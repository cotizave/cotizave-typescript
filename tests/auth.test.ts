import { describe, it, expect } from 'vitest';
import { harness, always } from './helpers';

describe('authentication', () => {
  it('sends the API key as X-API-Key and never in the query string', async () => {
    const { client, calls } = harness(always({ body: { rates: [] } }), { apiKey: 'secret-123' });
    await client.rates.list('AR');
    const call = calls[0]!;
    expect(call.headers['x-api-key']).toBe('secret-123');
    expect(call.url).not.toContain('secret-123');
    expect(call.url).not.toContain('api_key');
  });

  it('sets Accept: application/json by default', async () => {
    const { client, calls } = harness(always({ body: {} }));
    await client.issuers.list();
    expect(calls[0]!.headers['accept']).toBe('application/json');
  });

  it('does not keep the API key in a query param on export either', async () => {
    const { client, calls } = harness(always({ body: 'a,b,c', headers: { 'content-type': 'text/csv' } }), {
      apiKey: 'secret-xyz',
    });
    await client.export('/v2/fx/ar/rates', { format: 'csv' });
    expect(calls[0]!.url).not.toContain('secret-xyz');
    expect(calls[0]!.headers['x-api-key']).toBe('secret-xyz');
    expect(calls[0]!.headers['accept']).toBe('text/csv');
  });
});
