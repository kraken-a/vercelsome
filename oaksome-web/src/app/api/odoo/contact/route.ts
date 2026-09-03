export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, clientIp, tooManyRequests, RL_CONTACT } from '@/lib/rate-limit'

const ODOO_URL = process.env.ODOO_URL!

const ContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(30).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
  type: z.string().max(30).optional(),
  utm_source: z.string().max(120).optional(),
}).passthrough()

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(`contact:${clientIp(request)}`, RL_CONTACT.limit, RL_CONTACT.windowMs)
  if (!rl.ok) return tooManyRequests(rl)

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return Response.json({ success: false, error: 'Requête invalide.' }, { status: 400 })
  }

  const parsed = ContactSchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json({ success: false, error: 'Requête invalide.' }, { status: 400 })
  }
  const body = parsed.data

  let res: Response
  try {
    res = await fetch(`${ODOO_URL}/api/oaksome/v1/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return Response.json({ success: false, error: 'Service indisponible.' }, { status: 503 })
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    return Response.json({ success: false, error: 'Réponse invalide du serveur.' }, { status: 502 })
  }

  // Normalize Odoo native error format { error: { code, message, details, request_id } }
  const d = data as Record<string, unknown>
  if (d?.error && typeof d.error === 'object') {
    const odooError = d.error as Record<string, unknown>
    return Response.json(
      { success: false, error: (odooError.message as string) || 'Une erreur est survenue.' },
      { status: res.ok ? 400 : res.status }
    )
  }

  return Response.json(data, { status: res.status })
}
