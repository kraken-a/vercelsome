'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { NavItem, NavCollection } from '@/lib/api/navigation'
import type { ProductSummary } from '@/types/product'

type Props = {
  collections: ReadonlyArray<NavCollection>
  spaces: ReadonlyArray<NavItem>
  types: ReadonlyArray<NavItem>
  products: ReadonlyArray<ProductSummary>
  total: number
}

const PAGE_SIZE = 12

// Static finition slugs — labels resolved via t() inside component
const FINITION_SLUGS = ['melamine', 'laque'] as const

type FilterCategory = 'collections' | 'spaces' | 'types' | 'finitions'

type ActiveFilters = {
  readonly collections: Set<string>
  readonly spaces: Set<string>
  readonly types: Set<string>
  readonly finitions: Set<string>
}

function createEmptyFilters(): ActiveFilters {
  return {
    collections: new Set(),
    spaces: new Set(),
    types: new Set(),
    finitions: new Set(),
  }
}

function hasActiveFilters(filters: ActiveFilters): boolean {
  return Object.values(filters).some(group => group.size > 0)
}

function getProductCollections(product: ProductSummary): string[] {
  if (product.collection_slugs && product.collection_slugs.length > 0) {
    return [...product.collection_slugs]
  }
  return product.collection_slug ? [product.collection_slug] : []
}

function getProductSpaces(product: ProductSummary): string[] {
  if (product.space_slugs && product.space_slugs.length > 0) {
    return [...product.space_slugs]
  }
  return product.space_slug ? [product.space_slug] : []
}

export function ShopClient({ collections, spaces, types, products, total }: Props) {
  const t = useTranslations('shop.acheter')
  const tShop = useTranslations('shop')
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(createEmptyFilters)
  const [query, setQuery] = useState('')
  const [price, setPrice] = useState('all')
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())

  function toggleFilter(category: FilterCategory, value: string) {
    if (value === 'all') {
      setActiveFilters(createEmptyFilters())
      setVisible(PAGE_SIZE)
      return
    }

    setActiveFilters(prev => {
      const nextGroup = new Set(prev[category])
      if (nextGroup.has(value)) nextGroup.delete(value)
      else nextGroup.add(value)

      return {
        ...prev,
        [category]: nextGroup,
      }
    })
    setVisible(PAGE_SIZE)
  }

  function toggleWishlist(id: number) {
    setWishlist(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const filtered = useMemo(() => {
    const isAll = !hasActiveFilters(activeFilters)
    const q = query.toLowerCase().trim()

    return products.filter(p => {
      const productCollections = getProductCollections(p)
      const productSpaces = getProductSpaces(p)

      if (!isAll) {
        if (
          activeFilters.collections.size > 0 &&
          !productCollections.some(collection => activeFilters.collections.has(collection))
        ) {
          return false
        }

        if (activeFilters.types.size > 0 && !activeFilters.types.has(p.type_slug)) {
          return false
        }

        if (
          activeFilters.spaces.size > 0 &&
          !productSpaces.some(space => activeFilters.spaces.has(space))
        ) {
          return false
        }

        // Finitions are still static in the UI until Odoo exposes a product field for them.
      }
      if (price !== 'all') {
        const [min, max] = price.split('-').map(Number)
        if (p.price_ttc < min || p.price_ttc > max) return false
      }
      if (q && !p.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [activeFilters, query, price, products])

  const shown = filtered.slice(0, visible)
  const remaining = filtered.length - shown.length
  const isAll = !hasActiveFilters(activeFilters)
  const resultLabel = isAll && !query && price === 'all'
    ? t('result_default', { count: total })
    : filtered.length > 1
      ? t('result_filtered_plural', { filtered: filtered.length, total })
      : t('result_filtered', { filtered: filtered.length, total })

  function Chip({ category, value, label }: { category: FilterCategory; value: string; label: string }) {
    return (
      <span
        className={`filter-chip${activeFilters[category].has(value) ? ' active' : ''}`}
        onClick={() => toggleFilter(category, value)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && toggleFilter(category, value)}
      >{label}</span>
    )
  }

  return (
    <>
      <div className="container">
        {/* Search */}
        <div className="shop-search">
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={query}
            onChange={e => { setQuery(e.target.value); setVisible(PAGE_SIZE) }}
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <span
            className={`filter-chip${isAll ? ' active' : ''}`}
            onClick={() => toggleFilter('collections', 'all')}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && toggleFilter('collections', 'all')}
          >{t('filter_all')}</span>

          {collections.length > 0 && (
            <>
              <span className="filter-sep" />
              <span className="filter-group-label">{t('filter_collection')}</span>
              {collections.map(c => (
                <Chip key={c.slug} category="collections" value={c.slug} label={c.name} />
              ))}
            </>
          )}

          {spaces.length > 0 && (
            <>
              <span className="filter-sep" />
              <span className="filter-group-label">{t('filter_space')}</span>
              {spaces.map(s => (
                <Chip key={s.slug} category="spaces" value={s.slug} label={s.name} />
              ))}
            </>
          )}

          {types.length > 0 && (
            <>
              <span className="filter-sep" />
              <span className="filter-group-label">{t('filter_type')}</span>
              {types.map(t => (
                <Chip key={t.slug} category="types" value={t.slug} label={t.name} />
              ))}
            </>
          )}

          <span className="filter-sep" />
          <span className="filter-group-label">{t('filter_finition')}</span>
          {FINITION_SLUGS.map(f => (
            <Chip key={f} category="finitions" value={f} label={f === 'melamine' ? t('badge_melamine') : 'Laque — Atelier'} />
          ))}

          <span className="filter-sep" />
          <span className="filter-group-label">{t('filter_budget')}</span>
          <div className="price-filter">
            <select value={price} onChange={e => { setPrice(e.target.value); setVisible(PAGE_SIZE) }}>
              <option value="all">{t('price_all')}</option>
              <option value="0-2000">{t('price_under_2000')}</option>
              <option value="2000-4000">{t('price_2000_4000')}</option>
              <option value="4000-6000">{t('price_4000_6000')}</option>
              <option value="6000-99999">{t('price_over_6000')}</option>
            </select>
          </div>
        </div>

        <p className="result-count">{resultLabel}</p>
      </div>

      {/* Product grid */}
      <section style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="shop-grid">
            {/* CTA card */}
            <Link href="/configurer" className="cta-card">
              <div style={{ fontSize: '3rem' }}>✦</div>
              <h3>{t('cta_card_h3')}</h3>
              <p>{t('cta_card_p')}</p>
            </Link>

            {shown.map(p => (
              <div key={p.id} className="product-card">
                <div className="product-img">
                  <button
                    className={`wishlist-btn${wishlist.has(p.id) ? ' active' : ''}`}
                    onClick={() => toggleWishlist(p.id)}
                    aria-label={t('aria_wishlist_save')}
                  >
                    {wishlist.has(p.id) ? '♥' : '♡'}
                  </button>
                  <div className="product-img-carousel">
                    {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" />}
                  </div>
                </div>

                <div className="product-info">
                  <p className="price">{p.price_ttc.toLocaleString('fr-BE')} €</p>
                  <h4>{p.name}</h4>
                  <div className="product-meta">
                    <span className="badge-finition">{t('badge_melamine')}</span>
                    <span className="badge-delai">6-8 sem.</span>
                  </div>
                  <div className="product-tags">
                    {p.type_slug && (
                      <span className="product-tag">{p.type_slug.replace(/-/g, ' ').toUpperCase()}</span>
                    )}
                    {getProductCollections(p)[0] && (
                      <span className="product-tag tag-collection">{getProductCollections(p)[0].toUpperCase()}</span>
                    )}
                  </div>
                </div>

                <div className="product-footer">
                  <div className="color-dots">
                    {(p.colors ?? []).slice(0, 3).map((c, i) => (
                      <span
                        key={i}
                        className="color-dot"
                        style={{ background: c.hex, ...(c.hex === '#FFFFFF' || c.hex === '#ffffff' ? { borderColor: '#ddd' } : {}) }}
                        title={c.name}
                      />
                    ))}
                    {(p.colors ?? []).length > 3 && (
                      <span className="color-more">+{(p.colors ?? []).length - 3}</span>
                    )}
                  </div>
                  <Link href={`/configurer?product=${p.id}`} className="btn-configure">{tShop('btn_configure')}</Link>
                </div>
              </div>
            ))}
          </div>

          {remaining > 0 && (
            <div style={{ textAlign: 'center', margin: '3rem 0' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setVisible(v => v + PAGE_SIZE)}
              >
                {t('load_more')}{' '}
                <span className="load-more-count">
                  {remaining > 1 ? t('load_more_count_plural', { remaining }) : t('load_more_count', { remaining })}
                </span>
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
