/**
 * Server-side PII hashing for Meta CAPI / GA4 Measurement Protocol.
 * Normalizes whitespace + case, then SHA-256 → 64-char lowercase hex.
 *
 * Plaintext PII must never leave this process. The route handler hashes
 * before constructing the outbound payload.
 */

export async function hashSha256Lower(input: string): Promise<string> {
  const normalized = input.trim().toLowerCase()
  if (normalized.length === 0) {
    throw new Error('hashSha256Lower: empty input after normalization')
  }
  const bytes = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const view = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < view.length; i++) {
    hex += view[i].toString(16).padStart(2, '0')
  }
  return hex
}
