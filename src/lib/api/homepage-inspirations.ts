import { apiGet } from './client';
import type { Result } from './client';

export type InspirationCombo = {
  readonly id: number;
  readonly space_id: number;
  readonly space_name: string;
  readonly space_slug: string;
  readonly style_id: number;
  readonly style_name: string;
  readonly style_slug: string;
  readonly image_url: string;
  readonly label: string;
};

export type InspirationSpace = {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
};

export type HomepageInspirationsData = {
  readonly combos: ReadonlyArray<InspirationCombo>;
  readonly spaces: ReadonlyArray<InspirationSpace>;
};

export async function getHomepageInspirations(): Promise<Result<HomepageInspirationsData>> {
  return apiGet<HomepageInspirationsData>('/homepage-inspirations', undefined, { revalidate: 3600 });
}

// Some Odoo data sets ship two combos sharing the same space+style pair (different ids)
// which renders as duplicate tiles. Dedupe by composite key, preserving order.
export function dedupeInspirations(
  combos: ReadonlyArray<InspirationCombo>,
): ReadonlyArray<InspirationCombo> {
  const seen = new Set<string>();
  const out: InspirationCombo[] = [];
  for (const c of combos) {
    const key = `${c.space_id}-${c.style_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
