import {
  axeptioInitSnippet,
  axeptioBridgeSnippet,
  cookiesVersionForLocale,
  isValidAxeptioClientId,
  COOKIES_VERSION_FR,
  COOKIES_VERSION_NL,
} from '../axeptio'

describe('axeptio helpers', () => {
  describe('isValidAxeptioClientId', () => {
    it('accepts alphanumeric and dashes', () => {
      expect(isValidAxeptioClientId('abc-123-DEF')).toBe(true)
      expect(isValidAxeptioClientId('vercelsome')).toBe(true)
    })

    it.each([
      '',
      '   ',
      'has space',
      'quote"inj',
      "tick'inj",
      'angle<inj>',
      'amp&inj',
      'semi;inj',
      'paren(inj)',
      'newline\ninj',
    ])('rejects %p', (value) => {
      expect(isValidAxeptioClientId(value)).toBe(false)
    })
  })

  describe('cookiesVersionForLocale', () => {
    it('maps fr → vercelsome-fr', () => {
      expect(cookiesVersionForLocale('fr')).toBe(COOKIES_VERSION_FR)
      expect(cookiesVersionForLocale('fr')).toBe('vercelsome-fr')
    })

    it('maps nl → vercelsome-nl', () => {
      expect(cookiesVersionForLocale('nl')).toBe(COOKIES_VERSION_NL)
      expect(cookiesVersionForLocale('nl')).toBe('vercelsome-nl')
    })

    it('falls back to FR for unknown locales', () => {
      expect(cookiesVersionForLocale('en')).toBe(COOKIES_VERSION_FR)
      expect(cookiesVersionForLocale('')).toBe(COOKIES_VERSION_FR)
    })
  })

  describe('axeptioInitSnippet', () => {
    it('returns a script body containing clientId and cookiesVersion', () => {
      const out = axeptioInitSnippet('abc-123', 'vercelsome-fr')
      expect(out).toContain('clientId: "abc-123"')
      expect(out).toContain('cookiesVersion: "vercelsome-fr"')
      expect(out).toContain('static.axept.io/sdk.js')
    })

    it('returns empty string when clientId is invalid (fail closed)', () => {
      expect(axeptioInitSnippet('', 'vercelsome-fr')).toBe('')
      expect(axeptioInitSnippet('has space', 'vercelsome-fr')).toBe('')
      expect(axeptioInitSnippet('inj"ect', 'vercelsome-fr')).toBe('')
    })

    it('never contains a closing script tag', () => {
      const out = axeptioInitSnippet('abc-123', 'vercelsome-fr')
      expect(out).not.toMatch(/<\/script/i)
    })
  })

  describe('axeptioBridgeSnippet', () => {
    const snippet = axeptioBridgeSnippet()

    it('listens to axeptio_authorized_vendors via _axcb queue', () => {
      expect(snippet).toContain('_axcb')
      expect(snippet).toContain('axeptio_authorized_vendors')
    })

    it('writes window.__vercelsomeConsent', () => {
      expect(snippet).toContain('__vercelsomeConsent')
    })

    it('does not write back to Axeptio (read-only of choices)', () => {
      expect(snippet).not.toMatch(/sdk\.setUserChoices/i)
      expect(snippet).not.toMatch(/axeptio\.setUserChoices/i)
    })

    it('flips analytics from google_analytics choice', () => {
      expect(snippet).toContain('google_analytics')
    })

    it('flips ads from facebook_pixel or google_ads choice', () => {
      expect(snippet).toMatch(/facebook_pixel|google_ads/)
    })

    it('never contains a closing script tag', () => {
      expect(snippet).not.toMatch(/<\/script/i)
    })
  })
})
