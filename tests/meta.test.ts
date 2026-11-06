import { describe, it, expect } from 'vitest';
import { harness, always } from './helpers';

describe('response metadata and conditional requests', () => {
  it('parses rate-limit metadata on a successful response', async () => {
    const { client } = harness(
      always({
        body: { country: 'AR', rates: [] },
        headers: {
          'x-ratelimit-limit': '150000',
          'x-ratelimit-remaining': '149999',
          'x-ratelimit-reset': '2026-12-01T00:00:00Z',
          'x-ratelimit-limit-minute': '120',
          'x-ratelimit-remaining-minute': '119',
          'x-request-id': 'req-abc',
        },
      }),
    );
    const { data, meta } = await client.request<{ country: string }>({
      method: 'GET',
      path: '/v2/fx/ar/rates',
    });
    expect(data?.country).toBe('AR');
    expect(meta.rateLimit.limit).toBe(150000);
    expect(meta.rateLimit.remaining).toBe(149999);
    expect(meta.rateLimit.reset).toBe('2026-12-01T00:00:00Z');
    expect(meta.rateLimit.limitPerMinute).toBe(120);
    expect(meta.rateLimit.remainingPerMinute).toBe(119);
    expect(meta.requestId).toBe('req-abc');
  });

  it('handles 304 Not Modified without parsing a body', async () => {
    const { client, calls } = harness(always({ status: 304 }));
    const result = await client.request({
      method: 'GET',
      path: '/v2/fx/ve/rates',
      ifNoneMatch: 'W/"etag-123"',
    });
    expect(result.notModified).toBe(true);
    expect(result.data).toBeUndefined();
    expect(result.meta.status).toBe(304);
    expect(calls[0]!.headers['if-none-match']).toBe('W/"etag-123"');
  });

  it('export() returns raw CSV text', async () => {
    const { client } = harness(
      always({ body: 'id,mid\nve-bcv,248.45', headers: { 'content-type': 'text/csv' } }),
    );
    const csv = await client.export('/v2/fx/ve/rates', { format: 'csv' });
    expect(csv).toBe('id,mid\nve-bcv,248.45');
  });
});
