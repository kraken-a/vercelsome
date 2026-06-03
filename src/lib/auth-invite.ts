/**
 * Stateless HMAC-SHA256 invite tokens for the LandingGate.
 *
 * Token format: base64url(payload).base64url(signature)
 * Payload: "${iat}|${exp}|${nonce}" (pipe-delimited, no JSON overhead)
 *
 * Uses the Web Crypto API (crypto.subtle) — compatible with the
 * Next.js Edge runtime used by middleware.ts.
 */

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

const enc = new TextEncoder()

async function importKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  )
}

export async function mintInviteToken(secret: string): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + TOKEN_TTL_SECONDS
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const payload = `${iat}|${exp}|${nonce}`

  const key = await importKey(secret, 'sign')
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload))

  const payloadB64 = Buffer.from(payload).toString('base64url')
  const sigB64 = Buffer.from(sigBuf).toString('base64url')
  return `${payloadB64}.${sigB64}`
}

export async function verifyInviteToken(token: string, secret: string): Promise<boolean> {
  try {
    const dotIdx = token.indexOf('.')
    if (dotIdx < 1 || dotIdx === token.length - 1) return false

    const payloadB64 = token.slice(0, dotIdx)
    const sigB64 = token.slice(dotIdx + 1)

    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8')
    const parts = payload.split('|')
    if (parts.length !== 3) return false

    const exp = parseInt(parts[1], 10)
    if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) return false

    const sigBytes = Buffer.from(sigB64, 'base64url')
    const key = await importKey(secret, 'verify')
    return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload))
  } catch {
    return false
  }
}
