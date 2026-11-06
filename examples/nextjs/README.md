# Next.js example (App Router)

A server-side Route Handler that proxies Cotizave through your own API. The
private key never reaches the browser.

1. Install the SDK in your Next.js project:

   ```bash
   npm install @cotizave/sdk
   ```

2. Set `COTIZAVE_API_KEY` in `.env.local` (server-only; do **not** prefix with
   `NEXT_PUBLIC_`).

3. Copy `route.ts` to `app/api/rates/[cc]/route.ts` and call it from your client:

   ```ts
   const res = await fetch('/api/rates/AR');
   const data = await res.json();
   ```

> Never import `@cotizave/sdk` into a Client Component (`'use client'`). Use Route
> Handlers, Server Actions, or server-only modules.
