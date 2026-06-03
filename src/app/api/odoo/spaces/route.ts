export const revalidate = 300

import { apiGet } from '@/lib/api/client'

type SpaceItem = {
  id?: number
  name?: string
  slug?: string
  image_url?: string
}
type NavData = { spaces?: unknown[] }

function normalizeSpaces(raw: unknown): Array<{ id: number; name: string; slug: string; image_url: string; image: string; image_128: string }> {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is SpaceItem => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      id: typeof item.id === 'number' ? item.id : 0,
      name: typeof item.name === 'string' ? item.name : '',
      slug: typeof item.slug === 'string' ? item.slug : '',
      image_url: typeof item.image_url === 'string' ? item.image_url : '',
      image: typeof item.image_url === 'string' ? item.image_url : '',
      image_128: typeof item.image_url === 'string' ? item.image_url : '',
    }))
}

export async function GET() {
  try {
    const result = await apiGet<NavData>('/navigation', undefined, { revalidate: 300 })
    if (!result.success) {
      return Response.json({ error: `Odoo spaces unavailable: ${result.error}` }, { status: result.code })
    }
    return Response.json(normalizeSpaces(result.data.spaces))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Odoo error'
    console.error('[api/odoo/spaces] REST call failed:', message)
    return Response.json({ error: `Odoo spaces unavailable: ${message}` }, { status: 503 })
  }
}
