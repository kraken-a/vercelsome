export const dynamic = 'force-dynamic'
import {NextRequest} from 'next/server'
import { z } from 'zod'
import { checkRateLimit, clientIp, tooManyRequests, RL_NEWSLETTER } from '@/lib/rate-limit'

const ODOO_URL = process.env.ODOO_URL!

const NewsletterSchema = z.object({
    email: z.string().email().max(254),
    consent: z.boolean().optional(),
    locale: z.string().max(10).optional(),
}).passthrough()

export async function POST(request: NextRequest) {
    const rl = checkRateLimit(`newsletter:${clientIp(request)}`, RL_NEWSLETTER.limit, RL_NEWSLETTER.windowMs)
    if (!rl.ok) return tooManyRequests(rl)

    let raw: unknown
    try {
        raw = await request.json()
    } catch {
        return Response.json({success: false, error: 'Requête invalide.'}, {status: 400})
    }

    const parsed = NewsletterSchema.safeParse(raw)
    if (!parsed.success) {
        return Response.json({success: false, error: 'Requête invalide.'}, {status: 400})
    }
    const body = parsed.data

    let res: Response
    try {
        res = await fetch(`${ODOO_URL}/api/oaksome/v1/newsletter/subscribe`, {
            method: 'POST',

            headers: {'Content-Type': 'application/json', Accept: 'application/json'},
            body: JSON.stringify(body),
        })
    } catch {
        return Response.json({success: false, error: 'Service indisponible.'}, {status: 503})
    }


    let data: unknown
    try {
        data = await res.json()
    } catch {
        return Response.json({success: false, error: 'Réponse invalide du serveur.'}, {status: 502})
    }

    const d = data as Record<string, unknown>
    if (d?.error && typeof d.error === 'object') {
        const odooError = d.error as Record<string, unknown>
        return Response.json(
            {success: false, error: (odooError.message as string) || 'Une erreur est survenue.'},

            {status: res.ok ? 400 : res.status}
        )
    }


    return Response.json(data, {status: res.status})
}
