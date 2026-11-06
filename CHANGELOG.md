# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-06

Initial release. Not yet published to npm.

### Added

- `Cotizave` client for the Cotizave **API v2** (`X-API-Key` auth).
- Typed resources derived from the OpenAPI v2 contract:
  - `rates.list` / `rates.get` / `rates.global` / `rates.snapshot`
  - `history.get` / `history.daily` / `history.raw` / `history.iterate` /
    `history.stats` / `history.limits`
  - `convert` / `convertBulk` (max 50)
  - `markets` / `spread` / `route` / `bankRates`
  - `countries` / `currencies` / `banks` / `issuers` / `holidays` / `crypto`
- Zero-runtime-dependency HTTP transport on native `fetch`: timeouts,
  `AbortSignal`, controlled retries with backoff + jitter, and rate-limit
  awareness (never retries a monthly-quota `429`).
- Typed error hierarchy (`CotizaveError` and status-specific subclasses) that
  preserves API `code`, `message`, `field`, `details` and response metadata.
- Response metadata (status, headers, parsed rate-limit info) via `request`;
  conditional GETs (`ifNoneMatch` / `304`); CSV/XML export via `export`.
- Dual ESM + CommonJS builds with per-format type declarations (validated with
  `publint` and `are-the-types-wrong`).
- Client options with safe defaults: low timeouts (`timeout` 5s, `historyTimeout`
  10s), `maxRetries`, `maxRetryDelay`, a `retry` policy (`baseDelay`, `maxDelay`,
  `statuses`, `retryRateLimited`, `shouldRetry`, `onRetry`), `headers`,
  `language`, `onResponse`, `maxResponseBytes`, `baseUrl`, `fetch`, `userAgent`
  and `allowInsecureHttp`.
- Per-call overrides on every method through a trailing `RequestConfig`
  (`signal`, `timeout`, `maxRetries`, `headers`, `language`).

### Security

- Requests can never leave the configured origin; a path that resolves to another
  host is rejected (`invalid_request_path`).
- Redirects are treated as errors, so the API key is never forwarded to another
  origin.
- The timeout and the caller's `AbortSignal` cover the whole response, including a
  slow or stalled body.
- Response bodies are read with a size cap (`maxResponseBytes`).
- An `http://` base URL is rejected unless `allowInsecureHttp` is set.
- The API key is held in runtime-private fields and is absent from
  `client.config`, so logging or serializing a client never exposes it.
- Caller-supplied header values are validated, and prototype-polluting keys are
  stripped from server-provided `error.details`.

[Unreleased]: https://github.com/cotizave/cotizave-typescript/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/cotizave/cotizave-typescript/releases/tag/v0.1.0
