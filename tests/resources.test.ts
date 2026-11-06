import { describe, it, expect } from 'vitest';
import { harness, always } from './helpers';

function urlOf(calls: { url: string }[]): URL {
  return new URL(calls[0]!.url);
}

describe('catalog resources', () => {
  it('countries.list / get', async () => {
    const { client, calls } = harness(always({ body: { countries: [] } }));
    await client.countries.list();
    expect(urlOf(calls).pathname).toBe('/v2/countries');

    const h2 = harness(always({ body: { code: 'BR' } }));
    await h2.client.countries.get('BR');
    expect(urlOf(h2.calls).pathname).toBe('/v2/countries/br');
  });

  it('currencies.get encodes the code', async () => {
    const { client, calls } = harness(always({ body: { code: 'USD' } }));
    await client.currencies.get('USD');
    expect(urlOf(calls).pathname).toBe('/v2/currencies/USD');
  });

  it('banks.list passes q and banks.get builds the path', async () => {
    const { client, calls } = harness(always({ body: { country: 'VE', total: 0, banks: [] } }));
    await client.banks.list('VE', { q: 'mercantil' });
    expect(urlOf(calls).pathname).toBe('/v2/banks/ve');
    expect(urlOf(calls).searchParams.get('q')).toBe('mercantil');

    const h2 = harness(always({ body: { code: '0105' } }));
    await h2.client.banks.get('VE', '0105');
    expect(urlOf(h2.calls).pathname).toBe('/v2/banks/ve/0105');
  });

  it('issuers.list', async () => {
    const { client, calls } = harness(always({ body: { issuers: [] } }));
    await client.issuers.list();
    expect(urlOf(calls).pathname).toBe('/v2/issuers');
  });
});

describe('holidays', () => {
  it('list sends year', async () => {
    const { client, calls } = harness(
      always({ body: { country: 'AR', year: 2026, holidays: [] } }),
    );
    await client.holidays.list('AR', { year: 2026 });
    expect(urlOf(calls).searchParams.get('year')).toBe('2026');
  });

  it('check sends date, next sends from', async () => {
    const h1 = harness(
      always({ body: { country: 'AR', date: '2026-05-01', is_holiday: true, holiday: null } }),
    );
    await h1.client.holidays.check('AR', '2026-05-01');
    expect(urlOf(h1.calls).searchParams.get('date')).toBe('2026-05-01');

    const h2 = harness(
      always({ body: { country: 'AR', from: '2026-05-01', days_until: 0, holiday: {} } }),
    );
    await h2.client.holidays.next('AR', '2026-05-01');
    expect(urlOf(h2.calls).searchParams.get('from')).toBe('2026-05-01');
  });

  it('businessDays validates days and builds the path', async () => {
    const { client, calls } = harness(
      always({ body: { country: 'VE', from: '2026-10-01', days: 5, result: '2026-10-08' } }),
    );
    await client.holidays.businessDays('VE', { from: '2026-10-01', days: 5 });
    expect(urlOf(calls).pathname).toBe('/v2/holidays/ve/business-days');
    expect(urlOf(calls).searchParams.get('days')).toBe('5');

    const bad = harness(always({ body: {} }));
    await expect(bad.client.holidays.businessDays('VE', { days: -1 })).rejects.toThrow(/days/);
    expect(bad.calls.length).toBe(0);
  });
});

describe('fx tools', () => {
  it('markets / spread / route / bankRates', async () => {
    const m = harness(always({ body: { country: 'VE', markets: [] } }));
    await m.client.markets('VE');
    expect(urlOf(m.calls).pathname).toBe('/v2/fx/ve/markets');

    const s = harness(always({ body: { country: 'VE', spread: {} } }));
    await s.client.spread('VE', { against: 've-paralelo' });
    expect(urlOf(s.calls).searchParams.get('against')).toBe('ve-paralelo');

    const r = harness(always({ body: { country: 'VE', best: {} } }));
    await r.client.route('VE', {
      from: 'USD',
      to: 'VES',
      amount: 100,
      direction: 'send',
      maxStaleness: 60,
    });
    const ru = urlOf(r.calls);
    expect(ru.pathname).toBe('/v2/fx/ve/route');
    expect(ru.searchParams.get('amount')).toBe('100');
    expect(ru.searchParams.get('max_staleness')).toBe('60');

    const b = harness(always({ body: { country: 'VE', currency: 'VES', banks: [] } }));
    await b.client.bankRates('VE', { bank: '0105' });
    expect(urlOf(b.calls).searchParams.get('bank')).toBe('0105');
  });
});

describe('crypto', () => {
  it('list with tag and get by id', async () => {
    const { client, calls } = harness(always({ body: { base: 'USD', rates: [] } }));
    await client.crypto.list({ tag: 'usdt' });
    expect(urlOf(calls).pathname).toBe('/v2/crypto');
    expect(urlOf(calls).searchParams.get('tag')).toBe('usdt');

    const h2 = harness(always({ body: { id: 'usdt-usd' } }));
    await h2.client.crypto.get('usdt-usd');
    expect(urlOf(h2.calls).pathname).toBe('/v2/crypto/usdt-usd');
  });
});

describe('remaining coverage', () => {
  it('currencies.list hits the catalog', async () => {
    const { client, calls } = harness(always({ body: { currencies: [] } }));
    await client.currencies.list();
    expect(urlOf(calls).pathname).toBe('/v2/currencies');
  });

  it('rates.global accepts symbols as a string and a custom base', async () => {
    const { client, calls } = harness(always({ body: { base: 'EUR', count: 0, rates: [] } }));
    await client.rates.global({ symbols: 'BRL,ARS', base: 'EUR' });
    const url = urlOf(calls);
    expect(url.searchParams.get('symbols')).toBe('BRL,ARS');
    expect(url.searchParams.get('base')).toBe('EUR');
    expect(url.searchParams.has('format')).toBe(false);
  });

  it('rejects empty identifiers before any request', async () => {
    const { client, calls } = harness(always({ body: {} }));
    expect(() => client.rates.list('')).toThrow(/country code/);
    expect(() => client.rates.get('CO', ' ')).toThrow(/rate id/);
    expect(() => client.banks.get('VE', '')).toThrow(/bank code/);
    expect(calls.length).toBe(0);
  });

  it('history.iterate forwards an explicit page size', async () => {
    const { client, calls } = harness(
      always({ body: { granularity: 'raw', points: [], next_cursor: null } }),
    );
    for await (const point of client.history.iterate({
      country: 'VE',
      rateId: 've-bcv',
      limit: 250,
    })) {
      void point;
    }
    expect(urlOf(calls).searchParams.get('limit')).toBe('250');
  });
});
