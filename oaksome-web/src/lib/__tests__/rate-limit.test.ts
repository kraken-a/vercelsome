/** @jest-environment node */
import type { NextRequest } from 'next/server'
import { clientIp, createRateLimiter } from '../rate-limit'

function makeReq(headers: Record<string, string> = {}): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest
}

const ORIGINAL_TRUSTED_PROXY = process.env.TRUSTED_PROXY

afterEach(() => {
  if (ORIGINAL_TRUSTED_PROXY === undefined) {
    delete process.env.TRUSTED_PROXY
  } else {
    process.env.TRUSTED_PROXY = ORIGINAL_TRUSTED_PROXY
  }
})

describe('clientIp — TRUSTED_PROXY=none (default)', () => {
  beforeEach(() => { delete process.env.TRUSTED_PROXY })

  it('returns unknown when no IP headers present', () => {
    expect(clientIp(makeReq())).toBe('unknown')
  })

  it('uses rightmost non-private XFF entry, not leftmost (spoofable)', () => {
    // Client sends a fake first entry; outermost proxy appends the real IP last.
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1, 5.6.7.8' })
    expect(clientIp(req)).toBe('5.6.7.8')
  })

  it('skips private RFC-1918 entries from the right', () => {
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4, 10.0.0.5' })
    expect(clientIp(req)).toBe('1.2.3.4')
  })

  it('skips loopback entries', () => {
    const req = makeReq({ 'x-forwarded-for': '9.8.7.6, 127.0.0.1' })
    expect(clientIp(req)).toBe('9.8.7.6')
  })

  it('falls back to x-real-ip when XFF is absent', () => {
    const req = makeReq({ 'x-real-ip': '3.4.5.6' })
    expect(clientIp(req)).toBe('3.4.5.6')
  })

  it('does not use leftmost XFF (spoofable by the client)', () => {
    // Attacker sends malicious first entry; real IP appended at end.
    const req = makeReq({ 'x-forwarded-for': '99.99.99.99, 1.1.1.1' })
    // Should return 1.1.1.1 (rightmost public), not 99.99.99.99.
    expect(clientIp(req)).toBe('1.1.1.1')
  })
})

describe('clientIp — TRUSTED_PROXY=nginx', () => {
  beforeEach(() => { process.env.TRUSTED_PROXY = 'nginx' })

  it('uses x-real-ip set by nginx', () => {
    const req = makeReq({ 'x-real-ip': '11.22.33.44', 'x-forwarded-for': '1.2.3.4' })
    expect(clientIp(req)).toBe('11.22.33.44')
  })

  it('falls back to rightmost non-private XFF when x-real-ip absent', () => {
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(clientIp(req)).toBe('5.6.7.8')
  })
})

describe('createRateLimiter', () => {
  it('returns ok on first call within limit', () => {
    const rl = createRateLimiter()
    const result = rl.check('test-key', 5, 60_000)
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('exhausts the limit and returns ok=false', () => {
    const rl = createRateLimiter()
    for (let i = 0; i < 3; i++) rl.check('k', 3, 60_000)
    const result = rl.check('k', 3, 60_000)
    expect(result.ok).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('instances are isolated — separate stores', () => {
    const a = createRateLimiter()
    const b = createRateLimiter()
    a.check('shared-key', 1, 60_000) // exhaust a
    a.check('shared-key', 1, 60_000)
    // b should not be affected
    expect(b.check('shared-key', 1, 60_000).ok).toBe(true)
  })

  it('returns without REDIS_URL — in-memory backend is always available', () => {
    const wasSet = 'REDIS_URL' in process.env
    const saved = process.env.REDIS_URL
    delete process.env.REDIS_URL
    try {
      const rl = createRateLimiter()
      expect(rl.check('k', 10, 60_000).ok).toBe(true)
    } finally {
      if (wasSet) process.env.REDIS_URL = saved
    }
  })
})
