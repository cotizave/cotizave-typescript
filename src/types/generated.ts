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
        /** Banks of a country (identity, no price) */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                    q?: string;
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description List */
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
        /** A single bank by its official code (SUDEBAN in VE) */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
                    cc: components["parameters"]["cc"];
                    code: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Bank */
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
        /** Published countries. Pro and above. */
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
                /** @description List */
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
        /** A single published country. Pro and above. */
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
                /** @description Country */
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
         * USDT, USDC and EURC stablecoins priced in US dollars. Growth and above.
         * @description US-dollar price of the stablecoins published by Cotizave,
         *     with the same row shape as `/v2/fx/{cc}/rates` (`type: crypto`,
         *     `quote: USD`, `mid` = midpoint between bid and ask). Refreshed every
         *     5 minutes. Plans without the feature receive the descriptor without a price
         *     (`available: false`, `required_plan`).
         */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                    /** @description Id or tag (usdt, stablecoin…) */
                    tag?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Collection */
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
        /** A single stablecoin (usdt-usd, usdc-usd, eurc-usd). Growth and above. */
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
                /** @description Rate (includes `fetched_at`) */
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
                /** @description No data right now */
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
        /** Currencies quoted by Cotizave (ISO 4217). Pro and above. */
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
                /** @description List */
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
        /** A single currency. Pro and above. */
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
                /** @description Currency */
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
         * BCV quotations per bank (all plans)
         * @description What the BCV publishes as "informative rates of the banking system".
         *     Each row is identified by the bank (SUDEBAN code or null), not by a rate
         *     id. In VE, without the `bank` filter, `bank_rates` and `captured_at` keep the v1 response:
         *     there `stale` means an earlier publication. In `banks`, `stale`
         *     means the quotation exceeded its staleness threshold.
         */
        get: {
            parameters: {
                query?: {
                    /** @description Filter by SUDEBAN code */
                    bank?: string;
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Rates per bank */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GeoFields"] & {
                            /** @description v1 rows with bank, buy, sell, date, stale and days_behind; VE only and without the bank filter. */
                            bank_rates?: Record<string, never>[];
                            banks: components["schemas"]["BankRate"][];
                            /**
                             * Format: date-time
                             * @description v1 alias; VE only.
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
                /** @description Invalid `bank`, or bank filter not available for the country (AU) */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description bcv_snapshot_unavailable in VE; bank_rates_not_available if the country does not publish per-bank rates */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                /** @description bank_rates_unavailable for bank sources outside VE */
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
        /** Rate catalog of a country (no prices). Growth and above. */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Catalog */
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
         * All rates of a country
         * @description In Venezuela, plan-restricted rates appear as a descriptor
         *     without a price. Free receives the v1 fields plus `id`; Basic adds
         *     `name`, `quote`, `stale`, `staleness_sec` and `available`; Growth and Pro
         *     add `description`, `tags`, `change_24h_pct`, `vs_official_pct` and
         *     `required_plan`. `stale_after_sec` keeps v1's conditional omission.
         *     In AR, CO, PE, MX,
         *     AU and ES every published rate includes a price on any plan.
         *     SET-FX is disabled in Colombia. In VE, `?markup=tag` keeps
         *     the v1 variant for plans with the markups capability.
         */
        get: {
            parameters: {
                query?: {
                    base?: string;
                    /** @description Legacy v2 filter; keeps the internal category values. */
                    category?: components["schemas"]["Category"];
                    /** @description Returns the full board as it closed on that day (RatesSnapshotResponse) instead of the live rates. Subject to the history retention of the plan. */
                    date?: string;
                    format?: components["parameters"]["format"];
                    /** @description User markup rule; VE and authorized plans only. */
                    markup?: string;
                    quote?: string;
                    /** @description Id, v1 id, or alias (bcv, reference, euro…) */
                    tag?: string;
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Collection */
                200: {
                    headers: {
                        "Cache-Control"?: string;
                        ETag?: string;
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["RatesResponse"] | components["schemas"]["RatesSnapshotResponse"];
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
        /** A single rate by canonical id */
        get: {
            parameters: {
                query?: {
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
                    cc: components["parameters"]["cc"];
                    /** @description Canonical id (ve-bcv). Case-insensitive. */
                    id: components["parameters"]["id"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Rate with plan-dependent fields; Free keeps the v1 contract plus id. */
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
                /** @description resource_not_found in VE when there is no data, or rate_not_found / country_not_supported */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Error"];
                    };
                };
                429: components["responses"]["RateLimited"];
                /** @description Registered rate with no data right now */
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
         * History of a rate
         * @description `?date=` → a single point (the rate in effect that day). Without `date`:
         *     `granularity=daily` (default, no pagination) or `raw` (paginated with
         *     `cursor`/`limit`; pages move backwards in time and each
         *     page is in ascending order). Retention depends on the plan.
         */
        get: {
            parameters: {
                query?: {
                    /** @description Raw only. Opaque. */
                    cursor?: string;
                    date?: string;
                    format?: components["parameters"]["format"];
                    from?: string;
                    granularity?: "daily" | "raw";
                    /** @description Raw only. */
                    limit?: number;
                    /** @description With stats: window of the moving average; adds sma/ema to the aggregates. */
                    ma?: number;
                    /** @description Returns the aggregates of the period (HistoryStatsResponse) instead of the points. */
                    stats?: "1" | "true";
                    to?: string;
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
                    cc: components["parameters"]["cc"];
                    /** @description Canonical id (ve-bcv). Case-insensitive. */
                    id: components["parameters"]["id"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Point or collection */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["HistoryPointResponse"] | components["schemas"]["HistoryCollection"] | components["schemas"]["HistoryStatsResponse"];
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
                /** @description rate_not_found | history_not_available | no record */
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
        /** Best executable rate of a country. Pro and above. */
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
                    /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Route */
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
        /** Spread of the official rate against another rate of the country. Growth and above. */
        get: {
            parameters: {
                query?: {
                    against?: string;
                    base?: "USD";
                    format?: components["parameters"]["format"];
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
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
         * A single conversion
         * @description VE: USD/EUR ↔ VES, default `via` = the official rate for that currency (ve-bcv / ve-euro).
         *     CO: USD ↔ COP, default `via` = co-trm; `date` only with co-trm (the TRM in effect that day).
         *     AU: USD ↔ AUD, default `via` = au-official; no `date`.
         *     JP: USD ↔ JPY, default `via` = jp-official; `date` with jp-official.
         *     LATAM (pe, py, bo, ar, br, cl, uy, mx, cr, gt, hn, do): USD ↔ local,
         *     default `via` = {cc}-official; `date` in pe, ar, br, cl and hn.
         *     SE/PL/CH: USD ↔ local and EUR ↔ local; default `via` = the official rate in
         *     that currency ({cc}-official / {cc}-official-eur); `date` with the USD official rate.
         *     With an explicit `via`, a registered EUR rate can convert EUR ↔ local
         *     currency even if that country has no default EUR reference (for example,
         *     remittances from Spain in AR/CO/MX). Remittances only support EUR → local.
         *     `via` must match the pair; rates are never substituted and pairs are never crossed.
         *     The extra BCV rates CNY/TRY/RUB are published in `/rates`, but they are not
         *     convertible, and a `via` selecting them returns 400 with field `via`.
         *     `date` from Growth and only where suitable conversion history exists.
         */
        get: {
            parameters: {
                query: {
                    amount: number;
                    date?: string;
                    format?: components["parameters"]["format"];
                    from: string;
                    /** @description Local v1 alias of via, for VE. */
                    market?: string;
                    to: string;
                    /** @description v2 id (ve-binance…). Snapshot rates only. */
                    via?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Conversion */
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
         * Up to 50 conversions. Pro and above. Counts as 1 request.
         * @description Accepts exactly one JSON object: the v2 body with conversions, or the v1 body with from, to, amounts and market. A second JSON document returns 400 invalid_format. The second variant responds with rate, market, type, updated_at, results, total_in, total_out and id.
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
                /** @description One result per item, in the same order (conversion or error) */
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
         * History coverage (first/last date) of every rate the plan can see.
         * @description With an API key it counts against quota and returns the coverage of every
         *     rate visible to the plan (not only the official one). An account with no
         *     rates that have history receives 200 with an empty `limits`. The public, officials-only variant lives at
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
                /** @description Coverage */
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
         * The official rate of every published country in a single call.
         * @description `?symbols=BRL,EUR` filters currencies (all plans). `?base=EUR` changes
         *     the base (paid plans only; 402 on Free).
         */
        get: {
            parameters: {
                query?: {
                    /** @description Base currency (paid plans only). Defaults to USD. */
                    base?: string;
                    format?: components["parameters"]["format"];
                    /** @description Comma-separated ISO 4217 currencies. */
                    symbols?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description The official rate of each published country */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["GlobalRatesList"];
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
         * Holidays (year), is-it-a-holiday (date), or the next one (from). Basic and above.
         * @description `year`, `date` and `from` are mutually exclusive (400 if two are sent).
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
                    /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Depends on the mode */
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
                /** @description holidays_not_available (year outside the table; details first_year/last_year) */
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
        /** Date reached by adding N business days. Basic and above. */
        get: {
            parameters: {
                query: {
                    days: number;
                    format?: components["parameters"]["format"];
                    from?: string;
                };
                header?: never;
                path: {
                    /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
                    cc: components["parameters"]["cc"];
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Result */
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
         * Directory of the institutions that issue official rates. All plans.
         * @description Fixed reference data (provenance): who issues each official rate of the
         *     published countries and which rates they publish. No prices or history.
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
                /** @description Directory */
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
         * History coverage of the official rates, no API key required (edge-cached).
         * @description No key, no quota, JSON only, no parameters. Only the official rate of each country.
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
                /** @description Coverage (official rates only) */
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
         * Reduced issuers directory, no API key required (edge-cached).
         * @description No key, no quota, JSON only, no parameters. A subset of /v2/issuers (id, names, kind, countries and the name of each rate).
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
                /** @description Reduced directory */
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
            /** @description Link to its quotations at /v2/fx/{cc}/bank-rates?bank=; null if there are none */
            bank_rates: string | null;
            code: string;
            country: string;
            name: string;
            /**
             * @description null if the source does not report it (CO)
             * @enum {string|null}
             */
            type: "public" | "private" | null;
        };
        BankRate: {
            ask: number | null;
            bank: {
                /** @description SUDEBAN; null when there is no reliable code */
                code: string | null;
                /** @description Name as published by the BCV */
                name: string;
            };
            base: string;
            bid: number | null;
            /** @description Days behind the latest publication */
            days_behind: number;
            /**
             * Format: date
             * @description Value date (VE); absent if the bank does not publish it (AU)
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
         * @description Values of the category filter parameter; its name and values are kept as-is.
         * @enum {string}
         */
        Category: "official" | "interbank" | "parallel" | "securities" | "crypto_p2p" | "crypto_exchange" | "bank_board" | "cash" | "remittance" | "card" | "exchange_house" | "crypto";
        ConvertResponse: {
            /** Format: date */
            date?: string;
            /** Format: date */
            effective_date?: string;
            from: components["schemas"]["Amount"];
            /** @description Local identifier of the rate used; via keeps the global v2 id. */
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
            /** @description Follows Accept-Language (es/en) */
            name: string;
            rates: string[];
            region: string;
            region_code: string;
            timezone: string;
        };
        Currency: {
            code: string;
            minor_unit: number;
            /** @description Follows Accept-Language (es/en) */
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
        /** @description Country data at the top level. country and currency on all plans; geography only on Pro+. */
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
        HistoricalLimitRow: {
            /** @description Omitted = USD; EUR for euro-denominated official rates. */
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
                /** @description Only for rates with their own daily history. */
                ask?: number;
                /** @description Only for rates with their own daily history. */
                bid?: number;
                /**
                 * Format: date-time
                 * @description v1-compatible name of the capture time; VE only.
                 */
                captured_at?: string;
                /** Format: date */
                date: string;
                /**
                 * Format: date-time
                 * @description For own daily history, the last write of that version; in VE, the stored capture; for the TRM fallback, the time the response was built.
                 */
                fetched_at: string;
                mid: number;
                /** @description v1-compatible alias of mid; VE only. */
                rate?: number;
                /** Format: date-time */
                updated_at: string;
            }[];
            quote: string;
            /** Format: date */
            to: string;
            /** @description Raw only: present and true when the page was cut short. */
            truncated?: boolean;
        };
        HistoryPointResponse: {
            /** @description Only for rates with their own daily history. */
            ask?: number;
            base: string;
            /** @description Only for rates with their own daily history. */
            bid?: number;
            /**
             * Format: date-time
             * @description v1-compatible name of the capture time; VE only.
             */
            captured_at?: string;
            /** Format: date */
            date: string;
            /**
             * Format: date-time
             * @description For own daily history, the last write of that version; in VE, the stored capture; for the TRM fallback, the time the response was built.
             */
            fetched_at: string;
            id: string;
            market: string;
            mid: number;
            quote: string;
            /** @description v1-compatible alias of mid; VE only. */
            rate?: number;
            /** Format: date-time */
            updated_at: string;
        };
        /** @description Aggregates of a period over the daily closes. count is the number of days with data. */
        HistoryStats: {
            avg: number;
            change: number;
            change_pct: number;
            count: number;
            /** @description Exponential moving average (only with ma). */
            ema?: number;
            first: components["schemas"]["HistoryStatsPoint"];
            last: components["schemas"]["HistoryStatsPoint"];
            max: number;
            min: number;
            /** @description Moving-average window (only with ma). */
            period?: number;
            /** @description Simple moving average (only with ma). */
            sma?: number;
            stddev: number;
            /** @description Latest close against its EMA (only with ma). */
            vs_ema_pct?: number;
            /** @description Latest close against its SMA (only with ma). */
            vs_sma_pct?: number;
        };
        HistoryStatsPoint: {
            /** Format: date */
            date: string;
            mid: number;
        };
        HistoryStatsResponse: {
            base: string;
            /** Format: date */
            from: string;
            granularity: string;
            id: string;
            market: string;
            quote: string;
            stats: components["schemas"]["HistoryStats"];
            /** Format: date */
            to: string;
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
            /** @description v1 aliases for VE markets. */
            aliases?: string[];
            available: boolean;
            base: string;
            /** @description Pairs that /convert supports for this rate, regardless of plan and of whether a usable price exists right now. Empty for rates outside the conversion snapshot. */
            conversion_directions: {
                from: string;
                to: string;
            }[];
            id: string;
            market: string;
            name: string;
            quote: string;
            /**
             * @description Id of the minimum public plan that enables the rate; hobby = Basic, indie = Growth.
             * @enum {string}
             */
            required_plan: "free" | "hobby" | "indie" | "pro" | "pro_extra";
            stale_after_sec: number;
            tags: string[];
            type: components["schemas"]["RateType"];
        };
        /** @description Fields present depend on the plan. In VE the v1 fields keep exactly their omission rules; Free only adds id. */
        Rate: {
            /** @description VE keeps the v1 omission when there is no ask price. */
            ask?: number | null;
            /**
             * @description Basic+
             * @constant
             */
            available?: true;
            /** @description In VE it is omitted if v1 omitted it. */
            base?: string;
            /** @description VE keeps the v1 omission when there is no bid price. */
            bid?: number | null;
            /** @description Growth+. Against the latest capture from ≥24 h ago */
            change_24h_pct?: number | null;
            /** @description What the rate is, who publishes it, how often it changes and what it is used for. Follows Accept-Language (es/en; en when the header is absent). Absent if there is no text. */
            description?: string;
            /**
             * Format: date
             * @description Value date (official rates only)
             */
            effective_date?: string;
            /**
             * Format: date-time
             * @description Only on the single-rate resource
             */
            fetched_at?: string;
            id: string;
            /** @description Stable local identifier; in VE it is exactly the v1 market. For additional BCV currencies it is the ISO 4217 code. */
            market: string;
            mid: number;
            /** @description Basic+ */
            name?: string;
            /** @description Basic+ */
            quote?: string;
            /**
             * @description Growth+. Id of the minimum public plan that enables the rate; hobby = Basic, indie = Growth.
             * @enum {string}
             */
            required_plan?: "free" | "hobby" | "indie" | "pro" | "pro_extra";
            /** @description Basic+ in /rates; Free keeps it in /convert. */
            stale?: boolean;
            /** @description In VE it appears when v1 had an explicit threshold. */
            stale_after_sec?: number;
            /** @description Basic+ in /rates; Free keeps it in /convert and /route. */
            staleness_sec?: number;
            /** @description Growth+ */
            tags?: string[];
            type: components["schemas"]["RateType"];
            /**
             * Format: date-time
             * @description Time of the data point at the source
             */
            updated_at: string;
            /** @description Growth+. Against the official rate of the same base; null for official rates */
            vs_official_pct?: number | null;
        };
        /** @description Restricted VE rate: Free sees only id, Basic sees identity and available=false, Growth+ sees the full descriptor. */
        RateDescriptor: {
            /** @constant */
            available?: false;
            base?: string;
            /** @description What the rate is, who publishes it, how often it changes and what it is used for. Follows Accept-Language (es/en; en when the header is absent). Absent if there is no text. */
            description?: string;
            id: string;
            /** @description Stable local identifier */
            market?: string;
            name?: string;
            quote?: string;
            /**
             * @description Id of the minimum public plan that enables the rate; hobby = Basic, indie = Growth.
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
            /** @description Cotizave Index object. VE only. */
            index?: Record<string, never>;
            plan: string;
            rates: (components["schemas"]["Rate"] | components["schemas"]["RateDescriptor"])[];
        };
        /** @description The full board of a country on a date: every rate the plan includes, as it was that day. */
        RatesSnapshotResponse: components["schemas"]["GeoFields"] & {
            base: string;
            count: number;
            /** Format: date */
            date: string;
            rates: components["schemas"]["RatesSnapshotRow"][];
        };
        /** @description Close of a rate on a past date. No change_24h or vs_official: those are relative to "now". */
        RatesSnapshotRow: {
            /** @description Absent when the source has no ask price. */
            ask?: number;
            /** @description Absent when the source has no bid price. */
            bid?: number;
            id: string;
            market: string;
            mid: number;
            type: components["schemas"]["RateType"];
            /** Format: date-time */
            updated_at: string;
        };
        /**
         * @description Values compatible with v1 for VE; v2-only classes keep their own meaning.
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
        /** @description Rate limit or quota exceeded */
        RateLimited: {
            headers: {
                "Retry-After"?: number;
                /** @description Requests per minute allowed by the plan */
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
        /** @description ISO 3166 alpha-2, lowercase (case-insensitive). */
        cc: "ve" | "co" | "au" | "jp" | "se" | "pl" | "ch" | "pe" | "py" | "bo" | "ar" | "br" | "cl" | "uy" | "mx" | "cr" | "gt" | "hn" | "do" | "in" | "id" | "ph" | "th" | "za" | "cn" | "il" | "hk" | "ke" | "gh" | "ng" | "tr" | "ro" | "hu" | "it" | "nl" | "be" | "at" | "ie" | "fi" | "gr" | "hr" | "si" | "sk" | "ee" | "lv" | "lt" | "lu" | "mt" | "cy" | "bg" | "es" | "fr" | "de" | "pt" | "is" | "ua" | "ge" | "mk" | "md" | "am" | "uz" | "az" | "kz" | "kg";
        format: "json" | "csv" | "xml";
        /** @description Canonical id (ve-bcv). Case-insensitive. */
        id: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
