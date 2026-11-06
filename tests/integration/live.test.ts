/**
 * Opt-in tests against the real Cotizave API.
 *
 * They are skipped unless BOTH variables are set, so they never run by accident
 * (not in `npm test`, not in CI, not when publishing):
 *
 *   COTIZAVE_INTEGRATION=1 COTIZAVE_API_KEY=... npm run test:integration
 *
 * They only issue a handful of read-only requests available on every plan, so
 * they cost a few quota units. The key is read from the environment and is
 * never printed.
 */
import { describe, it, expect } from 'vitest';
import { Cotizave, CotizaveAuthenticationError } from '../../src/index';

const apiKey = process.env['COTIZAVE_API_KEY'];
const enabled = process.env['COTIZAVE_INTEGRATION'] === '1' && Boolean(apiKey);

describe.skipIf(!enabled)('live API (opt-in)', () => {
  const client = new Cotizave({ apiKey: apiKey ?? 'unset', maxRetries: 1 });

  it('reads the issuers directory', async () => {
    const res = await client.issuers.list();
    expect(Array.isArray(res.issuers)).toBe(true);
  });

  it('reads the global official rates and exposes quota metadata', async () => {
    const { data, meta } = await client.request<{ rates: unknown[] }>({ path: '/v2/fx/rates' });
    expect(Array.isArray(data?.rates)).toBe(true);
    expect(meta.status).toBe(200);
    expect(typeof meta.rateLimit.remaining).toBe('number');
  });

  it('reads the history coverage', async () => {
    const res = await client.history.limits();
    expect(Array.isArray(res.limits)).toBe(true);
  });

  it('maps a rejected key to a typed authentication error', async () => {
    const wrong = new Cotizave({ apiKey: 'invalid-key-for-integration-test', maxRetries: 0 });
    await expect(wrong.issuers.list()).rejects.toBeInstanceOf(CotizaveAuthenticationError);
  });
});
