/**
 * Official TypeScript SDK for the Cotizave API v2.
 *
 * @example
 * import { Cotizave } from '@cotizave/sdk';
 *
 * const client = new Cotizave({ apiKey: process.env.COTIZAVE_API_KEY! });
 * const rates = await client.rates.list('AR');
 */

export { Cotizave } from './client';

export {
  type CotizaveOptions,
  type PublicConfig,
  type FetchLike,
  SDK_VERSION,
  DEFAULT_BASE_URL,
} from './config';

// Errors — catch `CotizaveError` for anything, or a subclass for a family.
export {
  CotizaveError,
  CotizaveBadRequestError,
  CotizaveAuthenticationError,
  CotizaveFeatureNotInPlanError,
  CotizaveForbiddenError,
  CotizaveNotFoundError,
  CotizaveNotAcceptableError,
  CotizaveUnprocessableError,
  CotizaveRateLimitError,
  CotizaveServerError,
  CotizaveConnectionError,
  CotizaveTimeoutError,
  type RateLimitInfo,
  type ResponseMeta,
} from './errors';

// Low-level request/response types.
export type {
  RequestOptions,
  RequestConfig,
  RawResult,
  QueryParams,
  QueryValue,
} from './transport';

// Resource option types.
export type { ListRatesOptions, GlobalRatesOptions } from './resources/rates';
export type {
  HistoryPointOptions,
  HistoryDailyOptions,
  HistoryRawOptions,
  HistoryIterateOptions,
} from './resources/history';
export {
  BULK_CONVERT_MAX,
  type ConvertOptions,
  type BulkConvertOptions,
  type BulkConvertItemInput,
} from './resources/conversion';
export type {
  SpreadOptions,
  RouteOptions,
  BankRatesOptions,
  MarketsCatalog,
  BankRatesResponse,
} from './resources/markets';
export type {
  HolidaysYear,
  HolidayCheck,
  NextHoliday,
  BusinessDaysResult,
} from './resources/holidays';
export type { CryptoList, StablecoinId } from './resources/crypto';

// Data model types (derived from the OpenAPI v2 contract).
export type {
  Rate,
  RateDescriptor,
  RatesResponse,
  RateType,
  RateCategory,
  GeoFields,
  GlobalRateRow,
  GlobalRatesList,
  GlobalRatesMap,
  HistoryPoint,
  HistoryCollection,
  HistoricalLimitRow,
  HistoricalLimitsResponse,
  Amount,
  ConvertResponse,
  BulkConvertItem,
  BulkConvertResponse,
  MarketEntry,
  SpreadResponse,
  SpreadQuote,
  RouteResponse,
  RouteOption,
  BankRate,
  Country,
  Currency,
  Bank,
  Issuer,
  IssuersResponse,
  Holiday,
  ApiErrorBody,
} from './types/public';

// Generated OpenAPI namespaces, for advanced/low-level typing.
export type { paths, components, operations } from './types/public';
