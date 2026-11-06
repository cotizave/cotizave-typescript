import type { RateLimitInfo, ResponseMeta } from '../errors';

/** Flattens a `Headers` object into a lowercase-keyed plain record. */
export function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

function int(record: Record<string, string>, key: string): number | undefined {
  const raw = record[key];
  if (raw === undefined) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Parses Cotizave's rate-limit headers from a response. */
export function parseRateLimit(record: Record<string, string>): RateLimitInfo {
  const info: RateLimitInfo = {};
  const scope = record['x-ratelimit-scope'];
  if (scope === 'monthly' || scope === 'burst') info.scope = scope;

  const limit = int(record, 'x-ratelimit-limit');
  if (limit !== undefined) info.limit = limit;
  const remaining = int(record, 'x-ratelimit-remaining');
  if (remaining !== undefined) info.remaining = remaining;
  const reset = record['x-ratelimit-reset'];
  if (reset !== undefined) info.reset = reset;

  const limitMin = int(record, 'x-ratelimit-limit-minute');
  if (limitMin !== undefined) info.limitPerMinute = limitMin;
  const remainingMin = int(record, 'x-ratelimit-remaining-minute');
  if (remainingMin !== undefined) info.remainingPerMinute = remainingMin;

  const retryAfter = int(record, 'retry-after');
  if (retryAfter !== undefined) info.retryAfter = retryAfter;
  const retryAfterMs = int(record, 'x-ratelimit-retry-after-ms');
  if (retryAfterMs !== undefined) info.retryAfterMs = retryAfterMs;

  return info;
}

/** Builds response metadata (status, headers, request id, rate limit). */
export function buildMeta(status: number, headers: Headers): ResponseMeta {
  const record = headersToRecord(headers);
  const meta: ResponseMeta = {
    status,
    headers: record,
    rateLimit: parseRateLimit(record),
  };
  const requestId = record['x-request-id'];
  if (requestId) meta.requestId = requestId;
  return meta;
}
