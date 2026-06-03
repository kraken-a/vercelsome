import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hashSha256Lower } from '@/features/tracking/capi-hash'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const META_GRAPH_VERSION = 'v19.0'
const META_TIMEOUT_MS = 3000

const BodySchema = z.object({
  event_name: z.enum(['purchase', 'generate_lead', 'begin_checkout']),
  event_id: z.string().min(1),
  value: z.number().optional(),
  currency: z.string().length(3).optional(),
  email: z.string().email().optional(),
  consent: z.boolean().optional(),
})

type Body = z.infer<typeof BodySchema>

type ForwardResult =
  | { forwarded: true; fbtrace_id?: string }
  | { forwarded: false; error?: string }

async function forwardToMeta(body: Body): Promise<ForwardResult> {
  const token = process.env.META_CAPI_ACCESS_TOKEN
  const pixelId = process.env.META_CAPI_PIXEL_ID
  if (!token || !pixelId) return { forwarded: false, error: 'meta_not_configured' }

  const userData: Record<string, string[]> = {}
  if (body.email) {
    const em = await hashSha256Lower(body.email)
    userData.em = [em]
  }

  const customData: Record<string, unknown> = {}
  if (typeof body.value === 'number') customData.value = body.value
  if (body.currency) customData.currency = body.currency

  const payload = {
    data: [
      {
        event_name: body.event_name,
        event_id: body.event_id,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website' as const,
        user_data: userData,
        custom_data: customData,
      },
    ],
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), META_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      return { forwarded: false, error: `meta_http_${res.status}` }
    }
    const json = (await res.json().catch(() => ({}))) as { fbtrace_id?: string }
    return { forwarded: true, fbtrace_id: json.fbtrace_id }
  } catch (err) {
    const reason = err instanceof Error ? err.name : 'unknown'
    return { forwarded: false, error: `meta_fetch_${reason}` }
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(req: Request): Promise<Response> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_json' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'invalid_payload' },
      { status: 400 },
    )
  }

  if (parsed.data.consent !== true) {
    return NextResponse.json({ success: true, forwarded: false })
  }

  const result = await forwardToMeta(parsed.data)
  console.info('[capi]', {
    event_name: parsed.data.event_name,
    event_id: parsed.data.event_id,
    forwarded: result.forwarded,
    error: 'error' in result ? result.error : undefined,
  })

  return NextResponse.json({ success: true, ...result })
  // TODO(Phase 2): mirror to GA4 Measurement Protocol — gated by GA4_API_SECRET
}
