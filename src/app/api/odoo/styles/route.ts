export const revalidate = 300

import { apiGet } from '@/lib/api/client'

type StyleItem = {
  id?: number
  name?: string
  slug?: string
  image_url?: string
}

type StylesPayload = {
  collections?: unknown
}

function normalizeStyles(payload: unknown) {
  const raw = (payload && typeof payload === 'object' && Array.isArray((payload as StylesPayload).collections))
    ? (payload as StylesPayload).collections
    : payload

  if (!Array.isArray(raw)) return []

  return raw
    .filter((item): item is StyleItem => Boolean(item && typeof item === 'object'))
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
    const result = await apiGet<unknown>('/collections', undefined, { revalidate: 300 })
    if (!result.success) {
      return Response.json({ error: `Odoo styles unavailable: ${result.error}` }, { status: result.code })
    }
    return Response.json(normalizeStyles(result.data))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Odoo error'
    console.error('[api/odoo/styles] REST call failed:', message)
    return Response.json({ error: `Odoo styles unavailable: ${message}` }, { status: 503 })
  }
}
