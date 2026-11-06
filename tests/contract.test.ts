import { describe, it, expect } from 'vitest';
import type { RatesResponse, CryptoList } from '../src/index';
import { harness, always } from './helpers';

// Fixtures copied verbatim from openapi/cotizave-v2.yaml examples, so the SDK
// is exercised against the documented contract shapes — not invented data.

const VE_FREE_RATES: RatesResponse = {
  country: 'VE',
  currency: 'VES',
  base: 'USD',
  fetched_at: '2026-10-22T13:05:03Z',
  plan: 'free',
  index: { value: 290.85, version: 'v1' },
  rates: [
    { id: 've-bcv', market: 'reference', type: 'reference', base: 'USD', mid: 248.45123456, updated_at: '2026-10-22T04:00:00Z', effective_date: '2026-10-22' },
    { id: 've-binance', market: 'binance', type: 'p2p', base: 'USD', mid: 290.85, bid: 290.4, ask: 291.3, updated_at: '2026-10-22T12:58:40Z' },
    { id: 've-cash' },
  ],
} as unknown as RatesResponse;

const CRYPTO_GROWTH: CryptoList = {
  base: 'USD',
  fetched_at: '2026-10-22T13:05:00Z',
  plan: 'indie',
  rates: [
    { id: 'usdt-usd', market: 'crypto_usdt', name: 'Tether', type: 'crypto', base: 'USDT', quote: 'USD', mid: 0.998695, bid: 0.99869, ask: 0.9987, updated_at: '2026-10-22T13:05:00Z', stale: false, stale_after_sec: 900, staleness_sec: 12, change_24h_pct: -0.04, tags: ['crypto', 'usdt', 'stablecoin'], available: true, required_plan: 'indie' },
  ],
} as unknown as CryptoList;

describe('contract fixtures', () => {
  it('rates.list preserves VE free-plan shape, including a price-less descriptor', async () => {
    const { client } = harness(always({ body: VE_FREE_RATES }));
    const res = await client.rates.list('VE');
    expect(res.country).toBe('VE');
    expect(res.rates).toHaveLength(3);
    // Canonical id is preserved; a reference is never silently turned into P2P.
    expect(res.rates[0]!.id).toBe('ve-bcv');
    expect(res.rates[0]!.type).toBe('reference');
    // High-precision decimals are kept intact.
    expect((res.rates[0] as { mid: number }).mid).toBe(248.45123456);
    // A descriptor-only rate (ve-cash) keeps just its id.
    expect(res.rates[2]).toEqual({ id: 've-cash' });
  });

  it('crypto.list preserves the stablecoin row shape', async () => {
    const { client } = harness(always({ body: CRYPTO_GROWTH }));
    const res = await client.crypto.list();
    expect(res.base).toBe('USD');
    expect(res.rates[0]!.id).toBe('usdt-usd');
    expect(res.rates[0]!.type).toBe('crypto');
    expect((res.rates[0] as { quote: string }).quote).toBe('USD');
  });
});
