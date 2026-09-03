export const revalidate = 0

import { apiGet } from '@/lib/api/client'

type Collection = { finition_ids: { id: number; name: string; color_hex?: string }[] }
type NavData = { collections: Collection[] }

export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get('lang') || undefined
  try {
    const result = await apiGet<NavData>('/navigation', lang ? { lang } : undefined, { revalidate: 0 })
    if (!result.success) {
      console.error('[api/odoo/finitions] REST call failed:', result.error)
      return Response.json([], { status: result.code })
    }
    const seen = new Set<number>()
    const finitions = result.data.collections
      .flatMap((c) => c.finition_ids)
      .filter((f) => {
        if (seen.has(f.id)) return false
        seen.add(f.id)
        return true
      })
      .map((f) => ({ id: f.id, name: f.name, color_hex: f.color_hex ?? '' }))
    return Response.json(finitions)
  } catch (err) {
    console.error('[api/odoo/finitions]', err)
    return Response.json([], { status: 500 })
  }
}
