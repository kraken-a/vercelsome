import type { ProductSummary } from './product';

export type Gamme = {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly image_url: string;
  readonly price_from: number;
  readonly lead_time_days: number;
};

export type GammeDetail = {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly long_description?: string;
  readonly images: ReadonlyArray<{ readonly url: string; readonly name: string; readonly sequence: number }>;
  readonly products: ReadonlyArray<ProductSummary>;
  readonly price_from: number;
  readonly lead_time_days: number;
  readonly features: ReadonlyArray<string>;
  readonly testimonials: ReadonlyArray<{
    readonly author: string;
    readonly text: string;
    readonly rating: number;
  }>;
};
