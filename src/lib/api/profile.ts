import { apiGet, apiPut } from './client';
import type { Result } from './client';
import type { Profile } from '@/types/user';

export type UpdateProfileData = {
  readonly name?: string
  readonly phone?: string
  readonly building_year?: number
  readonly address?: {
    readonly street?: string
    readonly city?: string
    readonly zip?: string
    readonly country?: string
  }
}

export async function getProfile(): Promise<Result<Profile>> {
  return apiGet<Profile>('/profile');
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<Result<Profile>> {
  return apiPut<Profile>('/profile', data);
}
