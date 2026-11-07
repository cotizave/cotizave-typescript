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

## Bilingual documentation

Prose docs are kept in English and Spanish; code, comments, identifiers and error
`code`s stay English-only.

- `README.md` (English) and `README.es.md` (Spanish) must be edited **together**
  in the same change — they cross-link via a language switcher at the top, and npm
  shows `README.md`.
- The docs-page drafts `docs/sdk-typescript.mdx` and `docs/sdk-typescript.es.mdx`
  are a pair too; update both.
- `CHANGELOG.md`, `CONTRIBUTING.md` and `SECURITY.md` are English-only.

## Design principles

- Small, predictable, strongly-typed public API; avoid `any` (prefer `unknown`).
- Money math stays on the server — never reimplement conversions in JS.
- Preserve canonical ids, markets, sources and precision exactly as returned.
- Add tests for every new method and every error family.

## Commit & PR

- Use clear, present-tense commit messages.
- Describe the change and link any related contract update.

## Releasing

Releases are driven by the **Release** workflow (`.github/workflows/release.yml`),
not by publishing from a laptop.

1. In the repo, open **Actions → Release → Run workflow**, pick the bump
   (`patch` / `minor` / `major`) and run it.
2. The `tag` job runs the full gate, bumps the version (keeping `SDK_VERSION` in
   sync via the `version` script), pushes the tag, and creates a GitHub Release
   with auto-generated notes.
3. The `publish` job waits for approval in the `npm-publish` environment, then
   publishes to npm with provenance via Trusted Publishing (OIDC) — no stored
   token.

One-time setup for the automated path:

- A GitHub **Environment** named `npm-publish` with required reviewers
  (Settings → Environments).
- A **Trusted Publisher** on npm for this repo + `release.yml` + the
  `npm-publish` environment (npm package Settings → Trusted Publishers).

The **first** publish of a brand-new package name is different: npm holds it as a
staged release behind a `0.0.0-stage` placeholder until a maintainer approves it
(`npm stage list` → `npm stage approve <id>`, or the Staged Packages tab). After
that first approval, the workflow above publishes directly.
