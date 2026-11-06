/**
 * Friendly, stable public type aliases over the generated OpenAPI types.
 *
 * Consumers import these from the package root (e.g. `import type { Rate } from
 * "@cotizave/sdk"`) and never need to touch `components["schemas"][...]`.
 */
import type { components } from './generated';

type Schemas = components['schemas'];

/** Canonical exchange-rate reference (fields present depend on plan and market). */
export type Rate = Schemas['Rate'];
/** A restricted VE rate shown without a price (descriptor only). */
export type RateDescriptor = Schemas['RateDescriptor'];
/** Response of `rates.list(cc)`. */
export type RatesResponse = Schemas['RatesResponse'];
/** Rate classification (`reference`, `p2p`, `crypto`, …). */
export type RateType = Schemas['RateType'];
/** `category` filter values for `rates.list`. */
export type RateCategory = Schemas['Category'];
/** Country-level fields embedded in several responses. */
export type GeoFields = Schemas['GeoFields'];

/** A single row of the global officials endpoint (`rates.global`). */
export type GlobalRateRow = Schemas['GlobalRateRow'];
/** Rich-list form of `rates.global` (default). */
export type GlobalRatesList = Schemas['GlobalRatesList'];
/** Compact map form of `rates.global` (`format: "map"`). */
export type GlobalRatesMap = Schemas['GlobalRatesMap'];

/** One historical data point (`history.get` with a `date`). */
export type HistoryPoint = Schemas['HistoryPointResponse'];
/** A daily or raw history series (`history.daily` / `history.raw`). */
export type HistoryCollection = Schemas['HistoryCollection'];
/** Coverage window of a rate's stored history. */
export type HistoricalLimitRow = Schemas['HistoricalLimitRow'];
/** Response of `history.limits()`. */
export type HistoricalLimitsResponse = Schemas['HistoricalLimitsResponse'];

/** A converted amount (`{ currency, amount }`). */
export type Amount = Schemas['Amount'];
/** Response of a single `convert(...)`. */
export type ConvertResponse = Schemas['ConvertResponse'];
/** One entry of a bulk conversion result (`{ index, conversion?, error? }`). */
export type BulkConvertItem = Schemas['BulkConvertItem'];
/** Response of `convertBulk(...)`. */
export type BulkConvertResponse = Schemas['BulkConvertResponse'];

/** Catalog entry from `markets.list(cc)`. */
export type MarketEntry = Schemas['MarketEntry'];
/** Response of `spread(cc, ...)`. */
export type SpreadResponse = Schemas['SpreadResponse'];
/** A quote inside a spread response. */
export type SpreadQuote = Schemas['SpreadQuote'];
/** Response of `route(cc, ...)`. */
export type RouteResponse = Schemas['RouteResponse'];
/** A single executable option inside a route response. */
export type RouteOption = Schemas['RouteOption'];

/** A single BCV-published bank quotation. */
export type BankRate = Schemas['BankRate'];

/** Country catalog entry. */
export type Country = Schemas['Country'];
/** Currency catalog entry (ISO 4217). */
export type Currency = Schemas['Currency'];
/** Bank identity entry. */
export type Bank = Schemas['Bank'];

/** An official-rate issuing institution. */
export type Issuer = Schemas['Issuer'];
/** Response of `issuers.list()`. */
export type IssuersResponse = Schemas['IssuersResponse'];

/** A public holiday. */
export type Holiday = Schemas['Holiday'];

/** Raw error body returned by the API (`{ code, message, field?, details? }`). */
export type ApiErrorBody = Schemas['Error'];

export type { components, paths, operations } from './generated';
