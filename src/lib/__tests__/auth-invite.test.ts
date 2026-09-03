/** @jest-environment node */

import { mintInviteToken, verifyInviteToken, isWeakSecret, assertInviteSecret } from '../auth-invite'

const SECRET = 'test-secret-that-is-at-least-32-bytes!!'

describe('mintInviteToken / verifyInviteToken', () => {
  it('mints a token with two base64url parts separated by a dot', async () => {
    const token = await mintInviteToken(SECRET)
    const parts = token.split('.')
    expect(parts).toHaveLength(2)
    expect(parts[0].length).toBeGreaterThan(0)
    expect(parts[1].length).toBeGreaterThan(0)
  })

  it('round-trips: a freshly minted token verifies', async () => {
    const token = await mintInviteToken(SECRET)
    const ok = await verifyInviteToken(token, SECRET)
    expect(ok).toBe(true)
  })

  it('rejects a tampered payload', async () => {
    const token = await mintInviteToken(SECRET)
    const [, sig] = token.split('.')
    const fakePayload = Buffer.from('9999999999|9999999999|deadbeef').toString('base64url')
    const tampered = `${fakePayload}.${sig}`
    const ok = await verifyInviteToken(tampered, SECRET)
    expect(ok).toBe(false)
  })

  it('rejects a tampered signature', async () => {
    const token = await mintInviteToken(SECRET)
    const [payload] = token.split('.')
    const tampered = `${payload}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`
    const ok = await verifyInviteToken(tampered, SECRET)
    expect(ok).toBe(false)
  })

  it('rejects an expired token', async () => {
    const nowSec = Math.floor(Date.now() / 1000)
    const iat = nowSec - 60 * 60 * 24 * 31
    const exp = nowSec - 1
    const nonce = 'deadbeef'
    const payloadStr = `${iat}|${exp}|${nonce}`
    const payloadB64 = Buffer.from(payloadStr).toString('base64url')

    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(SECRET),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const sigBuf = await crypto.subtle.sign('HMAC', keyMaterial, enc.encode(payloadStr))
    const sigB64 = Buffer.from(sigBuf).toString('base64url')

    const expiredToken = `${payloadB64}.${sigB64}`
    const ok = await verifyInviteToken(expiredToken, SECRET)
    expect(ok).toBe(false)
  })

  it('rejects a malformed token (no dot separator)', async () => {
    const ok = await verifyInviteToken('nodothere', SECRET)
    expect(ok).toBe(false)
  })

  it('rejects an empty string', async () => {
    const ok = await verifyInviteToken('', SECRET)
    expect(ok).toBe(false)
  })

  it('rejects a valid token verified with a wrong secret', async () => {
    const token = await mintInviteToken(SECRET)
    const ok = await verifyInviteToken(token, 'wrong-secret-that-is-at-least-32-bytes!!')
    expect(ok).toBe(false)
  })
})

describe('invite secret entropy guard (L7)', () => {
  const STRONG = 'jH8x2pQwTzR4vL9mN6kB1cD7eF0gA3sUuYiOoP5lZ' // 41 chars

  describe('isWeakSecret', () => {
    it('flags an undefined secret', () => {
      expect(isWeakSecret(undefined)).toBe(true)
    })
    it('flags a short secret (< 32 chars)', () => {
      expect(isWeakSecret('too-short')).toBe(true)
    })
    it('flags the known placeholder', () => {
      expect(isWeakSecret('dev-secret-change-in-production')).toBe(true)
    })
    it('flags the typo placeholder variant', () => {
      expect(isWeakSecret('dev-sKecret-change-in-production')).toBe(true)
    })
    it('accepts a strong 32+ char secret', () => {
      expect(isWeakSecret(STRONG)).toBe(false)
    })
  })

  describe('assertInviteSecret', () => {
    it('throws in production for a missing secret', () => {
      expect(() => assertInviteSecret('production', undefined)).toThrow(/INVITE_TOKEN_SECRET/)
    })
    it('throws in production for a short secret', () => {
      expect(() => assertInviteSecret('production', 'too-short')).toThrow(/openssl rand/)
    })
    it('throws in production for the placeholder', () => {
      expect(() => assertInviteSecret('production', 'dev-secret-change-in-production')).toThrow()
    })
    it('throws in production for the typo placeholder', () => {
      expect(() => assertInviteSecret('production', 'dev-sKecret-change-in-production')).toThrow()
    })
    it('passes in production for a strong secret', () => {
      expect(() => assertInviteSecret('production', STRONG)).not.toThrow()
    })
    it('warns (does not throw) in development for a weak secret', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      expect(() => assertInviteSecret('development', 'too-short')).not.toThrow()
      expect(warn).toHaveBeenCalled()
      warn.mockRestore()
    })
    it('is a no-op in the test environment', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
      expect(() => assertInviteSecret('test', undefined)).not.toThrow()
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })
  })
})
