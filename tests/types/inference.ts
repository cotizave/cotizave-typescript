/**
 * Compile-only type tests. `npm run test:types` runs `tsc --noEmit` over this
 * file; it must compile, and every `@ts-expect-error` must actually error.
 * Nothing here executes.
 */
import { Cotizave } from '../../src/index';
import type { Rate, ConvertResponse, RatesResponse, GlobalRatesList } from '../../src/index';

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

// rates.global returns the rich list, with or without filters.
async function globalRates(): Promise<void> {
  const list: GlobalRatesList = await client.rates.global();
  const filtered: GlobalRatesList = await client.rates.global({ symbols: ['BRL'], base: 'EUR' });
  // @ts-expect-error the compact map form is not reachable on the live API
  void client.rates.global({ asMap: true });
  void list;
  void filtered;
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

export { returns, globalRates, required, noExtraProps };
