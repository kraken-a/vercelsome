import type { ProductSummary } from './product';

export type Space = {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly image_url: string;
  readonly product_count: number;
};

export type SpaceDetail = {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly long_description?: string;
  readonly images: ReadonlyArray<{ readonly url: string; readonly name: string; readonly sequence: number }>;
  readonly products: ReadonlyArray<ProductSummary>;
  readonly recommended_collections: ReadonlyArray<{ readonly name: string; readonly slug: string }>;
};
