import type { HttpMethod, ResolvedRetry } from '../config';
import { CotizaveConnectionError, CotizaveError, CotizaveRateLimitError } from '../errors';

/** What the retry policy needs to know about the failed attempt. */
export interface RetryAttempt {
  error: unknown;
  /** Zero-based index of the attempt that just failed. */
  attempt: number;
  method: HttpMethod;
  path: string;
}

/**
 * The built-in decision, before any custom `shouldRetry`.
 *
 * Only idempotent (GET) requests are retried. A 429 is retried only when it is a
 * burst (velocity) limit — never when the monthly quota is exhausted, since
 * waiting seconds cannot help and would just burn the retry budget. Errors that
 * require changing the request (400/401/402/403/404/406/422) are never retried.
 */
export function defaultShouldRetry(
  error: unknown,
  method: HttpMethod,
  policy: ResolvedRetry,
): boolean {
  if (method !== 'GET') return false;
  if (error instanceof CotizaveConnectionError) return true; // network/timeout, no response
  if (error instanceof CotizaveRateLimitError) {
    return policy.retryRateLimited && error.scope === 'burst';
  }
  if (error instanceof CotizaveError) return policy.statuses.has(error.status);
  return false;
}

/** Final decision: the caller's `shouldRetry` wins when it returns a boolean. */
export function shouldRetry(failed: RetryAttempt, policy: ResolvedRetry): boolean {
  const defaultDecision = defaultShouldRetry(failed.error, failed.method, policy);
  if (!policy.shouldRetry) return defaultDecision;
  const custom = policy.shouldRetry({ ...failed, defaultDecision });
  return typeof custom === 'boolean' ? custom : defaultDecision;
}

/**
 * Computes how long to wait before the next attempt, in milliseconds.
 *
 * Honors a server `Retry-After` (seconds) or the sub-second
 * `X-RateLimit-Retry-After-Ms` when present; otherwise uses exponential
 * backoff with full jitter. Returns `null` when the wait would exceed the
 * remaining time budget (the caller should stop retrying).
 */
export function nextDelayMs(
  error: unknown,
  attempt: number,
  budgetLeftMs: number,
  policy: ResolvedRetry,
): number | null {
  if (budgetLeftMs <= 0) return null;

  if (error instanceof CotizaveRateLimitError) {
    const info = error.rateLimit;
    const hint =
      info?.retryAfterMs ?? (info?.retryAfter !== undefined ? info.retryAfter * 1000 : undefined);
    if (hint !== undefined) {
      // Clamp: a negative/garbage server hint must not skip the wait entirely.
      const serverMs = Math.max(0, hint);
      return serverMs <= budgetLeftMs ? serverMs : null;
    }
  }

  // Exponential backoff with full jitter, capped per wait and by the budget.
  const ceiling = Math.min(policy.maxDelay, policy.baseDelay * 2 ** attempt);
  return Math.min(Math.random() * ceiling, budgetLeftMs);
}

/** Sleeps for `ms`, rejecting early if the signal aborts. */
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
