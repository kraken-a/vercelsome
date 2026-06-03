import { apiGet } from './client';
import type { Result } from './client';
import type { GammeDetail } from '@/types/gamme';

export type GammeParams = {
  readonly country?: string;
  readonly sort?: string;
  readonly page?: string;
  readonly limit?: string;
};

export async function getGamme(
  slug: string,
  params?: GammeParams
): Promise<Result<GammeDetail>> {
  const queryParams: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams[key] = value;
      }
    });
  }
  return apiGet<GammeDetail>(
    `/gammes/${slug}`,
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
    { revalidate: 3600 }
  );
}
