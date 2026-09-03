/* jshint esversion: 11, module: true, node: true */
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

// ---------------------------------------------------------------------------
// FIX-SEC-001 / TASK-031: Security headers
// ---------------------------------------------------------------------------
// CSP is set dynamically in src/middleware.ts with a per-request nonce so that
// script-src uses 'nonce-{value}' instead of 'unsafe-inline'/'unsafe-eval'.
// Middleware runs before next.config headers() and sets the CSP on the response.
// The headers() below intentionally omit CSP to avoid overwriting it.
// ---------------------------------------------------------------------------

/** @type {import('next').NextConfig} */
const nextConfig = {
  // FIX-SEC-001: Remove X-Powered-By: Next.js from all responses
  poweredByHeader: false,

  experimental: {
    // Disable client-side router cache for dynamic pages so Odoo content
    // changes are visible immediately on navigation without hard refresh.
    staleTimes: {
      dynamic: 0,
      static: 300,
    },
  },

  // HOTFIX-001: Force webpack to re-bundle next-intl and @formatjs/* through
  // Next.js's own pipeline instead of leaving them in pre-built vendor chunks.
  // next-intl/dist/esm/production/extractor/format/index.js contains a dynamic
  // import(t) expression that webpack can't statically analyse, which causes
  // PackFileCacheStrategy to write an incomplete cache entry. On warm-cache
  // restarts this produces `Cannot find module './vendor-chunks/@formatjs.js'`.
  // transpilePackages prevents these modules from being split into vendor chunks.
  transpilePackages: ['next-intl', '@formatjs/intl-localematcher'],

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    remotePatterns: (() => {
      const patterns = [{ protocol: 'https', hostname: 'cdn.oaksome.com' }]
      const LOCAL_ALIASES = ['localhost', '127.0.0.1', '0.0.0.0']

      function addOdooUrl(raw) {
        if (!raw) return
        try {
          const u = new URL(raw)
          const proto = u.protocol.replace(':', '')
          const portObj = u.port ? { port: u.port } : {}
          // Avoid duplicates
          const already = patterns.some(p => p.hostname === u.hostname && p.protocol === proto)
          if (!already) patterns.push({ protocol: proto, hostname: u.hostname, ...portObj })
          // localhost / 127.0.0.1 / 0.0.0.0 all refer to the same machine in dev.
          // Odoo's `web.base.url` is independent of NEXT_PUBLIC_ODOO_URL, so in dev
          // it can emit image URLs with a different loopback alias *or* scheme than
          // the env (e.g. https://127.0.0.1:8069 while the env is http://localhost:8069).
          // Register every alias under both http and https so next/image accepts them.
          // Loopback-only; production Odoo/CDN hosts never enter this branch.
          if (LOCAL_ALIASES.includes(u.hostname)) {
            for (const alias of LOCAL_ALIASES) {
              for (const scheme of ['http', 'https']) {
                if (!patterns.some(p => p.hostname === alias && p.protocol === scheme)) {
                  patterns.push({ protocol: scheme, hostname: alias, ...portObj })
                }
              }
            }
          }
        } catch {}
      }

      // ODOO_URL  — server-side runtime URL (may be internal Docker hostname)
      // NEXT_PUBLIC_ODOO_URL — public URL baked into client bundle (used in image srcs)
      addOdooUrl(process.env.ODOO_URL)
      addOdooUrl(process.env.NEXT_PUBLIC_ODOO_URL)

      return patterns
    })(),
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // FIX-SEC-001: Baseline security headers
          {
            key: 'Strict-Transport-Security',
            // max-age=1 year + includeSubDomains. No `preload` until owner
            // explicitly opts in via hstspreload.org.
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Oaksome is the parent embedding oaksome-client.vercel.app in an
            // iframe on /configurer. SAMEORIGIN is correct — we are the
            // embedder, not the embedee. If a partner site needs to embed
            // Oaksome pages, add their origin to frame-ancestors in CSP instead
            // (X-Frame-Options cannot list multiple origins).
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ]
  },

  async rewrites() {
    // TASK-054 (audit M6): the legacy `/shop`, `/wishlist`, `/cart` rewrites to
    // Odoo's web controllers were removed. They bypassed the proxy's CSRF origin
    // check, cookie allowlist, and rate limiting (a cross-site POST to /cart/add
    // succeeded from any origin), and the middleware matcher excluded these
    // prefixes so no check ever ran on them. A dependency sweep confirmed nothing
    // same-origin uses them: all cart/wishlist calls go through the guarded
    // `/api/oaksome/v1` proxy (src/lib/api/client.ts), and the configurator runs
    // in an external iframe (oaksome-client.vercel.app) that posts back via the
    // server-side `/api/odoo/configurator` route — not these rewrites.
    return { beforeFiles: [] }
  },

  async redirects() {
    // QA-001 Drift B — materials are part of the samples experience, not a
    // standalone catalogue. Fold legacy /materiaux into /echantillons in both
    // locales (the NL canonical slug is /stalen per i18n/routing.ts).
    return [
      { source: '/fr/materiaux',      destination: '/fr/echantillons', permanent: true },
      { source: '/fr/materiaux/:path*', destination: '/fr/echantillons', permanent: true },
      { source: '/nl/materiaux',      destination: '/nl/stalen', permanent: true },
      { source: '/nl/materiaux/:path*', destination: '/nl/stalen', permanent: true },
      // Locale-less fallback — middleware will add the locale prefix afterward.
      { source: '/materiaux',         destination: '/echantillons', permanent: true },
      { source: '/materiaux/:path*',  destination: '/echantillons', permanent: true },
    ]
  },

  webpack(config) {
    // next-intl's extractor uses a dynamic import(t) that webpack can't statically
    // analyse. This causes a PackFileCacheStrategy warning and incorrect cache
    // invalidation that manifests as __webpack_modules__[moduleId] is not a function
    // on the first SSR render of any page after server start.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      /Parsing of next-intl.*for build dependencies failed/,
    ]
    return config
  },

  output: 'standalone',
}

export default withNextIntl(nextConfig)
