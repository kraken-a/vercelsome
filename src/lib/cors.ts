import { type NextRequest, NextResponse } from 'next/server'

const PROD_ALLOWED = [
  'https://vercelsome.com',
  'https://www.vercelsome.com',
  'https://cdn.vercelsome.com',
]

// In dev, Next.js auto-picks the next free port (3001+) when 3000 is busy,
// so we accept any http://localhost:* / http://127.0.0.1:* origin instead of
// hardcoding the port. Prod allowlist is unchanged.
function isDevLocalhostOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === 'production') return false
  try {
    const u = new URL(origin)
    if (u.protocol !== 'http:') return false
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

export function resolveAllowedOrigin(origin: string | null): string | null {
  if (!origin) return null
  if (PROD_ALLOWED.includes(origin)) return origin
  if (isDevLocalhostOrigin(origin)) return origin
  return null
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = resolveAllowedOrigin(origin)
  if (!allowed) return {}
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, X-Requested-With',
    'Vary': 'Origin',
  }
}

export function withCors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v)
  if (origin && !resolveAllowedOrigin(origin)) {
    console.warn(`[cors] blocked origin: ${origin} path=${req.nextUrl.pathname}`)
  }
  return res
}

export function preflight(req: NextRequest): NextResponse {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)
  return new NextResponse(null, { status: 204, headers })
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function verifyCsrfOrigin(req: NextRequest): boolean {
  if (SAFE_METHODS.has(req.method)) return true
  const origin = req.headers.get('origin') || req.headers.get('referer')
  if (!origin) return false
  if (resolveAllowedOrigin(origin)) return true
  try {
    const u = new URL(origin)
    const baseOrigin = `${u.protocol}//${u.host}`
    return resolveAllowedOrigin(baseOrigin) !== null
  } catch {
    return false
  }
}

export function csrfBlocked(req: NextRequest): NextResponse {
  const origin = req.headers.get('origin') || req.headers.get('referer') || '<none>'
  console.warn(`[csrf] blocked origin=${origin} method=${req.method} path=${req.nextUrl.pathname}`)
  return NextResponse.json(
    { success: false, error: 'CSRF check failed', code: 403 },
    { status: 403 },
  )
}
