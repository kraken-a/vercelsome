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
      const patterns = [{ protocol: 'https', hostname: 'cdn.vercelsome.com' }]
      const odooUrl = process.env.ODOO_URL
      if (odooUrl) {
        try {
          const u = new URL(odooUrl)
          const proto = u.protocol.replace(':', '')
          const portObj = u.port ? { port: u.port } : {}
          patterns.push({ protocol: proto, hostname: u.hostname, ...portObj })
          // localhost and 127.0.0.1 are the same machine; Odoo may return either.
          if (u.hostname === 'localhost') patterns.push({ protocol: proto, hostname: '127.0.0.1', ...portObj })
          if (u.hostname === '127.0.0.1') patterns.push({ protocol: proto, hostname: 'localhost', ...portObj })
        } catch {}
      }
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
            // Vercelsome is the parent embedding oaksome-client.vercel.app in an
            // iframe on /configurer. SAMEORIGIN is correct — we are the
            // embedder, not the embedee. If a partner site needs to embed
            // Vercelsome pages, add their origin to frame-ancestors in CSP instead
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
    const odooUrl = process.env.ODOO_URL
    if (!odooUrl) return { beforeFiles: [] }
    return {
      // beforeFiles runs before next-intl middleware so the locale prefix
      // never gets prepended to these Odoo proxy paths.
      beforeFiles: [
        { source: '/shop/:path*',     destination: `${odooUrl}/shop/:path*` },
        { source: '/wishlist/:path*', destination: `${odooUrl}/wishlist/:path*` },
        { source: '/cart/:path*',     destination: `${odooUrl}/cart/:path*` },
      ],
    }
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
