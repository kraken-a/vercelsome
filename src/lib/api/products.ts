import { apiGet } from './client'
import type { Result } from './client'
import type { Product, ProductListResponse } from '@/types/product'

export type ProductParams = {
  readonly collection?: string
  readonly space?: string
  readonly type?: string
  readonly price_min?: string
  readonly price_max?: string
  readonly sort?: string
  readonly page?: string
  readonly limit?: string
  readonly country?: string
  readonly q?: string
}

export async function getProducts(params?: ProductParams): Promise<Result<ProductListResponse>> {
  const queryParams: Record<string, string> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams[key] = value
      }
    })
  }
  return apiGet<ProductListResponse>(
    '/products',
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
    { revalidate: 3600 },
  )
}

export async function getProduct(id: number, country?: string): Promise<Result<Product>> {
  const params = country ? { country } : undefined
  return apiGet<Product>(`/products/${id}`, params, { revalidate: 1800 })
}
