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
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://s.pinimg.com https://static.axept.io https://*.axept.io https://embed.cloudflarestream.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https://backend.tecnibo.com https://*.cloudflarestream.com https://videodelivery.net",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' https://cdn.oaksome.com${process.env.NEXT_PUBLIC_ODOO_URL ? ` ${process.env.NEXT_PUBLIC_ODOO_URL}` : ''} https://www.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://graph.facebook.com https://*.axept.io https://*.pinimg.com https://ct.pinterest.com`,
    "frame-src 'self' https://oaks-indol.vercel.app https://iframe.cloudflarestream.com",

    "frame-ancestors 'self'",
    "form-action 'self' https://cdn.oaksome.com",
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

  // Derive locale before the gate so the fail-closed catch can build a
  // locale-aware landing redirect. Safe string ops only (Edge-runtime safe).
  const { pathname } = request.nextUrl
  const segments = pathname.split('/').filter(Boolean)
  const maybeLocale = segments[0]
  const locale = SUPPORTED_LOCALES.includes(maybeLocale)
    ? maybeLocale
    : DEFAULT_LOCALE
  const pathWithoutLocale = '/' + segments.slice(1).join('/')

  try {
    if (!isPublicPath(pathWithoutLocale)) {
      const secret = process.env.INVITE_TOKEN_SECRET
      if (!secret) {
        // Refuse to serve if secret is unset — loud fail rather than silent allow.
        console.error('[gate] INVITE_TOKEN_SECRET is not set — refusing request')
        return new NextResponse('Service Unavailable: invite gate misconfigured', { status: 503 })
      }

      const tokenCookie = request.cookies.get('oaksome_invite_token')
      const valid = tokenCookie ? await verifyInviteToken(tokenCookie.value, secret) : false

      if (!valid) {
        if (tokenCookie) {
          console.warn('[gate] invalid_token path=%s', pathname)
        }
        const landingUrl = new URL(`/${locale}/landing`, request.url)
        landingUrl.searchParams.set('next', pathname)
        const response = NextResponse.redirect(landingUrl)
        if (tokenCookie) {
          // Clear the bad cookie so the browser doesn't keep sending it.
          response.cookies.set('oaksome_invite_token', '', { maxAge: 0, path: '/' })
        }
        response.headers.set(cspHeaderName, csp)
        return response
      }
    }
  } catch (e) {
    // Fail closed: an exception in token verification or cookie parsing must
    // NOT serve the protected page. Redirect to landing, mirroring the normal
    // rejection path (L70–78). No loop: /landing is public so the redirected
    // request never re-enters the gate, and public paths never reach here.
    console.error('[middleware] Auth gate error, failing closed:', e)
    const landingUrl = new URL(`/${locale}/landing`, request.url)
    landingUrl.searchParams.set('next', pathname)
    const response = NextResponse.redirect(landingUrl)
    response.cookies.set('oaksome_invite_token', '', { maxAge: 0, path: '/' })
    response.headers.set(cspHeaderName, csp)
    return response
  }

  // Pass the modified request (with x-nonce) through intl middleware so RSC
  // receives the nonce via headers(). next-intl forwards request.headers in its
  // internal NextResponse.next({ request: { headers } }) call.
  const response = intlMiddleware(new NextRequest(request, { headers: requestHeaders }))
  response.headers.set(cspHeaderName, csp)
  return response
}

// TASK-054 (audit M6): `shop|wishlist|cart` were removed from the matcher
// exclusions. They were excluded only to let the now-deleted legacy Odoo
// rewrites (next.config.mjs) pass through unguarded — that was the bypass.
// With the rewrites gone, these paths resolve as normal Next routes (404),
// and there is no reason to keep them out of the auth/CSP middleware.
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
