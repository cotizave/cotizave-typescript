# Security Policy

## Reporting a vulnerability

Please report security issues privately. **Do not open a public GitHub issue for
a vulnerability.**

- Email: **security@cotizave.com**
- Or use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
  on this repository.

Include a description, reproduction steps, affected versions, and impact. We aim
to acknowledge within a few business days and will coordinate a fix and
disclosure timeline with you.

## Handling API keys

This SDK is designed for **server-side** use.

- Never embed a private API key in a browser bundle, a React Client Component, a
  mobile app, or any public JavaScript.
- Load the key from a server-side secret (environment variable or secret manager),
  never from source control.
- In Next.js, call the SDK from Route Handlers, Server Actions, or server-only
  modules.

The SDK sends your key only as the `X-API-Key` header to the configured
`baseUrl`, never in a URL/query string. It does not log the key, persist it, place
it in error messages, send telemetry, or make requests to any other origin.

## Supply chain

- Installing the package installs **no other packages**. Its single runtime
  dependency, Ky (MIT, itself dependency-free), is inlined at build time and
  listed in `THIRD_PARTY_NOTICES.md`.
- Releases are built on GitHub-hosted runners and published with npm provenance.
- Published contents are restricted to `dist/`, `README.md`, `CHANGELOG.md`,
  `LICENSE` and `THIRD_PARTY_NOTICES.md` (verified with `npm pack --dry-run`).

## Supported versions

While on `0.x`, only the latest minor receives security fixes.
