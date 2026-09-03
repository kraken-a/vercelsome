import { apiGet } from './client';
import type { Result } from './client';
import type { CollectionListResponse, CollectionDetail } from '@/types/collection';

export async function getCollections(
  country?: string,
  lang?: string,
): Promise<Result<CollectionListResponse>> {
  const params: Record<string, string> = {};
  if (country) params.country = country;
  if (lang) params.lang = lang;
  return apiGet<CollectionListResponse>('/collections', Object.keys(params).length ? params : undefined, {
    revalidate: 3600, tags: ['collections'],
  });
}

export async function getCollection(
  slug: string,
  lang?: string,
): Promise<Result<CollectionDetail>> {
  const params = lang ? { lang } : undefined
  return apiGet<CollectionDetail>(`/collections/${slug}`, params, {
    revalidate: 3600, tags: ['collections'],
  });
}
