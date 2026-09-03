/**
 * @jest-environment node
 */
import { POST } from '../route'

type FetchCall = {
  url: string
  body: Record<string, unknown>
}

function buildRequest(body: unknown): Request {
  return new Request('http://localhost/api/tracking/capi', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/tracking/capi', () => {
  const originalFetch = global.fetch
  const calls: FetchCall[] = []

  beforeEach(() => {
    calls.length = 0
    process.env.META_CAPI_ACCESS_TOKEN = 'test-token'
    process.env.META_CAPI_PIXEL_ID = '1234567890'
    global.fetch = (async (url: string | URL, init?: RequestInit) => {
      calls.push({
        url: typeof url === 'string' ? url : url.toString(),
        body: init?.body ? JSON.parse(init.body as string) : {},
      })
      return new Response(JSON.stringify({ events_received: 1, fbtrace_id: 'tr_abc' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns 400 on invalid payload (missing event_name)', async () => {
    const res = await POST(buildRequest({ event_id: 'uuid-1' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(calls.length).toBe(0)
  })

  it('returns 400 on unknown event_name', async () => {
    const res = await POST(
      buildRequest({ event_name: 'click_button', event_id: 'uuid-1', consent: true }),
    )
    expect(res.status).toBe(400)
    expect(calls.length).toBe(0)
  })

  it('short-circuits when consent is false (no forward, 200)', async () => {
    const res = await POST(
      buildRequest({ event_name: 'purchase', event_id: 'uuid-1', consent: false }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.forwarded).toBe(false)
    expect(calls.length).toBe(0)
  })

  it('short-circuits when consent is omitted', async () => {
    const res = await POST(
      buildRequest({ event_name: 'purchase', event_id: 'uuid-1' }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.forwarded).toBe(false)
    expect(calls.length).toBe(0)
  })

  it('forwards to Meta with hashed email when consent=true', async () => {
    const res = await POST(
      buildRequest({
        event_name: 'purchase',
        event_id: 'uuid-1',
        value: 1500,
        currency: 'EUR',
        email: 'User@Example.COM',
        consent: true,
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.forwarded).toBe(true)

    expect(calls.length).toBe(1)
    expect(calls[0].url).toContain('graph.facebook.com/v19.0/1234567890/events')
    expect(calls[0].url).toContain('access_token=test-token')

    const event = (calls[0].body as { data: Array<Record<string, unknown>> }).data[0]
    expect(event.event_name).toBe('purchase')
    expect(event.event_id).toBe('uuid-1')
    expect(event.action_source).toBe('website')

    const userData = event.user_data as { em?: string[] }
    expect(Array.isArray(userData.em)).toBe(true)
    expect(userData.em && userData.em[0]).toMatch(/^[a-f0-9]{64}$/)

    const flat = JSON.stringify(calls[0].body)
    expect(flat).not.toContain('User@Example.COM')
    expect(flat).not.toContain('user@example.com')
  })

  it('forwards without email when email is absent', async () => {
    const res = await POST(
      buildRequest({
        event_name: 'generate_lead',
        event_id: 'uuid-2',
        consent: true,
      }),
    )
    expect(res.status).toBe(200)
    expect(calls.length).toBe(1)
    const event = (calls[0].body as { data: Array<Record<string, unknown>> }).data[0]
    const userData = event.user_data as { em?: string[] }
    expect(userData.em).toBeUndefined()
  })

  it('does not block when Meta returns 5xx', async () => {
    global.fetch = (async () =>
      new Response(JSON.stringify({ error: { code: 1 } }), { status: 500 })) as typeof global.fetch
    const res = await POST(
      buildRequest({
        event_name: 'begin_checkout',
        event_id: 'uuid-3',
        consent: true,
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.forwarded).toBe(false)
  })

  it('does not block when Meta call throws', async () => {
    global.fetch = (async () => {
      throw new Error('network down')
    }) as typeof global.fetch
    const res = await POST(
      buildRequest({
        event_name: 'purchase',
        event_id: 'uuid-4',
        consent: true,
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.forwarded).toBe(false)
  })

  it('returns 200 + forwarded=false when META env vars are missing', async () => {
    delete process.env.META_CAPI_ACCESS_TOKEN
    delete process.env.META_CAPI_PIXEL_ID
    const res = await POST(
      buildRequest({
        event_name: 'purchase',
        event_id: 'uuid-5',
        consent: true,
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.forwarded).toBe(false)
    expect(calls.length).toBe(0)
  })
})
