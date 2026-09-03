// SEO contract: these tests ensure every route's metadata has a non-empty title,
// canonical URL, and fr/nl/en hreflang alternates. A regression here means
// search engines receive broken or missing metadata.

import { buildHreflangAlternates, buildMetadataBase, getPageMetadata, resolveLocaleAlternates } from '../page-metadata'

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(),
  getLocale: jest.fn(),
}))

describe('buildHreflangAlternates', () => {
  it('returns fr, nl and en alternates for a static path', () => {
    const result = buildHreflangAlternates('/acheter', { fr: '/acheter', nl: '/kopen', en: '/buy' })
    expect(result).toEqual({
      'fr': 'http://localhost:3000/fr/acheter',
      'nl': 'http://localhost:3000/nl/kopen',
      'en': 'http://localhost:3000/en/buy',
    })
  })

  it('returns fr, nl and en alternates for identical paths', () => {
    const result = buildHreflangAlternates('/login', '/login')
    expect(result).toEqual({
      'fr': 'http://localhost:3000/fr/login',
      'nl': 'http://localhost:3000/nl/login',
      'en': 'http://localhost:3000/en/login',
    })
  })

  it('substitutes a slug param into the path', () => {
    const result = buildHreflangAlternates(
      '/collection/[slug]',
      { fr: '/collection/[slug]', nl: '/collectie/[slug]', en: '/collection/[slug]' },
      { slug: 'satori' },
    )
    expect(result).toEqual({
      'fr': 'http://localhost:3000/fr/collection/satori',
      'nl': 'http://localhost:3000/nl/collectie/satori',
      'en': 'http://localhost:3000/en/collection/satori',
    })
  })

  it('substitutes an id param into the path', () => {
    const result = buildHreflangAlternates(
      '/produit/[id]',
      { fr: '/produit/[id]', nl: '/meubel/[id]', en: '/product/[id]' },
      { id: '42' },
    )
    expect(result).toEqual({
      'fr': 'http://localhost:3000/fr/produit/42',
      'nl': 'http://localhost:3000/nl/meubel/42',
      'en': 'http://localhost:3000/en/product/42',
    })
  })
})

describe('resolveLocaleAlternates', () => {
  it('returns canonical for the active locale and all hreflang alternates', () => {
    const result = resolveLocaleAlternates('fr', { fr: '/acheter', nl: '/kopen', en: '/buy' })
    expect(result.canonical).toBe('http://localhost:3000/fr/acheter')
    expect(result.languages['fr']).toBe('http://localhost:3000/fr/acheter')
    expect(result.languages['nl']).toBe('http://localhost:3000/nl/kopen')
    expect(result.languages['en']).toBe('http://localhost:3000/en/buy')
    expect(result.languages['x-default']).toBe('http://localhost:3000/fr/acheter')
  })

  it('returns NL canonical when locale is nl', () => {
    const result = resolveLocaleAlternates('nl', { fr: '/acheter', nl: '/kopen' })
    expect(result.canonical).toBe('http://localhost:3000/nl/kopen')
    expect(result.languages['x-default']).toBe('http://localhost:3000/fr/acheter')
  })

  it('handles static path (same for all locales)', () => {
    const result = resolveLocaleAlternates('fr', '/')
    expect(result.canonical).toBe('http://localhost:3000/fr/')
    expect(result.languages['nl']).toBe('http://localhost:3000/nl/')
    expect(result.languages['en']).toBe('http://localhost:3000/en/')
    expect(result.languages['x-default']).toBe('http://localhost:3000/fr/')
  })

  it('substitutes dynamic params in the path', () => {
    const result = resolveLocaleAlternates('fr', { fr: '/produit/[id]', nl: '/meubel/[id]' }, { id: '42' })
    expect(result.canonical).toBe('http://localhost:3000/fr/produit/42')
    expect(result.languages['nl']).toBe('http://localhost:3000/nl/meubel/42')
  })
})

describe('buildMetadataBase', () => {
  it('returns a URL object from NEXT_PUBLIC_SITE_URL env var', () => {
    const original = process.env.NEXT_PUBLIC_SITE_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'https://oaksome.com'
    const result = buildMetadataBase()
    expect(result).toBeInstanceOf(URL)
    expect(result.href).toBe('https://oaksome.com/')
    process.env.NEXT_PUBLIC_SITE_URL = original
  })

  it('falls back to localhost:3000 when env var is absent', () => {
    const original = process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.NEXT_PUBLIC_SITE_URL
    const result = buildMetadataBase()
    expect(result.href).toBe('http://localhost:3000/')
    process.env.NEXT_PUBLIC_SITE_URL = original
  })
})

describe('getPageMetadata', () => {
  // SEO contract: getPageMetadata must always return non-empty title, canonical,
  // and fr/nl/en hreflang alternates regardless of locale or pathMap shape.

  let originalSiteUrl: string | undefined

  beforeEach(() => {
    originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getTranslations } = require('next-intl/server')
    ;(getTranslations as jest.Mock).mockResolvedValue((key: string) => {
      const fixtures: Record<string, string> = {
        title: 'Oaksome — Sur mesure',
        description: 'Mobilier encastré sur mesure en Belgique.',
      }
      return fixtures[key] ?? key
    })
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl
    jest.resetAllMocks()
  })

  it('returns a non-empty title', async () => {
    const metadata = await getPageMetadata({ namespace: 'meta.home', locale: 'fr', pathMap: '/' })
    expect(typeof metadata.title).toBe('string')
    expect((metadata.title as string).length).toBeGreaterThan(0)
  })

  it('returns a non-empty alternates.canonical', async () => {
    const metadata = await getPageMetadata({ namespace: 'meta.home', locale: 'fr', pathMap: '/' })
    expect(typeof metadata.alternates?.canonical).toBe('string')
    expect((metadata.alternates?.canonical as string).length).toBeGreaterThan(0)
  })

  it('returns non-empty alternates.languages[fr]', async () => {
    const metadata = await getPageMetadata({ namespace: 'meta.home', locale: 'fr', pathMap: '/' })
    const languages = metadata.alternates?.languages as Record<string, string>
    expect(typeof languages?.['fr']).toBe('string')
    expect(languages['fr'].length).toBeGreaterThan(0)
  })

  it('returns non-empty alternates.languages[nl]', async () => {
    const metadata = await getPageMetadata({ namespace: 'meta.home', locale: 'fr', pathMap: '/' })
    const languages = metadata.alternates?.languages as Record<string, string>
    expect(typeof languages?.['nl']).toBe('string')
    expect(languages['nl'].length).toBeGreaterThan(0)
  })

  it('returns non-empty alternates.languages[en]', async () => {
    const metadata = await getPageMetadata({ namespace: 'meta.home', locale: 'fr', pathMap: '/' })
    const languages = metadata.alternates?.languages as Record<string, string>
    expect(typeof languages?.['en']).toBe('string')
    expect(languages['en'].length).toBeGreaterThan(0)
  })

  it('alternates.languages[x-default] equals the FR URL', async () => {
    const metadata = await getPageMetadata({
      namespace: 'meta.home',
      locale: 'nl',
      pathMap: { fr: '/acheter', nl: '/kopen' },
    })
    const languages = metadata.alternates?.languages as Record<string, string>
    expect(languages['x-default']).toBe(languages['fr'])
  })

  it('works correctly when locale is nl', async () => {
    const metadata = await getPageMetadata({ namespace: 'meta.home', locale: 'nl', pathMap: '/' })
    expect((metadata.title as string).length).toBeGreaterThan(0)
    expect((metadata.alternates?.canonical as string).includes('/nl/')).toBe(true)
  })
})
