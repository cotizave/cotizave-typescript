import { Resource, cc } from './base';
import type { SpreadResponse, RouteResponse } from '../types/public';
import type { paths } from '../types/generated';

/** `{ country, markets: MarketEntry[] }` — the per-country rate catalog. */
export type MarketsCatalog =
  paths['/v2/fx/{cc}/markets']['get']['responses']['200']['content']['application/json'];

/** Bank-rates response (`{ country, currency, indicator_date, banks, … }`). */
export type BankRatesResponse =
  paths['/v2/fx/{cc}/bank-rates']['get']['responses']['200']['content']['application/json'];

/** Options for {@link FxToolsResource.spread}. */
export interface SpreadOptions {
  /** Rate to compare the official against (default `ve-paralelo`). */
  against?: string;
  /** Base currency (only `USD` is supported). */
  base?: 'USD';
}

/** Options for {@link FxToolsResource.route}. */
export interface RouteOptions {
  /** Source currency. */
  from: string;
  /** Target currency. */
  to: string;
  /** Amount. */
  amount: number;
  /** `send` (you send `amount`) or `receive` (recipient gets `amount`). */
  direction?: 'send' | 'receive';
  /** Reject rates staler than this many seconds. */
  maxStaleness?: number;
}

/** Options for {@link FxToolsResource.bankRates}. */
export interface BankRatesOptions {
  /** Filter to a single SUDEBAN bank code (4 digits). */
  bank?: string;
}

/** Advanced per-country FX tools: catalog, spread, best route, bank rates. */
export class FxToolsResource extends Resource {
  /** The country's rate catalog (no prices). Growth+. */
  markets(country: string): Promise<MarketsCatalog> {
    return this.transport.get<MarketsCatalog>(`/v2/fx/${cc(country)}/markets`);
  }

  /** The spread of the official rate against another market. Growth+. */
  spread(country: string, options: SpreadOptions = {}): Promise<SpreadResponse> {
    return this.transport.get<SpreadResponse>(`/v2/fx/${cc(country)}/spread`, {
      against: options.against,
      base: options.base,
    });
  }

  /**
   * The best executable rate for an amount. Pro+. The backend resolves the
   * route — the SDK never computes it.
   */
  route(country: string, options: RouteOptions): Promise<RouteResponse> {
    return this.transport.get<RouteResponse>(`/v2/fx/${cc(country)}/route`, {
      from: options.from,
      to: options.to,
      amount: options.amount,
      direction: options.direction,
      max_staleness: options.maxStaleness,
    });
  }

  /** BCV per-bank quotations (all plans). Optionally filtered by bank code. */
  bankRates(country: string, options: BankRatesOptions = {}): Promise<BankRatesResponse> {
    return this.transport.get<BankRatesResponse>(`/v2/fx/${cc(country)}/bank-rates`, {
      bank: options.bank,
    });
  }
}
