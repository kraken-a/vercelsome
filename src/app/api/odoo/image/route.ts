export const dynamic = 'force-dynamic'

const ODOO_URL = process.env.ODOO_URL || process.env.NEXT_PUBLIC_ODOO_URL || ''

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path') ?? ''

  if (!path.startsWith('/web/image/')) {
    return new Response('Bad Request', { status: 400 })
  }

  if (!ODOO_URL) {
    return new Response('Odoo URL not configured', { status: 502 })
  }

  try {
    const upstream = await fetch(`${ODOO_URL}${path}`, { redirect: 'follow' })
    if (!upstream.ok) return new Response(null, { status: upstream.status })
    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const etag = upstream.headers.get('etag')
    const lastModified = upstream.headers.get('last-modified')
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      // 7-day TTL: product images change rarely; Cloudflare edge will serve
      // from cache without hitting the origin on repeated requests.
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
    }
    if (etag) responseHeaders['ETag'] = etag
    if (lastModified) responseHeaders['Last-Modified'] = lastModified
    return new Response(upstream.body, { headers: responseHeaders })
  } catch {
    return new Response('Upstream error', { status: 502 })
  }
}
