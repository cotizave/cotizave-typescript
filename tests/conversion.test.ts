import { describe, it, expect } from 'vitest';
import { BULK_CONVERT_MAX } from '../src/index';
import { harness, always } from './helpers';

describe('convert', () => {
  it('sends from/to/amount as query params on GET', async () => {
    const { client, calls } = harness(
      always({
        body: {
          from: { currency: 'USD', amount: 100 },
          to: { currency: 'BRL', amount: 500 },
          rate: 5,
        },
      }),
    );
    const res = await client.convert({ from: 'USD', to: 'BRL', amount: 100 });
    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe('/v2/fx/convert');
    expect(url.searchParams.get('from')).toBe('USD');
    expect(url.searchParams.get('to')).toBe('BRL');
    expect(url.searchParams.get('amount')).toBe('100');
    expect(res.rate).toBe(5);
  });

  it('rejects non-positive amounts before any request', async () => {
    const { client, calls } = harness(always({ body: {} }));
    await expect(client.convert({ from: 'USD', to: 'BRL', amount: 0 })).rejects.toThrow(/amount/);
    expect(calls.length).toBe(0);
  });

  it('passes optional via/date', async () => {
    const { client, calls } = harness(always({ body: { rate: 1 } }));
    await client.convert({
      from: 'USD',
      to: 'VES',
      amount: 10,
      via: 've-binance',
      date: '2026-10-01',
    });
    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get('via')).toBe('ve-binance');
    expect(url.searchParams.get('date')).toBe('2026-10-01');
  });
});

describe('convertBulk', () => {
  it('POSTs a JSON body with conversions', async () => {
    const { client, calls } = harness(
      always({ body: { count: 2, succeeded: 2, failed: 0, results: [] } }),
    );
    await client.convertBulk({
      conversions: [
        { from: 'USD', to: 'ARS', amount: 100 },
        { from: 'USD', to: 'COP', amount: 250 },
      ],
    });
    const call = calls[0]!;
    expect(call.method).toBe('POST');
    expect(call.headers['content-type']).toBe('application/json');
    expect(JSON.parse(call.body!)).toEqual({
      conversions: [
        { from: 'USD', to: 'ARS', amount: 100 },
        { from: 'USD', to: 'COP', amount: 250 },
      ],
    });
  });

  it('rejects an empty list', async () => {
    const { client, calls } = harness(always({ body: {} }));
    await expect(client.convertBulk({ conversions: [] })).rejects.toThrow(/non-empty/);
    expect(calls.length).toBe(0);
  });

  it(`rejects more than ${BULK_CONVERT_MAX} items`, async () => {
    const { client, calls } = harness(always({ body: {} }));
    const conversions = Array.from({ length: BULK_CONVERT_MAX + 1 }, () => ({
      from: 'USD',
      to: 'ARS',
      amount: 1,
    }));
    await expect(client.convertBulk({ conversions })).rejects.toThrow(/at most 50/);
    expect(calls.length).toBe(0);
  });

  it('preserves per-item results, including errors', async () => {
    const { client } = harness(
      always({
        body: {
          count: 2,
          succeeded: 1,
          failed: 1,
          results: [
            {
              index: 0,
              conversion: {
                from: { currency: 'USD', amount: 100 },
                to: { currency: 'ARS', amount: 1 },
                rate: 1,
              },
            },
            { index: 1, error: { code: 'rate_not_found', message: 'no rate' } },
          ],
        },
      }),
    );
    const res = await client.convertBulk({
      conversions: [
        { from: 'USD', to: 'ARS', amount: 100 },
        { from: 'USD', to: 'ZZZ', amount: 1 },
      ],
    });
    expect(res.failed).toBe(1);
    expect(res.results[0]!.conversion).toBeDefined();
    expect(res.results[1]!.error?.code).toBe('rate_not_found');
  });
});
