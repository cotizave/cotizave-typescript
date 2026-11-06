import type { ResolvedConfig } from './config';
import {
  CotizaveConnectionError,
  CotizaveError,
  CotizaveTimeoutError,
  errorFromResponse,
  type ResponseMeta,
} from './errors';
import type { ApiErrorBody } from './types/public';
import { buildMeta } from './internal/headers';
import { isRetryable, nextDelayMs, sleep } from './internal/retry';

/** A query value; `undefined`/`null` entries are omitted from the URL. */
export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions {
  method?: 'GET' | 'POST';
  path: string;
  query?: QueryParams;
  /** JSON body (POST only). */
  body?: unknown;
  /** Caller's abort signal; combined with the per-request timeout. */
  signal?: AbortSignal;
  /** Overrides the client-wide timeout for this call. */
  timeout?: number;
  /** Overrides the client-wide `maxRetries` for this call. */
  maxRetries?: number;
  /** Overrides the client-wide `maxResponseBytes` for this call. */
  maxResponseBytes?: number;
  /** Sends `If-None-Match` for a conditional GET. */
  ifNoneMatch?: string;
  /** `Accept` override; also drives how the body is parsed. */
  accept?: string;
  /** How to read the response body. Defaults to `json`. */
  parse?: 'json' | 'text';
}

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
  /** Fixed origin of the configured base URL; every request must stay on it. */
  private readonly origin: string;

  constructor(private readonly config: ResolvedConfig) {
    this.origin = new URL(config.baseUrl).origin;
  }

  /** JSON convenience: returns the parsed body, throwing on non-2xx. */
  async get<T>(path: string, query?: QueryParams, opts?: Partial<RequestOptions>): Promise<T> {
    const result = await this.request<T>({ method: 'GET', path, ...(query ? { query } : {}), ...opts });
    return result.data as T;
  }

  /** JSON convenience for POST. Not retried (the result may not be idempotent). */
  async post<T>(path: string, body: unknown, opts?: Partial<RequestOptions>): Promise<T> {
    const result = await this.request<T>({ method: 'POST', path, body, ...opts });
    return result.data as T;
  }

  /**
   * Full request with metadata. Retries eligible idempotent calls within the
   * configured budget; see {@link isRetryable}/{@link nextDelayMs}.
   */
  async request<T>(options: RequestOptions): Promise<RawResult<T>> {
    const method = options.method ?? 'GET';
    const idempotent = method === 'GET';
    const url = this.buildUrl(options.path, options.query);
    const budget = this.config.maxRetryDelay;
    const maxRetries = options.maxRetries ?? this.config.maxRetries;
    let spent = 0;
    let attempt = 0;

    for (;;) {
      try {
        return await this.attempt<T>(method, url, options);
      } catch (error) {
        // A caller that aborted is a deliberate cancellation: never retry it,
        // and surface the clean mapped error rather than a raw AbortError.
        if (options.signal?.aborted) throw error;

        const canRetry = attempt < maxRetries && isRetryable(error, idempotent);
        if (!canRetry) throw error;

        const delay = nextDelayMs(error, attempt, budget - spent);
        if (delay === null) throw error;

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
    method: 'GET' | 'POST',
    url: string,
    options: RequestOptions,
  ): Promise<RawResult<T>> {
    const controller = new AbortController();
    const timeoutMs = options.timeout ?? this.config.timeout;
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

    try {
      const response = await this.config.fetch(url, this.buildInit(method, options, controller.signal));
      // Read the body inside this try so the timeout and the caller's abort
      // signal still cover a slow or hung body, not just the headers phase.
      return await this.handleResponse<T>(response, options);
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

  private async handleResponse<T>(response: Response, options: RequestOptions): Promise<RawResult<T>> {
    const meta = buildMeta(response.status, response.headers);

    // 304: no body to read; let the caller reuse its cached copy.
    if (response.status === 304) {
      return { data: undefined, meta, notModified: true };
    }

    const parse = options.parse ?? 'json';
    const maxBytes = options.maxResponseBytes ?? this.config.maxResponseBytes;
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
      // No stream (e.g. some mocked responses): fall back to text(), still bounded in practice.
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
    const url = new URL(this.config.baseUrl + path);
    // A `path` supplied to the low-level API must never change the host. Values
    // like `@evil.com/...` or `.evil.com/...` parse into a different origin and
    // would send the X-API-Key header there. Reject anything off-origin.
    if (url.origin !== this.origin) {
      throw new CotizaveError({
        message: `Refusing to send a request to a different origin (${url.origin}). A request path must stay on ${this.origin}.`,
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

  private buildInit(
    method: 'GET' | 'POST',
    options: RequestOptions,
    signal: AbortSignal,
  ): RequestInit {
    const headers: Record<string, string> = {
      'X-API-Key': this.config.apiKey,
      Accept: options.accept ? assertHeaderValue(options.accept, 'accept') : 'application/json',
      'User-Agent': this.config.userAgent,
    };
    if (options.ifNoneMatch) {
      headers['If-None-Match'] = assertHeaderValue(options.ifNoneMatch, 'ifNoneMatch');
    }

    // The API is not expected to redirect. Following one could forward the
    // X-API-Key header to another origin (fetch only strips Authorization/Cookie
    // across origins), so treat any redirect as an error instead.
    const init: RequestInit = { method, headers, signal, redirect: 'error' };
    if (method === 'POST' && options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }
    return init;
  }
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

/**
 * Guards a caller-supplied header value against CR/LF/control-character
 * injection. A conformant `fetch` rejects these too, but a custom `fetch`
 * (allowed via config) might not, so validate before we hand it over.
 */
function assertHeaderValue(value: string, name: string): string {
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(value)) {
    throw new CotizaveError({
      message: `Invalid \`${name}\` value: header values must not contain control characters.`,
      code: 'invalid_header_value',
    });
  }
  return value;
}
