import { describe, it, expect, afterEach } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  Cotizave,
  CotizaveError,
  CotizaveConnectionError,
  CotizaveTimeoutError,
} from '../src/index';
import { harness, always } from './helpers';

describe('F1 — a request path cannot change the origin (no key leak)', () => {
  it('rejects a path that resolves to another host and makes no request', async () => {
    const { client, calls } = harness(always({ body: {} }));
    for (const path of ['@evil.com/v2/x', '.evil.com/v2/x']) {
      const err = (await client.request({ method: 'GET', path }).catch((e) => e)) as CotizaveError;
      expect(err).toBeInstanceOf(CotizaveError);
      expect(err.code).toBe('invalid_request_path');
    }
    // export() goes through the same guard.
    const err2 = (await client.export('@evil.com/x', { format: 'csv' }).catch((e) => e)) as CotizaveError;
    expect(err2.code).toBe('invalid_request_path');
    expect(calls.length).toBe(0); // fetch was never called for any hostile path
  });

  it('still allows a normal same-origin path', async () => {
    const { client, calls } = harness(always({ body: { ok: true } }));
    await client.request({ method: 'GET', path: '/v2/fx/ar/rates' });
    expect(calls[0]!.url).toBe('https://api.cotizave.com/v2/fx/ar/rates');
  });
});

describe('F2 — redirects are not followed (no cross-origin key forwarding)', () => {
  it('sets redirect: "error" on the request init', async () => {
    let captured: RequestInit | undefined;
    const client = new Cotizave({
      apiKey: 'k',
      fetch: async (_url, init) => {
        captured = init;
        return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
      },
    });
    await client.rates.list('AR');
    expect(captured?.redirect).toBe('error');
  });

  it('does not forward the API key when the server redirects cross-origin (loopback)', async () => {
    let attackerReceivedKey: string | undefined;
    const attacker = http.createServer((req, res) => {
      attackerReceivedKey = req.headers['x-api-key'] as string | undefined;
      res.end('ok');
    });
    await listen(attacker);
    const redirector = http.createServer((_req, res) => {
      res.writeHead(302, { Location: `http://127.0.0.1:${port(attacker)}/stolen` });
      res.end();
    });
    await listen(redirector);
    servers.push(attacker, redirector);

    const client = new Cotizave({ apiKey: 'SECRET-KEY', baseUrl: `http://127.0.0.1:${port(redirector)}`, allowInsecureHttp: true, maxRetries: 0 });
    const err = await client.rates.list('VE').catch((e) => e);

    expect(err).toBeInstanceOf(CotizaveConnectionError); // redirect became an error
    expect(attackerReceivedKey).toBeUndefined(); // key never reached the other origin
  });
});

describe('F3 — the timeout covers a slow/hung response body (loopback)', () => {
  it('times out instead of hanging when the body never completes', async () => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write('{"partial":'); // send headers + a partial body, then never finish
    });
    await listen(server);
    servers.push(server);

    const client = new Cotizave({
      apiKey: 'k',
      baseUrl: `http://127.0.0.1:${port(server)}`,
      allowInsecureHttp: true,
      timeout: 150,
      maxRetries: 0,
    });
    const start = Date.now();
    const err = await client.rates.list('VE').catch((e) => e);
    expect(err).toBeInstanceOf(CotizaveTimeoutError);
    expect(Date.now() - start).toBeLessThan(3000); // did not hang
  });
});

describe('hardening — insecure http baseUrl is gated behind an opt-in', () => {
  it('rejects an http baseUrl by default', () => {
    expect(() => new Cotizave({ apiKey: 'k', baseUrl: 'http://api.example.com' })).toThrow(/cleartext|https/i);
  });
  it('allows http when allowInsecureHttp is true', () => {
    expect(() => new Cotizave({ apiKey: 'k', baseUrl: 'http://127.0.0.1:8080', allowInsecureHttp: true })).not.toThrow();
  });
  it('always allows https', () => {
    expect(() => new Cotizave({ apiKey: 'k', baseUrl: 'https://api.example.com' })).not.toThrow();
  });
});

describe('hardening — caller header values are validated against CR/LF injection', () => {
  it('rejects a control character in ifNoneMatch', async () => {
    const { client, calls } = harness(always({ body: {} }));
    const err = (await client
      .request({ method: 'GET', path: '/v2/fx/ve/rates', ifNoneMatch: 'etag\r\nX-Injected: 1' })
      .catch((e) => e)) as CotizaveError;
    expect(err).toBeInstanceOf(CotizaveError);
    expect(err.code).toBe('invalid_header_value');
    expect(calls.length).toBe(0);
  });
});

describe('hardening — prototype-pollution keys are stripped from error.details (nested)', () => {
  it('drops __proto__/constructor/prototype at top level and when nested', async () => {
    const { client } = harness(
      always({
        status: 400,
        body: {
          code: 'invalid_format',
          message: 'bad',
          details: JSON.parse(
            '{"field":"x","__proto__":{"polluted":true},"constructor":1,"nested":{"__proto__":{"bad":1},"ok":2}}',
          ),
        },
      }),
      { maxRetries: 0 },
    );
    const err = (await client.rates.list('AR').catch((e) => e)) as CotizaveError;
    expect(err.details).toEqual({ field: 'x', nested: { ok: 2 } });
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined(); // global prototype intact
  });
});

// --- loopback server helpers ---
const servers: http.Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise<void>((r) => s.close(() => r()))));
});
function listen(server: http.Server): Promise<void> {
  return new Promise((r) => server.listen(0, '127.0.0.1', r));
}
function port(server: http.Server): number {
  return (server.address() as AddressInfo).port;
}
