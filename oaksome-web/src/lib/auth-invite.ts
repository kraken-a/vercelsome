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

// Minimum entropy for the HMAC secret. 32 bytes is the SHA-256 block-equivalent
// floor below which the key materially weakens the signature.
const MIN_SECRET_LENGTH = 32

// Low-entropy placeholders shipped in example envs that must never reach prod.
// Includes the historical typo variant to catch copy-paste from old configs.
const PLACEHOLDER_SECRETS = new Set<string>([
  'dev-secret-change-in-production',
  'dev-sKecret-change-in-production',
])

export function isWeakSecret(secret: string | undefined): boolean {
  if (!secret || secret.length < MIN_SECRET_LENGTH) return true
  return PLACEHOLDER_SECRETS.has(secret)
}

const WEAK_SECRET_MESSAGE =
  'INVITE_TOKEN_SECRET is missing, too short (< 32 chars), or a known placeholder. ' +
  'Generate a strong value with: openssl rand -base64 48'

/**
 * Module-load guard: a weak or placeholder INVITE_TOKEN_SECRET silently produces
 * forgeable invite tokens. Fail fast in production (matches the middleware's
 * 503-on-missing posture); warn in development. Test environments are exempt so
 * the suite can run with a fixed short secret. `nodeEnv`/`secret` are injectable
 * to make the guard unit-testable without mutating the live module-load behavior.
 */
export function assertInviteSecret(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  secret: string | undefined = process.env.INVITE_TOKEN_SECRET,
): void {
  if (nodeEnv === 'test') return
  if (!isWeakSecret(secret)) return
  if (nodeEnv === 'production') {
    throw new Error(WEAK_SECRET_MESSAGE)
  }
  console.warn(`[auth-invite] ${WEAK_SECRET_MESSAGE}`)
}

// Skip the guard during `next build` — secrets are runtime-only and not available
// in the build container. The middleware and proxy route handle the missing-secret
// case at request time (503 / skip token mint respectively).
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  assertInviteSecret()
}

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
