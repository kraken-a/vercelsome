import { apiGet } from './client';
import type { Result } from './client';

type HomepageTaxonomy = {
  readonly id?: number;
  readonly name: string;
  readonly slug?: string;
};

export type HomepageBestseller = {
  readonly id: number;
  readonly name: string;
  readonly image_url: string;
  readonly price_ttc: number;
  readonly currency: string;
  readonly is_new: boolean;
  readonly is_basic: boolean;
  readonly is_premium: boolean;
  readonly discount: number;
  readonly dimensions: string;
  readonly badge: { readonly key: string; readonly label: string } | null;
  readonly category: string;
  readonly space: string;
  readonly style: string;
  readonly style_slug: string;
  readonly public_categ_ids?: ReadonlyArray<HomepageTaxonomy>;
  readonly space_ids?: ReadonlyArray<HomepageTaxonomy>;
  readonly style_ids?: ReadonlyArray<HomepageTaxonomy>;
  readonly oaksome_space_ids?: ReadonlyArray<HomepageTaxonomy>;
  readonly oaksome_style_ids?: ReadonlyArray<HomepageTaxonomy>;
};

export type HomeApiData = {
  readonly top_notice: unknown;
  readonly collections: ReadonlyArray<unknown>;
  readonly bestsellers: ReadonlyArray<HomepageBestseller>;
  readonly spaces: ReadonlyArray<unknown>;
};

export async function getHomeData(lang?: string): Promise<Result<HomeApiData>> {
  const params = lang ? { lang } : undefined;
  return apiGet<HomeApiData>('/home', params, { revalidate: 3600, tags: ['home'] });
}
