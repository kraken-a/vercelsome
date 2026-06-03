import { apiGet } from './client';
import type { Result } from './client';

export type Testimonial = {
  readonly id: number;
  readonly author: string;
  readonly text: string;
  readonly rating: number;
  readonly image_url?: string;
  readonly product_name?: string;
  readonly product_slug?: string;
  readonly date: string;
};

export async function getTestimonials(): Promise<
  Result<ReadonlyArray<Testimonial>>
> {
  return apiGet<ReadonlyArray<Testimonial>>('/testimonials', undefined, {
    revalidate: 3600,
  });
}
