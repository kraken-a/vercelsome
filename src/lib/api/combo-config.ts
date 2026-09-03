import { apiGet } from './client';
import type { Result } from './client';

type ComboTaxonomy = {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
};

export type ComboBanner = {
  readonly id: number;
  readonly name: string;
  readonly sequence: number;
  readonly image_url: string;
  readonly space: ComboTaxonomy | null;
  readonly category: ComboTaxonomy | null;
  readonly style: ComboTaxonomy | null;
  readonly product: {
    readonly id: number;
    readonly name: string;
    readonly image_url: string;
    readonly price_ttc: number;
    readonly currency: string;
  } | null;
};

export type ComboConfig = {
  readonly id: number;
  readonly name: string;
  readonly default_product_link: string;
  readonly banners: ReadonlyArray<ComboBanner>;
};

export async function getComboConfig(lang?: string): Promise<Result<ComboConfig | null>> {
  const params = lang ? { lang } : undefined;
  return apiGet<ComboConfig | null>('/combo-config', params, { revalidate: 3600, tags: ['combo-config'] });
}
