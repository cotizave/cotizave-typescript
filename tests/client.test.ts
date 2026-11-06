import { describe, it, expect } from 'vitest';
import { Cotizave, DEFAULT_BASE_URL } from '../src/index';
import { harness, always } from './helpers';

describe('constructor and configuration', () => {
  it('requires a non-empty apiKey', () => {
    // @ts-expect-error missing apiKey
    expect(() => new Cotizave({})).toThrow(/apiKey/);
    expect(() => new Cotizave({ apiKey: '' })).toThrow(/apiKey/);
    expect(() => new Cotizave({ apiKey: '   ' })).toThrow(/apiKey/);
  });

  it('applies defaults', () => {
    const client = new Cotizave({ apiKey: 'k' });
    expect(client.config.baseUrl).toBe(DEFAULT_BASE_URL);
    expect(client.config.timeout).toBe(30_000);
    expect(client.config.maxRetries).toBe(2);
  });

  it('rejects an invalid baseUrl', () => {
    expect(() => new Cotizave({ apiKey: 'k', baseUrl: 'not-a-url' })).toThrow(/baseUrl/);
    expect(() => new Cotizave({ apiKey: 'k', baseUrl: 'ftp://x.com' })).toThrow(/baseUrl/);
  });

  it('strips trailing slashes from baseUrl', () => {
    const client = new Cotizave({ apiKey: 'k', baseUrl: 'https://example.com/' });
    expect(client.config.baseUrl).toBe('https://example.com');
  });

  it('validates numeric options', () => {
    expect(() => new Cotizave({ apiKey: 'k', timeout: -1 })).toThrow(/timeout/);
    expect(() => new Cotizave({ apiKey: 'k', maxRetries: -1 })).toThrow(/maxRetries/);
  });

  it('freezes resolved config', () => {
    const client = new Cotizave({ apiKey: 'k' });
    expect(Object.isFrozen(client.config)).toBe(true);
  });
});

describe('request building', () => {
  it('lowercases country codes and builds the right URL', async () => {
    const { client, calls } = harness(always({ body: { country: 'AR', rates: [] } }));
    await client.rates.list('AR');
    expect(calls[0]!.url).toBe('https://api.cotizave.com/v2/fx/ar/rates');
  });

  it('omits undefined query params but sends provided ones', async () => {
    const { client, calls } = harness(always({ body: { country: 'VE', rates: [] } }));
    await client.rates.list('ve', { tag: 'bcv' });
    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get('tag')).toBe('bcv');
    expect(url.searchParams.has('category')).toBe(false);
    expect(url.searchParams.has('base')).toBe(false);
  });

  it('encodes path segments', async () => {
    const { client, calls } = harness(always({ body: { id: 'co-trm' } }));
    await client.rates.get('CO', 'co-trm');
    expect(calls[0]!.url).toBe('https://api.cotizave.com/v2/fx/co/rates/co-trm');
  });

  it('sends a default User-Agent and a custom suffix', async () => {
    const { client, calls } = harness(always({ body: {} }), { userAgent: 'acme/1.0' });
    await client.issuers.list();
    expect(calls[0]!.headers['user-agent']).toMatch(/^cotizave-sdk-typescript\/.+ acme\/1\.0$/);
  });

  it('joins array symbols for the global feed and sets format=map', async () => {
    const { client, calls } = harness(always({ body: { base: 'USD', date: '', rates: {} } }));
    await client.rates.global({ symbols: ['BRL', 'EUR'], asMap: true });
    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe('/v2/fx/rates');
    expect(url.searchParams.get('symbols')).toBe('BRL,EUR');
    expect(url.searchParams.get('format')).toBe('map');
  });
});
