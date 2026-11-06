/**
 * DO NOT EDIT MANUALLY.
 * Generated from openapi/cotizave-v2.yaml by `npm run generate:types`.
 */
/* eslint-disable */

export interface paths {
    "/v2/banks/{cc}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Bancos del país (identidad, sin precio) */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                    q?: string;
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Lista */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            banks: components["schemas"]["Bank"][];
                            country: string;
                            total: number;
                        };
                    };
                };
                404: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/banks/{cc}/{code}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Un banco por su código oficial (SUDEBAN en VE) */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
                    cc: components["parameters"]["cc"];
                    code: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Banco */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Bank"];
                    };
                };
                400: components["responses"]["Error"];
                403: components["responses"]["Error"];
                /** @description bank_not_found | country_not_supported */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/countries": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Países publicados. Desde Pro. */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Lista */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            countries: components["schemas"]["Country"][];
                        };
                    };
                };
                402: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/countries/{cc}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Un país publicado. Desde Pro. */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    cc: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description País */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Country"];
                    };
                };
                402: components["responses"]["Error"];
                /** @description country_not_supported */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/crypto": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Estables USDT, USDC y EURC en dólares. Desde Growth.
         * @description Precio en dólares de las monedas estables publicadas por Cotizave,
         *     con la misma forma de fila que `/v2/fx/{cc}/rates` (`type: crypto`,
         *     `quote: USD`, `mid` = punto medio entre compra y venta). Se renueva cada
         *     5 minutos. Los planes sin la función reciben el descriptor sin precio
         *     (`available: false`, `required_plan`).
         */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                    /** @description Id o etiqueta (usdt, stablecoin…) */
                    tag?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Colección */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @example USD */
                            base: string;
                            /** Format: date-time */
                            fetched_at: string;
                            plan: string;
                            rates: components["schemas"]["Rate"][];
                        };
                    };
                };
                400: components["responses"]["Error"];
                429: components["responses"]["RateLimited"];
                503: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/crypto/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Una moneda estable (usdt-usd, usdc-usd, eurc-usd). Desde Growth. */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    id: "usdt-usd" | "usdc-usd" | "eurc-usd";
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Tasa (incluye `fetched_at`) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Rate"];
                    };
                };
                /** @description feature_not_in_plan (details: feature, id, required_plan) */
                402: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description rate_not_found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description Sin dato en este momento */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/currencies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Monedas que Cotizave cotiza (ISO 4217). Desde Pro. */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Lista */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            currencies: components["schemas"]["Currency"][];
                        };
                    };
                };
                402: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/currencies/{code}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Una moneda. Desde Pro. */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    code: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Moneda */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Currency"];
                    };
                };
                400: components["responses"]["Error"];
                402: components["responses"]["Error"];
                /** @description currency_not_found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/fx/{cc}/bank-rates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Cotizaciones del BCV por banco (todos los planes)
         * @description Lo que el BCV publica en "tasas informativas del sistema bancario".
         *     Cada fila la identifica el banco (código SUDEBAN o null), no un id de
         *     tasa. En VE, sin filtro `bank`, `bank_rates` y `captured_at` conservan la respuesta V1:
         *     allí `stale` significa publicación anterior. En `banks`, `stale`
         *     significa que la cotización superó su umbral de antigüedad.
         */
        get: {
            parameters: {
                query?: {
                    /** @description Filtra por código SUDEBAN */
                    bank?: string;
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Tasas por banco */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GeoFields"] & {
                            /** @description Filas V1 con bank, buy, sell, date, stale y days_behind; solo VE y sin filtro bank. */
                            bank_rates?: Record<string, never>[];
                            banks: components["schemas"]["BankRate"][];
                            /**
                             * Format: date-time
                             * @description Alias V1; solo VE.
                             */
                            captured_at?: string;
                            /** Format: date-time */
                            fetched_at: string;
                            /** Format: date */
                            indicator_date: string;
                            plan: string;
                        };
                    };
                };
                /** @description `bank` no válido, o filtro por banco no disponible en el país (AU) */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description bcv_snapshot_unavailable en VE; bank_rates_not_available si el país no publica tasas por banco */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description bank_rates_unavailable para fuentes bancarias fuera de VE */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/fx/{cc}/markets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Catálogo de tasas del país (sin precios). Desde Growth. */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Catálogo */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            country: string;
                            markets: components["schemas"]["MarketEntry"][];
                        };
                    };
                };
                402: components["responses"]["Error"];
                404: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/fx/{cc}/rates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Todas las tasas del país
         * @description En Venezuela, las tasas restringidas por plan aparecen como descriptor
         *     sin precio. Free recibe los campos de V1 más `id`; Basic agrega
         *     `name`, `quote`, `stale`, `staleness_sec` y `available`; Growth y Pro
         *     agregan `description`, `tags`, `change_24h_pct`, `vs_official_pct` y
         *     `required_plan`. `stale_after_sec` conserva la omisión condicional de V1.
         *     En AR, CO, PE, MX,
         *     AU y ES todas las tasas publicadas incluyen precio en cualquier plan.
         *     SET-FX está deshabilitado en Colombia. En VE, `?markup=tag` conserva
         *     la variante V1 para planes con la capacidad de márgenes.
         */
        get: {
            parameters: {
                query?: {
                    base?: string;
                    /** @description Filtro histórico de v2; conserva los valores de categoría interna. */
                    category?: components["schemas"]["Category"];
                    format?: components["parameters"]["format"];
                    /** @description Regla de margen del usuario, solo VE y planes autorizados. */
                    markup?: string;
                    quote?: string;
                    /** @description Id, id de v1 o alias (bcv, reference, euro…) */
                    tag?: string;
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Colección */
                200: {
                    headers: {
                        "Cache-Control"?: string;
                        ETag?: string;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RatesResponse"];
                    };
                };
                /** @description Not Modified (If-None-Match) */
                304: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["Error"];
                401: components["responses"]["Error"];
                402: components["responses"]["Error"];
                404: components["responses"]["Error"];
                429: components["responses"]["RateLimited"];
                503: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/fx/{cc}/rates/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Una tasa por id canónico */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
                    cc: components["parameters"]["cc"];
                    /** @description Id canónico (ve-bcv). Case-insensitive. */
                    id: components["parameters"]["id"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Tasa con campos según plan; Free conserva el contrato V1 más id. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Rate"];
                    };
                };
                /** @description Not Modified */
                304: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                400: components["responses"]["Error"];
                /** @description feature_not_in_plan (details: feature, id, required_plan) */
                402: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description resource_not_found en VE sin dato, o rate_not_found / country_not_supported */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                429: components["responses"]["RateLimited"];
                /** @description Tasa registrada sin dato en este momento */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/fx/{cc}/rates/{id}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Histórico de una tasa
         * @description `?date=` → un punto (la tasa que regía ese día). Sin `date`:
         *     `granularity=daily` (default, sin paginación) o `raw` (paginada con
         *     `cursor`/`limit`; las páginas avanzan hacia atrás en el tiempo y cada
         *     una viene en orden ascendente). Retención según el plan.
         */
        get: {
            parameters: {
                query?: {
                    /** @description Solo raw. Opaco. */
                    cursor?: string;
                    date?: string;
                    format?: components["parameters"]["format"];
                    from?: string;
                    granularity?: "daily" | "raw";
                    /** @description Solo raw. */
                    limit?: number;
                    to?: string;
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
                    cc: components["parameters"]["cc"];
                    /** @description Id canónico (ve-bcv). Case-insensitive. */
                    id: components["parameters"]["id"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Punto o colección */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["HistoryPointResponse"] | components["schemas"]["HistoryCollection"];
                    };
                };
                400: components["responses"]["Error"];
                402: components["responses"]["Error"];
                /** @description history_out_of_retention */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description rate_not_found | history_not_available | sin registro */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                503: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/fx/{cc}/route": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Mejor tasa ejecutable del país. Desde Pro. */
        get: {
            parameters: {
                query: {
                    amount: number;
                    direction?: "send" | "receive";
                    format?: components["parameters"]["format"];
                    from: string;
                    max_staleness?: number;
                    to: string;
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Ruta */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RouteResponse"];
                    };
                };
                400: components["responses"]["Error"];
                402: components["responses"]["Error"];
                503: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/fx/{cc}/spread": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Diferencial de la oficial contra otra tasa del país. Desde Growth. */
        get: {
            parameters: {
                query?: {
                    against?: string;
                    base?: "USD";
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Spread */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SpreadResponse"];
                    };
                };
                400: components["responses"]["Error"];
                402: components["responses"]["Error"];
                404: components["responses"]["Error"];
                422: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/fx/convert": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Una conversión
         * @description VE: USD/EUR ↔ VES, default `via` = la oficial de esa moneda (ve-bcv / ve-euro).
         *     CO: USD ↔ COP, default `via` = co-trm; `date` solo con co-trm (TRM que regía ese día).
         *     AU: USD ↔ AUD, default `via` = au-official; sin `date`.
         *     JP: USD ↔ JPY, default `via` = jp-official; `date` con jp-official.
         *     LATAM (pe, py, bo, ar, br, cl, uy, mx, cr, gt, hn, do): USD ↔ local,
         *     default `via` = {cc}-official; `date` en pe, ar, br, cl y hn.
         *     SE/PL/CH: USD ↔ local y EUR ↔ local; default `via` = la oficial en
         *     esa moneda ({cc}-official / {cc}-official-eur); `date` con la oficial en USD.
         *     Con `via` explícito, una tasa EUR registrada puede convertir EUR ↔ moneda
         *     local aunque ese país no tenga una referencia EUR predeterminada (por ejemplo,
         *     remesas desde España en AR/CO/MX). Las remesas solo admiten EUR → local.
         *     `via` debe coincidir con el par; no se sustituyen tasas ni se cruzan pares.
         *     Las tasas extras del BCV CNY/TRY/RUB se publican en `/rates`, pero no son
         *     convertibles y un `via` que las seleccione devuelve 400 con campo `via`.
         *     `date` desde Growth y solo donde exista histórico de conversión apto.
         */
        get: {
            parameters: {
                query: {
                    amount: number;
                    date?: string;
                    format?: components["parameters"]["format"];
                    from: string;
                    /** @description Alias V1 local de via, para VE. */
                    market?: string;
                    to: string;
                    /** @description Id de v2 (ve-binance…). Solo tasas del snapshot. */
                    via?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Conversión */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ConvertResponse"];
                    };
                };
                400: components["responses"]["Error"];
                402: components["responses"]["Error"];
                403: components["responses"]["Error"];
                404: components["responses"]["Error"];
                503: components["responses"]["Error"];
            };
        };
        put?: never;
        /**
         * Hasta 50 conversiones. Desde Pro. Cuenta 1 consulta.
         * @description Acepta exactamente un objeto JSON: el body V2 con conversions o el body V1 con from, to, amounts y market. Un segundo documento JSON devuelve 400 invalid_format. La segunda variante responde con rate, market, type, updated_at, results, total_in, total_out e id.
         */
        post: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        conversions: {
                            amount: number;
                            /** Format: date */
                            date?: string;
                            from: string;
                            to: string;
                            via?: string;
                        }[];
                    } | {
                        amounts: number[];
                        from: string;
                        market?: string;
                        to: string;
                    };
                };
            };
            responses: {
                /** @description Un resultado por ítem, en el mismo orden (conversión o error) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BulkConvertResponse"] | {
                            id: string;
                            market: string;
                            rate: number;
                            results: {
                                amount: number;
                                result: number;
                            }[];
                            total_in: number;
                            total_out: number;
                            type: components["schemas"]["RateType"];
                            /** Format: date-time */
                            updated_at: string;
                        };
                    };
                };
                400: components["responses"]["Error"];
                402: components["responses"]["Error"];
                429: components["responses"]["RateLimited"];
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/fx/historical-limits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Cobertura del histórico (desde/hasta) de cada tasa que el plan ve.
         * @description Con API key cuenta cuota y trae la cobertura de cada tasa visible por el
         *     plan (no solo la oficial). Una cuenta sin tasas con histórico recibe 200
         *     con `limits` vacío. La variante pública solo oficiales vive en
         *     `/v2/public/historical-limits`.
         */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Cobertura */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["HistoricalLimitsResponse"];
                    };
                };
                429: components["responses"]["RateLimited"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/fx/rates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * La oficial de cada país publicado en una sola llamada.
         * @description `?symbols=BRL,EUR` filtra monedas (todos los planes). `?base=EUR` cambia
         *     la base (solo planes de pago; 402 en Free). `?format=map` devuelve el mapa
         *     compacto `{quote: mid}`; cualquier otro valor la lista rica (default).
         */
        get: {
            parameters: {
                query?: {
                    /** @description Moneda base (solo planes de pago). Default USD. */
                    base?: string;
                    /** @description Forma de la respuesta. Default list. */
                    format?: "list" | "map";
                    /** @description Monedas ISO 4217 separadas por coma. */
                    symbols?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Lista rica o mapa compacto, según format */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GlobalRatesList"] | components["schemas"]["GlobalRatesMap"];
                    };
                };
                400: components["responses"]["Error"];
                402: components["responses"]["Error"];
                429: components["responses"]["RateLimited"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/holidays/{cc}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Feriados (año), ¿es feriado? (date) o el próximo (from). Desde Basic en V2.
         * @description `year`, `date` y `from` son excluyentes (400 si vienen dos).
         */
        get: {
            parameters: {
                query?: {
                    date?: string;
                    format?: components["parameters"]["format"];
                    from?: string;
                    year?: number;
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Según el modo */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            country: string;
                            holidays: components["schemas"]["Holiday"][];
                            year: number;
                        } | {
                            country: string;
                            /** Format: date */
                            date: string;
                            holiday: components["schemas"]["Holiday"] | null;
                            is_holiday: boolean;
                        } | {
                            country: string;
                            days_until: number;
                            /** Format: date */
                            from: string;
                            holiday: components["schemas"]["Holiday"];
                        };
                    };
                };
                400: components["responses"]["Error"];
                402: components["responses"]["Error"];
                403: components["responses"]["Error"];
                /** @description holidays_not_available (año fuera de la tabla, details first_year/last_year) */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                503: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/holidays/{cc}/business-days": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Fecha resultante de sumar N días hábiles. Desde Basic en V2. */
        get: {
            parameters: {
                query: {
                    days: number;
                    format?: components["parameters"]["format"];
                    from?: string;
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Resultado */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            country: string;
                            days: number;
                            /** Format: date */
                            from: string;
                            /** Format: date */
                            result: string;
                        };
                    };
                };
                400: components["responses"]["Error"];
                402: components["responses"]["Error"];
                403: components["responses"]["Error"];
                503: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/issuers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Directorio de instituciones que emiten las tasas oficiales. Todos los planes.
         * @description Datos fijos de referencia (procedencia): quién emite cada oficial de los
         *     países publicados, con qué tasas publica. Sin precios ni histórico.
         */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Directorio */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["IssuersResponse"];
                    };
                };
                429: components["responses"]["RateLimited"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/public/historical-limits": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Cobertura del histórico de las oficiales, sin API key (cacheado en el edge).
         * @description Sin key, sin cuota, solo JSON, cero parámetros. Solo la oficial de cada país.
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Cobertura (solo oficiales) */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["HistoricalLimitsResponse"];
                    };
                };
                503: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v2/public/issuers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Directorio reducido de emisores, sin API key (cacheado en el edge).
         * @description Sin key, sin cuota, solo JSON, cero parámetros. Subconjunto de /v2/issuers (id, nombres, tipo, países y nombre de cada tasa).
         */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Directorio reducido */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["IssuersResponse"];
                    };
                };
                503: components["responses"]["Error"];
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Amount: {
            amount: number;
            currency: string;
        };
        Bank: {
            /** @description Enlace a sus cotizaciones en /v2/fx/{cc}/bank-rates?bank=; null si no hay */
            bank_rates: string | null;
            code: string;
            country: string;
            name: string;
            /**
             * @description null si la fuente no lo informa (CO)
             * @enum {string|null}
             */
            type: "public" | "private" | null;
        };
        BankRate: {
            ask: number | null;
            bank: {
                /** @description SUDEBAN; null si no hay código confiable */
                code: string | null;
                /** @description Nombre tal como lo publica el BCV */
                name: string;
            };
            base: string;
            bid: number | null;
            /** @description Días detrás de la última publicación */
            days_behind: number;
            /**
             * Format: date
             * @description Fecha valor (VE); ausente si el banco no la publica (AU)
             */
            effective_date?: string;
            mid: number;
            quote: string;
            stale: boolean;
            stale_after_sec: number;
            staleness_sec: number;
            /** Format: date-time */
            updated_at: string;
            /** @description Growth+ */
            vs_official_pct?: number | null;
        };
        /** @description One result per input item, in request order: a conversion or an error. */
        BulkConvertItem: {
            conversion?: components["schemas"]["ConvertResponse"];
            error?: components["schemas"]["Error"];
            /** @description Position in the request array. */
            index: number;
        };
        BulkConvertResponse: {
            count: number;
            failed: number;
            results: components["schemas"]["BulkConvertItem"][];
            succeeded: number;
        };
        /**
         * @description Valores del parámetro de filtro category; su nombre y valores se mantienen.
         * @enum {string}
         */
        Category: "official" | "interbank" | "parallel" | "securities" | "crypto_p2p" | "crypto_exchange" | "bank_board" | "cash" | "remittance" | "card" | "exchange_house" | "crypto";
        ConvertResponse: {
            /** Format: date */
            date?: string;
            /** Format: date */
            effective_date?: string;
            from: components["schemas"]["Amount"];
            /** @description Identificador local de la tasa usada; via conserva el id global de v2. */
            market: string;
            rate: number;
            stale: boolean;
            staleness_sec: number;
            to: components["schemas"]["Amount"];
            type: components["schemas"]["RateType"];
            /** Format: date-time */
            updated_at: string;
            via: string;
        };
        Country: {
            code: string;
            continent: string;
            currency: string;
            flag: string;
            /** @description Según Accept-Language (es/en) */
            name: string;
            rates: string[];
            region: string;
            region_code: string;
            timezone: string;
        };
        Currency: {
            code: string;
            minor_unit: number;
            /** @description Según Accept-Language (es/en) */
            name: string;
            numeric_code: string;
            symbol: string;
        };
        Error: {
            /**
             * @example rate_not_found
             * @example country_not_supported
             * @example feature_not_in_plan
             * @example unknown_parameter
             */
            code: string;
            details?: Record<string, never>;
            field?: string;
            message: string;
        };
        /** @description Datos del país en el primer nivel. country y currency en todos los planes; la geografía solo en Pro+. */
        GeoFields: {
            /** @description Pro+ */
            continent?: string;
            country: string;
            /** @description Pro+ */
            country_name?: string;
            currency: string;
            /** @description Pro+ */
            flag?: string;
            /** @description Pro+ (UN M49) */
            region?: string;
            /** @description Pro+ (UN M49) */
            region_code?: string;
            /** @description Pro+ (IANA) */
            timezone?: string;
        };
        GlobalRateRow: {
            country: string;
            id: string;
            mid: number;
            quote: string;
            stale: boolean;
            stale_after_sec: number;
            /** Format: date-time */
            updated_at: string;
        };
        GlobalRatesList: {
            base: string;
            count: number;
            /** Format: date-time */
            date: string;
            rates: components["schemas"]["GlobalRateRow"][];
        };
        GlobalRatesMap: {
            base: string;
            /** Format: date-time */
            date: string;
            /** @description Mapa de moneda de cotización a mid (unidades por 1 base). */
            rates: {
                [key: string]: number;
            };
        };
        HistoricalLimitRow: {
            /** @description Omitido = USD; EUR en oficiales en euro. */
            base?: string;
            country: string;
            days: number;
            /** Format: date */
            first: string;
            id: string;
            /** Format: date */
            last: string;
            quote: string;
        };
        HistoricalLimitsResponse: {
            /** @example USD */
            base: string;
            count: number;
            limits: components["schemas"]["HistoricalLimitRow"][];
        };
        HistoryCollection: {
            base: string;
            count: number;
            /** Format: date */
            from: string;
            /** @enum {string} */
            granularity: "daily" | "raw";
            id: string;
            market: string;
            next_cursor: string | null;
            points: {
                /** Format: date */
                date: string;
                /**
                 * Format: date-time
                 * @description En histórico diario propio, última escritura de esa versión; en VE, captura guardada; en el respaldo TRM, hora de armado de la respuesta.
                 */
                fetched_at: string;
                mid: number;
                /** Format: date-time */
                updated_at: string;
            }[];
            quote: string;
            /** Format: date */
            to: string;
        };
        HistoryPointResponse: {
            base: string;
            /** Format: date */
            date: string;
            /**
             * Format: date-time
             * @description En histórico diario propio, última escritura de esa versión; en VE, captura guardada; en el respaldo TRM, hora de armado de la respuesta.
             */
            fetched_at: string;
            id: string;
            market: string;
            mid: number;
            quote: string;
            /** Format: date-time */
            updated_at: string;
        };
        Holiday: {
            /** Format: date */
            date: string;
            fixed: boolean;
            global: boolean;
            local_name: string;
            name: string;
            type: string;
            types?: string[];
        };
        Issuer: {
            id: string;
            jurisdiction: components["schemas"]["IssuerJurisdiction"];
            /** @description central_bank, exchange, aggregator, … */
            kind: string;
            links?: components["schemas"]["IssuerLinks"];
            name: string;
            publishes: components["schemas"]["IssuerPublishes"][];
            short_name: string;
            timezone?: string;
        };
        IssuerJurisdiction: {
            countries: string[];
            currency?: string;
        };
        IssuerLinks: {
            website: string;
        };
        IssuerPublishes: {
            label: string;
            pair?: string;
            rate_id: string;
            schedule?: string;
            source?: string;
            status?: string;
            value_date?: string;
        };
        IssuersResponse: {
            issuers: components["schemas"]["Issuer"][];
            summary?: components["schemas"]["IssuersSummary"];
            without_issuer?: components["schemas"]["IssuerWithout"][];
        };
        IssuersSummary: {
            countries: number;
            issuers: number;
        };
        IssuerWithout: {
            country: string;
            rate_id: string;
            reason: string;
            status: string;
        };
        MarketEntry: {
            /** @description Aliases V1 para mercados VE. */
            aliases?: string[];
            available: boolean;
            base: string;
            /** @description Pares que /convert admite para esta tasa, independientemente del plan y de si hay precio utilizable ahora. Vacío para tasas fuera del snapshot de conversión. */
            conversion_directions: {
                from: string;
                to: string;
            }[];
            id: string;
            market: string;
            name: string;
            quote: string;
            /**
             * @description Id del plan público mínimo que habilita la tasa; hobby = Basic, indie = Growth.
             * @enum {string}
             */
            required_plan: "free" | "hobby" | "indie" | "pro" | "pro_extra";
            stale_after_sec: number;
            tags: string[];
            type: components["schemas"]["RateType"];
        };
        /** @description Campos presentes según plan. En VE los campos V1 conservan exactamente sus reglas de omisión; Free añade solo id. */
        Rate: {
            /** @description VE conserva la omisión V1 si no existe precio de venta. */
            ask?: number | null;
            /**
             * @description Basic+
             * @constant
             */
            available?: true;
            /** @description En VE se omite si V1 lo omitía. */
            base?: string;
            /** @description VE conserva la omisión V1 si no existe precio de compra. */
            bid?: number | null;
            /** @description Growth+. Contra la última captura de hace ≥24 h */
            change_24h_pct?: number | null;
            /** @description Qué es la tasa, quién la publica, cada cuánto cambia y para qué se usa. Según Accept-Language (es/en; sin encabezado, en). Ausente si no hay texto. */
            description?: string;
            /**
             * Format: date
             * @description Fecha valor (solo oficiales)
             */
            effective_date?: string;
            /**
             * Format: date-time
             * @description Solo en el recurso individual
             */
            fetched_at?: string;
            id: string;
            /** @description Identificador local estable; en VE es exactamente el market de v1. Para monedas BCV adicionales es el código ISO 4217. */
            market: string;
            mid: number;
            /** @description Basic+ */
            name?: string;
            /** @description Basic+ */
            quote?: string;
            /**
             * @description Growth+. Id del plan público mínimo que habilita la tasa; hobby = Basic, indie = Growth.
             * @enum {string}
             */
            required_plan?: "free" | "hobby" | "indie" | "pro" | "pro_extra";
            /** @description Basic+ en /rates; Free lo conserva en /convert. */
            stale?: boolean;
            /** @description En VE aparece cuando V1 tenía un umbral explícito. */
            stale_after_sec?: number;
            /** @description Basic+ en /rates; Free lo conserva en /convert y /route. */
            staleness_sec?: number;
            /** @description Growth+ */
            tags?: string[];
            type: components["schemas"]["RateType"];
            /**
             * Format: date-time
             * @description Momento del dato en la fuente
             */
            updated_at: string;
            /** @description Growth+. Contra la oficial de la misma base; null en oficiales */
            vs_official_pct?: number | null;
        };
        /** @description Tasa VE restringida: Free ve solo id, Basic ve identidad y available=false, Growth+ ve el descriptor completo. */
        RateDescriptor: {
            /** @constant */
            available?: false;
            base?: string;
            /** @description Qué es la tasa, quién la publica, cada cuánto cambia y para qué se usa. Según Accept-Language (es/en; sin encabezado, en). Ausente si no hay texto. */
            description?: string;
            id: string;
            /** @description Identificador local estable */
            market?: string;
            name?: string;
            quote?: string;
            /**
             * @description Id del plan público mínimo que habilita la tasa; hobby = Basic, indie = Growth.
             * @enum {string}
             */
            required_plan?: "free" | "hobby" | "indie" | "pro" | "pro_extra";
            tags?: string[];
            type?: components["schemas"]["RateType"];
        };
        RatesResponse: components["schemas"]["GeoFields"] & {
            base: string;
            /** Format: date-time */
            fetched_at: string;
            /** @description Cotizave Index (mismo objeto que /v1/fx/rates). Solo VE. */
            index?: Record<string, never>;
            plan: string;
            rates: (components["schemas"]["Rate"] | components["schemas"]["RateDescriptor"])[];
        };
        /**
         * @description Valores compatibles con v1 para VE; las clases exclusivas de v2 conservan su significado propio.
         * @enum {string}
         */
        RateType: "reference" | "interbank" | "parallel" | "securities" | "p2p" | "crypto_exchange" | "bank_board" | "cash" | "remittance" | "card" | "exchange_house" | "crypto";
        RouteOption: {
            amount: number;
            id: string;
            market: string;
            rate: number;
            staleness_sec: number;
            type: components["schemas"]["RateType"];
            updated_at: string;
        };
        RouteResponse: {
            alternatives: components["schemas"]["RouteOption"][];
            best: components["schemas"]["RouteOption"];
            country: string;
            direction: string;
            fetched_at: string;
            from: components["schemas"]["Amount"];
            skipped?: {
                id: string;
                market: string;
                reason: string;
            }[];
        };
        SpreadQuote: {
            id: string;
            market: string;
            updated_at: string;
            value: number;
        };
        SpreadResponse: {
            compared: components["schemas"]["SpreadQuote"];
            country: string;
            fetched_at: string;
            reference: components["schemas"]["SpreadQuote"];
            spread: {
                absolute: number;
                direction: string;
                percentage: number;
            };
        };
    };
    responses: {
        /** @description Error */
        Error: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Límite de velocidad o cuota (mismas cabeceras que v1) */
        RateLimited: {
            headers: {
                "Retry-After"?: number;
                /** @description Consultas por minuto del plan */
                "X-RateLimit-Limit-Minute"?: number;
                "X-RateLimit-Remaining-Minute"?: number;
                "X-RateLimit-Retry-After-Ms"?: number;
                "X-RateLimit-Scope"?: "burst" | "monthly";
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
    };
    parameters: {
        /** @description ISO 3166 alfa-2, minúscula (case-insensitive). Todos van con API_V2_ENABLED. */
        cc: "ve" | "co" | "au" | "jp" | "se" | "pl" | "ch" | "pe" | "py" | "bo" | "ar" | "br" | "cl" | "uy" | "mx" | "cr" | "gt" | "hn" | "do" | "in" | "id" | "ph" | "th" | "za" | "cn" | "il" | "hk" | "ke" | "gh" | "ng" | "tr" | "ro" | "hu" | "it" | "nl" | "be" | "at" | "ie" | "fi" | "gr" | "hr" | "si" | "sk" | "ee" | "lv" | "lt" | "lu" | "mt" | "cy" | "bg" | "es" | "fr" | "de" | "pt" | "is" | "ua" | "ge" | "mk" | "md" | "am" | "uz" | "az" | "kz" | "kg";
        format: "json" | "csv" | "xml";
        /** @description Id canónico (ve-bcv). Case-insensitive. */
        id: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
