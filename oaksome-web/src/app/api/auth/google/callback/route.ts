export const runtime = 'nodejs'

import { getOAuthConfig } from '@/lib/api/oauth-config'

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const next = state ? decodeURIComponent(state) : '/'
  const loginUrl = `${origin}/fr/login?error=oauth_failed`

  if (!code) {
    return Response.redirect(`${origin}/fr/login?error=oauth_cancelled`, 302)
  }

  // Exchange authorization code for access token
  const { google_client_id, google_client_secret } = await getOAuthConfig()

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: google_client_id,
      client_secret: google_client_secret,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json() as { access_token?: string }
  if (!tokens.access_token) {
    return Response.redirect(loginUrl, 302)
  }

  // Get Google user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const googleUser = await userRes.json() as { email?: string; name?: string }

  if (!googleUser.email) {
    return Response.redirect(loginUrl, 302)
  }

  // Find or create portal user in Odoo
  const odooRes = await fetch(`${process.env.ODOO_URL}/api/oaksome/v1/auth/oauth-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      email: googleUser.email,
      name: googleUser.name || googleUser.email,
    }),
  })

  if (!odooRes.ok) {
    return Response.redirect(loginUrl, 302)
  }

  // Forward Odoo session cookie to browser, then redirect
  const odooCookie = odooRes.headers.get('set-cookie')
  const headers = new Headers({ Location: `${origin}${next}` })
  if (odooCookie) {
    headers.append('Set-Cookie', odooCookie)
  }

  return new Response(null, { status: 302, headers })
}
