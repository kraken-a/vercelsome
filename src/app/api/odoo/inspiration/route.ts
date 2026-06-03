export const dynamic = 'force-dynamic'

import { apiGet } from '@/lib/api/client'

type RestRelation = { id?: number; name?: string; slug?: string }
type RestInspiration = {
  id?: number
  name?: string
  image_url?: string
  source?: string
  styles?: unknown
  case_id?: unknown
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function normalizeInspiration(item: RestInspiration) {
  const styles = asArray<RestRelation>(item.styles).map((s) => ({
    id: typeof s.id === 'number' ? s.id : 0,
    name: typeof s.name === 'string' ? s.name : '',
    slug: typeof s.slug === 'string' ? s.slug : '',
  }))

  const caseSlug =
    item.case_id && typeof item.case_id === 'object' && 'slug' in item.case_id
      ? (item.case_id as { slug?: unknown }).slug
      : undefined

  return {
    id: typeof item.id === 'number' ? item.id : 0,
    name: typeof item.name === 'string' ? item.name : '',
    source: typeof item.source === 'string' ? item.source : '',
    image_url: typeof item.image_url === 'string' ? item.image_url : '',
    image: typeof item.image_url === 'string' ? item.image_url : false,
    styles,
    style_ids: styles,
    case_id: typeof caseSlug === 'string' ? { slug: caseSlug } : null,
  }
}

export async function GET() {
  const result = await apiGet<unknown>('/inspirations')
  if (!result.success) {
    return Response.json({ error: result.error }, { status: result.code })
  }
  const list = asArray<RestInspiration>(result.data).map(normalizeInspiration)
  return Response.json(list)
}
