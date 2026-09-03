import { apiGet, apiPost, apiDelete } from './client';
import type { Result } from './client';

export type WishlistApiItem = {
  readonly id: number;
  readonly product_id: number;
  readonly product_name: string;
  readonly product_image_url: string;
  readonly price_ttc: number;
  readonly currency: string;
  readonly json_config?: Record<string, unknown>;
  readonly fav_date?: string;
};

export type WishlistApiResponse = {
  readonly items: ReadonlyArray<WishlistApiItem>;
  readonly count: number;
};

export type WishlistAddResponse = {
  readonly item: WishlistApiItem;
  readonly already_exists: boolean;
};

export type WishlistRemoveResponse = {
  readonly deleted: boolean;
  readonly item_id: number;
};

export async function getWishlist(): Promise<Result<WishlistApiResponse>> {
  return apiGet<WishlistApiResponse>('/wishlist');
}

export async function addToWishlist(
  productId: number,
  jsonConfig?: Record<string, unknown>,
): Promise<Result<WishlistAddResponse>> {
  return apiPost<WishlistAddResponse>('/wishlist/add', {
    product_id: productId,
    json_config: jsonConfig,
  });
}

export async function removeFromWishlist(
  itemId: number,
): Promise<Result<WishlistRemoveResponse>> {
  return apiDelete<WishlistRemoveResponse>('/wishlist/remove', { item_id: itemId });
}
