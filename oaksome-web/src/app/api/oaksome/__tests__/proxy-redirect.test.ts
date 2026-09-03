/**
 * @jest-environment node
 *
 * Unit tests for the proxy 3xx handler in [...path]/route.ts.
 * Verifies that only auth-related redirects are mapped to 401,
 * while non-auth redirects are forwarded as-is.
 *
 * ODOO_URL must be set before the module is loaded (it's captured at module scope).
 */

// Set env before any import so ODOO_BASE is non-empty when the module initialises.
process.env.ODOO_URL = 'http://odoo.test'

import { GET } from '../[...path]/route'
import type { NextRequest } from 'next/server'

// Build a minimal NextRequest-shaped object.
// The proxy uses: req.method, req.headers, req.nextUrl.search, req.nextUrl.pathname
function buildRequest(
  method = 'GET',
  headers: Record<string, string> = {},
): NextRequest {
  return {
    method,
    headers: new Headers({
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      ...headers,
    }),
    nextUrl: { search: '', pathname: '/api/oaksome/v1/products' } as URL,
  } as unknown as NextRequest
}

// Params shape expected by the route handler.
function buildParams(segments: string[]): { params: Promise<{ path: string[] }> } {
  return { params: Promise.resolve({ path: segments }) }
}

describe('proxy 3xx redirect handling', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  function mockOdooResponse(status: number, locationHeader?: string): void {
    const headers = new Headers({ 'content-type': 'text/html' })
    if (locationHeader !== undefined) {
      headers.set('location', locationHeader)
    }
    global.fetch = (async () =>
      new Response(null, { status, headers })) as typeof global.fetch
  }

  it('302 to /web/login → returns 401 JSON with session-expired message', async () => {
    mockOdooResponse(302, 'http://odoo.test/web/login')
    const res = await GET(buildRequest(), buildParams(['v1', 'products']))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe(401)
    expect(json.error).toMatch(/session/i)
  })

  it('302 to /web/session → returns 401 JSON with session-expired message', async () => {
    mockOdooResponse(302, 'http://odoo.test/web/session/expire')
    const res = await GET(buildRequest(), buildParams(['v1', 'products']))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.code).toBe(401)
  })

  it('301 to a non-auth location → forwards 301 with Location header', async () => {
    mockOdooResponse(301, '/some/moved/endpoint')
    const res = await GET(buildRequest(), buildParams(['v1', 'products']))
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('/some/moved/endpoint')
    // Body should be empty — no JSON error body
    const body = await res.text()
    expect(body).toBe('')
  })

  it('302 with no Location header → forwards 302 without crashing', async () => {
    mockOdooResponse(302)
    const res = await GET(buildRequest(), buildParams(['v1', 'products']))
    expect(res.status).toBe(302)
    // No crash is the key assertion; location may be empty string or absent
  })
})
