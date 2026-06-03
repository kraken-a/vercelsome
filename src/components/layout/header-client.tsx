'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import Image from 'next/image'
import { useCart } from '@/features/cart/hooks'
import { useWishlist } from '@/features/wishlist/hooks'
import type { NavItem, NavCollection } from '@/lib/api/navigation'
import { NotificationBell } from './notification-panel'
import { useAuth } from '@/features/auth/hooks'

type SearchProduct = { id: number; name: string; image_url: string; price: number }
type SearchSuggestion = { id: number; name: string; slug: string }
type DesktopMenuKey = 'type' | 'espace' | 'collections'

type Props = {
  typeItems: ReadonlyArray<NavItem>
  espaceItems: ReadonlyArray<NavItem>
  collectionItems: ReadonlyArray<NavCollection>
}

const MEGA_MENU_FALLBACK = {
  type: '/images/stock/oaksome-v8-thumb-biblio.jpg',
  espace: '/images/stock/oaksome-v8-thumb-salon.jpg',
  collection: '/images/stock/oaksome-v8-ambiance-satori-1.jpg',
} as const

const TYPE_THUMBS: Record<string, string> = {
  dressings: '/images/stock/oaksome-v8-thumb-dressing.jpg',
  bibliotheques: '/images/stock/oaksome-v8-thumb-biblio.jpg',
  'meuble-tv': '/images/stock/oaksome-v8-thumb-meuble-tv.jpg',
  'ensembles-muraux': '/images/stock/oaksome-v8-thumb-ensemble-mural.jpg',
  commodes: '/images/stock/oaksome-v8-thumb-commode.jpg',
  buffets: '/images/stock/oaksome-v8-thumb-buffet.jpg',
  bureaux: '/images/stock/oaksome-v8-thumb-bureau.jpg',
  entrees: '/images/stock/oaksome-v8-thumb-vestiaire.jpg',
  placards: '/images/stock/oaksome-v8-thumb-placard.jpg',
  'ponts-de-lit': '/images/stock/oaksome-v8-thumb-pont.jpg',
}

const ESPACE_THUMBS: Record<string, string> = {
  chambre: '/images/stock/oaksome-v8-thumb-chambre.jpg',
  salon: '/images/stock/oaksome-v8-thumb-salon.jpg',
  entree: '/images/stock/oaksome-v8-thumb-entree.jpg',
  bureau: '/images/stock/oaksome-v8-thumb-bureau-piece.jpg',
  buanderie: '/images/stock/oaksome-v8-thumb-buanderie.jpg',
}

const COLLECTION_THUMBS: Record<string, string> = {
  line: '/images/stock/oaksome-v8-thumb-line.jpg',
  satori: '/images/stock/oaksome-v8-thumb-satori.jpg',
  vista: '/images/stock/oaksome-v8-thumb-vista.jpg',
  lys: '/images/stock/oaksome-v8-thumb-lys.jpg',
}

const TYPE_ORDER = [
  'dressings',
  'bibliotheques',
  'meuble-tv',
  'ensembles-muraux',
  'commodes',
  'buffets',
  'bureaux',
  'entrees',
  'placards',
  'ponts-de-lit',
] as const

const ESPACE_ORDER = ['chambre', 'salon', 'entree', 'bureau', 'buanderie'] as const
const COLLECTION_ORDER = ['line', 'satori', 'vista', 'lys'] as const

function orderMenuItems<T extends { slug: string }>(items: ReadonlyArray<T>, preferredOrder: ReadonlyArray<string>): T[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]))
  const ordered = preferredOrder
    .map((slug) => bySlug.get(slug))
    .filter((item): item is T => Boolean(item))

  if (ordered.length > 0) return ordered
  return [...items]
}

function getMenuImageSrc(
  src: string | null | undefined,
  slug: string,
  kind: 'type' | 'espace' | 'collection',
): string {
  const curated = kind === 'type'
    ? TYPE_THUMBS[slug]
    : kind === 'espace'
      ? ESPACE_THUMBS[slug]
      : COLLECTION_THUMBS[slug]

  if (curated) return curated

  return MEGA_MENU_FALLBACK[kind]
}

export function HeaderClient({ typeItems, espaceItems, collectionItems }: Props) {
  const t = useTranslations()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { cart, setCartOpen } = useCart()
  const { wishlist } = useWishlist()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState<DesktopMenuKey | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([])
  const [searchSuggestions, setSearchSuggestions] = useState<{ collections: SearchSuggestion[]; types: SearchSuggestion[]; spaces: SearchSuggestion[] } | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typeMenuItems = orderMenuItems(typeItems, TYPE_ORDER)
  const espaceMenuItems = orderMenuItems(espaceItems, ESPACE_ORDER)
  const collectionMenuItems = orderMenuItems(collectionItems, COLLECTION_ORDER)

  function handleDesktopCtaClick(path: '/gamme' | '/espaces' | '/collections') {
    setDesktopMenuOpen(null)
    router.push(path)
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const toggleAccordion = (key: string) => {
    setAccordionOpen(prev => prev === key ? null : key)
  }

  useEffect(() => {
    if (!searchOpen) { setQuery(''); setSearchProducts([]); setSearchSuggestions(null) }
  }, [searchOpen])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (query.length < 3) { setSearchProducts([]); setSearchSuggestions(null); return }
    setSearchLoading(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/oaksome/v1/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        const data = json.data ?? json
        setSearchProducts(data.products || [])
        setSearchSuggestions(data.suggestions || null)
      } catch { /* silent */ } finally { setSearchLoading(false) }
    }, 350)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [query])

  return (
    <>
      {/* Search Overlay */}
      <div
        className={`search-overlay${searchOpen ? ' open' : ''}`}
        onClick={() => setSearchOpen(false)}
      >
        <div className="search-box" onClick={e => e.stopPropagation()}>
          <input
            type="text"
            placeholder={t('search.placeholder')}
            autoFocus={searchOpen}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query.length < 3 && (
            <div style={{ marginTop: '1rem' }}>
              {typeMenuItems.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '11px', fontFamily: "'PP Air Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: '#696761', margin: '0 0 8px' }}>{t('nav.by_type')}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {typeMenuItems.map(item => (
                      <button key={item.id} onClick={() => setQuery(item.name)}
                        style={{ fontSize: '12px', border: '1px solid #ccc', padding: '3px 10px', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {espaceMenuItems.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '11px', fontFamily: "'PP Air Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: '#696761', margin: '0 0 8px' }}>{t('nav.by_room')}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {espaceMenuItems.map(item => (
                      <button key={item.slug} onClick={() => setQuery(item.name)}
                        style={{ fontSize: '12px', border: '1px solid #ccc', padding: '3px 10px', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {collectionMenuItems.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', fontFamily: "'PP Air Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: '#696761', margin: '0 0 8px' }}>{t('nav.collections')}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {collectionMenuItems.map(item => (
                      <button key={item.slug} onClick={() => setQuery(item.name)}
                        style={{ fontSize: '12px', border: '1px solid #ccc', padding: '3px 10px', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {searchLoading && <p style={{ color: '#999', fontSize: '13px' }}>{t('search.loading')}</p>}
          {!searchLoading && query.length >= 3 && searchProducts.length === 0 &&
            (!searchSuggestions || (searchSuggestions.types.length === 0 && searchSuggestions.spaces.length === 0 && searchSuggestions.collections.length === 0)) && (
            <p style={{ fontSize: '13px', color: '#999' }}>{t('search.no_results', { query })}</p>
          )}
          {searchSuggestions && (
            <>
              {searchSuggestions.types.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '11px', fontFamily: "'PP Air Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: '#696761', margin: '0 0 6px' }}>{t('search.section_types')}</p>
                  {searchSuggestions.types.map(item => (
                    <Link key={item.id} href={{ pathname: '/gamme/[slug]', params: { slug: item.slug } }} onClick={() => setSearchOpen(false)}
                      style={{ display: 'block', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px', textDecoration: 'none', color: 'inherit' }}>
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
              {searchSuggestions.spaces.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '11px', fontFamily: "'PP Air Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: '#696761', margin: '0 0 6px' }}>{t('search.section_spaces')}</p>
                  {searchSuggestions.spaces.map(item => (
                    <Link key={item.id} href={{ pathname: '/espace/[slug]', params: { slug: item.slug } }} onClick={() => setSearchOpen(false)}
                      style={{ display: 'block', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px', textDecoration: 'none', color: 'inherit' }}>
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
              {searchSuggestions.collections.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ fontSize: '11px', fontFamily: "'PP Air Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: '#696761', margin: '0 0 6px' }}>{t('nav.collections')}</p>
                  {searchSuggestions.collections.map(item => (
                    <Link key={item.id} href={{ pathname: '/collection/[slug]', params: { slug: item.slug } }} onClick={() => setSearchOpen(false)}
                      style={{ display: 'block', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px', textDecoration: 'none', color: 'inherit' }}>
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
          {searchProducts.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '11px', fontFamily: "'PP Air Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: '#696761', margin: '0 0 6px' }}>{t('search.section_products')}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {searchProducts.map(p => (
                  <Link key={p.id} href={{ pathname: '/produit/[id]', params: { id: String(p.id) } }} onClick={() => setSearchOpen(false)}
                    style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: 'inherit' }}>
                    <Image src={p.image_url} alt={p.name} width={48} height={48} style={{ objectFit: 'cover', flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#696761', fontFamily: "'PP Air Mono',monospace" }}>{p.price.toLocaleString('fr-BE')} €</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div
        className={`mobile-menu-overlay${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Menu */}
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        <div className="mobile-menu-header">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <Image src="/images/oaksome-logo.svg" alt="Vercelsome" width={120} height={22} style={{ height: '22px', width: 'auto' }} />
          </Link>
          <button className="mobile-menu-close" onClick={() => setMobileOpen(false)} aria-label={t('nav.aria.menu_close')}>
            ×
          </button>
        </div>

        <div className="mobile-menu-body">
          {/* Accordion: Par Type */}
          <div className={`mobile-menu-accordion${accordionOpen === 'type' ? ' open' : ''}`}>
            <button
              className="mobile-menu-accordion-toggle"
              onClick={() => toggleAccordion('type')}
            >
              <span className="acc-arrow">{accordionOpen === 'type' ? '−' : '+'}</span>
              {t('nav.by_type')}
            </button>
            <div className="mobile-menu-accordion-content">
              <div className="mobile-menu-sub-grid">
                {typeMenuItems.map(item => (
                  <Link
                    key={item.id}
                    href={{ pathname: '/gamme/[slug]', params: { slug: item.slug } }}
                    className="mobile-menu-sub-item"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Image
                      src={getMenuImageSrc(item.image_url, item.slug, 'type')}
                      alt={item.name}
                      width={80}
                      height={80}
                      style={{ objectFit: 'cover' }}
                    />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Accordion: Par Pièce */}
          <div className={`mobile-menu-accordion${accordionOpen === 'espace' ? ' open' : ''}`}>
            <button
              className="mobile-menu-accordion-toggle"
              onClick={() => toggleAccordion('espace')}
            >
              <span className="acc-arrow">{accordionOpen === 'espace' ? '−' : '+'}</span>
              {t('nav.by_room')}
            </button>
            <div className="mobile-menu-accordion-content">
              <div className="mobile-menu-sub-grid">
                {espaceMenuItems.map(item => (
                  <Link
                    key={item.slug}
                    href={{ pathname: '/espace/[slug]', params: { slug: item.slug } }}
                    className="mobile-menu-sub-item"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Image
                      src={getMenuImageSrc(item.image_url, item.slug, 'espace')}
                      alt={item.name}
                      width={80}
                      height={80}
                      style={{ objectFit: 'cover' }}
                    />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Accordion: Collections */}
          <div className={`mobile-menu-accordion${accordionOpen === 'collections' ? ' open' : ''}`}>
            <button
              className="mobile-menu-accordion-toggle"
              onClick={() => toggleAccordion('collections')}
            >
              <span className="acc-arrow">{accordionOpen === 'collections' ? '−' : '+'}</span>
              {t('nav.collections')}
            </button>
            <div className="mobile-menu-accordion-content">
              <div className="mobile-menu-sub-grid">
                {collectionMenuItems.map(item => (
                  <Link
                    key={item.slug}
                    href={{ pathname: '/collection/[slug]', params: { slug: item.slug } }}
                    className="mobile-menu-sub-item"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Image
                      src={getMenuImageSrc(item.image_url, item.slug, 'collection')}
                      alt={item.name}
                      width={80}
                      height={80}
                      style={{ objectFit: 'cover' }}
                    />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mobile-menu-divider" />

          <Link href="/inspirations" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>
            {t('nav.inspiration_short')}
          </Link>
          <Link href="/comment-ca-marche" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>
            {t('nav.how_it_works')}
          </Link>

          <div className="mobile-menu-divider" />

          <Link href="/configurer" className="mobile-menu-link mobile-menu-cta" onClick={() => setMobileOpen(false)}>
            {t('nav.configurator')} →
          </Link>

          <div className="mobile-menu-divider" />

          <Link href={isAuthenticated ? '/profile' : '/login'} className="mobile-menu-link-sm" onClick={() => setMobileOpen(false)}>
            {t('nav.my_account')}
          </Link>
          <Link href="/wishlist" className="mobile-menu-link-sm" onClick={() => setMobileOpen(false)}>
            {t('nav.aria.wishlist')}
          </Link>
          <Link href="/contact" className="mobile-menu-link-sm" onClick={() => setMobileOpen(false)}>
            {t('nav.contact')}
          </Link>
        </div>
      </div>

      {/* Main Nav */}
      <nav aria-label={t('nav.aria.main_nav')} className={scrolled ? 'scrolled' : ''}>
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label={t('nav.aria.menu_open')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="3" y1="7" x2="21" y2="7" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="17" x2="21" y2="17" />
          </svg>
        </button>

        <div className="nav-left">
          <Link href="/acheter">{t('nav.our_furniture')}</Link>

          {/* Par Type — mega menu */}
          <div
            className={`nav-dropdown${desktopMenuOpen === 'type' ? ' open' : ''}`}
            onMouseEnter={() => setDesktopMenuOpen('type')}
            onMouseLeave={() => setDesktopMenuOpen((current) => current === 'type' ? null : current)}
          >
            <Link href="/gamme" className="nav-dropdown-link">+ {t('nav.by_type')}</Link>
            <div className="nav-dropdown-menu nav-mega">
              <div className="mega-content">
                <Link href="/gamme" className="mega-cta-discover" onClick={(e) => {
                  e.preventDefault()
                  handleDesktopCtaClick('/gamme')
                }}>
                  <span className="cta-label">{t('nav.see_all')}</span>
                  <span className="cta-action">{t('nav.our_types')} <span className="cta-arrow">→</span></span>
                </Link>
                <div className="mega-grid">
                  {typeMenuItems.map(item => (
                    <Link key={item.id} href={{ pathname: '/gamme/[slug]', params: { slug: item.slug } }} className="mega-item" onClick={() => setDesktopMenuOpen(null)}>
                      <Image
                        src={getMenuImageSrc(item.image_url, item.slug, 'type')}
                        alt={item.name}
                        width={400}
                        height={320}
                        sizes="20vw"
                        style={{ objectFit: 'cover', width: '100%' }}
                      />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Par Pièce — mega menu */}
          <div
            className={`nav-dropdown${desktopMenuOpen === 'espace' ? ' open' : ''}`}
            onMouseEnter={() => setDesktopMenuOpen('espace')}
            onMouseLeave={() => setDesktopMenuOpen((current) => current === 'espace' ? null : current)}
          >
            <Link href="/espaces" className="nav-dropdown-link">+ {t('nav.by_room')}</Link>
            <div className="nav-dropdown-menu nav-mega">
              <div className="mega-content">
                <Link href="/espaces" className="mega-cta-discover" onClick={(e) => {
                  e.preventDefault()
                  handleDesktopCtaClick('/espaces')
                }}>
                  <span className="cta-label">{t('nav.see_all')}</span>
                  <span className="cta-action">{t('nav.our_spaces')} <span className="cta-arrow">→</span></span>
                </Link>
                <div className="mega-grid">
                  {espaceMenuItems.map(item => (
                    <Link key={item.slug} href={{ pathname: '/espace/[slug]', params: { slug: item.slug } }} className="mega-item" onClick={() => setDesktopMenuOpen(null)}>
                      <Image
                        src={getMenuImageSrc(item.image_url, item.slug, 'espace')}
                        alt={item.name}
                        width={400}
                        height={320}
                        sizes="20vw"
                        style={{ objectFit: 'cover', width: '100%' }}
                      />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Collections — mega menu */}
          <div
            className={`nav-dropdown${desktopMenuOpen === 'collections' ? ' open' : ''}`}
            onMouseEnter={() => setDesktopMenuOpen('collections')}
            onMouseLeave={() => setDesktopMenuOpen((current) => current === 'collections' ? null : current)}
          >
            <Link href="/collections" className="nav-dropdown-link">+ {t('nav.collections')}</Link>
            <div className="nav-dropdown-menu nav-mega">
              <div className="mega-content">
                <Link href="/collections" className="mega-cta-discover" onClick={(e) => {
                  e.preventDefault()
                  handleDesktopCtaClick('/collections')
                }}>
                  <span className="cta-label">{t('nav.see_all')}</span>
                  <span className="cta-action">{t('nav.our_collections')} <span className="cta-arrow">→</span></span>
                </Link>
                <div className="mega-grid">
                  {collectionMenuItems.map(item => (
                    <Link key={item.slug} href={{ pathname: '/collection/[slug]', params: { slug: item.slug } }} className="mega-item" onClick={() => setDesktopMenuOpen(null)}>
                      <Image
                        src={getMenuImageSrc(item.image_url, item.slug, 'collection')}
                        alt={item.name}
                        width={400}
                        height={320}
                        sizes="20vw"
                        style={{ objectFit: 'cover', width: '100%' }}
                      />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logo — centered */}
        <Link href="/" className="logo">
          <Image src="/images/oaksome-logo.svg" alt="Vercelsome" width={120} height={20} style={{ height: '20px', width: 'auto' }} />
        </Link>

        <div className="nav-right">
          <Link href="/inspirations">{t('nav.inspiration_short')}</Link>
          <Link href="/comment-ca-marche">{t('nav.how_it_works')}</Link>
          <Link href="/configurer" className="nav-cta-link">{t('nav.configurator')}</Link>

          {/* Search */}
          <button
            className="nav-icon search-icon"
            onClick={() => setSearchOpen(true)}
            aria-label={t('nav.aria.search')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Account */}
          <Link href={isAuthenticated ? '/profile' : '/login'} className="nav-icon" aria-label={t('nav.aria.account')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

          {/* Wishlist */}
          <Link href="/wishlist" className="nav-wishlist" aria-label={t('nav.aria.wishlist')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                 strokeLinecap="round">
              <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {' '}
            <span className="wishlist-count">{wishlist.count} </span>
          </Link>

          {/* Cart */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="nav-cart"
            aria-label={t('nav.aria.cart')}
            aria-haspopup="dialog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
              <span className="cart-count">{cart.totalItems}</span>
          </button>
        </div>
      </nav>
    </>
  )
}
