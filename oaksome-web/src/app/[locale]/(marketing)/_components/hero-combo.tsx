'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { toImageProxyUrl } from '@/lib/image-url'
import type { ComboConfig, ComboBanner } from '@/lib/api/combo-config'

type Props = { config: ComboConfig }
type FilterKey = 'space' | 'category' | 'style'
type Filters = { spaces: Set<number>; categories: Set<number>; styles: Set<number> }

const ROTATION_MS = 7000
const EMPTY_FILTERS: Filters = { spaces: new Set(), categories: new Set(), styles: new Set() }

function uniqueById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>()
  return items.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('fr-BE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)
  } catch {
    return `${price} ${currency}`
  }
}

function matchesBanner(b: ComboBanner, f: Filters): boolean {
  const spaceOk = f.spaces.size === 0 || (b.space != null && f.spaces.has(b.space.id))
  const catOk = f.categories.size === 0 || (b.category != null && f.categories.has(b.category.id))
  const styleOk = f.styles.size === 0 || (b.style != null && f.styles.has(b.style.id))
  return spaceOk && catOk && styleOk
}

const GridIcon = () => (
  <svg className="hh-edit" viewBox="0 0 17 15" fill="currentColor" aria-hidden="true">
    <circle cx="1.5" cy="1.5" r="1.5"/>
    <circle cx="8.5" cy="1.5" r="1.5"/>
    <circle cx="15.5" cy="1.5" r="1.5"/>
    <circle cx="1.5" cy="7.5" r="1.5"/>
    <circle cx="8.5" cy="7.5" r="1.5"/>
    <circle cx="15.5" cy="7.5" r="1.5"/>
    <circle cx="1.5" cy="13.5" r="1.5"/>
    <circle cx="8.5" cy="13.5" r="1.5"/>
    <circle cx="15.5" cy="13.5" r="1.5"/>
  </svg>
)

const PlusIcon = () => (
  <svg viewBox="0 0 13 13" aria-hidden="true" width="13" height="13">
    <path d="M6.5 0v13M0 6.5h13" stroke="currentColor" strokeWidth="1.1" fill="none"/>
  </svg>
)

export function HeroCombo({ config }: Props) {
  const t = useTranslations('home')
  const { banners } = config

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [openDropdowns, setOpenDropdowns] = useState<Set<FilterKey>>(new Set())
  const [timerKey, setTimerKey] = useState(0)
  const [mobileExpanded, setMobileExpanded] = useState(false)

  const spaces = useMemo(() => uniqueById(banners.filter(b => b.space).map(b => b.space!)), [banners])
  const categories = useMemo(() => uniqueById(banners.filter(b => b.category).map(b => b.category!)), [banners])
  const styles = useMemo(() => uniqueById(banners.filter(b => b.style).map(b => b.style!)), [banners])

  const filteredBanners = useMemo(
    () => banners.filter(b => matchesBanner(b, filters)),
    [banners, filters]
  )

  const displayBanners = filteredBanners.length > 0 ? filteredBanners : banners
  const current: ComboBanner | undefined = displayBanners[displayIndex % displayBanners.length] ?? displayBanners[0]

  const advance = useCallback(() => {
    setDisplayIndex(prev => (prev + 1) % displayBanners.length)
  }, [displayBanners.length])

  useEffect(() => {
    if (displayBanners.length <= 1) return
    const timer = setInterval(advance, ROTATION_MS)
    return () => clearInterval(timer)
  }, [advance, timerKey, displayBanners.length])

  const toggleFilter = useCallback((type: 'spaces' | 'categories' | 'styles', id: number) => {
    setFilters(prev => {
      const set = new Set(prev[type])
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return { ...prev, [type]: set }
    })
    setDisplayIndex(0)
    setTimerKey(k => k + 1)
  }, [])

  const closeOne = (key: FilterKey) => {
    setOpenDropdowns(prev => { const n = new Set(prev); n.delete(key); return n })
  }
  const closeAll = () => setOpenDropdowns(new Set())

  const toggleMobile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMobileExpanded(prev => !prev)
    setOpenDropdowns(new Set())
  }

  const toggle = (key: FilterKey) => (e: React.MouseEvent) => {
    e.stopPropagation()
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600
    setOpenDropdowns(prev => {
      const isOpen = prev.has(key)
      if (isMobile) {
        return isOpen ? new Set<FilterKey>() : new Set<FilterKey>([key])
      }
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  }

  const isOpen = (key: FilterKey) => openDropdowns.has(key)

  // Pill label: show selected name if 1, count if multiple, default if none
  const spaceLabel = current?.space?.name ?? t('combo_hero.filter_space')
  const categoryLabel = current?.category?.name ?? t('combo_hero.filter_category')
  const styleLabel = current?.style?.name ?? t('combo_hero.filter_style')

  return (
    <section
      className="hero-combo"
      onClick={closeAll}
      aria-label={t('hero.title')}
    >
      <h1 className="sr-only">{t('hero.title')}</h1>

      {/* Background images — crossfade over filtered set */}
      {banners.map((b, i) => (
        <div
          key={b.id}
          className="hh-bg"
          style={{
            backgroundImage: b.image_url ? `url(${toImageProxyUrl(b.image_url)})` : undefined,
            opacity: b.id === current?.id ? 1 : 0,
          }}
          aria-hidden="true"
        />
      ))}
      <div className="hh-overlay" aria-hidden="true" />

      {/* Controls overlay */}
      <div className="hh-controls">
        <div className={`hh-selectors${mobileExpanded ? ' is-mobile-open' : ''}`}>

          {/* Space pill + popover */}
          <div className="hh-pill-wrap hh-pill-wrap--filter">
            {isOpen('space') && (
              <div className="hh-pop hh-pop--start" role="dialog" aria-label={t('combo_hero.filter_space')} onClick={e => e.stopPropagation()}>
                <div className="hh-pop-head">
                  <span className="hh-pop-label">{t('combo_hero.filter_space')}</span>
                  <button type="button" className="hh-pop-x" onClick={() => closeOne('space')} aria-label="Fermer">×</button>
                </div>
                <ul className="hh-pop-list">
                  {spaces.map(s => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={`hh-pop-opt${(filters.spaces.size > 0 ? filters.spaces.has(s.id) : current?.space?.id === s.id) ? ' is-active' : ''}`}
                        onClick={() => toggleFilter('spaces', s.id)}
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              className={`hh-sel hh-sel--white${filters.spaces.size > 0 ? ' is-filtered' : ''}`}
              onClick={toggle('space')}
              aria-expanded={isOpen('space')}
              aria-haspopup="dialog"
            >
              <span className="hh-dot" />
              <span className="hh-lbl">{spaceLabel}</span>
              <GridIcon />
            </button>
          </div>

          {/* Category pill + popover */}
          <div className="hh-pill-wrap hh-pill-wrap--filter">
            {isOpen('category') && (
              <div className="hh-pop hh-pop--offset" role="dialog" aria-label={t('combo_hero.filter_category')} onClick={e => e.stopPropagation()}>
                <div className="hh-pop-head">
                  <span className="hh-pop-label">{t('combo_hero.filter_category')}</span>
                  <button type="button" className="hh-pop-x" onClick={() => closeOne('category')} aria-label="Fermer">×</button>
                </div>
                <ul className="hh-pop-list">
                  {categories.map(c => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`hh-pop-opt${(filters.categories.size > 0 ? filters.categories.has(c.id) : current?.category?.id === c.id) ? ' is-active' : ''}`}
                        onClick={() => toggleFilter('categories', c.id)}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              className={`hh-sel hh-sel--dark${filters.categories.size > 0 ? ' is-filtered' : ''}`}
              onClick={toggle('category')}
              aria-expanded={isOpen('category')}
              aria-haspopup="dialog"
            >
              <span className="hh-dot" />
              <span className="hh-lbl">{categoryLabel}</span>
            </button>
          </div>

          {/* Style pill + popover */}
          <div className="hh-pill-wrap hh-pill-wrap--filter">
            {isOpen('style') && (
              <div className="hh-pop hh-pop--end" role="dialog" aria-label={t('combo_hero.filter_style')} onClick={e => e.stopPropagation()}>
                <div className="hh-pop-head">
                  <span className="hh-pop-label">{t('combo_hero.filter_style')}</span>
                  <button type="button" className="hh-pop-x" onClick={() => closeOne('style')} aria-label="Fermer">×</button>
                </div>
                <ul className="hh-pop-list">
                  {styles.map(s => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className={`hh-pop-opt${(filters.styles.size > 0 ? filters.styles.has(s.id) : current?.style?.id === s.id) ? ' is-active' : ''}`}
                        onClick={() => toggleFilter('styles', s.id)}
                      >
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              className={`hh-sel hh-sel--lime${filters.styles.size > 0 ? ' is-filtered' : ''}`}
              onClick={toggle('style')}
              aria-expanded={isOpen('style')}
              aria-haspopup="dialog"
            >
              <span className="hh-dot" />
              <span className="hh-lbl">{styleLabel}</span>
            </button>
          </div>

          {/* Mobile: COMBINE toggle — hidden on desktop */}
          <button
            type="button"
            className="hh-sel hh-sel--white hh-mobile-toggle"
            onClick={toggleMobile}
            aria-expanded={mobileExpanded}
          >
            <span className="hh-dot" />
            <span className="hh-lbl">{t('combo_hero.combine')}</span>
            <span className="hh-toggle-icon" aria-hidden="true">
              {mobileExpanded ? '×' : '+'}
            </span>
          </button>

          {/* Configurator CTA */}
          <Link href="/configurer" className="hh-configurer" aria-label={t('hero.cta')}>
            <span className="hh-cta-t">{t('combo_hero.cta_short')}</span>
            <span className="hh-cta-d" aria-hidden="true" />
            <span className="hh-cta-p" aria-hidden="true">
              <PlusIcon />
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom-right: mini product card */}
      {current?.product && (
        <Link href={`/configurer?template_id=${current.product.id}`} className="hh-mini" aria-label={current.product.name}>
          <span className="hh-mini-img">
            {current.product.image_url && (
              <img src={toImageProxyUrl(current.product.image_url)} alt="" />
            )}
            <span className="hh-mini-plus" aria-hidden="true">+</span>
          </span>
          <span className="hh-mini-cap">
            <span className="hh-mini-name">{current.product.name}</span>
            <span className="hh-mini-price">{formatPrice(current.product.price_ttc, current.product.currency)} <span className="badge-ttc">TTC</span></span>
          </span>
        </Link>
      )}

    </section>
  )
}
