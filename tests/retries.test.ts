import { describe, it, expect } from 'vitest';
import { CotizaveBadRequestError, CotizaveRateLimitError, CotizaveServerError } from '../src/index';
import { harness, sequence, always } from './helpers';

describe('retry policy', () => {
  it('retries an eligible GET on 503 and then succeeds', async () => {
    const { client, calls } = harness(
      sequence(
        { status: 503, body: { code: 'service_unavailable', message: 'down' } },
        { status: 200, body: { country: 'AR', rates: [] } },
      ),
    );
    const res = await client.rates.list('AR');
    expect(res.country).toBe('AR');
    expect(calls.length).toBe(2);
  });

  it('respects X-RateLimit-Retry-After-Ms on a burst 429', async () => {
    const { client, calls } = harness(
      sequence(
        {
          status: 429,
          body: { code: 'rate_limit_exceeded', message: 'slow', details: { kind: 'burst' } },
          headers: { 'x-ratelimit-scope': 'burst', 'x-ratelimit-retry-after-ms': '20' },
        },
        { status: 200, body: { country: 'VE', rates: [] } },
      ),
    );
    const start = Date.now();
    await client.rates.list('VE');
    expect(calls.length).toBe(2);
    expect(Date.now() - start).toBeGreaterThanOrEqual(15);
  });

  it('never retries a monthly 429 (quota exhausted)', async () => {
    const { client, calls } = harness(
      always({
        status: 429,
        body: { code: 'rate_limit_exceeded', message: 'quota', details: { kind: 'monthly' } },
        headers: { 'x-ratelimit-scope': 'monthly', 'retry-after': '3600' },
      }),
    );
    await expect(client.rates.list('AR')).rejects.toBeInstanceOf(CotizaveRateLimitError);
    expect(calls.length).toBe(1);
  });

  it('never retries a 400', async () => {
    const { client, calls } = harness(
      always({ status: 400, body: { code: 'unknown_parameter', message: 'bad' } }),
    );
    await expect(client.rates.list('AR')).rejects.toBeInstanceOf(CotizaveBadRequestError);
    expect(calls.length).toBe(1);
  });

  it('gives up after maxRetries and throws the last error', async () => {
    const { client, calls } = harness(
      always({
        status: 429,
        body: { code: 'rate_limit_exceeded', message: 'slow', details: { kind: 'burst' } },
        headers: { 'x-ratelimit-scope': 'burst', 'x-ratelimit-retry-after-ms': '5' },
      }),
      { maxRetries: 2, maxRetryDelay: 1000 },
    );
    await expect(client.rates.list('AR')).rejects.toBeInstanceOf(CotizaveRateLimitError);
    expect(calls.length).toBe(3); // 1 + 2 retries
  });

  it('disables retries when maxRetries is 0', async () => {
    const { client, calls } = harness(
      always({ status: 503, body: { code: 'service_unavailable', message: 'down' } }),
      { maxRetries: 0 },
    );
    await expect(client.rates.list('AR')).rejects.toBeInstanceOf(CotizaveServerError);
    expect(calls.length).toBe(1);
  });

  it('does not retry POST (bulk convert)', async () => {
    const { client, calls } = harness(
      always({ status: 503, body: { code: 'service_unavailable', message: 'down' } }),
    );
    await expect(
      client.convertBulk({ conversions: [{ from: 'USD', to: 'ARS', amount: 1 }] }),
    ).rejects.toBeInstanceOf(CotizaveServerError);
    expect(calls.length).toBe(1);
  });

  it('stops retrying when the server delay exceeds the budget', async () => {
    const { client, calls } = harness(
      always({
        status: 429,
        body: { code: 'rate_limit_exceeded', message: 'slow', details: { kind: 'burst' } },
        headers: { 'x-ratelimit-scope': 'burst', 'retry-after': '120' },
      }),
      { maxRetries: 3, maxRetryDelay: 1000 },
    );
    await expect(client.rates.list('AR')).rejects.toBeInstanceOf(CotizaveRateLimitError);
    expect(calls.length).toBe(1); // 120s > 1s budget → no retry
  });
});
