import { apiGet } from './client';
import type { Result } from './client';
import type { SpaceDetail } from '@/types/space';

export type EspaceParams = {
  readonly country?: string;
  readonly sort?: string;
  readonly page?: string;
  readonly limit?: string;
  readonly lang?: string;
};

export async function getEspace(
  slug: string,
  params?: EspaceParams
): Promise<Result<SpaceDetail>> {
  const queryParams: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams[key] = value;
      }
    });
  }
  return apiGet<SpaceDetail>(
    `/espaces/${slug}`,
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
    { revalidate: 3600, tags: ['spaces'] }
  );
}
