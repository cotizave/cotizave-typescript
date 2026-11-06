// Minimal Node.js example.
//
// Run from this folder:
//   npm install @cotizave/sdk
//   COTIZAVE_API_KEY=sk_live_xxx node index.mjs
//
// The API key is read from the environment — never hard-code it.
import { Cotizave, CotizaveError, CotizaveRateLimitError } from '@cotizave/sdk';

const apiKey = process.env.COTIZAVE_API_KEY;
if (!apiKey) {
  console.error('Set COTIZAVE_API_KEY in your environment first.');
  process.exit(1);
}

const client = new Cotizave({ apiKey });

try {
  // 1. All published rates for Argentina.
  const { rates } = await client.rates.list('AR');
  console.log(`AR rates: ${rates.length}`);

  // 2. A single rate by canonical id.
  const trm = await client.rates.get('CO', 'co-trm');
  console.log('CO TRM mid:', trm.mid);

  // 3. A conversion (the math runs on Cotizave).
  const conversion = await client.convert({ from: 'USD', to: 'BRL', amount: 100 });
  console.log(
    `100 ${conversion.from.currency} = ${conversion.to.amount} ${conversion.to.currency}`,
  );
} catch (err) {
  if (err instanceof CotizaveRateLimitError) {
    console.error(
      err.isQuotaExhausted ? 'Monthly quota exhausted.' : `Slow down; retry in ${err.retryAfter}s.`,
    );
  } else if (err instanceof CotizaveError) {
    console.error(`API error ${err.status} (${err.code}): ${err.message}`);
  } else {
    throw err;
  }
}
