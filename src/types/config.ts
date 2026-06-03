export type SharedConfig = {
  readonly token: string;
  readonly product_id: number;
  readonly product_name: string;
  readonly product_slug: string;
  readonly selections: ReadonlyArray<{
    readonly option_code: string;
    readonly option_name: string;
    readonly value_name: string;
    readonly extra_price: number;
  }>;
  readonly dimensions?: {
    readonly width: number;
    readonly depth: number;
    readonly height: number;
  };
  readonly total_price: number;
  readonly total_price_ttc: number;
  readonly created_at: string;
  readonly expires_at: string;
};
