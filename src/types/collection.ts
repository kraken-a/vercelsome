import type { ProductSummary } from './product';

export type Collection = {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly color_hex: string;
  readonly image_url: string;
  readonly product_count: number;
};

export type CollectionDetail = {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly long_description?: string;
  readonly color_hex: string;
  readonly images: ReadonlyArray<{ readonly url: string; readonly name: string; readonly sequence: number }>;
  readonly products: ReadonlyArray<ProductSummary>;
  readonly features: ReadonlyArray<string>;
  readonly price_range: { readonly min: number; readonly max: number };
};

export type CollectionListResponse = {
  readonly collections: ReadonlyArray<Collection>;
};
