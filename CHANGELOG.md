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
  - `rates.list` / `rates.get` / `rates.global`
  - `history.get` / `history.daily` / `history.raw` / `history.iterate` / `history.limits`
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
- Dual ESM + CommonJS builds with bundled type declarations.

[Unreleased]: https://github.com/cotizave/cotizave-typescript/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/cotizave/cotizave-typescript/releases/tag/v0.1.0
