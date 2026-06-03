import { type NextRequest, NextResponse } from 'next/server'
import { checkSensitiveProxyPath, tooManyRequests } from '@/lib/rate-limit'
import { withCors, preflight, verifyCsrfOrigin, csrfBlocked } from '@/lib/cors'
import { mintInviteToken } from '@/lib/auth-invite'

const INVITE_TOKEN_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// Odoo backend routes are registered under /api/oaksome regardless of this app's name
const ODOO_ROOT = process.env.ODOO_URL || process.env.NEXT_PUBLIC_ODOO_URL || ''
const ODOO_BASE = ODOO_ROOT ? `${ODOO_ROOT}/api/oaksome` : ''

if (!ODOO_BASE) {
  console.warn(
    '[api/vercelsome] Missing Odoo base URL. Set ODOO_URL (preferred) or NEXT_PUBLIC_ODOO_URL.',
  )
}

async function proxy(req: NextRequest, path: string): Promise<NextResponse> {
  if (!ODOO_BASE) {
    return NextResponse.json(
      { success: false, error: 'Odoo base URL is not configured', code: 500 },
      { status: 500 },
    )
  }

  if (path.includes('..') || path.startsWith('/')) {
    return NextResponse.json({ success: false, error: 'Invalid path', code: 400 }, { status: 400 })
  }

  if (!verifyCsrfOrigin(req)) return csrfBlocked(req)

  const rl = checkSensitiveProxyPath(req, path)
  if (rl && !rl.ok) return tooManyRequests(rl)

  const target = `${ODOO_BASE}/${path}${req.nextUrl.search}`

  const forwardHeaders = new Headers()
  forwardHeaders.set('Content-Type', 'application/json')
  forwardHeaders.set('Accept', 'application/json')

  // Forward session cookie from browser to Odoo.
  // If odoo_sid is present (set by configurator iframe), it takes precedence over
  // session_id so Odoo recognises the authenticated user from the iframe context.
  const cookie = req.headers.get('cookie') || ''
  const cookiePairs = cookie.split(';').map(c => c.trim()).filter(Boolean)
  const cookieMap: Record<string, string> = Object.fromEntries(
    cookiePairs.map(c => { const [k, ...v] = c.split('='); return [k.trim(), v.join('=')] })
  )
  if (cookieMap['odoo_sid']) {
    cookieMap['session_id'] = cookieMap['odoo_sid']
    delete cookieMap['odoo_sid']
  }
  const forwardCookie = Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join('; ')
  if (forwardCookie) forwardHeaders.set('cookie', forwardCookie)

  const init: RequestInit = {
    method: req.method,
    headers: forwardHeaders,
    redirect: 'manual',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text()
  }

  let odooRes: Response
  try {
    odooRes = await fetch(target, init)
  } catch {
    return NextResponse.json(
      { success: false, error: 'Odoo unreachable', code: 503 },
      { status: 503 },
    )
  }

  // Odoo redirects to /web/login when session is invalid (auth='user' routes).
  // Only return 401 JSON for auth-related redirects; forward all other 3xx as-is.
  if (odooRes.status >= 300 && odooRes.status < 400) {
    const location = odooRes.headers.get('location') ?? ''
    const isAuthRedirect = location.includes('/web/login') || location.includes('/web/session')
    if (isAuthRedirect) {
      return NextResponse.json({ success: false, error: 'Session expirée. Veuillez vous reconnecter.', code: 401 }, { status: 401 })
    }
    // Non-auth redirect: forward it as-is (no body — Odoo redirect bodies are HTML)
    return new NextResponse(null, { status: odooRes.status, headers: { location } })
  }

  const body = await odooRes.text()
  const res = new NextResponse(body, {
    status: odooRes.status,
    headers: { 'Content-Type': 'application/json' },
  })

  // Forward all Set-Cookie headers from Odoo. Force HttpOnly + SameSite=Lax always;
  // Secure only in production (so http://localhost dev still works).
  const isProd = process.env.NODE_ENV === 'production'
  const setCookies = typeof odooRes.headers.getSetCookie === 'function'
    ? odooRes.headers.getSetCookie()
    : (odooRes.headers.get('set-cookie') ? [odooRes.headers.get('set-cookie') as string] : [])

  // After a successful login, mint an invite token so the middleware gate lets the user through.
  if (path === 'v1/auth/login' && odooRes.status === 200) {
    const secret = process.env.INVITE_TOKEN_SECRET
    if (secret) {
      try {
        const inviteToken = await mintInviteToken(secret)
        res.cookies.set('vercelsome_invite_token', inviteToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax',
          maxAge: INVITE_TOKEN_MAX_AGE,
          path: '/',
        })
      } catch (err) {
        console.error('[api/auth/login] failed to mint invite token:', err)
      }
    }
  }

  for (const raw of setCookies) {
    const parts = raw.split(';').map(p => p.trim())
    const [rawName, rawValue] = (parts[0] ?? '').split('=')
    const name = rawName?.trim()
    const value = rawValue?.trim() ?? ''
    if (!name) continue
    const opts: Parameters<typeof res.cookies.set>[2] = {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
    }
    for (const attr of parts.slice(1)) {
      const lower = attr.toLowerCase()
      if (lower.startsWith('max-age=')) opts.maxAge = parseInt(attr.split('=')[1] ?? '0', 10)
      else if (lower.startsWith('expires=')) opts.expires = new Date(attr.split(/=(.+)/)[1] ?? '')
      else if (lower.startsWith('samesite=')) opts.sameSite = (attr.split('=')[1] ?? 'lax').toLowerCase() as 'lax' | 'strict' | 'none'
      else if (lower.startsWith('path=')) opts.path = attr.split('=')[1] ?? '/'
      else if (lower.startsWith('domain=')) opts.domain = attr.split('=')[1] ?? undefined
    }
    res.cookies.set(name, value, opts)
  }

  return res
}

type Params = { path: string[] }

export async function OPTIONS(req: NextRequest) {
  return preflight(req)
}

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { path } = await params
  return withCors(req, await proxy(req, path.join('/')))
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { path } = await params
  return withCors(req, await proxy(req, path.join('/')))
}

export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { path } = await params
  return withCors(req, await proxy(req, path.join('/')))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { path } = await params
  return withCors(req, await proxy(req, path.join('/')))
}
