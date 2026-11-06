import { Resource, cc, historyConfig, seg } from './base';
import type { RequestConfig } from '../transport';
import type {
  RatesResponse,
  Rate,
  RateCategory,
  RatesSnapshotResponse,
  GlobalRatesList,
} from '../types/public';

/** Filters for {@link RatesResource.list}. */
export interface ListRatesOptions {
  /** Id, v1 id, or alias (e.g. `bcv`, `reference`, `euro`). */
  tag?: string;
  /** Historical v2 category filter. */
  category?: RateCategory;
  /** Base currency (ISO 4217). */
  base?: string;
  /** Quote currency (ISO 4217). */
  quote?: string;
  /** User markup rule — Venezuela and authorized plans only. */
  markup?: string;
}

/** Options for {@link RatesResource.global}. */
export interface GlobalRatesOptions {
  /** Restrict to these quote currencies (ISO 4217). */
  symbols?: string[] | string;
  /** Base currency (paid plans only). Defaults to USD. */
  base?: string;
}

/** Exchange-rate reads: per-country list, single rate by id, and the global feed. */
export class RatesResource extends Resource {
  /**
   * Lists every rate published for a country.
   *
   * @example
   * const { rates } = await client.rates.list('AR');
   */
  list(
    country: string,
    options: ListRatesOptions = {},
    config?: RequestConfig,
  ): Promise<RatesResponse> {
    return this.transport.get<RatesResponse>(
      `/v2/fx/${cc(country)}/rates`,
      {
        tag: options.tag,
        category: options.category,
        base: options.base,
        quote: options.quote,
        markup: options.markup,
      },
      config,
    );
  }

  /**
   * Fetches one rate by its canonical id.
   *
   * @example
   * const trm = await client.rates.get('CO', 'co-trm');
   */
  get(country: string, rateId: string, config?: RequestConfig): Promise<Rate> {
    return this.transport.get<Rate>(
      `/v2/fx/${cc(country)}/rates/${seg(rateId, 'rate id')}`,
      undefined,
      config,
    );
  }

  /**
   * The full board of a country as it closed on a past day: every rate the plan
   * includes, in one call. Subject to the plan's history retention.
   *
   * @example
   * const board = await client.rates.snapshot('AR', '2026-10-01');
   */
  snapshot(country: string, date: string, config?: RequestConfig): Promise<RatesSnapshotResponse> {
    return this.transport.get<RatesSnapshotResponse>(
      `/v2/fx/${cc(country)}/rates`,
      { date: seg(date, 'date') },
      historyConfig(this.transport, config),
    );
  }

  /**
   * The official rate of every published country in a single call.
   *
   * @example
   * const { rates } = await client.rates.global({ symbols: ['BRL', 'EUR'] });
   */
  global(options: GlobalRatesOptions = {}, config?: RequestConfig): Promise<GlobalRatesList> {
    const symbols = Array.isArray(options.symbols) ? options.symbols.join(',') : options.symbols;
    return this.transport.get<GlobalRatesList>(
      '/v2/fx/rates',
      { symbols, base: options.base },
      config,
    );
  }
}
