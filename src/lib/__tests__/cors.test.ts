/** @jest-environment node */
import type { NextRequest } from 'next/server'
import { resolveAllowedOrigin, verifyCsrfOrigin } from '../cors'

function makeReq(method: string, headers: Record<string, string> = {}, pathname = '/api/oaksome/v1/auth/login'): NextRequest {
  const h = new Headers(headers)
  return {
    method,
    headers: h,
    nextUrl: { pathname } as URL,
  } as unknown as NextRequest
}

describe('resolveAllowedOrigin', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: ORIGINAL_ENV, configurable: true })
  })

  function setEnv(env: 'development' | 'production' | 'test') {
    Object.defineProperty(process.env, 'NODE_ENV', { value: env, configurable: true })
  }

  describe('production', () => {
    beforeEach(() => setEnv('production'))

    it('accepts canonical prod origins', () => {
      expect(resolveAllowedOrigin('https://vercelsome.com')).toBe('https://vercelsome.com')
      expect(resolveAllowedOrigin('https://www.vercelsome.com')).toBe('https://www.vercelsome.com')
      expect(resolveAllowedOrigin('https://cdn.vercelsome.com')).toBe('https://cdn.vercelsome.com')
    })

    it('rejects localhost in production', () => {
      expect(resolveAllowedOrigin('http://localhost:3000')).toBeNull()
      expect(resolveAllowedOrigin('http://localhost:3001')).toBeNull()
      expect(resolveAllowedOrigin('http://127.0.0.1:3000')).toBeNull()
    })

    it('rejects unknown origins', () => {
      expect(resolveAllowedOrigin('https://evil.test')).toBeNull()
      expect(resolveAllowedOrigin(null)).toBeNull()
    })
  })

  describe('development', () => {
    beforeEach(() => setEnv('development'))

    it('accepts localhost on any port', () => {
      expect(resolveAllowedOrigin('http://localhost:3000')).toBe('http://localhost:3000')
      expect(resolveAllowedOrigin('http://localhost:3001')).toBe('http://localhost:3001')
      expect(resolveAllowedOrigin('http://localhost:5173')).toBe('http://localhost:5173')
      expect(resolveAllowedOrigin('http://127.0.0.1:3001')).toBe('http://127.0.0.1:3001')
    })

    it('still accepts prod origins (so we can hit dev against prod-like setups)', () => {
      expect(resolveAllowedOrigin('https://vercelsome.com')).toBe('https://vercelsome.com')
    })

    it('rejects non-http localhost (https on localhost is unused, treat as suspicious)', () => {
      expect(resolveAllowedOrigin('https://localhost:3001')).toBeNull()
    })

    it('rejects non-localhost origins', () => {
      expect(resolveAllowedOrigin('http://evil.test:3000')).toBeNull()
      expect(resolveAllowedOrigin('http://localhost.evil.test:3000')).toBeNull()
    })

    it('rejects malformed origins', () => {
      expect(resolveAllowedOrigin('not-a-url')).toBeNull()
      expect(resolveAllowedOrigin('')).toBeNull()
    })
  })
})

describe('verifyCsrfOrigin', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: ORIGINAL_ENV, configurable: true })
  })

  it('allows safe methods regardless of origin', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    expect(verifyCsrfOrigin(makeReq('GET'))).toBe(true)
    expect(verifyCsrfOrigin(makeReq('HEAD'))).toBe(true)
    expect(verifyCsrfOrigin(makeReq('OPTIONS'))).toBe(true)
  })

  it('rejects POST with no origin / referer', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    expect(verifyCsrfOrigin(makeReq('POST'))).toBe(false)
  })

  it('accepts POST from any localhost port in dev (via Origin header)', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true })
    expect(verifyCsrfOrigin(makeReq('POST', { origin: 'http://localhost:3001' }))).toBe(true)
    expect(verifyCsrfOrigin(makeReq('POST', { origin: 'http://127.0.0.1:5173' }))).toBe(true)
  })

  it('accepts POST from prod origin via Referer header in prod', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    expect(verifyCsrfOrigin(makeReq('POST', { referer: 'https://vercelsome.com/fr/login' }))).toBe(true)
  })

  it('rejects POST from foreign origin', () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    expect(verifyCsrfOrigin(makeReq('POST', { origin: 'https://evil.test' }))).toBe(false)
  })
})
