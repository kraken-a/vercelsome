export const revalidate = 0

import { apiGet } from '@/lib/api/client'

export interface ShopInsert {
  id: number
  title: string
  subtitle: string
  image_url: string | false
  position: number
  link: string
  cta_label: string
  page: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lang = searchParams.get('lang') || undefined
  const page = searchParams.get('page') || undefined

  const params: Record<string, string> = {}
  if (lang) params.lang = lang
  if (page) params.page = page

  try {
    const result = await apiGet<ShopInsert[]>('/shop-inserts', Object.keys(params).length ? params : undefined, { revalidate: 0 })
    if (!result.success) {
      return Response.json([], { status: 200 })
    }
    return Response.json(Array.isArray(result.data) ? result.data : [])
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/odoo/shop-inserts]', message)
    return Response.json([])
  }
}
