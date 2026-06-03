import { apiGet, apiPost, apiPut, CHECKOUT_TIMEOUT_MS } from './client';
import type { Result } from './client';

export type CartItem = {
  readonly id: number;
  readonly product_id: number;
  readonly product_name: string;
  readonly quantity: number;
  readonly price_ttc: number;
  readonly product_image_url: string;
  readonly json_config?: Record<string, unknown>;
  readonly cart_date?: string;
};

export type Cart = {
  readonly items: ReadonlyArray<CartItem>;
  readonly total_ttc: number;
  readonly currency: string;
  readonly count: number;
};

export type AddToCartData = {
  readonly product_id: number;
  readonly quantity: number;
  readonly json_config?: Record<string, unknown>;
};

export type UpdateCartData = {
  readonly item_id: number;
  readonly quantity: number;
};

export type CartMutationResult =
  | { readonly item: CartItem }
  | { readonly deleted: true; readonly item_id: number };

export async function getCart(country?: string, lang?: string): Promise<Result<Cart>> {
  const params: Record<string, string> = {};
  if (country) params.country = country;
  if (lang) params.lang = lang;
  return apiGet<Cart>('/cart', Object.keys(params).length ? params : undefined);
}

export async function addToCart(
  data: AddToCartData
): Promise<Result<CartMutationResult>> {
  return apiPost<CartMutationResult>('/cart/add', data);
}

export async function updateCart(
  data: UpdateCartData
): Promise<Result<CartMutationResult>> {
  return apiPut<CartMutationResult>('/cart/update', data);
}

export async function removeFromCart(id: number): Promise<Result<CartMutationResult>> {
  return apiPost<CartMutationResult>('/cart/remove', { item_id: id });
}

export type CheckoutUrlResponse = {
  readonly checkout_url: string | null
  readonly has_order: boolean
  readonly is_so2: boolean
  readonly order_id: number | null
  readonly order_name: string | null
  readonly project_id: number | null
  readonly so1_id: number | null
}

export async function getCheckoutUrl(tva6?: boolean, so1Id?: number): Promise<Result<CheckoutUrlResponse>> {
  const params: Record<string, string> = {}
  if (tva6 !== undefined) params.tva6 = tva6 ? '1' : '0'
  if (so1Id !== undefined) params.so1_id = String(so1Id)
  return apiGet<CheckoutUrlResponse>('/cart/checkout-url', Object.keys(params).length ? params : undefined, { timeout: CHECKOUT_TIMEOUT_MS })
}

export type ConfirmOrderResponse = {
  readonly order_id: number;
  readonly order_name: string;
  readonly state: string;
};

export async function confirmOrder(orderId: number): Promise<Result<ConfirmOrderResponse>> {
  return apiPost<ConfirmOrderResponse>('/cart/confirm-order', { order_id: orderId });
}
