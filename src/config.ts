/** Minimal `fetch` signature the SDK depends on (native `fetch` satisfies it). */
export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

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

  /** Per-request timeout in milliseconds. Defaults to 30000 (30s). */
  timeout?: number;

  /**
   * Maximum number of *additional* retries for eligible idempotent (GET)
   * requests. Defaults to 2. Set to 0 to disable retries entirely.
   */
  maxRetries?: number;

  /**
   * Total time budget (ms) across all retry waits for a single call.
   * A `Retry-After` longer than what is left is not awaited. Defaults to 60000.
   */
  maxRetryDelay?: number;

  /**
   * Maximum size (bytes) of a response body the client will read before
   * aborting with a `response_too_large` error. Guards against an oversized or
   * decompression-bomb response. Defaults to 25_000_000 (25 MB).
   */
  maxResponseBytes?: number;

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

/** Fully-resolved configuration with defaults applied. */
export interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  maxRetryDelay: number;
  maxResponseBytes: number;
  fetch: FetchLike;
  userAgent: string;
}

export const DEFAULT_BASE_URL = 'https://api.cotizave.com';
export const DEFAULT_TIMEOUT = 30_000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_MAX_RETRY_DELAY = 60_000;
export const DEFAULT_MAX_RESPONSE_BYTES = 25_000_000;

/** SDK version, kept in sync with package.json by the build. */
export const SDK_VERSION = '0.1.0';

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
      'Cotizave: no global `fetch` is available. Use Node 18+ (22+ recommended) or pass a `fetch` implementation.',
    );
  }

  let baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  let protocol: string;
  try {
    protocol = new URL(baseUrl).protocol;
    baseUrl = baseUrl.replace(/\/+$/, '');
  } catch {
    throw new Error(`Cotizave: \`baseUrl\` must be a valid URL, got: ${String(options.baseUrl)}`);
  }
  if (protocol === 'http:') {
    // An http base would send the API key in cleartext. Require an explicit opt-in.
    if (options.allowInsecureHttp !== true) {
      throw new Error(
        'Cotizave: `baseUrl` uses http:// which would send your API key in cleartext. Use https://, or set `allowInsecureHttp: true` for local testing.',
      );
    }
  } else if (protocol !== 'https:') {
    throw new Error(`Cotizave: \`baseUrl\` must be an http(s) URL, got: ${String(options.baseUrl)}`);
  }

  const timeout = numberOption(options.timeout, DEFAULT_TIMEOUT, 'timeout', 1);
  const maxRetries = numberOption(options.maxRetries, DEFAULT_MAX_RETRIES, 'maxRetries', 0);
  const maxRetryDelay = numberOption(
    options.maxRetryDelay,
    DEFAULT_MAX_RETRY_DELAY,
    'maxRetryDelay',
    0,
  );
  const maxResponseBytes = numberOption(
    options.maxResponseBytes,
    DEFAULT_MAX_RESPONSE_BYTES,
    'maxResponseBytes',
    1,
  );

  const userAgent = options.userAgent
    ? `${baseUserAgent()} ${options.userAgent}`.trim()
    : baseUserAgent();

  return {
    apiKey,
    baseUrl,
    timeout,
    maxRetries,
    maxRetryDelay,
    maxResponseBytes,
    fetch: fetchImpl,
    userAgent,
  };
}

function numberOption(value: number | undefined, fallback: number, name: string, min: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min) {
    throw new Error(`Cotizave: \`${name}\` must be a finite number >= ${min}.`);
  }
  return value;
}
