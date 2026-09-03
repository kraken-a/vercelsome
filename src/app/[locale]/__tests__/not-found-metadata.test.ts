// SEO contract: the 404 page must always return a non-empty title and description
// for both FR and NL locales. An empty <title> on the 404 page was a previously
// found regression — this test exists to catch it before it reaches production.

import { generateMetadata } from '../not-found'

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(),
  getLocale: jest.fn(),
}))

jest.mock('@/i18n/navigation', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Link: ({ children }: { children: any }) => children,
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getTranslations, getLocale } = require('next-intl/server') as {
  getTranslations: jest.Mock
  getLocale: jest.Mock
}

const frMessages: Record<string, string> = {
  errorCode: '404 — Page introuvable',
  intro: 'Cette page n\'existe pas ou a été déplacée.',
}

const nlMessages: Record<string, string> = {
  errorCode: '404 — Pagina niet gevonden',
  intro: 'Deze pagina bestaat niet of is verplaatst.',
}

describe('not-found generateMetadata', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('locale: fr', () => {
    beforeEach(() => {
      getLocale.mockResolvedValue('fr')
      getTranslations.mockResolvedValue((key: string) => frMessages[key] ?? key)
    })

    it('returns a non-empty title', async () => {
      const metadata = await generateMetadata()
      expect(typeof metadata.title).toBe('string')
      expect((metadata.title as string).length).toBeGreaterThan(0)
    })

    it('returns a non-empty description', async () => {
      const metadata = await generateMetadata()
      expect(typeof metadata.description).toBe('string')
      expect((metadata.description as string).length).toBeGreaterThan(0)
    })
  })

  describe('locale: nl', () => {
    beforeEach(() => {
      getLocale.mockResolvedValue('nl')
      getTranslations.mockResolvedValue((key: string) => nlMessages[key] ?? key)
    })

    it('returns a non-empty title (NL variant)', async () => {
      const metadata = await generateMetadata()
      expect(typeof metadata.title).toBe('string')
      expect((metadata.title as string).length).toBeGreaterThan(0)
    })

    it('returns a non-empty description (NL variant)', async () => {
      const metadata = await generateMetadata()
      expect(typeof metadata.description).toBe('string')
      expect((metadata.description as string).length).toBeGreaterThan(0)
    })
  })

  it('title differs between fr and nl locales', async () => {
    getLocale.mockResolvedValue('fr')
    getTranslations.mockResolvedValue((key: string) => frMessages[key] ?? key)
    const frMeta = await generateMetadata()

    jest.resetAllMocks()
    getLocale.mockResolvedValue('nl')
    getTranslations.mockResolvedValue((key: string) => nlMessages[key] ?? key)
    const nlMeta = await generateMetadata()

    expect(frMeta.title).not.toBe(nlMeta.title)
  })
})
