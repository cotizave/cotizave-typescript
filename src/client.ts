import { resolveConfig, type CotizaveOptions, type ResolvedConfig } from './config';
import { Transport, type QueryParams, type RequestOptions, type RawResult } from './transport';
import { RatesResource } from './resources/rates';
import { HistoryResource } from './resources/history';
import { ConversionResource, type ConvertOptions, type BulkConvertOptions } from './resources/conversion';
import {
  FxToolsResource,
  type SpreadOptions,
  type RouteOptions,
  type BankRatesOptions,
  type MarketsCatalog,
  type BankRatesResponse,
} from './resources/markets';
import {
  CountriesResource,
  CurrenciesResource,
  BanksResource,
  IssuersResource,
} from './resources/catalogs';
import { HolidaysResource } from './resources/holidays';
import { CryptoResource } from './resources/crypto';
import type { ConvertResponse, BulkConvertResponse, SpreadResponse, RouteResponse } from './types/public';

/**
 * The Cotizave API v2 client.
 *
 * @example
 * import { Cotizave } from '@cotizave/sdk';
 *
 * const client = new Cotizave({ apiKey: process.env.COTIZAVE_API_KEY! });
 * const rates = await client.rates.list('AR');
 */
export class Cotizave {
  /** Resolved, validated configuration (read-only). */
  readonly config: Readonly<ResolvedConfig>;

  private readonly transport: Transport;
  private readonly fx: FxToolsResource;
  private readonly conversion: ConversionResource;

  /** Per-country rate reads and the global officials feed. */
  readonly rates: RatesResource;
  /** Point-in-time, daily and raw history, plus coverage limits. */
  readonly history: HistoryResource;
  /** Published countries catalog (Pro+). */
  readonly countries: CountriesResource;
  /** Currencies catalog (Pro+). */
  readonly currencies: CurrenciesResource;
  /** Bank identities, with optional search. */
  readonly banks: BanksResource;
  /** Official-rate issuers directory. */
  readonly issuers: IssuersResource;
  /** Holiday calendars and business-day math. */
  readonly holidays: HolidaysResource;
  /** Stablecoin references priced in USD. */
  readonly crypto: CryptoResource;

  constructor(options: CotizaveOptions) {
    this.config = Object.freeze(resolveConfig(options));
    this.transport = new Transport(this.config);

    this.rates = new RatesResource(this.transport);
    this.history = new HistoryResource(this.transport);
    this.countries = new CountriesResource(this.transport);
    this.currencies = new CurrenciesResource(this.transport);
    this.banks = new BanksResource(this.transport);
    this.issuers = new IssuersResource(this.transport);
    this.holidays = new HolidaysResource(this.transport);
    this.crypto = new CryptoResource(this.transport);

    this.conversion = new ConversionResource(this.transport);
    this.fx = new FxToolsResource(this.transport);
  }

  /** Converts a single amount. See {@link ConversionResource.convert}. */
  convert(options: ConvertOptions): Promise<ConvertResponse> {
    return this.conversion.convert(options);
  }

  /** Converts up to 50 items in one call. See {@link ConversionResource.convertBulk}. */
  convertBulk(options: BulkConvertOptions): Promise<BulkConvertResponse> {
    return this.conversion.convertBulk(options);
  }

  /** The country's rate catalog (no prices). Growth+. */
  markets(country: string): Promise<MarketsCatalog> {
    return this.fx.markets(country);
  }

  /** Spread of the official rate against another market. Growth+. */
  spread(country: string, options?: SpreadOptions): Promise<SpreadResponse> {
    return this.fx.spread(country, options);
  }

  /** Best executable rate for an amount. Pro+. */
  route(country: string, options: RouteOptions): Promise<RouteResponse> {
    return this.fx.route(country, options);
  }

  /** BCV per-bank quotations (all plans). */
  bankRates(country: string, options?: BankRatesOptions): Promise<BankRatesResponse> {
    return this.fx.bankRates(country, options);
  }

  /**
   * Low-level request with full response metadata (status, headers, rate-limit
   * info) and support for conditional GETs (`ifNoneMatch`) and non-JSON bodies
   * (`parse: 'text'`). Most code should use the typed resources above.
   */
  request<T>(options: RequestOptions): Promise<RawResult<T>> {
    return this.transport.request<T>(options);
  }

  /**
   * Fetches a resource as CSV or XML and returns the raw body text.
   *
   * @example
   * const csv = await client.export('/v2/fx/ar/rates', { format: 'csv' });
   */
  async export(path: string, query: QueryParams & { format: 'csv' | 'xml' }): Promise<string> {
    const accept = query.format === 'csv' ? 'text/csv' : 'application/xml';
    const result = await this.transport.request<string>({
      method: 'GET',
      path,
      query,
      accept,
      parse: 'text',
    });
    return result.data ?? '';
  }
}
