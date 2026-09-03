type OAuthConfig = {
  google_client_id: string
  google_client_secret: string
}

let cached: OAuthConfig | null = null
let cachedAt = 0
const TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function getOAuthConfig(): Promise<OAuthConfig> {
  const now = Date.now()
  if (cached && now - cachedAt < TTL_MS) return cached

  const res = await fetch(`${process.env.ODOO_URL}/api/oaksome/v1/config/oauth`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    // Fallback to env vars if Odoo unreachable
    return {
      google_client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      google_client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }
  }

  const json = await res.json() as { data?: OAuthConfig }
  const data = json.data ?? { google_client_id: '', google_client_secret: '' }
  cached = data
  cachedAt = now
  return data
}
