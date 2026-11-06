import { Resource, seg } from './base';
import type { RequestConfig } from '../transport';
import type { Rate } from '../types/public';
import type { paths } from '../types/generated';

/** `{ base, fetched_at, plan, rates }` — the stablecoin feed. */
export type CryptoList =
  paths['/v2/crypto']['get']['responses']['200']['content']['application/json'];

/** Canonical stablecoin ids priced in USD. */
export type StablecoinId = 'usdt-usd' | 'usdc-usd' | 'eurc-usd';

/** Stable references (USDT, USDC, EURC) priced in USD. Growth+. */
export class CryptoResource extends Resource {
  /** Lists the published stablecoins. Optional `tag` filter (e.g. `usdt`). */
  list(options: { tag?: string } = {}, config?: RequestConfig): Promise<CryptoList> {
    return this.transport.get<CryptoList>('/v2/crypto', { tag: options.tag }, config);
  }

  /** One stablecoin by its canonical id. */
  get(id: StablecoinId, config?: RequestConfig): Promise<Rate> {
    return this.transport.get<Rate>(`/v2/crypto/${seg(id, 'crypto id')}`, undefined, config);
  }
}
