export const revalidate = 300

import { apiGet } from '@/lib/api/client'

export type Testimonial = {
  id: number
  author: string
  location: string | null
  text: string
  rating: number
  image_url: string | null
  collection: { id: number; name: string; slug: string } | null
  case_study_slug: string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get('collection') || undefined
  const lang = searchParams.get('lang') || undefined
  const params: Record<string, string> = {}
  if (collection) params.collection = collection
  if (lang) params.lang = lang
  try {
    const result = await apiGet<Testimonial[]>('/testimonials', Object.keys(params).length ? params : undefined, { revalidate: 300 })
    if (!result.success) {
      return Response.json({ error: result.error }, { status: result.code })
    }
    return Response.json(Array.isArray(result.data) ? result.data : [])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/odoo/testimonials]', message)
    return Response.json({ error: 'Service temporarily unavailable' }, { status: 503 })
  }
}
