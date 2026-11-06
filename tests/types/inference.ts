/**
 * Compile-only type tests. `npm run test:types` runs `tsc --noEmit` over this
 * file; it must compile, and every `@ts-expect-error` must actually error.
 * Nothing here executes.
 */
import { Cotizave } from '../../src/index';
import type {
  Rate,
  ConvertResponse,
  RatesResponse,
  GlobalRatesList,
  GlobalRatesMap,
} from '../../src/index';

declare const client: Cotizave;

// Return types are inferred from the contract.
async function returns(): Promise<void> {
  const rates: RatesResponse = await client.rates.list('AR');
  const one: Rate = await client.rates.get('CO', 'co-trm');
  const conv: ConvertResponse = await client.convert({ from: 'USD', to: 'BRL', amount: 100 });
  void rates;
  void one;
  void conv;
}

// Overloads: asMap narrows the return type.
async function globalOverloads(): Promise<void> {
  const list: GlobalRatesList = await client.rates.global();
  const list2: GlobalRatesList = await client.rates.global({ symbols: ['BRL'] });
  const map: GlobalRatesMap = await client.rates.global({ asMap: true });
  void list;
  void list2;
  void map;
}

// Required fields are enforced at compile time.
function required(): void {
  // @ts-expect-error amount is required
  void client.convert({ from: 'USD', to: 'BRL' });
  // @ts-expect-error from is required
  void client.convert({ to: 'BRL', amount: 1 });
  // @ts-expect-error country is required
  void client.rates.list();
  // @ts-expect-error date is required for a point lookup
  void client.history.get({ country: 'CO', rateId: 'co-trm' });
}

// Unknown options are rejected.
function noExtraProps(): void {
  // @ts-expect-error `limit` is not a valid convert option
  void client.convert({ from: 'USD', to: 'BRL', amount: 1, limit: 5 });
}

export { returns, globalOverloads, required, noExtraProps };
