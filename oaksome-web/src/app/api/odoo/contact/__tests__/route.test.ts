/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../route'

function buildRequest(body: unknown, raw?: string): NextRequest {
  return new NextRequest('http://localhost/api/odoo/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': '10.0.0.1' },
    body: raw ?? JSON.stringify(body),
  })
}

describe('POST /api/odoo/contact', () => {
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

  it('forwards a valid payload to Odoo', async () => {
    const res = await POST(
      buildRequest({ name: 'Jane Doe', email: 'jane@example.com', message: 'Bonjour' }),
    )
    expect(res.status).toBe(200)
    expect(calls).toBe(1)
  })

  it('rejects a non-object body (400, no Odoo call)', async () => {
    const res = await POST(buildRequest('not-an-object'))
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })

  it('rejects an invalid email (400, no Odoo call)', async () => {
    const res = await POST(buildRequest({ name: 'Jane', email: 'not-an-email' }))
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })

  it('rejects an oversized message (400, no Odoo call)', async () => {
    const res = await POST(
      buildRequest({ name: 'Jane', email: 'jane@example.com', message: 'x'.repeat(5001) }),
    )
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })

  it('rejects malformed JSON (400, no Odoo call)', async () => {
    const res = await POST(buildRequest(undefined, '{not json'))
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })
})
