import { Resource } from './base';
import type { RequestConfig } from '../transport';
import type { ConvertResponse, BulkConvertResponse } from '../types/public';

/** Input for a single conversion. */
export interface ConvertOptions {
  /** Source currency (ISO 4217), e.g. `USD`. */
  from: string;
  /** Target currency (ISO 4217), e.g. `BRL`. */
  to: string;
  /** Amount to convert (> 0). */
  amount: number;
  /** Explicit v2 rate id to convert through (e.g. `ve-binance`). */
  via?: string;
  /** v1 local market alias for `via` (Venezuela only). */
  market?: string;
  /** Historical conversion date (`YYYY-MM-DD`); Growth+ where supported. */
  date?: string;
}

/** A single item inside a bulk conversion request. */
export interface BulkConvertItemInput {
  from: string;
  to: string;
  amount: number;
  via?: string;
  date?: string;
}

/** Input for a bulk conversion (max 50 items). */
export interface BulkConvertOptions {
  conversions: BulkConvertItemInput[];
}

/** The maximum number of conversions accepted by a single bulk request. */
export const BULK_CONVERT_MAX = 50;

/** Conversion operations. The arithmetic runs on Cotizave, never in the SDK. */
export class ConversionResource extends Resource {
  /**
   * Converts one amount between two currencies.
   *
   * @example
   * const result = await client.convert({ from: 'USD', to: 'BRL', amount: 100 });
   */
  async convert(options: ConvertOptions, config?: RequestConfig): Promise<ConvertResponse> {
    if (!(typeof options.amount === 'number' && options.amount > 0)) {
      throw new TypeError('convert: `amount` must be a number greater than 0.');
    }
    return this.transport.get<ConvertResponse>(
      '/v2/fx/convert',
      {
        from: options.from,
        to: options.to,
        amount: options.amount,
        via: options.via,
        market: options.market,
        date: options.date,
      },
      config,
    );
  }

  /**
   * Converts up to 50 items in one request (Pro+). Counts as a single query.
   * Each result keeps its input order and carries either a `conversion` or an
   * `error` — a failed item never silently drops.
   *
   * @example
   * const { results } = await client.convertBulk({
   *   conversions: [
   *     { from: 'USD', to: 'ARS', amount: 100 },
   *     { from: 'USD', to: 'COP', amount: 250 },
   *   ],
   * });
   */
  async convertBulk(
    options: BulkConvertOptions,
    config?: RequestConfig,
  ): Promise<BulkConvertResponse> {
    const conversions = options?.conversions;
    if (!Array.isArray(conversions) || conversions.length === 0) {
      throw new TypeError('convertBulk: `conversions` must be a non-empty array.');
    }
    if (conversions.length > BULK_CONVERT_MAX) {
      throw new TypeError(
        `convertBulk: at most ${BULK_CONVERT_MAX} conversions are allowed (got ${conversions.length}).`,
      );
    }
    return this.transport.post<BulkConvertResponse>('/v2/fx/convert', { conversions }, config);
  }
}
