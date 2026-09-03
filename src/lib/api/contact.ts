import { apiPost } from './client';
import type { Result } from './client';

export type ContactType = 'commercial' | 'support' | 'pro';

export type ContactData = {
  readonly type: ContactType;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly subject: string;
  readonly message: string;
};

export type ContactResponse = {
  readonly reference_id: string;
  readonly message: string;
};

export async function sendContact(
  data: ContactData
): Promise<Result<ContactResponse>> {
  return apiPost<ContactResponse>('/contact', data);
}
