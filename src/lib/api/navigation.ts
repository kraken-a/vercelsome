import { apiGet } from './client';
import type { Result } from './client';

export type NavItem = {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly image_url: string;
  readonly category_desc?: string;
  readonly price_from?: number;
};

export type NavSpace = NavItem & {
  readonly description?: string;
};

export type NavCollection = NavItem & {
  readonly color_hex: string;
  readonly description?: string;
  readonly category_slugs?: ReadonlyArray<string>;
  readonly facades?: ReadonlyArray<{
    readonly id: number;
    readonly name: string;
    readonly description: string;
    readonly image_url: string;
  }>;
  readonly finition_ids?: ReadonlyArray<{
    readonly id: number;
    readonly name: string;
  }>;
  readonly space_slugs?: ReadonlyArray<string>;
};

export type NavigationData = {
  readonly types: ReadonlyArray<NavItem>;
  readonly spaces: ReadonlyArray<NavSpace>;
  readonly collections: ReadonlyArray<NavCollection>;
};

export async function getNavigation(lang?: string): Promise<Result<NavigationData>> {
  const params = lang ? { lang } : undefined
  return apiGet<NavigationData>('/navigation', params, { revalidate: 30 })
}
