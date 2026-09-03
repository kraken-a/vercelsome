import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, clientIp, tooManyRequests, RL_CONFIG } from '@/lib/rate-limit'

const ODOO_URL = process.env.ODOO_URL!
const CONFIG_JSON_MAX_BYTES = 512 * 1024
const FORWARDED_COOKIES = new Set(['session_id', 'odoo_sid'])

const ConfiguratorSchema = z.object({
  name: z.string().min(1).max(200),
  config_json: z
    .record(z.string(), z.unknown())
    .refine(
      (v) => Buffer.byteLength(JSON.stringify(v), 'utf8') <= CONFIG_JSON_MAX_BYTES,
      { message: 'config_json too large' },
    ),
  image_base64: z.string().max(2 * 1024 * 1024).nullable().optional(),
  user_id: z.number().int().positive().nullable().optional(),
  product_tmpl_id: z.number().int().positive().nullable().optional(),
  pricing: z.number().optional(),

})

function forwardCookie(req: NextRequest): string {
  const raw = req.headers.get('cookie') || ''
  const map: Record<string, string> = Object.fromEntries(
    raw.split(';').map(c => c.trim()).filter(Boolean)
      .map(c => { const [k, ...v] = c.split('='); return [k.trim(), v.join('=')] })
      .filter(([k]) => FORWARDED_COOKIES.has(k)),
  )
  if (map['odoo_sid']) { map['session_id'] = map['odoo_sid']; delete map['odoo_sid'] }
  return Object.entries(map).map(([k, v]) => `${k}=${v}`).join('; ')
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`configurator:${clientIp(req)}`, RL_CONFIG.limit, RL_CONFIG.windowMs)
  if (!rl.ok) return tooManyRequests(rl)
  try {
    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const parsed = ConfiguratorSchema.safeParse(raw)
    if (!parsed.success) {
      console.error('[configurator] Zod validation failed:', JSON.stringify(parsed.error.issues))
      return NextResponse.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 })
    }
    const {config_json, name, image_base64, user_id, product_tmpl_id, pricing} = parsed.data

    const cookie = forwardCookie(req)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    }
    if (cookie) headers['cookie'] = cookie

    const res = await fetch(`${ODOO_URL}/shop/get_or_create_product_by_config`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          config_json,
          name,
          ...(image_base64 != null ? { image_base64 } : {}),
          ...(user_id != null ? { user_id } : {}),
          ...(product_tmpl_id != null ? {product_tmpl_id} : {}),
          ...(pricing != null ? {pricing} : {}),
        },
      }),
    })

    const json = await res.json()
    if (json.error) {
      return NextResponse.json({ error: json.error }, { status: 400 })
    }

    return NextResponse.json(json.result ?? {})
  } catch (err) {
    console.error('[configurator] API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
