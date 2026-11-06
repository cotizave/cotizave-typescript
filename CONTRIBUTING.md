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
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm run test             # unit + contract tests (Vitest)
npm run test:types       # compile-only type inference tests
npm run build            # dual ESM/CJS build + d.ts (tsup)
```

Before opening a PR, run the full gate:

```bash
npm run lint && npm run typecheck && npm run test && npm run build && npm pack --dry-run
```

## Source of truth: the v2 contract

- The public types come from `openapi/cotizave-v2.yaml` via
  `npm run generate:types`. **Do not edit `src/types/generated.ts` by hand** — CI
  fails if it drifts from the spec.
- This SDK covers **API v2 only**. Do not add v1 routes, v1 compatibility, or
  invented fields/endpoints. If the spec and the backend disagree, follow what is
  actually implemented and note the discrepancy.
- Keep the package dependency-free at runtime. New runtime dependencies need a
  clear, verifiable justification.

## Design principles

- Small, predictable, strongly-typed public API; avoid `any` (prefer `unknown`).
- Money math stays on the server — never reimplement conversions in JS.
- Preserve canonical ids, markets, sources and precision exactly as returned.
- Add tests for every new method and every error family.

## Commit & PR

- Use clear, present-tense commit messages.
- Describe the change and link any related contract update.
- A maintainer reviews and approves releases; see the release workflow.
