import { Resource, cc, seg } from './base';
import type {
  RatesResponse,
  Rate,
  RateCategory,
  GlobalRatesList,
  GlobalRatesMap,
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
  list(country: string, options: ListRatesOptions = {}): Promise<RatesResponse> {
    return this.transport.get<RatesResponse>(`/v2/fx/${cc(country)}/rates`, {
      tag: options.tag,
      category: options.category,
      base: options.base,
      quote: options.quote,
      markup: options.markup,
    });
  }

  /**
   * Fetches one rate by its canonical id.
   *
   * @example
   * const trm = await client.rates.get('CO', 'co-trm');
   */
  get(country: string, rateId: string): Promise<Rate> {
    return this.transport.get<Rate>(`/v2/fx/${cc(country)}/rates/${seg(rateId, 'rate id')}`);
  }

  /**
   * The official rate of every published country in a single call.
   *
   * Returns the rich list by default, or the compact map when `asMap` is set.
   */
  global(options?: GlobalRatesOptions & { asMap?: false }): Promise<GlobalRatesList>;
  global(options: GlobalRatesOptions & { asMap: true }): Promise<GlobalRatesMap>;
  global(
    options: GlobalRatesOptions & { asMap?: boolean } = {},
  ): Promise<GlobalRatesList | GlobalRatesMap> {
    const symbols = Array.isArray(options.symbols)
      ? options.symbols.join(',')
      : options.symbols;
    return this.transport.get<GlobalRatesList | GlobalRatesMap>('/v2/fx/rates', {
      symbols,
      base: options.base,
      format: options.asMap ? 'map' : undefined,
    });
  }
}
