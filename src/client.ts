import { resolveConfig, type CotizaveOptions, type PublicConfig } from './config';
import {
  Transport,
  type QueryParams,
  type RequestOptions,
  type RawResult,
  type RequestConfig,
} from './transport';
import { RatesResource } from './resources/rates';
import { HistoryResource } from './resources/history';
import {
  ConversionResource,
  type ConvertOptions,
  type BulkConvertOptions,
} from './resources/conversion';
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
import type {
  ConvertResponse,
  BulkConvertResponse,
  SpreadResponse,
  RouteResponse,
} from './types/public';

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
  /**
   * Resolved, validated configuration (read-only). The API key is deliberately
   * left out, so logging or serializing the client never exposes it.
   */
  readonly config: PublicConfig;

  readonly #transport: Transport;
  readonly #fx: FxToolsResource;
  readonly #conversion: ConversionResource;

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
    const resolved = resolveConfig(options);
    this.config = Object.freeze({
      baseUrl: resolved.baseUrl,
      timeout: resolved.timeout,
      historyTimeout: resolved.historyTimeout,
      maxRetries: resolved.maxRetries,
      maxRetryDelay: resolved.maxRetryDelay,
      maxResponseBytes: resolved.maxResponseBytes,
      userAgent: resolved.userAgent,
      ...(resolved.language !== undefined ? { language: resolved.language } : {}),
    });

    const transport = new Transport(resolved);
    this.#transport = transport;

    this.rates = new RatesResource(transport);
    this.history = new HistoryResource(transport);
    this.countries = new CountriesResource(transport);
    this.currencies = new CurrenciesResource(transport);
    this.banks = new BanksResource(transport);
    this.issuers = new IssuersResource(transport);
    this.holidays = new HolidaysResource(transport);
    this.crypto = new CryptoResource(transport);

    this.#conversion = new ConversionResource(transport);
    this.#fx = new FxToolsResource(transport);
  }

  /** Converts a single amount. See {@link ConversionResource.convert}. */
  convert(options: ConvertOptions, config?: RequestConfig): Promise<ConvertResponse> {
    return this.#conversion.convert(options, config);
  }

  /** Converts up to 50 items in one call. See {@link ConversionResource.convertBulk}. */
  convertBulk(options: BulkConvertOptions, config?: RequestConfig): Promise<BulkConvertResponse> {
    return this.#conversion.convertBulk(options, config);
  }

  /** The country's rate catalog (no prices). Growth+. */
  markets(country: string, config?: RequestConfig): Promise<MarketsCatalog> {
    return this.#fx.markets(country, config);
  }

  /** Spread of the official rate against another market. Growth+. */
  spread(
    country: string,
    options?: SpreadOptions,
    config?: RequestConfig,
  ): Promise<SpreadResponse> {
    return this.#fx.spread(country, options, config);
  }

  /** Best executable rate for an amount. Pro+. */
  route(country: string, options: RouteOptions, config?: RequestConfig): Promise<RouteResponse> {
    return this.#fx.route(country, options, config);
  }

  /** BCV per-bank quotations (all plans). */
  bankRates(
    country: string,
    options?: BankRatesOptions,
    config?: RequestConfig,
  ): Promise<BankRatesResponse> {
    return this.#fx.bankRates(country, options, config);
  }

  /**
   * Low-level request with full response metadata (status, headers, rate-limit
   * info) and support for conditional GETs (`ifNoneMatch`) and non-JSON bodies
   * (`parse: 'text'`). Most code should use the typed resources above.
   */
  request<T>(options: RequestOptions): Promise<RawResult<T>> {
    return this.#transport.request<T>(options);
  }

  /**
   * Fetches a resource as CSV or XML and returns the raw body text.
   *
   * @example
   * const csv = await client.export('/v2/fx/ar/rates', { format: 'csv' });
   */
  async export(path: string, query: QueryParams & { format: 'csv' | 'xml' }): Promise<string> {
    const accept = query.format === 'csv' ? 'text/csv' : 'application/xml';
    const result = await this.#transport.request<string>({
      method: 'GET',
      path,
      query,
      accept,
      parse: 'text',
    });
    return result.data ?? '';
  }
}
