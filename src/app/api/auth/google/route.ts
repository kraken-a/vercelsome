export const runtime = 'nodejs'

import { getOAuthConfig } from '@/lib/api/oauth-config'

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const next = searchParams.get('next') || '/'

  const { google_client_id } = await getOAuthConfig()

  const params = new URLSearchParams({
    client_id: google_client_id,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    state: encodeURIComponent(next),
  })

  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    302,
  )
}
