export const revalidate = 300

import { apiGet } from '@/lib/api/client'

type CategoryItem = {
  id?: number
  name?: string
  slug?: string
  image_url?: string
}
type NavData = { types?: unknown[] }

function normalizeCategories(raw: unknown): Array<{ id: number; name: string; slug: string; image_url: string; image_128: string }> {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is CategoryItem => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      id: typeof item.id === 'number' ? item.id : 0,
      name: typeof item.name === 'string' ? item.name : '',
      slug: typeof item.slug === 'string' ? item.slug : '',
      image_url: typeof item.image_url === 'string' ? item.image_url : '',
      image_128: typeof item.image_url === 'string' ? item.image_url : '',
    }))
}

export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get('lang') || undefined
  try {
    const result = await apiGet<NavData>('/navigation', lang ? { lang } : undefined, { revalidate: 300 })
    if (!result.success) {
      return Response.json({ error: `Odoo categories unavailable: ${result.error}` }, { status: result.code })
    }
    return Response.json(normalizeCategories(result.data.types))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Odoo error'
    console.error('[api/odoo/categories] REST call failed:', message)
    return Response.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}
