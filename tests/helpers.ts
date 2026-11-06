import { Cotizave } from '../src/index';
import type { FetchLike } from '../src/config';

export interface MockResponse {
  status?: number;
  /** Object → JSON-encoded; string → sent verbatim. */
  body?: unknown;
  headers?: Record<string, string>;
}

export interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export type Responder = (call: RecordedCall, attempt: number) => MockResponse;

export interface Harness {
  client: Cotizave;
  calls: RecordedCall[];
}

function toResponse(mock: MockResponse): Response {
  const status = mock.status ?? 200;
  const headers = new Headers(mock.headers ?? {});
  if (status === 304) return new Response(null, { status, headers });
  let bodyText: string | null = null;
  if (typeof mock.body === 'string') {
    bodyText = mock.body;
  } else if (mock.body !== undefined) {
    bodyText = JSON.stringify(mock.body);
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  }
  return new Response(bodyText, { status, headers });
}

/** Builds a client whose fetch is driven by `responder`, recording every call. */
export function harness(
  responder: Responder,
  options: Partial<ConstructorParameters<typeof Cotizave>[0]> = {},
): Harness {
  const calls: RecordedCall[] = [];
  const perUrlAttempts = new Map<string, number>();

  const fetchImpl: FetchLike = async (url, init = {}) => {
    const headers: Record<string, string> = {};
    new Headers(init.headers).forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });
    const call: RecordedCall = {
      url,
      method: init.method ?? 'GET',
      headers,
      ...(typeof init.body === 'string' ? { body: init.body } : {}),
    };
    calls.push(call);
    const key = `${call.method} ${url}`;
    const attempt = (perUrlAttempts.get(key) ?? 0) + 1;
    perUrlAttempts.set(key, attempt);

    // Honor abort so timeout tests behave like real fetch.
    if (init.signal?.aborted) throw init.signal.reason ?? new Error('aborted');
    return toResponse(responder(call, attempt));
  };

  const client = new Cotizave({
    apiKey: 'test-key',
    fetch: fetchImpl,
    ...options,
  });
  return { client, calls };
}

/** A responder that always returns the same mock. */
export function always(mock: MockResponse): Responder {
  return () => mock;
}

/** A responder returning each mock in order across all calls (global sequence). */
export function sequence(...mocks: MockResponse[]): Responder {
  let i = 0;
  return () => mocks[Math.min(i++, mocks.length - 1)]!;
}
