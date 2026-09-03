'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import { Link, useRouter, usePathname } from '@/i18n/navigation'
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

const LOCALES = [
  { code: 'fr', labels: { fr: 'Français',    en: 'French',  nl: 'Frans'      } },
  { code: 'en', labels: { fr: 'Anglais',     en: 'English', nl: 'Engels'     } },
  { code: 'nl', labels: { fr: 'Néerlandais', en: 'Dutch',   nl: 'Nederlands' } },
] as const

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
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const routeParams = useParams()
  const { isAuthenticated } = useAuth()
  const { cart, setCartOpen } = useCart()
  const { wishlist } = useWishlist()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState<DesktopMenuKey | null>(null)
  const [navBlocked, setNavBlocked] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [localeOpen, setLocaleOpen] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([])
  const [searchSuggestions, setSearchSuggestions] = useState<{ collections: SearchSuggestion[]; types: SearchSuggestion[]; spaces: SearchSuggestion[] } | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const localeRef = useRef<HTMLDivElement>(null)
  const menuBlockedRef = useRef(false)

  useEffect(() => {
    if (!localeOpen) return
    function handleOutside(e: MouseEvent) {
      if (localeRef.current && !localeRef.current.contains(e.target as Node)) setLocaleOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [localeOpen])
  const typeMenuItems = orderMenuItems(typeItems, TYPE_ORDER)
  const espaceMenuItems = orderMenuItems(espaceItems, ESPACE_ORDER)
  const collectionMenuItems = orderMenuItems(collectionItems, COLLECTION_ORDER)

  function closeDesktopMenu() {
    menuBlockedRef.current = true
    setDesktopMenuOpen(null)
    setNavBlocked(true)
    setTimeout(() => {
      menuBlockedRef.current = false
      setNavBlocked(false)
    }, 400)
  }

  function handleDesktopCtaClick(path: '/gamme' | '/espaces' | '/collections') {
    closeDesktopMenu()
    router.push(path)
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setDesktopMenuOpen(null)
  }, [pathname])

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
          {!searchLoading && query.length >= 3 && searchProducts.length === 0 && (() => {
            const q = query.toLowerCase()
            const hasLocalTypes = typeMenuItems.some(i => i.name.toLowerCase().includes(q))
            const hasLocalSpaces = espaceMenuItems.some(i => i.name.toLowerCase().includes(q))
            const hasApiSuggestions = searchSuggestions && (searchSuggestions.types.length > 0 || searchSuggestions.spaces.length > 0 || searchSuggestions.collections.length > 0)
            return !hasApiSuggestions && !hasLocalTypes && !hasLocalSpaces
          })() && (
            <p style={{ fontSize: '13px', color: '#999' }}>{t('search.no_results', { query })}</p>
          )}
          {searchSuggestions && (
            <>
              {(() => {
                const apiTypes = searchSuggestions.types
                const q = query.toLowerCase()
                const localTypes = apiTypes.length > 0 ? apiTypes : typeMenuItems
                  .filter(item => item.name.toLowerCase().includes(q))
                  .map(item => ({ id: item.id, name: item.name, slug: item.slug }))
                return localTypes.length > 0 ? (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '11px', fontFamily: "'PP Air Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: '#696761', margin: '0 0 6px' }}>{t('search.section_types')}</p>
                    {localTypes.map(item => (
                      <Link key={item.id} href={{ pathname: '/gamme/[slug]', params: { slug: item.slug } }} onClick={() => setSearchOpen(false)}
                        style={{ display: 'block', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px', textDecoration: 'none', color: 'inherit' }}>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                ) : null
              })()}
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
            <Image src="/images/oaksome-logo.svg" alt="Oaksome" width={120} height={22} style={{ height: '22px', width: 'auto' }} />
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

        <div className="nav-left" style={navBlocked ? { pointerEvents: 'none' } : undefined}>
          <Link href="/acheter">{t('nav.our_furniture')}</Link>

          {/* Par Type — mega menu */}
          <div
            className={`nav-dropdown${desktopMenuOpen === 'type' ? ' open' : ''}`}
            onMouseEnter={() => { if (!menuBlockedRef.current) setDesktopMenuOpen('type') }}
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
                    <Link key={item.id} href={{ pathname: '/gamme/[slug]', params: { slug: item.slug } }} className="mega-item" onClick={() => closeDesktopMenu()}>
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
            onMouseEnter={() => { if (!menuBlockedRef.current) setDesktopMenuOpen('espace') }}
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
                    <Link key={item.slug} href={{ pathname: '/espace/[slug]', params: { slug: item.slug } }} className="mega-item" onClick={() => closeDesktopMenu()}>
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
            onMouseEnter={() => { if (!menuBlockedRef.current) setDesktopMenuOpen('collections') }}
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
                    <Link key={item.slug} href={{ pathname: '/collection/[slug]', params: { slug: item.slug } }} className="mega-item" onClick={() => closeDesktopMenu()}>
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
          <Image src="/images/oaksome-logo.svg" alt="Oaksome" width={120} height={20} style={{ height: '20px', width: 'auto' }} />
        </Link>

        <div className="nav-right">
          <Link href="/inspirations">{t('nav.inspiration_short')}</Link>
          <Link href="/comment-ca-marche">{t('nav.how_it_works')}</Link>
          <Link href="/configurer" className="nav-cta-link">{t('nav.configurator')}</Link>

          {/* Language switcher */}
          <div className="locale-switcher" ref={localeRef}>
            <button
              className="locale-trigger"
              onClick={() => setLocaleOpen(o => !o)}
              aria-label="Changer de langue"
              aria-haspopup="listbox"
              aria-expanded={localeOpen}
            >
              <svg className="lang-globe" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18C7.7615 18 6.59483 17.7632 5.5 17.2895C4.40517 16.8157 3.45167 16.1727 2.6395 15.3605C1.82733 14.5483 1.18433 13.5948 0.7105 12.5C0.236833 11.4052 0 10.2385 0 9C0 7.75767 0.236833 6.59 0.7105 5.497C1.18433 4.40417 1.82733 3.45167 2.6395 2.6395C3.45167 1.82733 4.40517 1.18433 5.5 0.7105C6.59483 0.236833 7.7615 0 9 0C10.2423 0 11.41 0.236833 12.503 0.7105C13.5958 1.18433 14.5483 1.82733 15.3605 2.6395C16.1727 3.45167 16.8157 4.40417 17.2895 5.497C17.7632 6.59 18 7.75767 18 9C18 10.2385 17.7632 11.4052 17.2895 12.5C16.8157 13.5948 16.1727 14.5483 15.3605 15.3605C14.5483 16.1727 13.5958 16.8157 12.503 17.2895C11.41 17.7632 10.2423 18 9 18ZM9 17.0077C9.58717 16.2539 10.0712 15.5135 10.452 14.7865C10.8327 14.0597 11.1423 13.2463 11.3807 12.3463H6.61925C6.88342 13.2974 7.19942 14.1365 7.56725 14.8635C7.93525 15.5903 8.41283 16.3051 9 17.0077ZM7.727 16.8577C7.26033 16.3078 6.83433 15.6279 6.449 14.8182C6.06383 14.0086 5.777 13.1846 5.5885 12.3463H1.75375C2.32692 13.5898 3.13942 14.6096 4.19125 15.4057C5.24325 16.2019 6.42183 16.6859 7.727 16.8577ZM10.273 16.8577C11.5782 16.6859 12.7567 16.2019 13.8087 15.4057C14.8606 14.6096 15.6731 13.5898 16.2463 12.3463H12.4115C12.159 13.1974 11.8401 14.0278 11.4548 14.8375C11.0696 15.6472 10.6757 16.3206 10.273 16.8577ZM1.34625 11.3463H5.38075C5.30508 10.9359 5.25158 10.5362 5.22025 10.147C5.18875 9.758 5.173 9.37567 5.173 9C5.173 8.62433 5.18875 8.242 5.22025 7.853C5.25158 7.46383 5.30508 7.06408 5.38075 6.65375H1.34625C1.23725 6.99992 1.15225 7.37717 1.09125 7.7855C1.03042 8.19383 1 8.59867 1 9C1 9.40133 1.03042 9.80617 1.09125 10.2145C1.15225 10.6228 1.23725 11.0001 1.34625 11.3463ZM6.38075 11.3463H11.6193C11.6949 10.9359 11.7484 10.5426 11.7797 10.1663C11.8112 9.79008 11.827 9.40133 11.827 9C11.827 8.59867 11.8112 8.20992 11.7797 7.83375C11.7484 7.45742 11.6949 7.06408 11.6193 6.65375H6.38075C6.30508 7.06408 6.25158 7.45742 6.22025 7.83375C6.18875 8.20992 6.173 8.59867 6.173 9C6.173 9.40133 6.18875 9.79008 6.22025 10.1663C6.25158 10.5426 6.30508 10.9359 6.38075 11.3463ZM12.6193 11.3463H16.6538C16.7628 11.0001 16.8477 10.6228 16.9088 10.2145C16.9696 9.80617 17 9.40133 17 9C17 8.59867 16.9696 8.19383 16.9088 7.7855C16.8477 7.37717 16.7628 6.99992 16.6538 6.65375H12.6193C12.6949 7.06408 12.7484 7.46383 12.7797 7.853C12.8112 8.242 12.827 8.62433 12.827 9C12.827 9.37567 12.8112 9.758 12.7797 10.147C12.7484 10.5362 12.6949 10.9359 12.6193 11.3463ZM12.4115 5.65375H16.2463C15.6602 4.38458 14.8573 3.36475 13.8375 2.59425C12.8177 1.82375 11.6295 1.33333 10.273 1.123C10.7397 1.73717 11.1593 2.43942 11.5318 3.22975C11.9043 4.02025 12.1975 4.82825 12.4115 5.65375ZM6.61925 5.65375H11.3807C11.1166 4.71542 10.7909 3.86675 10.4038 3.10775C10.0166 2.34875 9.54867 1.64358 9 0.99225C8.45133 1.64358 7.98342 2.34875 7.59625 3.10775C7.20908 3.86675 6.88342 4.71542 6.61925 5.65375ZM1.75375 5.65375H5.5885C5.8025 4.82825 6.09575 4.02025 6.46825 3.22975C6.84075 2.43942 7.26033 1.73717 7.727 1.123C6.35767 1.33333 5.16633 1.82692 4.153 2.60375C3.1395 3.38075 2.33975 4.39742 1.75375 5.65375Z" fill="black"/>
              </svg>
            </button>
            {localeOpen && (
              <ul className="locale-dropdown" role="listbox">
                {LOCALES.map(l => (
                  <li key={l.code} role="option" aria-selected={locale === l.code}>
                    <button
                      onClick={() => { router.push(
                        // @ts-expect-error -- next-intl requires pathname+params for dynamic routes; params always match current pathname
                        { pathname, params: routeParams },
                        { locale: l.code }
                      ); setLocaleOpen(false) }}
                      className={locale === l.code ? 'active' : ''}
                    >
                      {l.labels[locale as keyof typeof l.labels]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
            <span className="wishlist-count">{wishlist.count}</span>
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
