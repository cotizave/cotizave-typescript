import { describe, it, expect } from 'vitest';
import {
  CotizaveError,
  CotizaveBadRequestError,
  CotizaveAuthenticationError,
  CotizaveFeatureNotInPlanError,
  CotizaveForbiddenError,
  CotizaveNotFoundError,
  CotizaveNotAcceptableError,
  CotizaveUnprocessableError,
  CotizaveRateLimitError,
  CotizaveServerError,
} from '../src/index';
import { harness, always } from './helpers';

function errorCase(status: number, code: string) {
  return always({ status, body: { code, message: `msg for ${code}` } });
}

describe('typed errors by status', () => {
  const cases: Array<[number, string, new (...a: never[]) => CotizaveError]> = [
    [400, 'unknown_parameter', CotizaveBadRequestError],
    [401, 'invalid_api_key', CotizaveAuthenticationError],
    [402, 'feature_not_in_plan', CotizaveFeatureNotInPlanError],
    [403, 'history_out_of_retention', CotizaveForbiddenError],
    [404, 'rate_not_found', CotizaveNotFoundError],
    [406, 'format_not_available', CotizaveNotAcceptableError],
    [422, 'reference_unavailable', CotizaveUnprocessableError],
    [500, 'internal_error', CotizaveServerError],
    [503, 'service_unavailable', CotizaveServerError],
  ];

  for (const [status, code, Ctor] of cases) {
    it(`maps HTTP ${status} → ${Ctor.name}`, async () => {
      const { client } = harness(errorCase(status, code), { maxRetries: 0 });
      const err = await client.rates.list('AR').catch((e) => e);
      expect(err).toBeInstanceOf(Ctor);
      expect(err).toBeInstanceOf(CotizaveError);
      expect(err.status).toBe(status);
      expect(err.code).toBe(code);
      expect(err.message).toBe(`msg for ${code}`);
    });
  }
});

describe('error body details', () => {
  it('preserves field and details', async () => {
    const { client } = harness(
      always({
        status: 402,
        body: {
          code: 'feature_not_in_plan',
          message: 'Upgrade required.',
          field: 'id',
          details: { feature: 'convert', required_plan: 'pro' },
        },
      }),
      { maxRetries: 0 },
    );
    const err = (await client.rates.list('AR').catch((e) => e)) as CotizaveError;
    expect(err.field).toBe('id');
    expect(err.details).toEqual({ feature: 'convert', required_plan: 'pro' });
  });

  it('keeps the status when a proxy returns non-JSON (HTML)', async () => {
    const { client } = harness(
      always({ status: 502, body: '<html>Bad Gateway</html>', headers: { 'content-type': 'text/html' } }),
      { maxRetries: 0 },
    );
    const err = (await client.rates.list('AR').catch((e) => e)) as CotizaveError;
    expect(err).toBeInstanceOf(CotizaveServerError);
    expect(err.status).toBe(502);
    expect(err.details?.non_json_body).toContain('Bad Gateway');
  });

  it('exposes response headers and request id on the error', async () => {
    const { client } = harness(
      always({ status: 404, body: { code: 'rate_not_found', message: 'no' }, headers: { 'x-request-id': 'req-1' } }),
      { maxRetries: 0 },
    );
    const err = (await client.rates.get('CO', 'nope').catch((e) => e)) as CotizaveError;
    expect(err.meta?.requestId).toBe('req-1');
    expect(err.headers?.['x-request-id']).toBe('req-1');
  });
});

describe('rate limit error', () => {
  it('flags monthly quota exhaustion', async () => {
    const { client } = harness(
      always({
        status: 429,
        body: { code: 'rate_limit_exceeded', message: 'Monthly limit exceeded.', details: { kind: 'monthly' } },
        headers: { 'x-ratelimit-scope': 'monthly', 'retry-after': '3600', 'x-ratelimit-remaining': '0' },
      }),
      { maxRetries: 0 },
    );
    const err = (await client.rates.list('AR').catch((e) => e)) as CotizaveRateLimitError;
    expect(err).toBeInstanceOf(CotizaveRateLimitError);
    expect(err.scope).toBe('monthly');
    expect(err.isQuotaExhausted).toBe(true);
    expect(err.retryAfter).toBe(3600);
    expect(err.rateLimit?.remaining).toBe(0);
  });

  it('flags burst limiting', async () => {
    const { client } = harness(
      always({
        status: 429,
        body: { code: 'rate_limit_exceeded', message: 'Too fast.', details: { kind: 'burst' } },
        headers: { 'x-ratelimit-scope': 'burst', 'retry-after': '1', 'x-ratelimit-retry-after-ms': '47' },
      }),
      { maxRetries: 0 },
    );
    const err = (await client.rates.list('AR').catch((e) => e)) as CotizaveRateLimitError;
    expect(err.scope).toBe('burst');
    expect(err.isQuotaExhausted).toBe(false);
    expect(err.rateLimit?.retryAfterMs).toBe(47);
  });
});
