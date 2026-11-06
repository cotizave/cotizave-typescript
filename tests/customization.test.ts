import { describe, it, expect } from 'vitest';
import {
  Cotizave,
  CotizaveError,
  CotizaveNotFoundError,
  CotizaveRateLimitError,
  CotizaveServerError,
  CotizaveTimeoutError,
  type ResponseEvent,
  type RetryEvent,
} from '../src/index';
import { harness, always, sequence } from './helpers';

const FAST_RETRY = { baseDelay: 1, maxDelay: 2 };
const DOWN = { status: 503, body: { code: 'service_unavailable', message: 'down' } };
const OK = { status: 200, body: { country: 'AR', rates: [] } };

/** A fetch that never answers but honors abort, to exercise timeouts. */
const hangingFetch = (_url: string, init?: RequestInit) =>
  new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
  });

describe('defaults', () => {
  it('uses low timeouts out of the box', () => {
    const { config } = new Cotizave({ apiKey: 'k' });
    expect(config.timeout).toBe(5_000);
    expect(config.historyTimeout).toBe(10_000);
    expect(config.maxRetries).toBe(2);
    expect(config.maxRetryDelay).toBe(10_000);
  });
});

describe('timeouts', () => {
  it('history reads use historyTimeout instead of timeout', async () => {
    const client = new Cotizave({
      apiKey: 'k',
      fetch: hangingFetch,
      timeout: 60_000,
      historyTimeout: 40,
      maxRetries: 0,
    });
    const start = Date.now();
    await expect(
      client.history.daily({ country: 'AR', rateId: 'ar-official' }),
    ).rejects.toBeInstanceOf(CotizaveTimeoutError);
    await expect(client.rates.snapshot('AR', '2026-10-01')).rejects.toBeInstanceOf(
      CotizaveTimeoutError,
    );
    expect(Date.now() - start).toBeLessThan(2_000);
  });

  it('live reads use timeout, not historyTimeout', async () => {
    const client = new Cotizave({
      apiKey: 'k',
      fetch: hangingFetch,
      timeout: 40,
      historyTimeout: 60_000,
      maxRetries: 0,
    });
    await expect(client.rates.list('AR')).rejects.toBeInstanceOf(CotizaveTimeoutError);
  });

  it('a per-call timeout wins over historyTimeout', async () => {
    const client = new Cotizave({
      apiKey: 'k',
      fetch: hangingFetch,
      historyTimeout: 60_000,
      maxRetries: 0,
    });
    await expect(
      client.history.get({ country: 'CO', rateId: 'co-trm', date: '2026-10-01' }, { timeout: 40 }),
    ).rejects.toBeInstanceOf(CotizaveTimeoutError);
  });
});

describe('language', () => {
  it('sends Accept-Language from the client option', async () => {
    const { client, calls } = harness(always(OK), { language: 'es' });
    await client.rates.list('AR');
    expect(calls[0]!.headers['accept-language']).toBe('es');
  });

  it('a per-call language overrides the client one', async () => {
    const { client, calls } = harness(always(OK), { language: 'es' });
    await client.rates.list('AR', {}, { language: 'en' });
    expect(calls[0]!.headers['accept-language']).toBe('en');
  });

  it('sends no Accept-Language by default', async () => {
    const { client, calls } = harness(always(OK));
    await client.rates.list('AR');
    expect(calls[0]!.headers['accept-language']).toBeUndefined();
  });
});

describe('custom headers', () => {
  it('sends client-wide headers and lets a call override them', async () => {
    const { client, calls } = harness(always(OK), {
      headers: { 'X-Trace-Id': 'client', 'X-App': 'billing' },
    });
    await client.rates.list('AR', {}, { headers: { 'X-Trace-Id': 'call' } });
    expect(calls[0]!.headers['x-trace-id']).toBe('call');
    expect(calls[0]!.headers['x-app']).toBe('billing');
  });

  it('never lets a header replace the API key', async () => {
    expect(() => new Cotizave({ apiKey: 'k', headers: { 'x-api-key': 'other' } })).toThrow(
      /X-API-Key/,
    );
    const { client, calls } = harness(always(OK), { apiKey: 'real-key' });
    const err = (await client.rates
      .list('AR', {}, { headers: { 'X-API-KEY': 'other' } })
      .catch((e) => e)) as CotizaveError;
    expect(err).toBeInstanceOf(CotizaveError);
    expect(err.code).toBe('invalid_header_value');
    expect(calls.length).toBe(0);
  });

  it('rejects header injection attempts', () => {
    expect(() => new Cotizave({ apiKey: 'k', headers: { 'X-A': 'v\r\nX-B: 1' } })).toThrow();
    expect(() => new Cotizave({ apiKey: 'k', headers: { 'Bad Name': 'v' } })).toThrow();
    expect(() => new Cotizave({ apiKey: 'k', language: 'es\r\nX-B: 1' })).toThrow();
  });
});

describe('onResponse hook', () => {
  it('is called for successful and failed exchanges with parsed metadata', async () => {
    const events: ResponseEvent[] = [];
    const { client } = harness(
      sequence(
        { ...OK, headers: { 'x-ratelimit-remaining': '41' } },
        { status: 404, body: { code: 'rate_not_found', message: 'no' } },
      ),
      { onResponse: (event) => events.push(event), maxRetries: 0 },
    );
    await client.rates.list('AR');
    await client.rates.get('AR', 'nope').catch(() => undefined);

    expect(events.map((e) => e.meta.status)).toEqual([200, 404]);
    expect(events[0]!.meta.rateLimit.remaining).toBe(41);
    expect(events[0]!.path).toBe('/v2/fx/ar/rates');
    expect(events[0]!.method).toBe('GET');
  });

  it('a throwing hook never breaks the request', async () => {
    const { client } = harness(always(OK), {
      onResponse: () => {
        throw new Error('boom');
      },
    });
    await expect(client.rates.list('AR')).resolves.toBeDefined();
  });
});

describe('retry customization', () => {
  it('retries by default and reports each retry through onRetry', async () => {
    const events: RetryEvent[] = [];
    const { client, calls } = harness(sequence(DOWN, DOWN, OK), {
      retry: { ...FAST_RETRY, onRetry: (event) => events.push(event) },
    });
    await client.rates.list('AR');
    expect(calls.length).toBe(3);
    expect(events.map((e) => e.retryNumber)).toEqual([1, 2]);
    expect(events[0]!.path).toBe('/v2/fx/ar/rates');
    expect(events[0]!.delayMs).toBeGreaterThanOrEqual(0);
  });

  it('retries only the configured statuses', async () => {
    const off = harness(always(DOWN), { retry: { ...FAST_RETRY, statuses: [] } });
    await expect(off.client.rates.list('AR')).rejects.toBeInstanceOf(CotizaveServerError);
    expect(off.calls.length).toBe(1);

    const teapot = { status: 418, body: { code: 'teapot', message: 'short and stout' } };
    const on = harness(sequence(teapot, OK), { retry: { ...FAST_RETRY, statuses: [418] } });
    await on.client.rates.list('AR');
    expect(on.calls.length).toBe(2);
  });

  it('shouldRetry can veto a retry the default policy would make', async () => {
    const { client, calls } = harness(always(DOWN), {
      retry: { ...FAST_RETRY, shouldRetry: () => false },
    });
    await expect(client.rates.list('AR')).rejects.toBeInstanceOf(CotizaveServerError);
    expect(calls.length).toBe(1);
  });

  it('shouldRetry can force a retry and sees the default decision', async () => {
    const seen: boolean[] = [];
    const notFound = { status: 404, body: { code: 'rate_not_found', message: 'no' } };
    const { client, calls } = harness(always(notFound), {
      maxRetries: 1,
      retry: {
        ...FAST_RETRY,
        shouldRetry: ({ error, defaultDecision }) => {
          seen.push(defaultDecision);
          return error instanceof CotizaveNotFoundError;
        },
      },
    });
    await expect(client.rates.get('AR', 'x')).rejects.toBeInstanceOf(CotizaveNotFoundError);
    expect(calls.length).toBe(2); // 1 + the forced retry, still bounded by maxRetries
    expect(seen).toEqual([false]);
  });

  it('shouldRetry returning undefined keeps the default policy', async () => {
    const { client, calls } = harness(sequence(DOWN, OK), {
      retry: { ...FAST_RETRY, shouldRetry: () => undefined },
    });
    await client.rates.list('AR');
    expect(calls.length).toBe(2);
  });

  it('retryRateLimited: false stops retrying burst 429s', async () => {
    const { client, calls } = harness(
      always({
        status: 429,
        body: { code: 'rate_limit_exceeded', message: 'slow', details: { kind: 'burst' } },
        headers: { 'x-ratelimit-scope': 'burst', 'x-ratelimit-retry-after-ms': '5' },
      }),
      { retry: { ...FAST_RETRY, retryRateLimited: false } },
    );
    await expect(client.rates.list('AR')).rejects.toBeInstanceOf(CotizaveRateLimitError);
    expect(calls.length).toBe(1);
  });

  it('validates retry options', () => {
    expect(() => new Cotizave({ apiKey: 'k', retry: { baseDelay: -1 } })).toThrow(/baseDelay/);
    // @ts-expect-error statuses must be numbers
    expect(() => new Cotizave({ apiKey: 'k', retry: { statuses: ['500'] } })).toThrow(/statuses/);
    // @ts-expect-error shouldRetry must be a function
    expect(() => new Cotizave({ apiKey: 'k', retry: { shouldRetry: true } })).toThrow(
      /shouldRetry/,
    );
  });
});

describe('newly covered endpoints', () => {
  it('rates.snapshot asks for the board of a past day', async () => {
    const { client, calls } = harness(
      always({ body: { country: 'AR', currency: 'ARS', date: '2026-10-01', count: 0, rates: [] } }),
    );
    const board = await client.rates.snapshot('AR', '2026-10-01');
    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe('/v2/fx/ar/rates');
    expect(url.searchParams.get('date')).toBe('2026-10-01');
    expect(board.date).toBe('2026-10-01');
  });

  it('history.stats asks for aggregates with an optional moving average', async () => {
    const { client, calls } = harness(
      always({ body: { id: 'ar-official', stats: { count: 30, min: 1, max: 2, avg: 1.5 } } }),
    );
    const res = await client.history.stats({
      country: 'AR',
      rateId: 'ar-official',
      from: '2026-09-01',
      to: '2026-09-30',
      movingAverage: 7,
    });
    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe('/v2/fx/ar/rates/ar-official/history');
    expect(url.searchParams.get('stats')).toBe('1');
    expect(url.searchParams.get('ma')).toBe('7');
    expect(url.searchParams.get('from')).toBe('2026-09-01');
    expect(res.stats.count).toBe(30);
  });
});
