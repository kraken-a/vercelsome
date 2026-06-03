export const revalidate = 300

import { apiGet } from '@/lib/api/client'

type Collection = { finition_ids: { id: number; name: string }[] }
type NavData = { collections: Collection[] }

export async function GET() {
  try {
    const result = await apiGet<NavData>('/navigation', undefined, { revalidate: 300 })
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
    return Response.json(finitions)
  } catch (err) {
    console.error('[api/odoo/finitions]', err)
    return Response.json([], { status: 500 })
  }
}
