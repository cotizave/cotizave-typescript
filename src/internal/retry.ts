import { CotizaveError, CotizaveRateLimitError, CotizaveConnectionError } from '../errors';

/** Statuses that are safe to retry for an idempotent (GET) request. */
const RETRYABLE_STATUSES = new Set([408, 500, 502, 503, 504, 429]);

/**
 * Decides whether a failed attempt should be retried.
 *
 * Only idempotent requests are retried. A 429 is retried **only** when it is a
 * burst (velocity) limit — never when the monthly quota is exhausted, since
 * waiting seconds cannot help and would just burn the retry budget. 4xx errors
 * that require changing the request (400/401/402/403/404/406/422) are never
 * retried.
 */
export function isRetryable(error: unknown, idempotent: boolean): boolean {
  if (!idempotent) return false;
  if (error instanceof CotizaveConnectionError) return true; // network/timeout, no response
  if (error instanceof CotizaveRateLimitError) {
    return error.scope === 'burst';
  }
  if (error instanceof CotizaveError) {
    return RETRYABLE_STATUSES.has(error.status);
  }
  return false;
}

/**
 * Computes how long to wait before the next attempt, in milliseconds.
 *
 * Honors a server `Retry-After` (seconds) or the sub-second
 * `X-RateLimit-Retry-After-Ms` when present; otherwise uses exponential
 * backoff with full jitter. Returns `null` when honoring the server hint would
 * exceed the remaining time budget (caller should stop retrying).
 */
export function nextDelayMs(
  error: unknown,
  attempt: number,
  budgetLeftMs: number,
): number | null {
  if (error instanceof CotizaveRateLimitError) {
    const info = error.rateLimit;
    const serverMs =
      info?.retryAfterMs ?? (info?.retryAfter !== undefined ? info.retryAfter * 1000 : undefined);
    if (serverMs !== undefined) {
      return serverMs <= budgetLeftMs ? serverMs : null;
    }
  }
  // Exponential backoff with full jitter: base 500ms, capped at 8s.
  const base = Math.min(8_000, 500 * 2 ** attempt);
  const jittered = Math.random() * base;
  return jittered <= budgetLeftMs ? jittered : budgetLeftMs > 0 ? budgetLeftMs : null;
}

/** Sleeps for `ms`, resolving early (rejecting) if the signal aborts. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('Aborted'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error('Aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
