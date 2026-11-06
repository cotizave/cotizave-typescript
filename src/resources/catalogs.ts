import { Resource, cc, seg } from './base';
import type { Country, Currency, Bank, IssuersResponse } from '../types/public';
import type { paths } from '../types/generated';

type CountriesList =
  paths['/v2/countries']['get']['responses']['200']['content']['application/json'];
type CurrenciesList =
  paths['/v2/currencies']['get']['responses']['200']['content']['application/json'];
type BanksList =
  paths['/v2/banks/{cc}']['get']['responses']['200']['content']['application/json'];

/** Country catalog (Pro+). */
export class CountriesResource extends Resource {
  /** Lists published countries. */
  list(): Promise<CountriesList> {
    return this.transport.get<CountriesList>('/v2/countries');
  }

  /** One published country by code. */
  get(country: string): Promise<Country> {
    return this.transport.get<Country>(`/v2/countries/${cc(country)}`);
  }
}

/** Currency catalog (Pro+). */
export class CurrenciesResource extends Resource {
  /** Lists currencies Cotizave quotes (ISO 4217). */
  list(): Promise<CurrenciesList> {
    return this.transport.get<CurrenciesList>('/v2/currencies');
  }

  /** One currency by code (e.g. `USD`). */
  get(code: string): Promise<Currency> {
    return this.transport.get<Currency>(`/v2/currencies/${seg(code, 'currency code')}`);
  }
}

/** Bank identities (no prices). */
export class BanksResource extends Resource {
  /** Lists a country's banks; optional free-text search via `q`. */
  list(country: string, options: { q?: string } = {}): Promise<BanksList> {
    return this.transport.get<BanksList>(`/v2/banks/${cc(country)}`, { q: options.q });
  }

  /** One bank by its official code (SUDEBAN in VE). */
  get(country: string, code: string): Promise<Bank> {
    return this.transport.get<Bank>(`/v2/banks/${cc(country)}/${seg(code, 'bank code')}`);
  }
}

/** Official-rate issuers directory (all plans). */
export class IssuersResource extends Resource {
  /** Lists the institutions that issue official rates. */
  list(): Promise<IssuersResponse> {
    return this.transport.get<IssuersResponse>('/v2/issuers');
  }
}
