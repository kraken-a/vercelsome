import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oaksome.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/acheter',
    '/configurer',
    '/inspirations',
    '/etudes-de-cas',
    '/echantillons',
    '/a-propos',
    '/comment-ca-marche',
    '/faq',
    '/engagements',
    '/contact',
    '/pro',
  ]

  const locales = ['fr', 'nl']

  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page === '' ? 1.0 : 0.8,
      })
    }
  }

  // Dynamic pages (collections, gammes, espaces, products, case-studies)
  // will be added when API is connected

  return entries
}
