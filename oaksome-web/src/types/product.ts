export type Product = {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly price: number;
  readonly price_ttc: number;
  readonly description?: string;
  readonly collection: { readonly name: string; readonly slug: string; readonly color_hex: string };
  readonly type: { readonly name: string; readonly slug: string };
  readonly spaces: ReadonlyArray<{ readonly name: string; readonly slug: string }>;
  readonly images: ReadonlyArray<{ readonly url: string; readonly name: string; readonly sequence: number }>;
  readonly dimensions?: { readonly width: number; readonly depth: number; readonly height: number };
  readonly colors: ReadonlyArray<{ readonly name: string; readonly hex: string }>;
  readonly config_lines: ReadonlyArray<ConfigLine>;
  readonly is_new: boolean;
  readonly is_premium: boolean;
  readonly is_basic: boolean;
  readonly discount: number;
  readonly rating_avg?: number;
  readonly related_products: ReadonlyArray<ProductSummary>;
};

export type ProductSummary = {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
  readonly price: number;
  readonly price_ttc: number;
  readonly image_url: string;
  readonly collection_slug?: string;
  readonly collection_slugs?: ReadonlyArray<string>;
  readonly type_slug: string;
  readonly space_slug?: string;
  readonly space_slugs?: ReadonlyArray<string>;
  readonly is_new: boolean;
  readonly is_basic: boolean;
  readonly is_premium: boolean;
  readonly discount: number;
  readonly dim_width?: number;
  readonly dim_height?: number;
  readonly dim_length?: number;
  readonly colors?: ReadonlyArray<{ readonly name: string; readonly hex: string }>;
};

export type ConfigLine = {
  readonly option: { readonly name: string; readonly code: string; readonly value_type: string };
  readonly values: ReadonlyArray<{
    readonly name: string;
    readonly extra_price: number;
    readonly image_url?: string;
  }>;
  readonly required: boolean;
};

export type ProductListResponse = {
  readonly products: ReadonlyArray<ProductSummary>;
  readonly filters_available: {
    readonly collections: ReadonlyArray<string>;
    readonly spaces: ReadonlyArray<string>;
    readonly types: ReadonlyArray<string>;
    readonly price_range: { readonly min: number; readonly max: number };
  };
};
