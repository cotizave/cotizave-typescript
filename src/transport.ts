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
  /** Sends `If-None-Match` for a conditional GET. */
  ifNoneMatch?: string;
  /** `Accept` override; also drives how the body is parsed. */
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
  constructor(private readonly config: ResolvedConfig) {}

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
    let spent = 0;
    let attempt = 0;

    for (;;) {
      try {
        return await this.attempt<T>(method, url, options);
      } catch (error) {
        const canRetry =
          attempt < this.config.maxRetries && isRetryable(error, idempotent);
        if (!canRetry) throw error;

        const delay = nextDelayMs(error, attempt, budget - spent);
        if (delay === null) throw error;

        await sleep(delay, options.signal);
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

    let response: Response;
    try {
      response = await this.config.fetch(url, this.buildInit(method, options, controller.signal));
    } catch (cause) {
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

    return this.handleResponse<T>(response, options);
  }

  private async handleResponse<T>(response: Response, options: RequestOptions): Promise<RawResult<T>> {
    const meta = buildMeta(response.status, response.headers);

    // 304: no body to read; let the caller reuse its cached copy.
    if (response.status === 304) {
      return { data: undefined, meta, notModified: true };
    }

    const parse = options.parse ?? 'json';
    const text = await safeText(response);

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

  private buildUrl(path: string, query?: QueryParams): string {
    const url = new URL(this.config.baseUrl + path);
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
      Accept: options.accept ?? 'application/json',
      'User-Agent': this.config.userAgent,
    };
    if (options.ifNoneMatch) headers['If-None-Match'] = options.ifNoneMatch;

    const init: RequestInit = { method, headers, signal };
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

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function errorMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return String(cause);
}
