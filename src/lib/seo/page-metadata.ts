/**
 * page-metadata.ts — shared helper for per-page Next.js metadata.
 *
 * Builds hreflang alternates and metadataBase so every page can call
 * getPageMetadata() instead of duplicating this logic.
 *
 * Pure helper functions (buildMetadataBase, buildHreflangAlternates) have no
 * next-intl dependency and are safe to import in Jest unit tests.
 * getPageMetadata() requires next-intl server context (Next.js App Router only).
 */

import type { Metadata } from 'next'

const LOCALES = ['fr', 'nl', 'en'] as const
type Locale = (typeof LOCALES)[number]

/** Localised pathname map (same shape as routing.pathnames values). */
type PathMap = string | (Partial<Record<Locale, string>> & { fr: string; nl: string })

/** Optional param substitutions (e.g. { slug: 'satori' } or { id: '42' }). */
type Params = Record<string, string>

/** Returns a URL object from NEXT_PUBLIC_SITE_URL or falls back to localhost. */
export function buildMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return new URL(raw)
}

/**
 * Builds `alternates.languages` for hreflang link tags.
 *
 * @param canonical  The logical pathname key (unused, kept for documentation).
 * @param pathMap    String (same path for all locales) or localised path map.
 * @param params     Dynamic segment substitutions (e.g. { slug: 'satori' }).
 */
export function buildHreflangAlternates(
  canonical: string,
  pathMap: PathMap,
  params?: Params,
): Record<string, string> {
  const base = buildMetadataBase().href.replace(/\/$/, '')

  const resolve = (locale: Locale): string => {
    const raw = typeof pathMap === 'string' ? pathMap : pathMap[locale] ?? pathMap.fr
    let path = raw
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        path = path.replace(`[${key}]`, value)
      }
    }
    return `${base}/${locale}${path}`
  }

  return Object.fromEntries(LOCALES.map((locale) => [locale, resolve(locale)]))
}

/**
 * Resolves canonical URL and hreflang alternates for a page.
 *
 * @param locale   Active locale ('fr' | 'nl' | 'en').
 * @param pathMap  Localized pathname map from routing.pathnames.
 * @param params   Dynamic segment substitutions (e.g. { slug: 'satori' }).
 * @returns        { canonical, languages } ready to spread into metadata.alternates.
 */
export function resolveLocaleAlternates(
  locale: string,
  pathMap: PathMap,
  params?: Params,
): { canonical: string; languages: Record<string, string> } {
  const base = buildMetadataBase().href.replace(/\/$/, '')
  const localeTyped = (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : 'fr'

  const resolvePath = (loc: Locale): string => {
    const raw = typeof pathMap === 'string' ? pathMap : pathMap[loc] ?? pathMap.fr
    let path = raw
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        path = path.replace(`[${key}]`, value)
      }
    }
    return `${base}/${loc}${path}`
  }

  const canonical = resolvePath(localeTyped)
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((loc) => [loc, resolvePath(loc)]),
  )
  languages['x-default'] = resolvePath('fr')

  return { canonical, languages }
}

export type PageMetadataInput = {
  /** next-intl namespace, e.g. 'meta.home'. Must have .title and .description keys. */
  namespace: string
  /** The locale string ('fr' | 'nl' | 'en'). */
  locale: string
  /** Pathname map for hreflang — see routing.pathnames. */
  pathMap: PathMap
  /** Dynamic segment substitutions for hreflang URLs (e.g. { slug: 'satori' }). */
  params?: Params
  /** Interpolation variables passed to t('title', tParams) and t('description', tParams). */
  tParams?: Params
  /** Optional OG image URL (absolute or relative to metadataBase). */
  ogImage?: string
}

/**
 * Resolves localised title + description from messages and emits
 * alternates.languages for supported hreflang link tags.
 *
 * Usage (server page):
 *   export async function generateMetadata({ params }: Props): Promise<Metadata> {
 *     const { locale } = await params
 *     return getPageMetadata({ namespace: 'meta.home', locale, pathMap: '/' })
 *   }
 */
export async function getPageMetadata({
  namespace,
  locale,
  pathMap,
  params,
  tParams,
  ogImage,
}: PageMetadataInput): Promise<Metadata> {
  // Dynamic import keeps next-intl/server out of the module's top-level scope
  // so Jest unit tests that import only the pure helpers can run without ESM issues.
  const { getTranslations } = await import('next-intl/server')
  const t = await getTranslations({ locale, namespace })

  const title = tParams ? t('title', tParams) : t('title')
  const description = tParams ? t('description', tParams) : t('description')
  const { canonical, languages } = resolveLocaleAlternates(locale, pathMap, params)

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    metadataBase: buildMetadataBase(),
  }

  if (ogImage) {
    metadata.openGraph = {
      title,
      description,
      images: [ogImage],
    }
    metadata.twitter = {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    }
  }

  return metadata
}
