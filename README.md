# @cotizave/sdk

Official TypeScript SDK for the **Cotizave API v2** — multi-country exchange-rate
references, conversions, history, bank rates, catalogs and calendars.

- 🧩 **Fully typed** — every request and response is derived from the OpenAPI v2 contract.
- 🪶 **Zero runtime dependencies** — built on native `fetch`.
- 🔁 **Built-in retries** for transient failures, with rate-limit awareness.
- 📦 **ESM + CommonJS**, Node.js 22+.
- 🔐 **Server-side by design** — your API key never belongs in a browser bundle.

> This SDK targets **API v2 only**. It does not implement, wrap, or fall back to v1.

## What is Cotizave?

[Cotizave](https://cotizave.com) is an exchange-rate data platform for developers
and businesses. The v2 API serves currency references for multiple countries,
historical series, conversions, bank rates, issuer directories and holiday
calendars behind a single API key.

## Requirements

- Node.js **22+** (any runtime with a global `fetch` works; you can also pass your own).
- A Cotizave API key — create one in your [dashboard](https://cotizave.com).

## Installation

```bash
npm install @cotizave/sdk
```

## Authentication

The client sends your key as the `X-API-Key` header. Read it from a server-side
environment variable — never hard-code it.

```ts
import { Cotizave } from '@cotizave/sdk';

const client = new Cotizave({
  apiKey: process.env.COTIZAVE_API_KEY!,
});
```

All options:

```ts
const client = new Cotizave({
  apiKey: process.env.COTIZAVE_API_KEY!,
  baseUrl: 'https://api.cotizave.com', // default
  timeout: 30_000, // ms, default 30s
  maxRetries: 2, // additional retries for GETs, default 2
  maxRetryDelay: 60_000, // total retry-wait budget per call, ms
  maxResponseBytes: 25_000_000, // response body cap, default 25 MB
  // allowInsecureHttp: true,          // permit an http:// baseUrl (local testing only)
  // fetch: customFetch,               // defaults to global fetch
  // userAgent: 'my-app/1.0.0',        // appended to the SDK User-Agent
});
```

Every default is sensible out of the box, and everything above is yours to tune.

### Per-call options

Any method takes an optional last argument to override settings for that one call
— pass an `AbortSignal` to cancel, a tighter `timeout`, or a different `maxRetries`:

```ts
const controller = new AbortController();
const rates = await client.rates.list('AR', {}, { signal: controller.signal, timeout: 5_000 });
// controller.abort() cancels the in-flight request.

// Methods without a filter object still take the config as the last argument:
const trm = await client.rates.get('CO', 'co-trm', { timeout: 2_000 });
const conv = await client.convert({ from: 'USD', to: 'BRL', amount: 100 }, { maxRetries: 0 });
```

## First request

```ts
// All published rates for a country (ISO 3166 alpha-2, case-insensitive).
const { rates } = await client.rates.list('AR');
```

## Rates

```ts
// Every rate of a country.
const list = await client.rates.list('AR', { tag: 'official' });

// A single rate by its canonical id.
const trm = await client.rates.get('CO', 'co-trm');

// The official rate of every published country in one call.
const global = await client.rates.global({ symbols: ['BRL', 'EUR'] });
const map = await client.rates.global({ asMap: true }); // { "ARS": 1012.5, ... }
```

Canonical ids, markets, sources and availability are preserved exactly as the API
returns them. The SDK never silently swaps one market for another.

## Conversions

The arithmetic runs on Cotizave — the SDK never computes money locally.

```ts
const result = await client.convert({ from: 'USD', to: 'BRL', amount: 100 });
console.log(result.to.amount, result.rate);

// Historical conversion (where supported; Growth+).
await client.convert({ from: 'USD', to: 'COP', amount: 100, date: '2026-10-01' });
```

### Bulk conversion

Up to **50** items in one request (Pro+). Counts as a single query. Each result
keeps its input order and carries either a `conversion` or an `error` — a failed
item never silently drops.

```ts
const { results, succeeded, failed } = await client.convertBulk({
  conversions: [
    { from: 'USD', to: 'ARS', amount: 100 },
    { from: 'USD', to: 'COP', amount: 250 },
  ],
});

for (const item of results) {
  if (item.conversion) console.log(item.index, item.conversion.to.amount);
  else console.warn(item.index, item.error?.code);
}
```

## History

```ts
// A single day: the rate that ruled on that date.
const point = await client.history.get({ country: 'CO', rateId: 'co-trm', date: '2026-10-01' });

// A daily series over a range.
const series = await client.history.daily({
  country: 'AR',
  rateId: 'ar-official',
  from: '2026-09-01',
  to: '2026-09-30',
});

// Raw (intraday) captures, one page at a time — pass the cursor you received.
let page = await client.history.raw({ country: 'VE', rateId: 've-bcv', limit: 1000 });
if (page.next_cursor) {
  page = await client.history.raw({ country: 'VE', rateId: 've-bcv', cursor: page.next_cursor });
}

// Or iterate raw captures safely (bounded by maxPages, default 50).
for await (const p of client.history.iterate({ country: 'VE', rateId: 've-bcv', maxPages: 10 })) {
  console.log(p.date, p.mid);
}

// Coverage: which dates have stored history, per rate your plan can see.
const limits = await client.history.limits();
```

Rate ids above are illustrative — check the current catalog with `client.markets(cc)`.
Not every market has intraday history, and having history is not the same as your
plan being allowed to read it.

## Markets, spread, route & bank rates

```ts
const catalog = await client.markets('VE'); // Growth+
const spread = await client.spread('VE', { against: 've-paralelo' }); // Growth+
const route = await client.route('VE', { from: 'USD', to: 'VES', amount: 100 }); // Pro+
const banks = await client.bankRates('VE', { bank: '0105' }); // all plans
```

The backend resolves routes and spreads; the SDK does not compute them.

## Catalogs & calendars

```ts
await client.countries.list(); // Pro+
await client.countries.get('BR'); // Pro+
await client.currencies.list(); // Pro+
await client.currencies.get('USD'); // Pro+

await client.banks.list('VE', { q: 'mercantil' });
await client.banks.get('VE', '0105');

await client.issuers.list(); // all plans

await client.holidays.list('AR', { year: 2026 });
await client.holidays.check('AR', '2026-05-01');
await client.holidays.next('AR', '2026-05-01');
await client.holidays.businessDays('VE', { from: '2026-10-01', days: 5 });

await client.crypto.list({ tag: 'usdt' }); // stablecoins priced in USD, Growth+
await client.crypto.get('usdt-usd');
```

## Error handling

Every failure throws a `CotizaveError` carrying the API `code`, `message`, and
optional `field` / `details`, plus response metadata. Catch the base class, or a
subclass for a specific family.

```ts
import {
  CotizaveError,
  CotizaveRateLimitError,
  CotizaveFeatureNotInPlanError,
  CotizaveNotFoundError,
} from '@cotizave/sdk';

try {
  await client.rates.get('CO', 'does-not-exist');
} catch (err) {
  if (err instanceof CotizaveNotFoundError) {
    console.error('Not found:', err.code);
  } else if (err instanceof CotizaveFeatureNotInPlanError) {
    console.error('Upgrade needed:', err.details); // { feature, required_plan, ... }
  } else if (err instanceof CotizaveError) {
    console.error(err.status, err.code, err.message);
  }
}
```

| Status | Error class                                        | Meaning                                |
| ------ | -------------------------------------------------- | -------------------------------------- |
| 400    | `CotizaveBadRequestError`                          | Invalid parameters or formats          |
| 401    | `CotizaveAuthenticationError`                      | Missing / invalid / revoked key        |
| 402    | `CotizaveFeatureNotInPlanError`                    | Feature not in your plan               |
| 403    | `CotizaveForbiddenError`                           | Account restriction / out of retention |
| 404    | `CotizaveNotFoundError`                            | Resource / rate not found              |
| 406    | `CotizaveNotAcceptableError`                       | Format cannot represent the response   |
| 422    | `CotizaveUnprocessableError`                       | No usable reference right now          |
| 429    | `CotizaveRateLimitError`                           | Rate limited (see below)               |
| 5xx    | `CotizaveServerError`                              | Server-side failure                    |
| —      | `CotizaveConnectionError` / `CotizaveTimeoutError` | No response (network / timeout)        |

## Rate limits & retries

Cotizave enforces both a **monthly quota** and a **per-minute velocity** limit.
On a `429`, `CotizaveRateLimitError.scope` tells them apart:

```ts
try {
  await client.rates.list('AR');
} catch (err) {
  if (err instanceof CotizaveRateLimitError) {
    if (err.isQuotaExhausted) {
      // scope === 'monthly' — waiting won't help; upgrade or wait for reset.
      console.error('Quota exhausted. Resets at', err.rateLimit?.reset);
    } else {
      // scope === 'burst' — slow down; retry after err.retryAfter seconds.
      console.error('Too fast. Retry after', err.retryAfter, 's');
    }
  }
}
```

By default the SDK makes **2 additional retries** for idempotent (GET) requests on
connection errors, `5xx`, and **burst** `429`s — honoring `Retry-After` within the
retry budget, with exponential backoff and jitter. It **never** retries a monthly
`429` (quota), nor `4xx` errors that require changing the request, nor `POST`.
Disable retries with `maxRetries: 0`.

### Reading rate-limit metadata on success

Use the low-level `request` for full response metadata without leaving the typed API:

```ts
const { data, meta } = await client.request<{ rates: unknown[] }>({
  method: 'GET',
  path: '/v2/fx/ar/rates',
});
console.log(meta.rateLimit.remaining, meta.rateLimit.limitPerMinute);
```

## CSV / XML export

JSON is the default and the only typed form. For CSV or XML, use `export`, which
returns the raw body text (CSV/XML are available from the Growth plan up):

```ts
const csv = await client.export('/v2/fx/ar/rates', { format: 'csv' });
```

## Conditional requests (ETag / 304)

```ts
const first = await client.request({ method: 'GET', path: '/v2/fx/ve/rates' });
const etag = first.meta.headers['etag'];

const next = await client.request({ method: 'GET', path: '/v2/fx/ve/rates', ifNoneMatch: etag });
if (next.notModified) {
  // 304 — reuse your cached copy; there is no body.
}
```

## Security

- **Server-side only.** This SDK is for Node.js servers and backend services.
  A private API key must never ship in a browser bundle, a React client component,
  or any public JavaScript.
- In **Next.js**, call it from Route Handlers, Server Actions, or server-only
  modules — never from a Client Component.
- The key is sent only as the `X-API-Key` header, never in a query string, and is
  never logged, persisted, or placed in error messages by the SDK.
- The SDK makes no calls other than to the configured `baseUrl`, and sends no
  telemetry.
- Requests are pinned to the configured origin and redirects are refused, so the
  key cannot be forwarded to another host.
- `baseUrl` must be `https://`. An `http://` URL is rejected unless you pass
  `allowInsecureHttp: true` (local testing only).
- `client.config` never contains the API key, so logging or serializing the client
  is safe.

See [SECURITY.md](./SECURITY.md).

## Compatibility

- **Runtime:** Node.js 22+ (and any runtime exposing a global `fetch`).
- **Modules:** ESM (`import`) and CommonJS (`require`).
- **Types:** bundled `.d.ts`; works under `node16`/`nodenext`/`bundler` resolution.

## Versioning

Semantic Versioning. While on `0.x`, the public interface may still change as the
v2 contract is validated. The data types are generated from the OpenAPI v2
contract and regenerated whenever it changes.

## The SDK is free; API usage is not unlimited

The SDK itself is free and MIT-licensed. Access to data, formats (CSV/XML),
history retention, and endpoints depends on your account's plan, and consumption
counts against your plan's quota and rate limits. Country and feature coverage
varies; the SDK does not promise any SLA or data-redistribution rights.

## Links

- Documentation: https://docs.cotizave.com/
- API v2 reference: https://docs.cotizave.com/api/v2/introduction
- GitHub: https://github.com/cotizave/cotizave-typescript
- Changelog: [CHANGELOG.md](./CHANGELOG.md)

## License

[MIT](./LICENSE)
