# @cotizave/sdk

[English](./README.md) · **Español**

SDK oficial de TypeScript para la **API v2 de Cotizave**: referencias cambiarias
multipaís, conversiones, histórico, tasas de bancos, catálogos y calendarios.

- 🧩 **Totalmente tipado** — cada petición y respuesta sale del contrato OpenAPI v2.
- 🪶 **No instalás nada más** — el motor HTTP ([Ky](https://github.com/sindresorhus/ky), sobre `fetch` nativo) va incluido.
- 🔁 **Reintentos integrados** ante fallos transitorios, con conciencia de los límites de uso.
- 📦 **ESM + CommonJS**, Node.js 22+.
- 🔐 **Pensado para el servidor** — tu API key no va en un bundle de navegador.

> Este SDK apunta **solo a la API v2**. No implementa, envuelve ni cae de vuelta a v1.

## ¿Qué es Cotizave?

[Cotizave](https://cotizave.com) es una plataforma de datos cambiarios para
desarrolladores y empresas. La API v2 sirve referencias de monedas de varios
países, series históricas, conversiones, tasas de bancos, directorios de emisores
y calendarios de feriados, todo detrás de una sola API key.

## Requisitos

- Node.js **22+** (sirve cualquier runtime con `fetch` global; también podés pasar el tuyo).
- Una API key de Cotizave — creala en tu [panel](https://cotizave.com).

## Instalación

```bash
npm install @cotizave/sdk
```

## Autenticación

El cliente envía tu key en la cabecera `X-API-Key`. Leela de una variable de
entorno del servidor; nunca la escribas directo en el código.

```ts
import { Cotizave } from '@cotizave/sdk';

const client = new Cotizave({
  apiKey: process.env.COTIZAVE_API_KEY!,
});
```

Solo `apiKey` es obligatoria. Todas las demás opciones tienen un valor por defecto
razonable y podés ajustarlas:

```ts
const client = new Cotizave({
  apiKey: process.env.COTIZAVE_API_KEY!,

  // Timeouts (ms)
  timeout: 5_000, // toda petición; por defecto 5s
  historyTimeout: 10_000, // lecturas de histórico, que pueden tardar más; por defecto 10s

  // Reintentos
  maxRetries: 2, // intentos extra; 0 los desactiva
  maxRetryDelay: 10_000, // presupuesto total de espera por reintentos, por llamada
  retry: {
    baseDelay: 250, // base del backoff exponencial
    maxDelay: 2_000, // tope de una espera individual
    statuses: [408, 500, 502, 503, 504], // estados que se reintentan en GET
    retryRateLimited: true, // reintenta los 429 por minuto respetando Retry-After
    // shouldRetry: ({ error, attempt, defaultDecision }) => defaultDecision,
    // onRetry: ({ retryNumber, delayMs, error }) => log(retryNumber, delayMs),
  },

  // Forma de la petición
  language: 'en', // 'en' (por defecto) o 'es' para nombres/descripciones localizados
  headers: { 'X-Trace-Id': 'abc123' }, // enviadas con cada petición
  userAgent: 'my-app/1.0.0', // se añade al User-Agent del SDK

  // Observabilidad y límites
  onResponse: ({ path, meta }) => console.log(path, meta.rateLimit.remaining),
  maxResponseBytes: 25_000_000, // tope del cuerpo de respuesta; por defecto 25 MB

  // Pruebas
  // baseUrl: 'http://127.0.0.1:8080', allowInsecureHttp: true,
  // fetch: customFetch,
});
```

Los timeouts son bajos a propósito: la API nunca deja correr una respuesta más de
10 segundos, así que esperar más solo retrasa tu propio manejo de errores.

### Opciones por llamada

Cualquier método acepta un último argumento opcional para ajustar esa llamada:
`signal`, `timeout`, `maxRetries`, `headers` y `language`.

```ts
const controller = new AbortController();
const rates = await client.rates.list('AR', {}, { signal: controller.signal, timeout: 5_000 });
// controller.abort() cancela la petición en curso.

// Los métodos sin objeto de filtros igual toman la config como último argumento:
const trm = await client.rates.get('CO', 'co-trm', { timeout: 2_000 });
const conv = await client.convert({ from: 'USD', to: 'BRL', amount: 100 }, { maxRetries: 0 });

// Nombres localizados para una sola llamada, más una cabecera de trazado:
await client.countries.get('BR', { language: 'es', headers: { 'X-Trace-Id': 'req-42' } });
```

## Primera consulta

```ts
// Todas las tasas publicadas de un país (ISO 3166 alfa-2, no distingue mayúsculas).
const { rates } = await client.rates.list('AR');
```

## Tasas

```ts
// Todas las tasas de un país.
const list = await client.rates.list('AR', { tag: 'official' });

// Una tasa por su id canónico.
const trm = await client.rates.get('CO', 'co-trm');

// La oficial de cada país publicado en una sola llamada.
const global = await client.rates.global({ symbols: ['BRL', 'EUR'] });

// El tablero completo de un país tal como cerró un día pasado.
const board = await client.rates.snapshot('AR', '2026-10-01');
```

Los ids canónicos, mercados, fuentes y disponibilidad se conservan tal cual los
devuelve la API. El SDK nunca cambia un mercado por otro en silencio.

## Conversiones

El cálculo corre en Cotizave — el SDK nunca hace cuentas con dinero localmente.

```ts
const result = await client.convert({ from: 'USD', to: 'BRL', amount: 100 });
console.log(result.to.amount, result.rate);

// Conversión histórica (donde esté disponible; Growth+).
await client.convert({ from: 'USD', to: 'COP', amount: 100, date: '2026-10-01' });
```

### Conversión masiva

Hasta **50** ítems en una petición (Pro+). Cuenta como una sola consulta. Cada
resultado conserva el orden de entrada y trae una `conversion` o un `error`: un
ítem que falla nunca se descarta en silencio.

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

## Histórico

```ts
// Un día puntual: la tasa que regía esa fecha.
const point = await client.history.get({ country: 'CO', rateId: 'co-trm', date: '2026-10-01' });

// Una serie diaria en un rango.
const series = await client.history.daily({
  country: 'AR',
  rateId: 'ar-official',
  from: '2026-09-01',
  to: '2026-09-30',
});

// Capturas crudas (intradía), una página por vez — pasá el cursor que recibiste.
let page = await client.history.raw({ country: 'VE', rateId: 've-bcv', limit: 1000 });
if (page.next_cursor) {
  page = await client.history.raw({ country: 'VE', rateId: 've-bcv', cursor: page.next_cursor });
}

// O iterá las capturas crudas sin riesgo (acotado por maxPages, 50 por defecto).
for await (const p of client.history.iterate({ country: 'VE', rateId: 've-bcv', maxPages: 10 })) {
  console.log(p.date, p.mid);
}

// Agregados de un rango, calculados por Cotizave: mínimo, máximo, promedio, variación, medias móviles.
const { stats } = await client.history.stats({
  country: 'AR',
  rateId: 'ar-official',
  from: '2026-09-01',
  to: '2026-09-30',
  movingAverage: 7,
});

// Cobertura: desde/hasta qué fecha hay histórico guardado, por tasa que tu plan ve.
const limits = await client.history.limits();
```

Los ids de tasas de arriba son ilustrativos — consultá el catálogo actual con
`client.markets(cc)`. No todo mercado tiene histórico intradía, y tener histórico
no es lo mismo que tu plan pueda leerlo.

## Mercados, brecha, ruta y tasas de bancos

```ts
const catalog = await client.markets('VE'); // Growth+
const spread = await client.spread('VE', { against: 've-paralelo' }); // Growth+
const route = await client.route('VE', { from: 'USD', to: 'VES', amount: 100 }); // Pro+
const banks = await client.bankRates('VE', { bank: '0105' }); // todos los planes
```

El backend resuelve rutas y brechas; el SDK no las calcula.

## Catálogos y calendarios

```ts
await client.countries.list(); // Pro+
await client.countries.get('BR'); // Pro+
await client.currencies.list(); // Pro+
await client.currencies.get('USD'); // Pro+

await client.banks.list('VE', { q: 'mercantil' });
await client.banks.get('VE', '0105');

await client.issuers.list(); // todos los planes

await client.holidays.list('AR', { year: 2026 });
await client.holidays.check('AR', '2026-05-01');
await client.holidays.next('AR', '2026-05-01');
await client.holidays.businessDays('VE', { from: '2026-10-01', days: 5 });

await client.crypto.list({ tag: 'usdt' }); // estables en dólares, Growth+
await client.crypto.get('usdt-usd');
```

## Manejo de errores

Todo fallo lanza un `CotizaveError` con el `code` y `message` de la API, más
`field` / `details` opcionales y los metadatos de la respuesta. Capturá la clase
base, o una subclase para una familia puntual.

```ts
import {
  CotizaveError,
  CotizaveRateLimitError,
  CotizaveFeatureNotInPlanError,
  CotizaveNotFoundError,
} from '@cotizave/sdk';

try {
  await client.rates.get('CO', 'no-existe');
} catch (err) {
  if (err instanceof CotizaveNotFoundError) {
    console.error('No encontrado:', err.code);
  } else if (err instanceof CotizaveFeatureNotInPlanError) {
    console.error('Requiere upgrade:', err.details); // { feature, required_plan, ... }
  } else if (err instanceof CotizaveError) {
    console.error(err.status, err.code, err.message);
  }
}
```

| Estado | Clase de error                                     | Significado                                  |
| ------ | -------------------------------------------------- | -------------------------------------------- |
| 400    | `CotizaveBadRequestError`                          | Parámetros o formatos inválidos              |
| 401    | `CotizaveAuthenticationError`                      | Key ausente / inválida / revocada            |
| 402    | `CotizaveFeatureNotInPlanError`                    | Función no incluida en tu plan               |
| 403    | `CotizaveForbiddenError`                           | Restricción de cuenta / fuera de retención   |
| 404    | `CotizaveNotFoundError`                            | Recurso / tasa no encontrada                 |
| 406    | `CotizaveNotAcceptableError`                       | El formato no puede representar la respuesta |
| 422    | `CotizaveUnprocessableError`                       | Sin referencia usable en este momento        |
| 429    | `CotizaveRateLimitError`                           | Límite alcanzado (ver abajo)                 |
| 5xx    | `CotizaveServerError`                              | Fallo del lado del servidor                  |
| —      | `CotizaveConnectionError` / `CotizaveTimeoutError` | Sin respuesta (red / timeout)                |

## Límites de uso y reintentos

Cotizave aplica una **cuota mensual** y un **límite de velocidad por minuto**. En
un `429`, `CotizaveRateLimitError.scope` los distingue:

```ts
try {
  await client.rates.list('AR');
} catch (err) {
  if (err instanceof CotizaveRateLimitError) {
    if (err.isQuotaExhausted) {
      // scope === 'monthly' — esperar no ayuda; hacé upgrade o esperá el reinicio.
      console.error('Cuota agotada. Se reinicia el', err.rateLimit?.reset);
    } else {
      // scope === 'burst' — bajá el ritmo; reintentá en err.retryAfter segundos.
      console.error('Demasiado rápido. Reintentá en', err.retryAfter, 's');
    }
  }
}
```

### Qué hace el SDK ante un fallo

Por defecto hace **2 intentos adicionales** para peticiones idempotentes (GET)
cuando hay un error de conexión o timeout, un `408`/`5xx`, o un `429` de **ráfaga**:

- Ante un `429` de ráfaga espera exactamente lo que pide el servidor (`Retry-After`,
  o el más fino `X-RateLimit-Retry-After-Ms`) y se rinde de inmediato si esa espera
  no entra en lo que queda del presupuesto `maxRetryDelay`.
- En los demás casos usa backoff exponencial con jitter completo.
- **Nunca** reintenta un `429` de cuota mensual, un `4xx` que requiere cambiar la
  petición (`400`/`401`/`402`/`403`/`404`/`406`/`422`), un `POST`, ni una llamada
  que cancelaste.

Todo es configurable — `maxRetries`, `maxRetryDelay` y las opciones de `retry` de
arriba — y podés tomar la decisión vos o solo observarla:

```ts
const client = new Cotizave({
  apiKey: process.env.COTIZAVE_API_KEY!,
  maxRetries: 3,
  retry: {
    // Decidí vos; devolvé undefined para conservar la política interna.
    shouldRetry: ({ error, attempt, defaultDecision }) =>
      error instanceof CotizaveRateLimitError && attempt > 0 ? false : defaultDecision,
    // Mirá cada reintento antes de que ocurra.
    onRetry: ({ retryNumber, delayMs, path }) =>
      console.warn(`reintento #${retryNumber} de ${path} en ${delayMs}ms`),
  },
});
```

### Leer los metadatos de límite en una respuesta exitosa

Lo más simple es el hook `onResponse`, que corre tras cada intercambio HTTP:

```ts
const client = new Cotizave({
  apiKey: process.env.COTIZAVE_API_KEY!,
  onResponse: ({ meta }) => {
    if ((meta.rateLimit.remaining ?? Infinity) < 100) console.warn('Cuota en baja');
  },
});
```

Usá el `request` de bajo nivel para los metadatos completos sin salir de la API tipada:

```ts
const { data, meta } = await client.request<{ rates: unknown[] }>({
  method: 'GET',
  path: '/v2/fx/ar/rates',
});
console.log(meta.rateLimit.remaining, meta.rateLimit.limit, meta.rateLimit.reset);
```

## Exportación CSV / XML

JSON es el formato por defecto y el único tipado. Para CSV o XML usá `export`, que
devuelve el texto crudo del cuerpo (CSV/XML disponibles desde el plan Growth):

```ts
const csv = await client.export('/v2/fx/ar/rates', { format: 'csv' });
```

## Peticiones condicionales (ETag / 304)

```ts
const first = await client.request({ method: 'GET', path: '/v2/fx/ve/rates' });
const etag = first.meta.headers['etag'];

const next = await client.request({ method: 'GET', path: '/v2/fx/ve/rates', ifNoneMatch: etag });
if (next.notModified) {
  // 304 — reusá tu copia en caché; no hay cuerpo.
}
```

Las peticiones condicionales rinden en catálogos (países, monedas, emisores,
bancos), que son estables. Las respuestas de tasas en vivo cambian en cada
llamada, así que rara vez responden `304`.

## Seguridad

- **Solo del lado del servidor.** Este SDK es para servidores Node.js y servicios
  backend. Una API key privada nunca debe ir en un bundle de navegador, un
  componente cliente de React, ni en JavaScript público.
- En **Next.js**, usalo desde Route Handlers, Server Actions o módulos exclusivos
  de servidor, nunca desde un Client Component.
- La key se envía solo en la cabecera `X-API-Key`, nunca en la query string, y el
  SDK nunca la loguea, persiste ni la pone en mensajes de error.
- El SDK no hace más llamadas que al `baseUrl` configurado, y no envía telemetría.
- Las peticiones quedan fijadas al origen configurado y se rechazan las
  redirecciones, así que la key no puede reenviarse a otro host.
- `baseUrl` debe ser `https://`. Una URL `http://` se rechaza salvo que pases
  `allowInsecureHttp: true` (solo para pruebas locales).
- `client.config` nunca contiene la API key, así que loguear o serializar el
  cliente es seguro.

Ver [SECURITY.md](./SECURITY.md).

## Compatibilidad

- **Runtime:** Node.js 22+ (y cualquier runtime con `fetch` global).
- **Módulos:** ESM (`import`) y CommonJS (`require`).
- **Tipos:** `.d.ts` incluido; funciona con resolución `node16`/`nodenext`/`bundler`.

## Versionado

Versionado semántico. Mientras esté en `0.x`, la interfaz pública puede cambiar a
medida que se valida el contrato v2. Los tipos de datos se generan del contrato
OpenAPI v2 y se regeneran cada vez que cambia.

## El SDK es gratis; el uso de la API no es ilimitado

El SDK es gratis y con licencia MIT. El acceso a datos, formatos (CSV/XML),
retención de histórico y endpoints depende del plan de tu cuenta, y el consumo
cuenta contra la cuota y los límites de tu plan. La cobertura de países y
funciones varía; el SDK no promete ningún SLA ni derechos de redistribución de datos.

## Enlaces

- Documentación: https://docs.cotizave.com/
- Referencia de la API v2: https://docs.cotizave.com/api/v2/introduction
- GitHub: https://github.com/cotizave/cotizave-typescript
- Changelog: [CHANGELOG.md](./CHANGELOG.md)

## Licencia

[MIT](./LICENSE)
