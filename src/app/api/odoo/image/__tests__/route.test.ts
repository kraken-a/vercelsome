/**
 * @jest-environment node
 *
 * Unit tests for the hardened /api/odoo/image proxy (TASK-045).
 * Covers: path canonicalization (traversal / encoded / collapsed slashes),
 * manual redirect rejection, content-type allowlist, oversize rejection,
 * happy-path streaming, and rate limiting.
 *
 * ODOO_URL must be set before the module is loaded (captured at module scope).
 */

process.env.ODOO_URL = 'http://odoo.test'

import { GET } from '../route'
import type { NextRequest } from 'next/server'

const BASE = 'http://localhost:3000/api/odoo/image'

function buildRequest(rawPathQuery: string, ip = '10.0.0.1'): NextRequest {
  const url = `${BASE}?path=${rawPathQuery}`
  return {
    url,
    headers: new Headers({ 'x-forwarded-for': ip }),
  } as unknown as NextRequest
}

function mockFetch(
  status: number,
  contentType: string | null,
  extraHeaders: Record<string, string> = {},
  body: BodyInit | null = 'PNGDATA',
): void {
  const headers = new Headers(extraHeaders)
  if (contentType !== null) headers.set('content-type', contentType)
  global.fetch = (async () =>
    new Response(status >= 200 && status < 300 ? body : null, { status, headers })) as typeof global.fetch
}

describe('/api/odoo/image hardening', () => {
  const originalFetch = global.fetch
  let warnSpy: jest.SpyInstance

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    global.fetch = originalFetch
    warnSpy.mockRestore()
  })

  // Each test uses a distinct IP to avoid the shared in-memory rate-limit bucket.

  describe('path validation → 400', () => {
    it('rejects traversal with ../', async () => {
      const res = await GET(buildRequest(encodeURIComponent('/web/image/../../api/x'), 'ip-trav'))
      expect(res.status).toBe(400)
    })

    it('rejects encoded traversal %2e%2e', async () => {
      // raw query contains %2e%2e which decodes to .. → leftover after decode caught
      const res = await GET(buildRequest('/web/image/%2e%2e/secret', 'ip-enc'))
      expect(res.status).toBe(400)
    })

    it('rejects collapsed slashes //', async () => {
      const res = await GET(buildRequest(encodeURIComponent('/web/image//product.template/1'), 'ip-slash'))
      expect(res.status).toBe(400)
    })

    it('rejects path outside /web/image/ prefix', async () => {
      const res = await GET(buildRequest(encodeURIComponent('/web/session/info'), 'ip-prefix'))
      expect(res.status).toBe(400)
    })

    it('rejects leftover percent after one decode (double-encoding)', async () => {
      // %252e decodes once to %2e, which still contains '%' → rejected
      const res = await GET(buildRequest('/web/image/%252e%252e', 'ip-dbl'))
      expect(res.status).toBe(400)
    })

    it('rejects malformed encoding', async () => {
      const res = await GET(buildRequest('/web/image/%E0%A4%A', 'ip-malformed'))
      expect(res.status).toBe(400)
    })
  })

  it('upstream 302 → 400 generic (no redirect following)', async () => {
    mockFetch(302, 'text/html', { location: 'http://odoo.test/web/login' })
    const res = await GET(
      buildRequest(encodeURIComponent('/web/image/product.template/1/image_1024'), 'ip-302'),
    )
    expect(res.status).toBe(400)
  })

  it('upstream text/html → 403 (content-type allowlist)', async () => {
    mockFetch(200, 'text/html; charset=utf-8')
    const res = await GET(
      buildRequest(encodeURIComponent('/web/image/product.template/1/image_1024'), 'ip-html'),
    )
    expect(res.status).toBe(403)
  })

  it('image/png happy path → 200 with nosniff and streamed body', async () => {
    mockFetch(200, 'image/png', { etag: 'W/"abc"' }, 'PNGBYTES')
    const res = await GET(
      buildRequest(encodeURIComponent('/web/image/product.template/42/image_1024/x.png'), 'ip-png'),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('etag')).toBe('W/"abc"')
    expect(await res.text()).toBe('PNGBYTES')
  })

  it('image/svg+xml → 200 with sandbox CSP and nosniff', async () => {
    mockFetch(200, 'image/svg+xml', {}, '<svg/>')
    const res = await GET(
      buildRequest(encodeURIComponent('/web/image/ir.attachment/9/datas/logo.svg'), 'ip-svg'),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-security-policy')).toBe('sandbox')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('oversize content-length → 400', async () => {
    mockFetch(200, 'image/png', { 'content-length': String(11 * 1024 * 1024) })
    const res = await GET(
      buildRequest(encodeURIComponent('/web/image/product.template/1/image_1024'), 'ip-big'),
    )
    expect(res.status).toBe(400)
  })

  it('rate limit → 429 after threshold', async () => {
    mockFetch(200, 'image/png')
    const ip = 'ip-rate'
    const goodPath = encodeURIComponent('/web/image/product.template/1/image_1024')
    // 300/min limit; the 301st request from the same IP should be throttled.
    let last: Response | undefined
    for (let i = 0; i < 301; i++) {
      last = await GET(buildRequest(goodPath, ip))
    }
    expect(last!.status).toBe(429)
  })
})
