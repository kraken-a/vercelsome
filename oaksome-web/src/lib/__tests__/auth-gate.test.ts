/** @jest-environment node */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isPublicPath, PUBLIC_PATTERNS } from '../auth-gate'

describe('isPublicPath', () => {
  describe('auth-flow routes (public)', () => {
    it.each([
      '/landing',
      '/login',
      '/password-recover',
      '/password-reset',
      '/configurer',
      '/register',
    ])('returns true for %s', (path) => {
      expect(isPublicPath(path)).toBe(true)
    })

    it('returns true for sub-paths of auth-flow routes (e.g. /login/foo)', () => {
      expect(isPublicPath('/login/anything')).toBe(true)
      expect(isPublicPath('/password-reset/abc')).toBe(true)
    })
  })

  describe('previously-public routes now protected', () => {
    it.each([
      '/cgv',
      '/cookies',
      '/mentions-legales',
      '/accessibilite',
      '/garantie',
      '/livraison',
      '/return',
      '/tva-6',
      '/prise-mesures',
      '/opmeten',
      '/config',
      '/config/abc123',
    ])('returns false for %s', (path) => {
      expect(isPublicPath(path)).toBe(false)
    })
  })

  describe('protected routes', () => {
    it.each([
      '/',
      '/acheter',
      '/produit/42',
      '/kopen',
      '/configureren',
      '/profile',
      '/commandes',
      '/commandes/9/rendez-vous',
      '/wishlist',
      '/panier',
      '/checkout',
      '/inspirations',
      '/contact',
      '/pro',
      '/a-propos',
      '/comment-ca-marche',
      '/faq',
    ])('returns false for %s', (path) => {
      expect(isPublicPath(path)).toBe(false)
    })
  })

  describe('prefix-abuse guards', () => {
    it.each([
      '/landingx',
      '/loginx',
      '/password-recoverx',
      '/password-resetx',
    ])('returns false for %s (no prefix abuse)', (path) => {
      expect(isPublicPath(path)).toBe(false)
    })
  })

  describe('input safety', () => {
    it('returns false for empty string', () => {
      expect(isPublicPath('')).toBe(false)
    })

    it('returns false for non-string input', () => {
      expect(isPublicPath(undefined as unknown as string)).toBe(false)
      expect(isPublicPath(null as unknown as string)).toBe(false)
      expect(isPublicPath(42 as unknown as string)).toBe(false)
    })
  })

  describe('allowlist invariants', () => {
    it('every pattern starts with "/" and has no trailing slash', () => {
      for (const pattern of PUBLIC_PATTERNS) {
        expect(pattern.startsWith('/')).toBe(true)
        expect(pattern.endsWith('/')).toBe(false)
      }
    })

    it('contains no duplicates', () => {
      expect(new Set(PUBLIC_PATTERNS).size).toBe(PUBLIC_PATTERNS.length)
    })

    it('contains only the 6 expected entries', () => {
      expect(PUBLIC_PATTERNS).toEqual([
        '/landing',
        '/login',
        '/password-recover',
        '/password-reset',
        '/configurer',
        '/register',
      ])
    })
  })
})

// ---------------------------------------------------------------------------
// FIX-AUTH-005 / TASK-055: client-set `oaksome_auth` indicator retired.
// UI auth state derives from AuthContext.getProfile(), not a JS-readable cookie.
// These guards fail if any former writer reintroduces the forgeable indicator.
// ---------------------------------------------------------------------------
describe('oaksome_auth indicator retirement', () => {
  const SRC = join(__dirname, '..', '..')
  const FORMER_WRITERS = [
    'app/[locale]/(auth)/login/_client.tsx',
    'app/[locale]/(auth)/login/_components/rich-login-form.tsx',
    'app/[locale]/(account)/layout.tsx',
  ]

  it.each(FORMER_WRITERS)('no document.cookie oaksome_auth write remains in %s', (rel) => {
    const contents = readFileSync(join(SRC, rel), 'utf8')
    expect(contents).not.toMatch(/oaksome_auth/)
  })
})

// ---------------------------------------------------------------------------
// Middleware cookie/redirect behaviour
// ---------------------------------------------------------------------------
// These tests exercise the auth-gate middleware logic directly.
// We mock:
//   - next-intl/middleware (returns a passthrough response so we don't need i18n routing)
//   - ../auth-invite.verifyInviteToken  (to control valid/invalid without real HMAC)
//
// Next.js Request/Response classes work in Node via the built-in `undici`
// global that Next.js registers at test time.  We fall back to the plain
// WHATWG Request/Response when NextRequest is not available so the tests
// remain runnable in jest's node env without a full Next.js bootstrap.
// ---------------------------------------------------------------------------

jest.mock('next-intl/middleware', () => ({
  __esModule: true,
  default: () => () => new Response('ok', { status: 200 }),
}))

// next-intl/routing is ESM — mock the wrapper that middleware imports.
jest.mock('../../i18n/routing', () => ({
  __esModule: true,
  routing: {
    locales: ['fr', 'nl'],
    defaultLocale: 'fr',
  },
}))

jest.mock('../auth-invite', () => ({
  __esModule: true,
  verifyInviteToken: jest.fn(),
}))

// Dynamic import so the mocks above are in place before the module is loaded.
async function importMiddleware() {
  return (await import('../../middleware')).default
}

// Helpers to build a minimal NextRequest-compatible object.
function makeRequest(pathname: string, cookieValue?: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextRequest } = require('next/server') as typeof import('next/server')
  const url = `http://localhost${pathname}`
  const headers: Record<string, string> = { origin: 'http://localhost' }
  if (cookieValue !== undefined) {
    headers['cookie'] = `oaksome_invite_token=${cookieValue}`
  }
  return new NextRequest(url, { method: 'GET', headers })
}

// Import auth-invite mock once at module scope so it's available for all tests.
// We use require() here so TypeScript doesn't complain about the mock type.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const authInviteMock = require('../auth-invite') as { verifyInviteToken: jest.Mock }

// Import middleware once — mocks are already in place from jest.mock() calls above.
let middlewareFn: Awaited<ReturnType<typeof importMiddleware>>
beforeAll(async () => {
  middlewareFn = await importMiddleware()
})

describe('middleware auth-gate behaviour', () => {
  const SECRET = 'test-secret-that-is-at-least-32-bytes!!'

  beforeEach(() => {
    process.env.INVITE_TOKEN_SECRET = SECRET
  })

  afterEach(() => {
    delete process.env.INVITE_TOKEN_SECRET
    jest.clearAllMocks()
  })

  it('redirects to /landing with ?next= when no token is present on a protected route', async () => {
    authInviteMock.verifyInviteToken.mockResolvedValue(false)

    const req = makeRequest('/fr/acheter')
    const res = await middlewareFn(req as never)

    expect(res.status).toBe(307)
    const location = res.headers.get('location') || ''
    expect(location).toContain('/landing')
    expect(location).toContain('next=')
  })

  it('clears the cookie (maxAge=0) when an invalid token is present', async () => {
    authInviteMock.verifyInviteToken.mockResolvedValue(false)

    const req = makeRequest('/fr/acheter', 'bad-token-value')
    const res = await middlewareFn(req as never)

    expect(res.status).toBe(307)
    // The Set-Cookie header should clear the cookie by setting Max-Age=0.
    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).toMatch(/oaksome_invite_token=/)
    expect(setCookie).toMatch(/[Mm]ax-[Aa]ge=0/)
  })

  it('passes through when a valid token is present', async () => {
    authInviteMock.verifyInviteToken.mockResolvedValue(true)

    const req = makeRequest('/fr/acheter', 'valid-token')
    const res = await middlewareFn(req as never)

    // next-intl passthrough mock returns 200
    expect(res.status).toBe(200)
  })

  // --- Structured rejection log (TASK-050 / FIX-AUTH-005) ----------------

  it('emits a structured warn (token NOT logged) when an invalid/expired token is present', async () => {
    authInviteMock.verifyInviteToken.mockResolvedValue(false)
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const secretToken = 'expired-or-tampered-token-value'
    const req = makeRequest('/fr/acheter', secretToken)
    const res = await middlewareFn(req as never)

    expect(res.status).toBe(307)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    const [fmt, ...args] = warnSpy.mock.calls[0]
    // Structured: format string carries the path, not the secret token.
    expect(String(fmt)).toContain('invalid_token')
    expect(String(fmt)).toContain('path=')
    // The raw token value must never be passed to the logger.
    expect(JSON.stringify([fmt, ...args])).not.toContain(secretToken)
    warnSpy.mockRestore()
  })

  it('does not warn when no token cookie is present (no signal to log)', async () => {
    authInviteMock.verifyInviteToken.mockResolvedValue(false)
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    const req = makeRequest('/fr/acheter')
    await middlewareFn(req as never)

    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
