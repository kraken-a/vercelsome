import { NextRequest } from 'next/server'
import { checkRateLimit, clientIp, tooManyRequests } from '@/lib/rate-limit'

const ODOO_URL = process.env.ODOO_URL || process.env.NEXT_PUBLIC_ODOO_URL || ''

// Generous read limit: product images are public assets; this only throttles abuse.
const RL_IMAGE = { limit: 300, windowMs: 60_000 }

// Canonical Odoo image paths only: /web/image/<model>/<id>/<field>[/<filename>].
// Allowed chars after the prefix: alphanumerics, dot, underscore, dash, slash, equals.
// No '%', '..', or '//' — those are rejected explicitly below.
const IMAGE_PATH_RE = /^\/web\/image\/[A-Za-z0-9._\-\/=]+$/

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
])

function badRequest(): Response {
  return new Response('Bad Request', { status: 400 })
}

export async function GET(req: NextRequest): Promise<Response> {
  const rl = checkRateLimit(`image:${clientIp(req)}`, RL_IMAGE.limit, RL_IMAGE.windowMs)
  if (!rl.ok) return tooManyRequests(rl)

  const raw = new URL(req.url).searchParams.get('path') ?? ''

  // Decode exactly once; reject malformed encoding.
  let path: string
  try {
    path = decodeURIComponent(raw)
  } catch {
    console.warn('[image-proxy] rejected: malformed encoding')
    return badRequest()
  }

  // Reject any leftover percent (signals double-encoding / smuggling),
  // traversal, and collapsed slashes before the pattern check.
  if (
    path.includes('%') ||
    path.includes('..') ||
    path.includes('//') ||
    !IMAGE_PATH_RE.test(path)
  ) {
    console.warn('[image-proxy] rejected non-canonical path pattern')
    return badRequest()
  }

  if (!ODOO_URL) {
    return new Response('Odoo URL not configured', { status: 502 })
  }

  try {
    // Follow redirects automatically — Odoo appends the product name as a
    // cosmetic filename suffix (e.g. /image_1920/Pont%20de%20lit%20Satori)
    // which would fail the strict path regex if we tried to validate it.
    // The content-type allowlist below is the security gate: text/html (login
    // redirect) and any non-image type are rejected before the body is forwarded.
    const upstream = await fetch(`${ODOO_URL}${encodeURI(path)}`, { redirect: 'follow' })

    if (!upstream.ok) return new Response(null, { status: upstream.status })

    const contentType = (upstream.headers.get('content-type') || '')
      .split(';')[0]!
      .trim()
      .toLowerCase()
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      console.warn('[image-proxy] rejected non-image content-type:', contentType)
      return new Response('Forbidden', { status: 403 })
    }

    const lengthHeader = upstream.headers.get('content-length')
    if (lengthHeader) {
      const len = Number(lengthHeader)
      if (Number.isFinite(len) && len > MAX_BYTES) {
        console.warn('[image-proxy] rejected oversize response')
        return badRequest()
      }
    }

    const etag = upstream.headers.get('etag')
    const lastModified = upstream.headers.get('last-modified')
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=600, stale-if-error=86400',
    }
    // SVG can carry active content; sandbox it so it cannot execute scripts.
    if (contentType === 'image/svg+xml') {
      responseHeaders['Content-Security-Policy'] = 'sandbox'
    }
    if (etag) responseHeaders['ETag'] = etag
    if (lastModified) responseHeaders['Last-Modified'] = lastModified
    return new Response(upstream.body, { headers: responseHeaders })
  } catch {
    return new Response('Upstream error', { status: 502 })
  }
}
