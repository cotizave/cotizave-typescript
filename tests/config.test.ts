import { describe, it, expect } from 'vitest';
import { Cotizave, CotizaveError, CotizaveConnectionError, CotizaveTimeoutError } from '../src/index';
import { harness, always } from './helpers';

describe('per-call overrides', () => {
  it('per-call maxRetries overrides the client default (down)', async () => {
    const { client, calls } = harness(
      always({ status: 503, body: { code: 'service_unavailable', message: 'down' } }),
      { maxRetries: 3, maxRetryDelay: 50 },
    );
    await expect(client.rates.list('AR', {}, { maxRetries: 0 })).rejects.toBeInstanceOf(CotizaveError);
    expect(calls.length).toBe(1);
  });

  it('per-call maxRetries overrides the client default (up)', async () => {
    const { client, calls } = harness(
      always({
        status: 429,
        body: { code: 'rate_limit_exceeded', message: 'slow', details: { kind: 'burst' } },
        headers: { 'x-ratelimit-scope': 'burst', 'x-ratelimit-retry-after-ms': '3' },
      }),
      { maxRetries: 0, maxRetryDelay: 1000 },
    );
    await expect(client.rates.list('AR', {}, { maxRetries: 2 })).rejects.toBeDefined();
    expect(calls.length).toBe(3);
  });

  it('per-call signal cancels the request', async () => {
    const { client } = harness(always({ body: {} }));
    const controller = new AbortController();
    controller.abort();
    const err = await client.rates.list('AR', {}, { signal: controller.signal }).catch((e) => e);
    expect(err).toBeInstanceOf(CotizaveConnectionError);
  });

  it('per-call timeout aborts a slow request', async () => {
    const client = new Cotizave({
      apiKey: 'k',
      fetch: (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    });
    await expect(client.rates.list('AR', {}, { timeout: 50 })).rejects.toBeInstanceOf(CotizaveTimeoutError);
  });
});

describe('maxResponseBytes', () => {
  it('validates the option', () => {
    expect(() => new Cotizave({ apiKey: 'k', maxResponseBytes: 0 })).toThrow(/maxResponseBytes/);
  });

  it('rejects a body larger than the configured cap', async () => {
    const { client } = harness(always({ body: { big: 'x'.repeat(100) } }), { maxResponseBytes: 10 });
    const err = (await client.rates.list('AR').catch((e) => e)) as CotizaveError;
    expect(err).toBeInstanceOf(CotizaveError);
    expect(err.code).toBe('response_too_large');
  });

  it('allows a per-call maxResponseBytes override via request()', async () => {
    const { client } = harness(always({ body: { big: 'x'.repeat(100) } }), { maxResponseBytes: 5 });
    // Raise the cap for this one call so the same body is accepted.
    const result = await client.request<{ big: string }>({
      method: 'GET',
      path: '/v2/fx/ar/rates',
      maxResponseBytes: 1_000,
    });
    expect(result.data?.big).toHaveLength(100);
  });
});
