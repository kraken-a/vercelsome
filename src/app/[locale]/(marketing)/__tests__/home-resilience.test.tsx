/** @jest-environment node */

// Regression: a partial/degraded Odoo response must not crash the whole home page.
// Repro: `/combo-config` returns `{success:true, data:{...}}` WITHOUT a `banners`
// array (observed while the local Odoo was mid module-upgrade) → the page read
// `comboResult.data.banners.length` → TypeError → error boundary (Ref digest).

const mockNav = jest.fn()
const mockInspo = jest.fn()
const mockHome = jest.fn()
const mockCombo = jest.fn()
const mockTagMap = jest.fn()

jest.mock('@/lib/api/navigation', () => ({ getNavigation: (...a: unknown[]) => mockNav(...a) }))
jest.mock('@/lib/api/homepage-inspirations', () => ({
  getHomepageInspirations: (...a: unknown[]) => mockInspo(...a),
  dedupeInspirations: (x: unknown[]) => x ?? [],
}))
jest.mock('@/lib/api/home', () => ({ getHomeData: (...a: unknown[]) => mockHome(...a) }))
jest.mock('@/lib/api/combo-config', () => ({ getComboConfig: (...a: unknown[]) => mockCombo(...a) }))
jest.mock('@/lib/api/home-product-tags', () => ({ getHomepageProductTagMap: (...a: unknown[]) => mockTagMap(...a) }))
jest.mock('next-intl/server', () => ({ getTranslations: async () => (k: string) => k }))
jest.mock('@/lib/seo/page-metadata', () => ({ getPageMetadata: async () => ({}) }))
// Stub children — their modules import CSS, which the ts-jest transform can't load.
jest.mock('../_components/inspo-section', () => ({ InspoSection: () => null }))
jest.mock('../_components/collections-scroll', () => ({ CollectionsScroll: () => null }))
jest.mock('../_components/testimonials-slider', () => ({ TestimonialsSlider: () => null }))
jest.mock('../_components/hero-combo', () => ({ HeroCombo: () => null }))
jest.mock('@/components/cards/product-card', () => ({ ProductCard: () => null }))

import HomePage from '../page'

const ok = <T,>(data: T) => ({ success: true as const, data })
const fail = () => ({ success: false as const, error: 'boom', code: 500 })
const props = { params: Promise.resolve({ locale: 'fr' }) }

const fullNav = ok({ types: [], spaces: [], collections: [], static_links: [] })
const fullHome = ok({ top_notice: null, collections: [], bestsellers: [], spaces: [] })
const fullInspo = ok({ combos: [], spaces: [] })

beforeEach(() => {
  jest.clearAllMocks()
  mockNav.mockResolvedValue(fullNav)
  mockInspo.mockResolvedValue(fullInspo)
  mockHome.mockResolvedValue(fullHome)
  mockCombo.mockResolvedValue(ok(null))
  mockTagMap.mockResolvedValue(new Map())
})

describe('HomePage — resilient to partial/degraded backend responses', () => {
  it('does not crash when combo-config returns an object WITHOUT a banners array', async () => {
    // The exact shape that caused the production TypeError.
    mockCombo.mockResolvedValue(ok({ id: 1, name: 'x', default_product_link: '' }))
    await expect(HomePage(props)).resolves.toBeTruthy()
  })

  it('does not crash when navigation succeeds but collections is missing', async () => {
    mockNav.mockResolvedValue(ok({ types: [], spaces: [], static_links: [] }))
    await expect(HomePage(props)).resolves.toBeTruthy()
  })

  it('does not crash when home succeeds but bestsellers is missing', async () => {
    mockHome.mockResolvedValue(ok({ top_notice: null, collections: [], spaces: [] }))
    await expect(HomePage(props)).resolves.toBeTruthy()
  })

  it('does not crash when inspirations succeeds but combos/spaces are missing', async () => {
    mockInspo.mockResolvedValue(ok({}))
    await expect(HomePage(props)).resolves.toBeTruthy()
  })

  it('still renders normally when every endpoint fails (all defaults)', async () => {
    mockNav.mockResolvedValue(fail())
    mockInspo.mockResolvedValue(fail())
    mockHome.mockResolvedValue(fail())
    mockCombo.mockResolvedValue(fail())
    await expect(HomePage(props)).resolves.toBeTruthy()
  })
})
