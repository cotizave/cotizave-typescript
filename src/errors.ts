import type { ApiErrorBody } from './types/public';

/** Parsed rate-limit metadata from response headers. */
export interface RateLimitInfo {
  /** Which axis was hit on a 429: `monthly` quota vs `burst` (per-minute/second). */
  scope?: 'monthly' | 'burst';
  /** Monthly quota ceiling (`X-RateLimit-Limit`). */
  limit?: number;
  /** Monthly quota remaining (`X-RateLimit-Remaining`). */
  remaining?: number;
  /** When the monthly quota resets (`X-RateLimit-Reset`, RFC 3339). */
  reset?: string;
  /** Per-minute velocity ceiling (`X-RateLimit-Limit-Minute`). */
  limitPerMinute?: number;
  /** Per-minute velocity remaining (`X-RateLimit-Remaining-Minute`). */
  remainingPerMinute?: number;
  /** `Retry-After` in whole seconds. */
  retryAfter?: number;
  /** Sub-second retry hint for burst limits (`X-RateLimit-Retry-After-Ms`). */
  retryAfterMs?: number;
}

/** Everything the SDK knows about a finished HTTP exchange. */
export interface ResponseMeta {
  status: number;
  headers: Record<string, string>;
  requestId?: string;
  rateLimit: RateLimitInfo;
}

export interface CotizaveErrorInit {
  message: string;
  status?: number;
  code?: string;
  field?: string;
  details?: Record<string, unknown>;
  meta?: ResponseMeta;
  cause?: unknown;
}

/**
 * Base class for every error the SDK throws. Always carries the API-provided
 * `code` and `message` when available, plus optional `field`/`details` and the
 * response metadata (status, headers, rate-limit info).
 *
 * Catch the base class to handle any API failure, or a subclass
 * (e.g. {@link CotizaveRateLimitError}) for a specific family.
 */
export class CotizaveError extends Error {
  /** HTTP status code, or 0 when the request never completed (network/timeout). */
  readonly status: number;
  /** Machine-readable error code from the API (e.g. `rate_limit_exceeded`). */
  readonly code: string;
  /** Offending field, when the API points at one. */
  readonly field?: string;
  /** Structured extra context from the API error body. */
  readonly details?: Record<string, unknown>;
  /** Response metadata, including parsed rate-limit headers. */
  readonly meta?: ResponseMeta;

  constructor(init: CotizaveErrorInit) {
    super(init.message, init.cause !== undefined ? { cause: init.cause } : undefined);
    this.name = new.target.name;
    this.status = init.status ?? 0;
    this.code = init.code ?? 'cotizave_error';
    this.field = init.field;
    this.details = init.details;
    this.meta = init.meta;
    // Restore prototype chain for reliable `instanceof` across targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /** Rate-limit metadata parsed from the response, if any. */
  get rateLimit(): RateLimitInfo | undefined {
    return this.meta?.rateLimit;
  }

  /** Response headers, if the request completed. */
  get headers(): Record<string, string> | undefined {
    return this.meta?.headers;
  }
}

/** 400 — invalid parameters, formats, or body. */
export class CotizaveBadRequestError extends CotizaveError {}
/** 401 — missing, invalid, or revoked API key. */
export class CotizaveAuthenticationError extends CotizaveError {}
/** 402 — the requested feature is not included in the account's plan. */
export class CotizaveFeatureNotInPlanError extends CotizaveError {}
/** 403 — account restriction or out-of-retention access. */
export class CotizaveForbiddenError extends CotizaveError {}
/** 404 — resource or rate not found, or country not supported. */
export class CotizaveNotFoundError extends CotizaveError {}
/** 406 — the requested format cannot represent this response. */
export class CotizaveNotAcceptableError extends CotizaveError {}
/** 422 — the operation has no usable reference right now. */
export class CotizaveUnprocessableError extends CotizaveError {}
/** 5xx / 502 / 503 / 504 — server-side failure. */
export class CotizaveServerError extends CotizaveError {}
/** The request failed before any response (DNS, TCP, TLS, abort). */
export class CotizaveConnectionError extends CotizaveError {}
/** The request was aborted because it exceeded the configured timeout. */
export class CotizaveTimeoutError extends CotizaveConnectionError {}

/** 429 — rate limited. Use {@link scope} to tell quota from burst. */
export class CotizaveRateLimitError extends CotizaveError {
  /** `monthly` = quota exhausted (do not retry soon); `burst` = slow down. */
  get scope(): 'monthly' | 'burst' | undefined {
    const fromDetails = this.details?.['kind'];
    if (fromDetails === 'monthly' || fromDetails === 'burst') return fromDetails;
    return this.meta?.rateLimit.scope;
  }

  /** `Retry-After` in seconds, if provided. */
  get retryAfter(): number | undefined {
    return this.meta?.rateLimit.retryAfter;
  }

  /** True when the monthly quota is exhausted (waiting a few seconds won't help). */
  get isQuotaExhausted(): boolean {
    return this.scope === 'monthly';
  }
}

const STATUS_MAP: Record<number, new (init: CotizaveErrorInit) => CotizaveError> = {
  400: CotizaveBadRequestError,
  401: CotizaveAuthenticationError,
  402: CotizaveFeatureNotInPlanError,
  403: CotizaveForbiddenError,
  404: CotizaveNotFoundError,
  406: CotizaveNotAcceptableError,
  422: CotizaveUnprocessableError,
  429: CotizaveRateLimitError,
};

/**
 * Builds the right {@link CotizaveError} subclass from a completed HTTP
 * response. `body` is the already-parsed error payload, or `undefined` when
 * the body was absent or not valid JSON (e.g. an HTML page from a proxy).
 */
export function errorFromResponse(
  status: number,
  body: Partial<ApiErrorBody> | undefined,
  meta: ResponseMeta,
  rawBodyText?: string,
): CotizaveError {
  const Ctor =
    STATUS_MAP[status] ?? (status >= 500 ? CotizaveServerError : CotizaveError);

  const hasApiError = body != null && typeof body.code === 'string';
  const code = hasApiError ? (body.code as string) : fallbackCode(status);
  const message = hasApiError && body.message ? body.message : fallbackMessage(status);

  const details = hasApiError
    ? sanitizeDetails(body.details as Record<string, unknown> | undefined)
    : rawBodyText
      ? { non_json_body: truncate(rawBodyText, 500) }
      : undefined;

  return new Ctor({
    message,
    status,
    code,
    ...(hasApiError && body.field ? { field: body.field } : {}),
    ...(details ? { details } : {}),
    meta,
  });
}

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Server-provided `details` is untrusted data handed to the consumer. Strip
 * prototype-polluting keys at every level so a consumer that later deep-merges
 * `error.details` into another object cannot be made to pollute a prototype.
 * Depth- and cycle-bounded.
 */
function sanitizeDetails(
  details: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (details == null || typeof details !== 'object') return details;
  return sanitizeValue(details, 0, new WeakSet()) as Record<string, unknown>;
}

function sanitizeValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (depth >= 8 || seen.has(value as object)) return undefined; // bound recursion/cycles
  seen.add(value as object);
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1, seen));
  }
  const clean: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    clean[key] = sanitizeValue((value as Record<string, unknown>)[key], depth + 1, seen);
  }
  return clean;
}

function fallbackCode(status: number): string {
  if (status >= 500) return 'server_error';
  if (status === 404) return 'resource_not_found';
  return 'http_error';
}

function fallbackMessage(status: number): string {
  return `Unexpected HTTP ${status} response from Cotizave.`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
