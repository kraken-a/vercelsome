import { apiGet } from './client';
import type { Result } from './client';
import type { CollectionListResponse, CollectionDetail } from '@/types/collection';

export async function getCollections(
  country?: string
): Promise<Result<CollectionListResponse>> {
  const params = country ? { country } : undefined;
  return apiGet<CollectionListResponse>('/collections', params, {
    revalidate: 3600,
  });
}

export async function getCollection(
  slug: string
): Promise<Result<CollectionDetail>> {
  return apiGet<CollectionDetail>(`/collections/${slug}`, undefined, {
    revalidate: 3600,
  });
}
