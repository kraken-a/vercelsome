import { apiGet } from './client';
import type { Result } from './client';
import type { ConfigLine } from '@/types/product';
import type { Gamme } from '@/types/gamme';
import type { Collection } from '@/types/collection';

export type ConfiguratorData = {
  readonly gammes: ReadonlyArray<Gamme>;
  readonly collections: ReadonlyArray<Collection>;
  readonly config_lines: ReadonlyArray<ConfigLine>;
  readonly pricing: {
    readonly base_prices: Record<string, number>;
    readonly dimension_multipliers: Record<string, number>;
  };
};

export async function getConfiguratorData(): Promise<
  Result<ConfiguratorData>
> {
  return apiGet<ConfiguratorData>('/configurator', undefined, {
    revalidate: 3600,
  });
}
