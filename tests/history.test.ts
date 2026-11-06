import { describe, it, expect } from 'vitest';
import { harness, always, sequence } from './helpers';

describe('history', () => {
  it('get(point) sends only a date', async () => {
    const { client, calls } = harness(
      always({ body: { id: 'co-trm', date: '2026-10-01', mid: 4000 } }),
    );
    await client.history.get({ country: 'CO', rateId: 'co-trm', date: '2026-10-01' });
    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe('/v2/fx/co/rates/co-trm/history');
    expect(url.searchParams.get('date')).toBe('2026-10-01');
    expect(url.searchParams.has('granularity')).toBe(false);
  });

  it('daily sends granularity=daily with from/to', async () => {
    const { client, calls } = harness(
      always({ body: { granularity: 'daily', points: [], next_cursor: null } }),
    );
    await client.history.daily({
      country: 'AR',
      rateId: 'ar-official',
      from: '2026-09-01',
      to: '2026-09-30',
    });
    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get('granularity')).toBe('daily');
    expect(url.searchParams.get('from')).toBe('2026-09-01');
    expect(url.searchParams.get('to')).toBe('2026-09-30');
  });

  it('raw sends granularity=raw with cursor/limit', async () => {
    const { client, calls } = harness(
      always({ body: { granularity: 'raw', points: [], next_cursor: null } }),
    );
    await client.history.raw({ country: 'VE', rateId: 've-bcv', cursor: 'abc', limit: 500 });
    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get('granularity')).toBe('raw');
    expect(url.searchParams.get('cursor')).toBe('abc');
    expect(url.searchParams.get('limit')).toBe('500');
  });

  it('iterate follows next_cursor and stops when it is null', async () => {
    const { client, calls } = harness(
      sequence(
        {
          body: {
            granularity: 'raw',
            points: [{ date: '2026-09-01', mid: 1, updated_at: '', fetched_at: '' }],
            next_cursor: 'c2',
          },
        },
        {
          body: {
            granularity: 'raw',
            points: [{ date: '2026-09-02', mid: 2, updated_at: '', fetched_at: '' }],
            next_cursor: null,
          },
        },
      ),
    );
    const mids: number[] = [];
    for await (const point of client.history.iterate({ country: 'VE', rateId: 've-bcv' })) {
      mids.push(point.mid);
    }
    expect(mids).toEqual([1, 2]);
    expect(calls.length).toBe(2);
    expect(new URL(calls[1]!.url).searchParams.get('cursor')).toBe('c2');
  });

  it('iterate respects maxPages', async () => {
    const { client, calls } = harness(
      always({
        body: {
          granularity: 'raw',
          points: [{ date: 'x', mid: 1, updated_at: '', fetched_at: '' }],
          next_cursor: 'always',
        },
      }),
    );
    const collected: number[] = [];
    for await (const point of client.history.iterate({
      country: 'VE',
      rateId: 've-bcv',
      maxPages: 3,
    })) {
      collected.push(point.mid);
    }
    expect(calls.length).toBe(3);
    expect(collected.length).toBe(3);
  });

  it('limits() hits the historical-limits endpoint', async () => {
    const { client, calls } = harness(always({ body: { base: 'USD', count: 0, limits: [] } }));
    await client.history.limits();
    expect(new URL(calls[0]!.url).pathname).toBe('/v2/fx/historical-limits');
  });
});
