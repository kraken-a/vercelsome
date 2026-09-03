import { apiGet } from './client';
import type { Result } from './client';
import type { SharedConfig } from '@/types/config';

export async function getSharedConfig(
  token: string
): Promise<Result<SharedConfig>> {
  return apiGet<SharedConfig>(`/config/${token}`);
}
