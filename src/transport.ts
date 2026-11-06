import {
  validateHeaders,
  validateHeaderValue,
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
import { nextDelayMs, shouldRetry, sleep } from './internal/retry';

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

/**
 * The typed HTTP layer: authentication, URL building, serialization, timeouts,
 * abort, error mapping, controlled retries and response metadata. Resource
 * modules sit on top of this; most users never call it directly.
 */
export class Transport {
  // Runtime-private (`#`) so the API key never shows up when a consumer logs,
  // inspects or serializes the client.
  readonly #config: ResolvedConfig;
  /** Fixed origin of the configured base URL; every request must stay on it. */
  readonly #origin: string;

  constructor(config: ResolvedConfig) {
    this.#config = config;
    this.#origin = new URL(config.baseUrl).origin;
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
    const method = options.method ?? 'GET';
    const { path } = options;
    const url = this.buildUrl(path, options.query);
    const init = this.buildInit(method, options);

    const policy = this.#config.retry;
    const budget = this.#config.maxRetryDelay;
    const maxRetries = options.maxRetries ?? this.#config.maxRetries;
    let spent = 0;
    let attempt = 0;

    for (;;) {
      try {
        return await this.attempt<T>(method, path, url, init, options);
      } catch (error) {
        // A caller that aborted is a deliberate cancellation: never retry it,
        // and surface the clean mapped error rather than a raw AbortError.
        if (options.signal?.aborted) throw error;

        if (attempt >= maxRetries) throw error;
        if (!shouldRetry({ error, attempt, method, path }, policy)) throw error;

        const delay = nextDelayMs(error, attempt, budget - spent, policy);
        if (delay === null) throw error;

        safeCall(policy.onRetry, { error, retryNumber: attempt + 1, delayMs: delay, method, path });

        // If the caller aborts during the backoff wait, stop and surface the
        // last error instead of the sleep's raw rejection.
        try {
          await sleep(delay, options.signal);
        } catch {
          throw error;
        }
        spent += delay;
        attempt += 1;
      }
    }
  }

  private async attempt<T>(
    method: HttpMethod,
    path: string,
    url: string,
    init: RequestInit,
    options: RequestOptions,
  ): Promise<RawResult<T>> {
    const controller = new AbortController();
    const timeoutMs = options.timeout ?? this.#config.timeout;
    const onExternalAbort = () => controller.abort(options.signal?.reason);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    if (options.signal) {
      if (options.signal.aborted) controller.abort(options.signal.reason);
      else options.signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    // Call fetch unbound: invoking it as a method of the config object would give
    // it the wrong `this`, which some runtimes reject ("Illegal invocation").
    const { fetch: doFetch } = this.#config;

    try {
      const response = await doFetch(url, { ...init, signal: controller.signal });
      // Read the body inside this try so the timeout and the caller's abort
      // signal still cover a slow or hung body, not just the headers phase.
      return await this.handleResponse<T>(response, method, path, options);
    } catch (cause) {
      // Mapped API errors (non-2xx, oversize body, bad JSON) pass through intact.
      if (cause instanceof CotizaveError) throw cause;
      if (timedOut) {
        throw new CotizaveTimeoutError({
          message: `Request to ${url} timed out after ${timeoutMs}ms.`,
          code: 'timeout',
          cause,
        });
      }
      if (options.signal?.aborted) {
        throw new CotizaveConnectionError({
          message: 'Request aborted by caller.',
          code: 'aborted',
          cause,
        });
      }
      throw new CotizaveConnectionError({
        message: `Network error while requesting ${url}: ${errorMessage(cause)}`,
        code: 'connection_error',
        cause,
      });
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onExternalAbort);
    }
  }

  private async handleResponse<T>(
    response: Response,
    method: HttpMethod,
    path: string,
    options: RequestOptions,
  ): Promise<RawResult<T>> {
    const meta = buildMeta(response.status, response.headers);
    safeCall(this.#config.onResponse, { method, path, meta });

    // 304: no body to read; let the caller reuse its cached copy.
    if (response.status === 304) {
      return { data: undefined, meta, notModified: true };
    }

    const parse = options.parse ?? 'json';
    const maxBytes = options.maxResponseBytes ?? this.#config.maxResponseBytes;
    const text = await this.readBodyCapped(response, maxBytes);

    if (response.ok) {
      if (parse === 'text') {
        return { data: text as unknown as T, meta, notModified: false };
      }
      // Empty 2xx body (e.g. 204) → undefined rather than a JSON parse error.
      if (text.trim() === '') {
        return { data: undefined, meta, notModified: false };
      }
      const parsed = tryParseJson(text);
      if (parsed.ok) return { data: parsed.value as T, meta, notModified: false };
      throw new CotizaveError({
        message: `Expected JSON from ${response.url} but could not parse the response body.`,
        status: response.status,
        code: 'invalid_json_response',
        details: { non_json_body: text.slice(0, 500) },
        meta,
      });
    }

    // Error path: the API always returns a JSON error body, but a proxy/gateway
    // may return HTML. errorFromResponse keeps the status either way.
    const parsed = tryParseJson(text);
    const body = parsed.ok ? (parsed.value as Partial<ApiErrorBody>) : undefined;
    throw errorFromResponse(response.status, body, meta, parsed.ok ? undefined : text);
  }

  /**
   * Reads the response body as text while enforcing a byte ceiling, so a
   * hostile or MITM'd endpoint cannot exhaust memory (including via a
   * decompression bomb, which native fetch inflates). The read stays tied to
   * the request signal, so a timeout/abort cancels it.
   */
  private async readBodyCapped(response: Response, maxBytes: number): Promise<string> {
    const body = response.body;
    if (!body) {
      // No stream (e.g. some mocked responses): fall back to text().
      try {
        return await response.text();
      } catch {
        return '';
      }
    }
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let total = 0;
    let out = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new CotizaveError({
            message: `Response body exceeded the maximum allowed size (${maxBytes} bytes).`,
            status: response.status,
            code: 'response_too_large',
          });
        }
        out += decoder.decode(value, { stream: true });
      }
    }
    out += decoder.decode();
    return out;
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
   * Builds the request init (everything except the per-attempt signal).
   *
   * Header precedence, lowest to highest: SDK defaults, client-wide `headers`
   * and `language`, per-call `headers` and `language`, explicit `accept` /
   * `ifNoneMatch`, and finally the API key, which nothing can override.
   */
  private buildInit(method: HttpMethod, options: RequestOptions): RequestInit {
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
    headers.set('X-API-Key', config.apiKey);

    // The API is not expected to redirect. Following one could forward the
    // X-API-Key header to another origin (fetch only strips Authorization/Cookie
    // across origins), so treat any redirect as an error instead.
    const init: RequestInit = { method, headers, redirect: 'error' };
    if (method === 'POST' && options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
      init.body = JSON.stringify(options.body);
    }
    return init;
  }
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

function errorMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return String(cause);
}
