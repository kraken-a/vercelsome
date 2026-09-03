/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../route'

function buildRequest(body: unknown, raw?: string): NextRequest {
  return new NextRequest('http://localhost/api/odoo/newsletter', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': '10.0.0.2' },
    body: raw ?? JSON.stringify(body),
  })
}

describe('POST /api/odoo/newsletter', () => {
  const originalFetch = global.fetch
  let calls: number

  beforeEach(() => {
    calls = 0
    process.env.ODOO_URL = 'http://odoo.local'
    global.fetch = (async () => {
      calls += 1
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('forwards a valid email to Odoo', async () => {
    const res = await POST(buildRequest({ email: 'sub@example.com' }))
    expect(res.status).toBe(200)
    expect(calls).toBe(1)
  })

  it('rejects an invalid email (400, no Odoo call)', async () => {
    const res = await POST(buildRequest({ email: 'nope' }))
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })

  it('rejects a non-object body (400, no Odoo call)', async () => {
    const res = await POST(buildRequest(42))
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })

  it('rejects malformed JSON (400, no Odoo call)', async () => {
    const res = await POST(buildRequest(undefined, 'not-json'))
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })
})
