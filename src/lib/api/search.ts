import { apiGet } from './client';
import type { Result } from './client';
import type { ProductSummary } from '@/types/product';
import type { Collection } from '@/types/collection';

export type SearchParams = {
  readonly page?: string;
  readonly limit?: string;
  readonly type?: string;
};

export type SearchResults = {
  readonly products: ReadonlyArray<ProductSummary>;
  readonly collections: ReadonlyArray<Collection>;
  readonly total: number;
};

export async function search(
  query: string,
  params?: SearchParams
): Promise<Result<SearchResults>> {
  const queryParams: Record<string, string> = { q: query };
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams[key] = value;
      }
    });
  }
  return apiGet<SearchResults>('/search', queryParams);
}
