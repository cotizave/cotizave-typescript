import { Resource, cc, seg } from './base';
import type { RequestConfig } from '../transport';
import type { HistoryPoint, HistoryCollection, HistoricalLimitsResponse } from '../types/public';

interface RateRef {
  /** Country code (ISO 3166 alpha-2). */
  country: string;
  /** Canonical rate id (e.g. `co-trm`). */
  rateId: string;
}

/** A single-day history lookup. */
export interface HistoryPointOptions extends RateRef {
  /** The day to read (`YYYY-MM-DD`). Returns the rate that ruled that day. */
  date: string;
}

/** A daily history series over a date range. */
export interface HistoryDailyOptions extends RateRef {
  from?: string;
  to?: string;
}

/** A single page of raw (intraday) captures. */
export interface HistoryRawOptions extends RateRef {
  /** Opaque cursor from a previous page's `next_cursor`. */
  cursor?: string;
  /** Page size (1–5000, default 1000). */
  limit?: number;
}

/** Controls the {@link HistoryResource.iterate} async generator. */
export interface HistoryIterateOptions extends RateRef {
  limit?: number;
  /** Hard cap on how many pages to fetch (default 50). Prevents runaway reads. */
  maxPages?: number;
}

type RawPoint = HistoryCollection['points'][number];

/** Historical reads: point-in-time, daily series, raw captures, and coverage. */
export class HistoryResource extends Resource {
  /**
   * The rate that ruled on a specific day.
   *
   * @example
   * await client.history.get({ country: 'CO', rateId: 'co-trm', date: '2026-10-01' });
   */
  get(options: HistoryPointOptions, config?: RequestConfig): Promise<HistoryPoint> {
    return this.transport.get<HistoryPoint>(this.path(options), { date: options.date }, config);
  }

  /**
   * A daily series between `from` and `to`.
   *
   * @example
   * await client.history.daily({ country: 'AR', rateId: 'ar-official', from: '2026-09-01', to: '2026-09-30' });
   */
  daily(options: HistoryDailyOptions, config?: RequestConfig): Promise<HistoryCollection> {
    return this.transport.get<HistoryCollection>(
      this.path(options),
      {
        granularity: 'daily',
        from: options.from,
        to: options.to,
      },
      config,
    );
  }

  /**
   * One page of raw (intraday) captures. Pages advance backwards in time; each
   * page's points are ascending. Pass the previous page's `next_cursor` to
   * continue. Only available where the plan allows raw history.
   */
  raw(options: HistoryRawOptions, config?: RequestConfig): Promise<HistoryCollection> {
    return this.transport.get<HistoryCollection>(
      this.path(options),
      {
        granularity: 'raw',
        cursor: options.cursor,
        limit: options.limit,
      },
      config,
    );
  }

  /**
   * Async iterator over raw captures, following cursors for you.
   *
   * Bounded by `maxPages` (default 50) so it never silently downloads an entire
   * history. Break out of the loop at any time to stop fetching.
   *
   * @example
   * for await (const point of client.history.iterate({ country: 'VE', rateId: 've-bcv' })) {
   *   console.log(point.date, point.mid);
   * }
   */
  async *iterate(
    options: HistoryIterateOptions,
    config?: RequestConfig,
  ): AsyncGenerator<RawPoint, void, void> {
    const maxPages = options.maxPages ?? 50;
    let cursor: string | undefined;
    for (let page = 0; page < maxPages; page += 1) {
      const result: HistoryCollection = await this.raw(
        {
          country: options.country,
          rateId: options.rateId,
          ...(options.limit !== undefined ? { limit: options.limit } : {}),
          ...(cursor !== undefined ? { cursor } : {}),
        },
        config,
      );
      for (const point of result.points) yield point;
      if (!result.next_cursor) return;
      cursor = result.next_cursor;
    }
  }

  /**
   * Coverage (first/last/days) of the stored history for every rate the plan
   * can see — use it to know which dates are safe to request.
   */
  limits(config?: RequestConfig): Promise<HistoricalLimitsResponse> {
    return this.transport.get<HistoricalLimitsResponse>('/v2/fx/historical-limits', undefined, config);
  }

  private path(ref: RateRef): string {
    return `/v2/fx/${cc(ref.country)}/rates/${seg(ref.rateId, 'rate id')}/history`;
  }
}
