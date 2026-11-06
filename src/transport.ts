import ky, { isHTTPError, isResponseSizeError, isTimeoutError } from 'ky';
import {
  validateHeaders,
  validateHeaderValue,
  type FetchLike,
  type HttpMethod,
  type ResolvedConfig,
} from './config';
import {
  CotizaveConnectionError,
  CotizaveError,
  CotizaveTimeoutError,
  errorFromResponse,
  type ResponseMeta,
} from './errors';
import type { ApiErrorBody } from './types/public';
import { buildMeta } from './internal/headers';
import { nextDelayMs, shouldRetry } from './internal/retry';

/** A query value; `undefined`/`null` entries are omitted from the URL. */
export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

/**
 * Per-call overrides accepted as the last argument of every resource method.
 * Everything is optional; omitted values fall back to the client configuration.
 */
export interface RequestConfig {
  /** Abort signal to cancel this call (e.g. on request timeout or disconnect). */
  signal?: AbortSignal;
  /** Overrides the client-wide `timeout` (ms) for this call. */
  timeout?: number;
  /** Overrides the client-wide `maxRetries` for this call. */
  maxRetries?: number;
  /** Extra headers for this call; they override the client-wide `headers`. */
  headers?: Record<string, string>;
  /** Overrides the client-wide `language` (`Accept-Language`) for this call. */
  language?: string;
}

/** Options of the low-level {@link Transport.request}. */
export interface RequestOptions extends RequestConfig {
  method?: HttpMethod;
  path: string;
  query?: QueryParams;
  /** JSON body (POST only). */
  body?: unknown;
  /** Overrides the client-wide `maxResponseBytes` for this call. */
  maxResponseBytes?: number;
  /** Sends `If-None-Match` for a conditional GET. */
  ifNoneMatch?: string;
  /** `Accept` override. */
  accept?: string;
  /** How to read the response body. Defaults to `json`. */
  parse?: 'json' | 'text';
}

/** Low-level result returned by {@link Transport.request}. */
export interface RawResult<T> {
  /** Parsed body, or `undefined` on a `304 Not Modified`. */
  data: T | undefined;
  /** Status, headers and parsed rate-limit metadata. */
  meta: ResponseMeta;
  /** True when the server answered `304 Not Modified`. */
  notModified: boolean;
}

/** What is needed to turn a low-level failure into a `CotizaveError`. */
interface FailureContext {
  url: string;
  timeoutMs: number;
  maxBytes: number;
  signal?: AbortSignal;
}

/**
 * The typed HTTP layer.
 *
 * The request engine is [Ky](https://github.com/sindresorhus/ky): it runs the
 * retry loop and its waits, the per-attempt timeout (headers and body) and the
 * response size limit. This class adds what is specific to Cotizave on top:
 * authentication, pinning every request to the configured origin, refusing
 * redirects, the retry policy (quota vs. burst limits) and mapping failures to
 * typed {@link CotizaveError}s. Resource modules sit on top of it; most users
 * never call it directly.
 */
export class Transport {
  // Runtime-private (`#`) so the API key never shows up when a consumer logs,
  // inspects or serializes the client.
  readonly #config: ResolvedConfig;
  /** Fixed origin of the configured base URL; every request must stay on it. */
  readonly #origin: string;
  /** The configured `fetch`, adapted to the signature Ky calls. */
  readonly #fetch: (request: Request) => Promise<Response>;

  constructor(config: ResolvedConfig) {
    this.#config = config;
    this.#origin = new URL(config.baseUrl).origin;
    this.#fetch = adaptFetch(config.fetch);
  }

  /** Default timeout (ms) for history reads; resources apply it when none is given. */
  get historyTimeout(): number {
    return this.#config.historyTimeout;
  }

  /** JSON convenience: returns the parsed body, throwing on non-2xx. */
  async get<T>(path: string, query?: QueryParams, config?: RequestConfig): Promise<T> {
    const result = await this.request<T>({ method: 'GET', path, query, ...pickConfig(config) });
    return result.data as T;
  }

  /** JSON convenience for POST. Not retried by default (it may not be idempotent). */
  async post<T>(path: string, body: unknown, config?: RequestConfig): Promise<T> {
    const result = await this.request<T>({ method: 'POST', path, body, ...pickConfig(config) });
    return result.data as T;
  }

  /**
   * Full request with metadata. Failed attempts are retried according to the
   * retry policy, always bounded by `maxRetries` and the `maxRetryDelay` budget.
   */
  async request<T>(options: RequestOptions): Promise<RawResult<T>> {
    const config = this.#config;
    const method = options.method ?? 'GET';
    const { path, signal } = options;
    const url = this.buildUrl(path, options.query);
    const headers = this.buildHeaders(method, options);

    const failure: FailureContext = {
      url,
      timeoutMs: options.timeout ?? config.timeout,
      maxBytes: options.maxResponseBytes ?? config.maxResponseBytes,
      ...(signal ? { signal } : {}),
    };
    const policy = config.retry;
    // Waits already spent and the wait chosen for the retry Ky is about to make.
    const waits = { spent: 0, next: 0 };
    let meta: ResponseMeta | undefined;

    const pending = ky(url, {
      method,
      headers,
      ...(method === 'POST' && options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
      ...(signal ? { signal } : {}),
      fetch: this.#fetch,
      // The API is not expected to redirect. Following one could forward the
      // X-API-Key header to another origin (fetch only strips Authorization/Cookie
      // across origins), so treat any redirect as an error instead.
      redirect: 'error',
      timeout: failure.timeoutMs,
      maxResponseSize: failure.maxBytes,
      // 304 is an answer, not a failure: the caller reuses its cached copy.
      throwHttpErrors: (status) => status !== 304,
      retry: {
        limit: retryLimit(options.maxRetries ?? config.maxRetries),
        // Let the policy below decide for every method instead of Ky's method gate.
        methods: ['get', 'post'],
        // Waits come from `delay`, which already honors the server's timing headers.
        afterStatusCodes: [],
        delay: () => waits.next,
        shouldRetry: ({ error, retryCount }) => {
          // A caller that aborted is a deliberate cancellation: never retry it.
          if (signal?.aborted) return false;
          const mapped = toCotizaveError(error, failure);
          const attempt = retryCount - 1;
          if (!shouldRetry({ error: mapped, attempt, method, path }, policy)) return false;

          const delay = nextDelayMs(mapped, attempt, config.maxRetryDelay - waits.spent, policy);
          if (delay === null) return false;

          waits.next = delay;
          waits.spent += delay;
          safeCall(policy.onRetry, {
            error: mapped,
            retryNumber: retryCount,
            delayMs: delay,
            method,
            path,
          });
          return true;
        },
      },
      hooks: {
        afterResponse: [
          ({ response }) => {
            meta = buildMeta(response.status, response.headers);
            safeCall(config.onResponse, { method, path, meta });
          },
        ],
      },
    });

    try {
      const response = await pending;
      meta ??= buildMeta(response.status, response.headers);

      // 304: no body to read; let the caller reuse its cached copy.
      if (response.status === 304) {
        return { data: undefined, meta, notModified: true };
      }

      // Read through Ky so the timeout and the size limit also cover the body.
      const text = await pending.text();
      if (options.parse === 'text') {
        return { data: text as unknown as T, meta, notModified: false };
      }
      // Empty 2xx body (e.g. 204) → undefined rather than a JSON parse error.
      if (text.trim() === '') {
        return { data: undefined, meta, notModified: false };
      }
      const parsed = tryParseJson(text);
      if (parsed.ok) return { data: parsed.value as T, meta, notModified: false };
      throw new CotizaveError({
        message: `Expected JSON from ${url} but could not parse the response body.`,
        status: response.status,
        code: 'invalid_json_response',
        details: { non_json_body: text.slice(0, 500) },
        meta,
      });
    } catch (error) {
      throw toCotizaveError(error, failure);
    }
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const url = new URL(this.#config.baseUrl + path);
    // A `path` supplied to the low-level API must never change the host. Values
    // like `@evil.com/...` or `.evil.com/...` parse into a different origin and
    // would send the X-API-Key header there. Reject anything off-origin.
    if (url.origin !== this.#origin) {
      throw new CotizaveError({
        message:
          `Refusing to send a request to a different origin (${url.origin}). ` +
          `A request path must stay on ${this.#origin}.`,
        code: 'invalid_request_path',
      });
    }
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  /**
   * Header precedence, lowest to highest: SDK defaults, client-wide `headers`
   * and `language`, per-call `headers` and `language`, explicit `accept` /
   * `ifNoneMatch`, and finally the API key, which nothing can override.
   */
  private buildHeaders(method: HttpMethod, options: RequestOptions): Headers {
    const config = this.#config;
    const headers = new Headers({ Accept: 'application/json', 'User-Agent': config.userAgent });

    for (const [name, value] of Object.entries(config.headers)) headers.set(name, value);
    if (config.language) headers.set('Accept-Language', config.language);

    const perCall = guard(() => validateHeaders(options.headers, 'headers'));
    for (const [name, value] of Object.entries(perCall)) headers.set(name, value);
    if (options.language !== undefined) {
      headers.set('Accept-Language', headerValue(options.language, 'language'));
    }

    if (options.accept) headers.set('Accept', headerValue(options.accept, 'accept'));
    if (options.ifNoneMatch) {
      headers.set('If-None-Match', headerValue(options.ifNoneMatch, 'ifNoneMatch'));
    }
    if (method === 'POST' && options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('X-API-Key', config.apiKey);
    return headers;
  }
}

/**
 * Ky calls `fetch(request)`; the SDK's public `fetch` option keeps the simpler
 * `fetch(url, init)` shape. This bridges the two and calls the function unbound,
 * since invoking fetch as a method of another object fails on some runtimes.
 */
function adaptFetch(userFetch: FetchLike): (request: Request) => Promise<Response> {
  return async (request) => {
    const init: RequestInit = {
      method: request.method,
      headers: request.headers,
      signal: request.signal,
      redirect: request.redirect,
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // Read a clone: Ky keeps the original to build the request of a retry.
      init.body = await request.clone().text();
    }
    return userFetch(request.url, init);
  };
}

/** Maps any failure of a request to the SDK's typed error hierarchy. */
function toCotizaveError(error: unknown, context: FailureContext): CotizaveError {
  if (error instanceof CotizaveError) return error;

  if (isHTTPError(error)) {
    const { response, data } = error;
    const meta = buildMeta(response.status, response.headers);
    // Ky pre-parses JSON error bodies; anything else arrives as text.
    const parsed =
      typeof data === 'string' ? tryParseJson(data) : { ok: true as const, value: data };
    const body = parsed.ok && isObject(parsed.value) ? parsed.value : undefined;
    const rawText = body === undefined && typeof data === 'string' ? data : undefined;
    return errorFromResponse(response.status, body as Partial<ApiErrorBody>, meta, rawText);
  }
  if (isResponseSizeError(error)) {
    return new CotizaveError({
      message: `Response body exceeded the maximum allowed size (${context.maxBytes} bytes).`,
      code: 'response_too_large',
      cause: error,
    });
  }
  if (isTimeoutError(error)) {
    return new CotizaveTimeoutError({
      message: `Request to ${context.url} timed out after ${context.timeoutMs}ms.`,
      code: 'timeout',
      cause: error,
    });
  }
  if (context.signal?.aborted) {
    return new CotizaveConnectionError({
      message: 'Request aborted by caller.',
      code: 'aborted',
      cause: error,
    });
  }
  return new CotizaveConnectionError({
    message: `Network error while requesting ${context.url}: ${errorMessage(error)}`,
    code: 'connection_error',
    cause: error,
  });
}

/**
 * Copies only the known per-call fields, so an object carrying extra keys can
 * never override the method, path or body of a request.
 */
function pickConfig(config: RequestConfig | undefined): RequestConfig {
  if (!config) return {};
  return {
    signal: config.signal,
    timeout: config.timeout,
    maxRetries: config.maxRetries,
    headers: config.headers,
    language: config.language,
  };
}

/** Ky requires a finite, non-negative integer. */
function retryLimit(maxRetries: number): number {
  return Number.isFinite(maxRetries) ? Math.max(0, Math.trunc(maxRetries)) : 0;
}

/** Runs a user-supplied hook; a throwing hook must never break a request. */
function safeCall<E>(hook: ((event: E) => void) | undefined, event: E): void {
  if (!hook) return;
  try {
    hook(event);
  } catch {
    // Ignored on purpose: observability hooks are best-effort.
  }
}

/** Turns a validation failure of per-call input into a catchable CotizaveError. */
function guard<T>(validate: () => T): T {
  try {
    return validate();
  } catch (cause) {
    throw new CotizaveError({
      message: errorMessage(cause),
      code: 'invalid_header_value',
      cause,
    });
  }
}

/**
 * Guards a caller-supplied header value against CR/LF/control-character
 * injection. A conformant `fetch` rejects these too, but a custom `fetch`
 * (allowed via config) might not, so validate before handing it over.
 */
function headerValue(value: string, name: string): string {
  return guard(() => validateHeaderValue(value, name));
}

function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function errorMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return String(cause);
}
