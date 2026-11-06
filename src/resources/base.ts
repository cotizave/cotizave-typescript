import type { RequestConfig, Transport } from '../transport';

/** Shared base for resource groups: holds the transport and small helpers. */
export abstract class Resource {
  constructor(protected readonly transport: Transport) {}
}

/**
 * Per-call config for a history read: the caller's `timeout` wins, otherwise
 * the (longer) client-wide `historyTimeout` applies instead of `timeout`.
 */
export function historyConfig(transport: Transport, config?: RequestConfig): RequestConfig {
  return { ...config, timeout: config?.timeout ?? transport.historyTimeout };
}

/** Normalizes an ISO-3166 alpha-2 country code (the API is case-insensitive). */
export function cc(code: string): string {
  if (typeof code !== 'string' || code.trim() === '') {
    throw new TypeError('A country code (ISO 3166 alpha-2, e.g. "AR") is required.');
  }
  return encodeURIComponent(code.trim().toLowerCase());
}

/** Encodes a single path segment (rate id, bank code, currency code). */
export function seg(value: string, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`A ${label} is required.`);
  }
  return encodeURIComponent(value.trim());
}
