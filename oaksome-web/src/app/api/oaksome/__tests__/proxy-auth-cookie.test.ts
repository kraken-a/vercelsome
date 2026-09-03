/** @jest-environment node */
/**
 * Regression tests for the proxy route's invite-token minting on login.
 *
 * Mocks:
 *  - global fetch  (Odoo upstream)
 *  - @/lib/rate-limit
 *  - @/lib/cors
 *  - @/lib/auth-invite.mintInviteToken
 *
 * The proxy route reads ODOO_BASE at module load time, so we use
 * jest.isolateModules() per test to ensure env vars are applied fresh.
 */

const SECRET = 'test-secret-that-is-at-least-32-bytes!!'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNextRequest(path: string, method = 'POST', body = '{}') {
  // Use plain Request because NextRequest works in node env too.
  const { NextRequest } = jest.requireActual('next/server') as typeof import('next/server')
  const hasBody = method !== 'GET' && method !== 'HEAD'
  return new NextRequest(`http://localhost/api/oaksome/${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
    },
    ...(hasBody ? { body } : {}),
  })
}

function mockFetchResponse(status: number, body = '{"success":true}', setCookie?: string) {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (setCookie) headers.set('set-cookie', setCookie)
  const response = new Response(body, { status, headers })
  // Polyfill getSetCookie for envs that don't support it yet.
  if (typeof (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie !== 'function') {
    ;(response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie = () =>
      setCookie ? [setCookie] : []
  }
  global.fetch = jest.fn().mockResolvedValue(response)
}

// ---------------------------------------------------------------------------
// Shared setup per test — isolated module registry so env vars take effect
// ---------------------------------------------------------------------------

async function loadIsolated(mintImpl: () => Promise<string>) {
  let routeModule: typeof import('../[...path]/route')
  let mintMock: jest.Mock

  await jest.isolateModulesAsync(async () => {
    jest.mock('@/lib/rate-limit', () => ({
      checkSensitiveProxyPath: jest.fn().mockReturnValue({ ok: true }),
      tooManyRequests: jest.fn(),
    }))

    jest.mock('@/lib/cors', () => ({
      withCors: jest.fn((_req: unknown, res: unknown) => res),
      preflight: jest.fn(),
      verifyCsrfOrigin: jest.fn().mockReturnValue(true),
      csrfBlocked: jest.fn(),
    }))

    mintMock = jest.fn(mintImpl)
    jest.mock('@/lib/auth-invite', () => ({
      mintInviteToken: mintMock,
    }))

    routeModule = await import('../[...path]/route')
  })

  return { route: routeModule!, mintMock: mintMock! }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('proxy route — invite token minting on login', () => {
  beforeEach(() => {
    process.env.ODOO_URL = 'http://odoo.test'
    process.env.INVITE_TOKEN_SECRET = SECRET
  })

  afterEach(() => {
    delete process.env.INVITE_TOKEN_SECRET
    delete process.env.ODOO_URL
    jest.clearAllMocks()
  })

  it('mints oaksome_invite_token when path is v1/auth/login and upstream returns 200', async () => {
    process.env.INVITE_TOKEN_SECRET = SECRET
    process.env.ODOO_URL = 'http://odoo.test'

    mockFetchResponse(200, '{"success":true}')
    const { route, mintMock } = await loadIsolated(() => Promise.resolve('minted-invite-token'))

    const req = makeNextRequest('v1/auth/login')
    const res = await route.POST(req, { params: Promise.resolve({ path: ['v1', 'auth', 'login'] }) })

    expect(mintMock).toHaveBeenCalledWith(SECRET)
    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).toContain('oaksome_invite_token=minted-invite-token')
  })

  it('does NOT mint token when upstream returns 401', async () => {
    mockFetchResponse(401, '{"success":false}')
    const { route, mintMock } = await loadIsolated(() => Promise.resolve('should-not-be-called'))

    const req = makeNextRequest('v1/auth/login')
    const res = await route.POST(req, { params: Promise.resolve({ path: ['v1', 'auth', 'login'] }) })

    expect(mintMock).not.toHaveBeenCalled()
    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).not.toContain('oaksome_invite_token')
  })

  it('does NOT mint token when INVITE_TOKEN_SECRET is unset', async () => {
    delete process.env.INVITE_TOKEN_SECRET

    mockFetchResponse(200, '{"success":true}')
    const { route, mintMock } = await loadIsolated(() => Promise.resolve('should-not-be-called'))

    const req = makeNextRequest('v1/auth/login')
    const res = await route.POST(req, { params: Promise.resolve({ path: ['v1', 'auth', 'login'] }) })

    expect(mintMock).not.toHaveBeenCalled()
    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).not.toContain('oaksome_invite_token')
  })

  it('does NOT mint token for non-login paths even on 200', async () => {
    mockFetchResponse(200, '{"success":true}')
    const { route, mintMock } = await loadIsolated(() => Promise.resolve('should-not-be-called'))

    const req = makeNextRequest('v1/products', 'GET')
    const res = await route.GET(req, { params: Promise.resolve({ path: ['v1', 'products'] }) })

    expect(mintMock).not.toHaveBeenCalled()
    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).not.toContain('oaksome_invite_token')
  })
})

// ---------------------------------------------------------------------------
// Cookie allowlist (TASK-051, M3) — only allowlisted cookies reach Odoo
// ---------------------------------------------------------------------------

function makeRequestWithCookies(path: string, cookieHeader: string, method = 'GET') {
  const { NextRequest } = jest.requireActual('next/server') as typeof import('next/server')
  return new NextRequest(`http://localhost/api/oaksome/${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost',
      cookie: cookieHeader,
    },
  })
}

/** Mocks fetch and returns a getter for the Cookie header sent upstream. */
function mockFetchCapture(): () => string {
  const headers = new Headers({ 'content-type': 'application/json' })
  const response = new Response('{"success":true}', { status: 200, headers })
  if (typeof (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie !== 'function') {
    ;(response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie = () => []
  }
  const fetchMock = jest.fn().mockResolvedValue(response)
  global.fetch = fetchMock as unknown as typeof fetch
  return () => {
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    return new Headers(init?.headers as HeadersInit).get('cookie') ?? ''
  }
}

describe('proxy route — upstream cookie allowlist', () => {
  beforeEach(() => {
    process.env.ODOO_URL = 'http://odoo.test'
  })

  afterEach(() => {
    delete process.env.ODOO_URL
    jest.clearAllMocks()
  })

  it('forwards only allowlisted cookies; drops analytics and unknown cookies', async () => {
    const getCookie = mockFetchCapture()
    const { route } = await loadIsolated(() => Promise.resolve('unused'))

    const req = makeRequestWithCookies('v1/products', 'session_id=a; _ga=x; evil=y')
    await route.GET(req, { params: Promise.resolve({ path: ['v1', 'products'] }) })

    const upstream = getCookie()
    expect(upstream).toContain('session_id=a')
    expect(upstream).not.toContain('_ga')
    expect(upstream).not.toContain('evil')
    expect(upstream).not.toContain('frontend_lang')
  })

  it('renames odoo_sid to session_id and drops unknown cookies', async () => {
    const getCookie = mockFetchCapture()
    const { route } = await loadIsolated(() => Promise.resolve('unused'))

    const req = makeRequestWithCookies('v1/products', 'odoo_sid=z; frontend_lang=fr; _ga=x')
    await route.GET(req, { params: Promise.resolve({ path: ['v1', 'products'] }) })

    const upstream = getCookie()
    expect(upstream).toContain('session_id=z')
    expect(upstream).not.toContain('odoo_sid')
    expect(upstream).not.toContain('frontend_lang')
    expect(upstream).not.toContain('_ga')
  })

  it('sends no Cookie header when only non-allowlisted cookies are present', async () => {
    const getCookie = mockFetchCapture()
    const { route } = await loadIsolated(() => Promise.resolve('unused'))

    const req = makeRequestWithCookies('v1/products', '_ga=x; evil=y')
    await route.GET(req, { params: Promise.resolve({ path: ['v1', 'products'] }) })

    expect(getCookie()).toBe('')
  })
})
