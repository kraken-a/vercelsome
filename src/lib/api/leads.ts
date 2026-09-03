import { apiPost } from './client';
import type { Result } from './client';
import type { LeadRequest, LeadResponse } from '@/types/lead';

export async function createLead(
  data: LeadRequest
): Promise<Result<LeadResponse>> {
  return apiPost<LeadResponse>('/leads', data);
}
