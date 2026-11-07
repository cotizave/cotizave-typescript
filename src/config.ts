import type { ResponseMeta } from './errors';

/** The `fetch` signature accepted by the `fetch` option (native `fetch` satisfies it). */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** HTTP methods the SDK issues. */
export type HttpMethod = 'GET' | 'POST';

/** What a custom {@link RetryOptions.shouldRetry} receives to make its decision. */
export interface RetryContext {
  /** The error of the failed attempt (usually a `CotizaveError`). */
  error: unknown;
  /** Zero-based index of the attempt that just failed. */
  attempt: number;
  method: HttpMethod;
  /** Request path, e.g. `/v2/fx/ar/rates`. */
  path: string;
  /** What the built-in policy would decide for this failure. */
  defaultDecision: boolean;
}

/** Passed to {@link RetryOptions.onRetry} right before the SDK waits and retries. */
export interface RetryEvent {
  error: unknown;
  /** One-based number of the retry about to happen. */
  retryNumber: number;
  /** How long the SDK will wait before retrying, in milliseconds. */
  delayMs: number;
  method: HttpMethod;
  path: string;
}

/** Passed to {@link CotizaveOptions.onResponse} for every completed HTTP exchange. */
export interface ResponseEvent {
  method: HttpMethod;
  path: string;
  /** Status, headers and parsed rate-limit metadata. */
  meta: ResponseMeta;
}

/**
 * Fine-grained retry behaviour. Every field is optional; the defaults are safe
 * for production. How *many* retries and the total time budget are the
 * top-level `maxRetries` and `maxRetryDelay` options.
 */
export interface RetryOptions {
  /** Base delay (ms) of the exponential backoff. Defaults to 250. */
  baseDelay?: number;
  /** Ceiling (ms) for a single backoff wait. Defaults to 2000. */
  maxDelay?: number;
  /**
   * HTTP statuses retried for idempotent (GET) requests.
   * Defaults to `[408, 500, 502, 503, 504]`.
   */
  statuses?: readonly number[];
  /**
   * Retry a `429` caused by the per-minute (burst) limit, waiting for the
   * server's `Retry-After`. Defaults to true. A `429` caused by an exhausted
   * monthly quota is never retried by the built-in policy.
   */
  retryRateLimited?: boolean;
  /**
   * Take the decision yourself. Return `true`/`false` to override the built-in
   * policy, or `undefined` to keep it. Retries stay bounded by `maxRetries` and
   * `maxRetryDelay` either way. Returning `true` for a POST retries a request
   * that may not be idempotent, so do that only if you know it is safe.
   */
  shouldRetry?: (context: RetryContext) => boolean | undefined;
  /** Called before each retry wait. Handy for logging and metrics. */
  onRetry?: (event: RetryEvent) => void;
}

/** Options accepted by the {@link Cotizave} constructor. */
export interface CotizaveOptions {
  /**
   * Your Cotizave API key, sent as the `X-API-Key` header.
   *
   * Read it from a server-side environment variable (e.g.
   * `process.env.COTIZAVE_API_KEY`). Never hard-code it or expose it to a
   * browser bundle — see the Security section of the README.
   */
  apiKey: string;

  /**
   * Base URL of the API. Defaults to `https://api.cotizave.com`.
   *
   * Only override this for testing or a controlled environment. It is not a
   * value to derive from untrusted request input.
   */
  baseUrl?: string;

  /** Per-request timeout in milliseconds. Defaults to 5000 (5s). */
  timeout?: number;

  /**
   * Timeout (ms) for history reads (`history.*` and `rates.snapshot`), which can
   * take longer than live rates. Defaults to 10000 (10s), the longest the API
   * itself lets a response run.
   */
  historyTimeout?: number;

  /**
   * Maximum number of *additional* retries for eligible requests.
   * Defaults to 2. Set to 0 to disable retries entirely.
   */
  maxRetries?: number;

  /**
   * Total time budget (ms) across all retry waits for a single call.
   * A `Retry-After` longer than what is left is not awaited. Defaults to 10000.
   */
  maxRetryDelay?: number;

  /** Fine-grained retry behaviour (backoff, statuses, custom decision, hook). */
  retry?: RetryOptions;

  /**
   * Maximum size (bytes) of a response body the client will read before
   * aborting with a `response_too_large` error. Guards against an oversized or
   * decompression-bomb response. Defaults to 25_000_000 (25 MB).
   */
  maxResponseBytes?: number;

  /**
   * Extra headers sent with every request (e.g. a tracing header). They cannot
   * replace the `X-API-Key` header. Per-call headers override these.
   */
  headers?: Record<string, string>;

  /**
   * Language for localized fields such as names and descriptions, sent as
   * `Accept-Language`. The API supports `en` (default) and `es`.
   */
  language?: string;

  /**
   * Called after every completed HTTP exchange, successful or not. Use it to
   * observe quota and rate-limit headers without the low-level API.
   */
  onResponse?: (event: ResponseEvent) => void;

  /**
   * Allow a non-HTTPS (`http://`) `baseUrl`. Off by default: an `http` base would
   * send your API key in cleartext. Only enable for local testing.
   */
  allowInsecureHttp?: boolean;

  /**
   * Custom `fetch` implementation. Defaults to the global `fetch`. Useful for
   * tests, instrumentation, or runtimes that expose a non-global fetch.
   */
  fetch?: FetchLike;

  /**
   * Extra token appended to the SDK's `User-Agent`, identifying your app
   * (e.g. `"acme-billing/1.2.3"`). Never put secrets here.
   */
  userAgent?: string;
}

/** Retry policy with defaults applied. */
export interface ResolvedRetry {
  baseDelay: number;
  maxDelay: number;
  statuses: ReadonlySet<number>;
  retryRateLimited: boolean;
  shouldRetry?: (context: RetryContext) => boolean | undefined;
  onRetry?: (event: RetryEvent) => void;
}

/** Fully-resolved configuration with defaults applied. Internal to the SDK. */
export interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  historyTimeout: number;
  maxRetries: number;
  maxRetryDelay: number;
  retry: ResolvedRetry;
  maxResponseBytes: number;
  headers: Readonly<Record<string, string>>;
  language?: string;
  onResponse?: (event: ResponseEvent) => void;
  fetch: FetchLike;
  userAgent: string;
}

/**
 * The configuration exposed on `client.config`. It leaves out the API key,
 * custom headers, hooks and the `fetch` implementation, so logging or
 * serializing a client is always safe.
 */
export interface PublicConfig {
  readonly baseUrl: string;
  readonly timeout: number;
  readonly historyTimeout: number;
  readonly maxRetries: number;
  readonly maxRetryDelay: number;
  readonly maxResponseBytes: number;
  readonly userAgent: string;
  readonly language?: string;
}

export const DEFAULT_BASE_URL = 'https://api.cotizave.com';
// The API cuts any response at 10s and its own queries at 1–1.5s, so these stay low.
export const DEFAULT_TIMEOUT = 5_000;
export const DEFAULT_HISTORY_TIMEOUT = 10_000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_MAX_RETRY_DELAY = 10_000;
export const DEFAULT_MAX_RESPONSE_BYTES = 25_000_000;
export const DEFAULT_RETRY_BASE_DELAY = 250;
export const DEFAULT_RETRY_MAX_DELAY = 2_000;
export const DEFAULT_RETRY_STATUSES: readonly number[] = [408, 500, 502, 503, 504];

/** Largest delay a timer accepts (about 24.8 days). */
const MAX_TIMEOUT = 2_147_483_647;

/** SDK version. A test fails if this drifts from `version` in package.json. */
export const SDK_VERSION = '0.1.1';

/** Header the SDK owns; callers can never set or replace it. */
const RESERVED_HEADER = 'x-api-key';

function baseUserAgent(): string {
  const node =
    typeof process !== 'undefined' && process.versions?.node
      ? ` node/${process.versions.node}`
      : '';
  return `cotizave-sdk-typescript/${SDK_VERSION}${node}`;
}

/**
 * Validates and normalizes user options, applying defaults. Throws a plain
 * `Error` (not a {@link CotizaveError}) for misconfiguration, because no
 * request has been made yet.
 */
export function resolveConfig(options: CotizaveOptions): ResolvedConfig {
  if (options == null || typeof options !== 'object') {
    throw new Error('Cotizave: options object with an `apiKey` is required.');
  }
  const apiKey = options.apiKey;
  if (typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new Error('Cotizave: `apiKey` is required and must be a non-empty string.');
  }

  const fetchImpl = options.fetch ?? (globalThis.fetch as FetchLike | undefined);
  if (typeof fetchImpl !== 'function') {
    throw new Error(
      'Cotizave: no global `fetch` is available. Use Node.js 22+ or pass a `fetch` implementation.',
    );
  }

  const config: ResolvedConfig = {
    apiKey,
    baseUrl: resolveBaseUrl(options),
    timeout: numberOption(options.timeout, DEFAULT_TIMEOUT, 'timeout', 1, MAX_TIMEOUT),
    historyTimeout: numberOption(
      options.historyTimeout,
      DEFAULT_HISTORY_TIMEOUT,
      'historyTimeout',
      1,
      MAX_TIMEOUT,
    ),
    maxRetries: integerOption(options.maxRetries, DEFAULT_MAX_RETRIES, 'maxRetries', 0),
    maxRetryDelay: numberOption(options.maxRetryDelay, DEFAULT_MAX_RETRY_DELAY, 'maxRetryDelay', 0),
    retry: resolveRetry(options.retry),
    maxResponseBytes: integerOption(
      options.maxResponseBytes,
      DEFAULT_MAX_RESPONSE_BYTES,
      'maxResponseBytes',
      1,
    ),
    headers: Object.freeze(validateHeaders(options.headers, 'headers')),
    fetch: fetchImpl,
    userAgent: options.userAgent
      ? `${baseUserAgent()} ${options.userAgent}`.trim()
      : baseUserAgent(),
  };

  if (options.language !== undefined) {
    config.language = validateHeaderValue(options.language, 'language');
  }
  if (options.onResponse !== undefined) {
    config.onResponse = functionOption(options.onResponse, 'onResponse');
  }
  return config;
}

function resolveBaseUrl(options: CotizaveOptions): string {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  let protocol: string;
  try {
    protocol = new URL(baseUrl).protocol;
  } catch {
    throw new Error(`Cotizave: \`baseUrl\` must be a valid URL, got: ${String(options.baseUrl)}`);
  }
  if (protocol === 'http:') {
    // An http base would send the API key in cleartext. Require an explicit opt-in.
    if (options.allowInsecureHttp !== true) {
      throw new Error(
        'Cotizave: `baseUrl` uses http:// which would send your API key in cleartext. ' +
          'Use https://, or set `allowInsecureHttp: true` for local testing.',
      );
    }
  } else if (protocol !== 'https:') {
    throw new Error(
      `Cotizave: \`baseUrl\` must be an http(s) URL, got: ${String(options.baseUrl)}`,
    );
  }
  return baseUrl.replace(/\/+$/, '');
}

function resolveRetry(retry: RetryOptions | undefined): ResolvedRetry {
  if (retry !== undefined && (retry === null || typeof retry !== 'object')) {
    throw new Error('Cotizave: `retry` must be an object.');
  }
  const statuses = retry?.statuses ?? DEFAULT_RETRY_STATUSES;
  if (!Array.isArray(statuses) || statuses.some((s) => !Number.isInteger(s))) {
    throw new Error('Cotizave: `retry.statuses` must be an array of HTTP status codes.');
  }
  const baseDelay = numberOption(retry?.baseDelay, DEFAULT_RETRY_BASE_DELAY, 'retry.baseDelay', 0);
  const maxDelay = numberOption(retry?.maxDelay, DEFAULT_RETRY_MAX_DELAY, 'retry.maxDelay', 0);

  const resolved: ResolvedRetry = {
    baseDelay,
    maxDelay: Math.max(maxDelay, baseDelay),
    statuses: new Set(statuses),
    retryRateLimited: retry?.retryRateLimited ?? true,
  };
  if (retry?.shouldRetry !== undefined) {
    resolved.shouldRetry = functionOption(retry.shouldRetry, 'retry.shouldRetry');
  }
  if (retry?.onRetry !== undefined) {
    resolved.onRetry = functionOption(retry.onRetry, 'retry.onRetry');
  }
  return resolved;
}

/**
 * Validates caller-supplied headers: plain token names, no control characters in
 * values, and never the reserved authentication header. Returns a clean copy.
 */
export function validateHeaders(
  headers: Record<string, string> | undefined,
  optionName: string,
): Record<string, string> {
  const clean: Record<string, string> = {};
  if (headers === undefined) return clean;
  if (headers === null || typeof headers !== 'object') {
    throw new TypeError(`Cotizave: \`${optionName}\` must be an object of header names to values.`);
  }
  for (const [name, value] of Object.entries(headers)) {
    if (!/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(name)) {
      throw new TypeError(
        `Cotizave: invalid header name in \`${optionName}\`: ${JSON.stringify(name)}`,
      );
    }
    if (name.toLowerCase() === RESERVED_HEADER) {
      throw new TypeError(
        `Cotizave: \`${optionName}\` cannot set the X-API-Key header; use the \`apiKey\` option.`,
      );
    }
    clean[name] = validateHeaderValue(value, `${optionName}.${name}`);
  }
  return clean;
}

/** Rejects non-string values and CR/LF/control characters (header injection). */
export function validateHeaderValue(value: unknown, optionName: string): string {
  // eslint-disable-next-line no-control-regex
  if (typeof value !== 'string' || /[\x00-\x1F\x7F]/.test(value)) {
    throw new TypeError(`Cotizave: \`${optionName}\` must be a string without control characters.`);
  }
  return value;
}

function functionOption<T>(value: T, name: string): T {
  if (typeof value !== 'function') {
    throw new Error(`Cotizave: \`${name}\` must be a function.`);
  }
  return value;
}

function numberOption(
  value: number | undefined,
  fallback: number,
  name: string,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    const range = max === Number.MAX_SAFE_INTEGER ? `>= ${min}` : `between ${min} and ${max}`;
    throw new Error(`Cotizave: \`${name}\` must be a finite number ${range}.`);
  }
  return value;
}

function integerOption(
  value: number | undefined,
  fallback: number,
  name: string,
  min: number,
): number {
  const resolved = numberOption(value, fallback, name, min);
  if (!Number.isInteger(resolved)) {
    throw new Error(`Cotizave: \`${name}\` must be an integer.`);
  }
  return resolved;
}
