# Contributing

Thanks for helping improve the official Cotizave TypeScript SDK.

## Prerequisites

- Node.js 22+
- npm 10+

## Setup

```bash
npm install
```

## Everyday commands

```bash
npm run generate:types   # regenerate src/types/generated.ts from the OpenAPI spec
npm run format           # Prettier (write)
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm run test             # unit + contract tests (Vitest)
npm run test:types       # compile-only type inference tests
npm run test:coverage    # tests with a coverage report
npm run test:integration # opt-in tests against the real API (see below)
npm run build            # dual ESM/CJS build + d.ts (tsup)
npm run check:package    # publint + are-the-types-wrong on the packed tarball
```

Before opening a PR, run the full gate:

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test:types \
  && npm run test && npm run build && npm run check:package
```

## Integration tests (opt-in)

`tests/integration` talks to the real API. It is skipped unless you set both
variables, so it never runs by accident or in CI:

```bash
COTIZAVE_INTEGRATION=1 COTIZAVE_API_KEY=your_key npm run test:integration
```

It issues a handful of read-only requests available on every plan. Never commit a
key, and never use a customer's key.

## Source of truth: the v2 contract

- The public types come from `openapi/cotizave-v2.yaml` via
  `npm run generate:types`. **Do not edit `src/types/generated.ts` by hand** — CI
  fails if it drifts from the spec.
- This SDK covers **API v2 only**. Do not add v1 routes, v1 compatibility, or
  invented fields/endpoints. If the spec and the backend disagree, follow what is
  actually implemented and note the discrepancy.
- Keep runtime dependencies to a minimum. The only one is Ky (the HTTP engine),
  inlined into the build; anything new needs a clear, verifiable justification.
- When bumping Ky, update `THIRD_PARTY_NOTICES.md` and re-run the security tests
  (`tests/security.test.ts`), which pin the behaviors we rely on.

## Design principles

- Small, predictable, strongly-typed public API; avoid `any` (prefer `unknown`).
- Money math stays on the server — never reimplement conversions in JS.
- Preserve canonical ids, markets, sources and precision exactly as returned.
- Add tests for every new method and every error family.

## Commit & PR

- Use clear, present-tense commit messages.
- Describe the change and link any related contract update.
- A maintainer reviews and approves releases; see the release workflow.
