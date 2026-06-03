import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oaksome.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/profile',
        '/projets',
        '/checkout',
        '/config/',
        '/login',
        '/register',
        '/password-recover',
        '/password-reset',
        '/wishlist',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
