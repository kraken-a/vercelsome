import {apiGet, apiPost, apiPut,  apiDelete} from './client';
import type { Result } from './client';
import type { Profile } from '@/types/user';

export type UpdateProfileData = {
  readonly name?: string
  readonly phone?: string
  readonly building_year?: number
  readonly lang?: string
  readonly address?: {
    readonly street?: string
    readonly city?: string
    readonly zip?: string
    readonly country?: string
  }
}

export type AddressData = {
  readonly type?: 'delivery' | 'invoice'
  readonly street?: string
  readonly city?: string
  readonly zip?: string
  readonly country?: string
}

export async function getProfile(): Promise<Result<Profile>> {
  return apiGet<Profile>('/profile');
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<Result<Profile>> {
  return apiPut<Profile>('/profile', data);
}

export async function setPassword(newPassword: string): Promise<Result<{ message: string }>> {
  return apiPost('/auth/set-password', { new_password: newPassword });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<Result<{ message: string }>> {
  return apiPost('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
}

export async function addAddress(data: AddressData): Promise<Result<Profile>> {
  return apiPost<Profile>('/profile/address', data);
}

export async function updateAddress(id: number, data: AddressData): Promise<Result<Profile>> {
  return apiPut<Profile>(`/profile/address/${id}`, data);
}

export async function deleteAddress(id: number): Promise<Result<Profile>> {
  return apiDelete<Profile>(`/profile/address/${id}`);
}

export async function setDefaultAddress(id: number): Promise<Result<Profile>> {
  return apiPut<Profile>(`/profile/address/${id}/default`, {});
}
