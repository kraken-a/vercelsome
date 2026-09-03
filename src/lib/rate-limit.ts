import { NextRequest, NextResponse } from 'next/server'

type Bucket = { count: number; reset: number }

// Single-instance constraint: this store is process-local. State is not shared
// across multiple container replicas. If horizontal scaling is introduced,
// replace the in-memory backend with a shared store (Redis via ioredis or
// Upstash REST) by injecting a RateLimitBackend via createRateLimiter() below.
// The public checkRateLimit() API surface stays unchanged.
const store = new Map<string, Bucket>()
const SWEEP_INTERVAL_MS = 5 * 60_000
let lastSweep = Date.now()

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [k, b] of store) {
    if (b.reset <= now) store.delete(k)
  }
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  )
}

// TRUSTED_PROXY controls which header carries the real client IP.
// Set TRUSTED_PROXY=nginx when Nginx sits in front and sets x-real-ip.
// Default 'none': no trusted proxy, so use rightmost non-private XFF entry
// (the last hop added by external infrastructure, not the client itself).
export function clientIp(req: NextRequest): string {
  const mode = (process.env.TRUSTED_PROXY ?? 'none').toLowerCase()

  if (mode === 'nginx') {
    // nginx sets x-real-ip to the real client address before forwarding.
    const real = req.headers.get('x-real-ip')
    if (real) return real.trim()
  }

  // Rightmost non-private XFF entry was written by the outermost proxy, not the client.
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) {
    const entries = fwd.split(',').map(s => s.trim()).reverse()
    for (const ip of entries) {
      if (ip && !isPrivateIp(ip)) return ip
    }
  }

  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()

  return 'unknown'
}

export type RateLimitResult = {
  ok: boolean
  remaining: number
  reset: number
  retryAfter: number
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  sweep(now)
  const bucket = store.get(key)
  if (!bucket || bucket.reset <= now) {
    const reset = now + windowMs
    store.set(key, { count: 1, reset })
    return { ok: true, remaining: limit - 1, reset, retryAfter: 0 }
  }
  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      reset: bucket.reset,
      retryAfter: Math.max(1, Math.ceil((bucket.reset - now) / 1000)),
    }
  }
  bucket.count += 1
  return {
    ok: true,
    remaining: limit - bucket.count,
    reset: bucket.reset,
    retryAfter: 0,
  }
}

export function tooManyRequests(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { success: false, error: 'Too many requests. Please try again later.', code: 429 },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
      },
    },
  )
}

export const RL_AUTH = { limit: 10, windowMs: 60_000 }
export const RL_LEADS = { limit: 5, windowMs: 60_000 }
export const RL_CONFIG = { limit: 30, windowMs: 60_000 }
export const RL_NEWSLETTER = { limit: 5, windowMs: 60_000 }
export const RL_CONTACT = { limit: 5, windowMs: 60_000 }

const SENSITIVE_PATH_RULES: Array<{ match: RegExp; rule: { limit: number; windowMs: number }; label: string }> = [
  { match: /^v1\/auth\/(login|register|password-reset|password-reset-confirm)$/, rule: RL_AUTH, label: 'auth' },
  { match: /^v1\/leads$/, rule: RL_LEADS, label: 'leads' },
  { match: /^v1\/samples$/, rule: RL_LEADS, label: 'samples' },
  { match: /^v1\/contact$/, rule: RL_CONTACT, label: 'contact' },
  { match: /^v1\/newsletter/, rule: RL_NEWSLETTER, label: 'newsletter' },
]

export function checkSensitiveProxyPath(
  req: NextRequest,
  path: string,
): RateLimitResult | null {
  if (req.method === 'GET' || req.method === 'HEAD') return null
  for (const r of SENSITIVE_PATH_RULES) {
    if (r.match.test(path)) {
      const ip = clientIp(req)
      const key = `${r.label}:${ip}`
      return checkRateLimit(key, r.rule.limit, r.rule.windowMs)
    }
  }
  return null
}

export type RateLimiter = {
  check(key: string, limit: number, windowMs: number): RateLimitResult
}

// Factory for an isolated in-memory rate limiter instance.
// Useful for tests and for future Redis injection: swap the in-memory
// store for a shared backend without changing the call sites.
export function createRateLimiter(): RateLimiter {
  const s = new Map<string, Bucket>()
  let lastS = Date.now()

  function sw(now: number) {
    if (now - lastS < SWEEP_INTERVAL_MS) return
    lastS = now
    for (const [k, b] of s) if (b.reset <= now) s.delete(k)
  }

  return {
    check(key: string, limit: number, windowMs: number): RateLimitResult {
      const now = Date.now()
      sw(now)
      const bucket = s.get(key)
      if (!bucket || bucket.reset <= now) {
        const reset = now + windowMs
        s.set(key, { count: 1, reset })
        return { ok: true, remaining: limit - 1, reset, retryAfter: 0 }
      }
      if (bucket.count >= limit) {
        return {
          ok: false,
          remaining: 0,
          reset: bucket.reset,
          retryAfter: Math.max(1, Math.ceil((bucket.reset - now) / 1000)),
        }
      }
      bucket.count += 1
      return { ok: true, remaining: limit - bucket.count, reset: bucket.reset, retryAfter: 0 }
    },
  }
}
