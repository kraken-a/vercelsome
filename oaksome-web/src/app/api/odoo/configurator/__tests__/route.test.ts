/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '../route'

function buildRequest(body: unknown, raw?: string): NextRequest {
  return new NextRequest('http://localhost/api/odoo/configurator', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-real-ip': '10.0.0.3' },
    body: raw ?? JSON.stringify(body),
  })
}

describe('POST /api/odoo/configurator', () => {
  const originalFetch = global.fetch
  let calls: number

  beforeEach(() => {
    calls = 0
    process.env.ODOO_URL = 'http://odoo.local'
    global.fetch = (async () => {
      calls += 1
      return new Response(JSON.stringify({ result: { product_id: 1 } }), {
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
      buildRequest({ template_id: 12, name: 'My config', config_json: { width: 100 } }),
    )
    expect(res.status).toBe(200)
    expect(calls).toBe(1)
  })

  it('rejects a missing name (400, no Odoo call)', async () => {
    const res = await POST(buildRequest({ template_id: 12, config_json: {} }))
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })

  it('rejects a non-positive template_id (400, no Odoo call)', async () => {
    const res = await POST(
      buildRequest({ template_id: 0, name: 'x', config_json: {} }),
    )
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })

  it('rejects an oversized config_json (400, no Odoo call)', async () => {
    const big = { blob: 'x'.repeat(60 * 1024) }
    const res = await POST(
      buildRequest({ template_id: 1, name: 'x', config_json: big }),
    )
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })

  it('rejects a non-object body (400, no Odoo call)', async () => {
    const res = await POST(buildRequest('nope'))
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })

  it('rejects malformed JSON (400, no Odoo call)', async () => {
    const res = await POST(buildRequest(undefined, '{bad'))
    expect(res.status).toBe(400)
    expect(calls).toBe(0)
  })
})
