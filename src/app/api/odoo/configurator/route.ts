import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, clientIp, tooManyRequests, RL_CONFIG } from '@/lib/rate-limit'

const ODOO_URL = process.env.ODOO_URL!

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(`configurator:${clientIp(req)}`, RL_CONFIG.limit, RL_CONFIG.windowMs)
  if (!rl.ok) return tooManyRequests(rl)
  try {
    const { template_id, config_json, name } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 })
    }

    // auth='public' on the Odoo side — no session cookie needed
    const res = await fetch(`${ODOO_URL}/shop/get_or_create_product_by_config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          product_tmpl_id: template_id,
          config_json,
          name,
          skip_cart: true,   // cart item created separately by POST /cart/add with user's session
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
