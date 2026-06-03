import { NextResponse, NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { isPublicPath } from './lib/auth-gate'
import { verifyInviteToken } from './lib/auth-invite'

const SUPPORTED_LOCALES = routing.locales as readonly string[]
const DEFAULT_LOCALE = routing.defaultLocale

const intlMiddleware = createMiddleware(routing)

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // nonce-{value} allows only explicitly nonce'd inline scripts.
    // 'strict-dynamic' trusts scripts loaded by a nonce'd script (e.g. GTM sub-loaders).
    // Domain allowlist retained as fallback for browsers without nonce/strict-dynamic support.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://s.pinimg.com https://static.axept.io https://*.axept.io`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https://backend.tecnibo.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' https://cdn.vercelsome.com${process.env.NEXT_PUBLIC_ODOO_URL ? ` ${process.env.NEXT_PUBLIC_ODOO_URL}` : ''} https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://graph.facebook.com https://*.axept.io https://*.pinimg.com https://ct.pinterest.com`,
    "frame-src 'self' https://vercelsome.vercel.app",
    "frame-ancestors 'self'",
    "form-action 'self' https://cdn.vercelsome.com",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ')
}

export default async function middleware(request: NextRequest) {
  // Generate a per-request nonce. Base64-encode the UUID for a compact, safe string.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isProd = process.env.NODE_ENV === 'production'
  // Enforced in production; Report-Only in development so localhost Odoo calls are not blocked.
  const cspHeaderName = isProd ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only'
  const csp = buildCsp(nonce)

  // Forward nonce to RSC via request header — layout.tsx reads it via headers().
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  try {
    const { pathname } = request.nextUrl
    const segments = pathname.split('/').filter(Boolean)
    const maybeLocale = segments[0]
    const locale = SUPPORTED_LOCALES.includes(maybeLocale)
      ? maybeLocale
      : DEFAULT_LOCALE
    const pathWithoutLocale = '/' + segments.slice(1).join('/')

    if (!isPublicPath(pathWithoutLocale)) {
      const secret = process.env.INVITE_TOKEN_SECRET
      if (!secret) {
        // Refuse to serve if secret is unset — loud fail rather than silent allow.
        console.error('[gate] INVITE_TOKEN_SECRET is not set — refusing request')
        return new NextResponse('Service Unavailable: invite gate misconfigured', { status: 503 })
      }

      const tokenCookie = request.cookies.get('vercelsome_invite_token')
      const valid = tokenCookie ? await verifyInviteToken(tokenCookie.value, secret) : false

      if (!valid) {
        if (tokenCookie) {
          console.warn('[gate] invalid_token path=%s', pathname)
        }
        const landingUrl = new URL(`/${locale}/login`, request.url)
        landingUrl.searchParams.set('next', pathname)
        const response = NextResponse.redirect(landingUrl)
        if (tokenCookie) {
          // Clear the bad cookie so the browser doesn't keep sending it.
          response.cookies.set('vercelsome_invite_token', '', { maxAge: 0, path: '/' })
        }
        response.headers.set(cspHeaderName, csp)
        return response
      }
    }
  } catch (e) {
    console.warn('[middleware] Auth gate error, falling through:', e)
  }

  // Pass the modified request (with x-nonce) through intl middleware so RSC
  // receives the nonce via headers(). next-intl forwards request.headers in its
  // internal NextResponse.next({ request: { headers } }) call.
  const response = intlMiddleware(new NextRequest(request, { headers: requestHeaders }))
  response.headers.set(cspHeaderName, csp)
  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|shop|wishlist|cart|.*\\..*).*)'],
}
