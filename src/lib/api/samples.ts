import { apiGet, apiPost } from './client';
import type { Result } from './client';

export type Sample = {
  readonly id: number;
  readonly name: string;
  readonly description?: string;
  readonly image_url: string;
  readonly material: string;
  readonly color: string;
};

export type SampleRequest = {
  readonly sample_ids: ReadonlyArray<number>;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly address: {
    readonly street: string;
    readonly city: string;
    readonly zip: string;
    readonly country: string;
  };
};

export type SampleResponse = {
  readonly id: number;
  readonly message: string;
  readonly estimated_delivery: string;
};

export async function getSamples(): Promise<Result<ReadonlyArray<Sample>>> {
  return apiGet<ReadonlyArray<Sample>>('/samples', undefined, {
    revalidate: 3600, tags: ['samples'],
  });
}

export async function requestSample(
  data: SampleRequest
): Promise<Result<SampleResponse>> {
  return apiPost<SampleResponse>('/samples/request', data);
}
