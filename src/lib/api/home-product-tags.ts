import { apiGet } from '@/lib/api/client'

type Taxonomy = {
  readonly id?: number
  readonly name: string
  readonly slug?: string
}

export type HomepageProductTags = {
  readonly category?: Taxonomy
  readonly space?: Taxonomy
  readonly style?: Taxonomy
}

type HomeBestseller = {
  id: number
  category: string
  space: string
  style: string
  style_slug: string
}

type HomeData = { bestsellers: HomeBestseller[] }

export async function getHomepageProductTagMap(
  productIds: readonly number[],
): Promise<Map<number, HomepageProductTags>> {
  const tagMap = new Map<number, HomepageProductTags>()
  if (productIds.length === 0) return tagMap

  try {
    const result = await apiGet<HomeData>('/home')
    if (!result.success) return tagMap

    const idSet = new Set(productIds)
    for (const p of result.data.bestsellers) {
      if (!idSet.has(p.id)) continue
      tagMap.set(p.id, {
        category: p.category ? { name: p.category } : undefined,
        space: p.space ? { name: p.space } : undefined,
        style: p.style ? { name: p.style, slug: p.style_slug } : undefined,
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Odoo error'
    console.error(`[home-product-tags] ${message}`)
  }

  return tagMap
}
