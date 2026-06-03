'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Link, useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCart } from '@/features/cart/hooks'
import { useWishlist } from '@/features/wishlist/hooks'
import { useToast } from '@/features/toast/context'
import { getCheckoutUrl } from '@/lib/api/cart'
import { trackViewCart, trackRemoveFromCart } from '@/features/tracking/events'
import { getSo1Info } from '@/lib/api/orders'
import type { So1Info } from '@/lib/api/orders'
import Assurance from '@/components/assurance/assurance'
import type { CartItem } from '@/features/cart/types'

import './panier.css'

function toCurrencyLocale(locale: string) {
  if (locale === 'nl') return 'nl-BE'
  if (locale === 'en') return 'en-BE'
  return 'fr-BE'
}

function fmt(price: number, locale: string) {
  return new Intl.NumberFormat(toCurrencyLocale(locale), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
}

function fmtAmount(price: number, locale: string) {
  return new Intl.NumberFormat(toCurrencyLocale(locale), { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)
}

const SKIP_KEYS = new Set(['name', 'action', 'aricles', 'articles'])

function CartConfigLines({ config }: { config: Record<string, unknown> }) {
  const lines: React.ReactNode[] = []

  // Dimensions line: "H 240 × W 200 × D 60 cm"
  const dim = config['dimension'] as Record<string, unknown> | undefined
  if (dim) {
    const parts: string[] = []
    if (dim['height'] ?? dim['hauteur']) parts.push(`H ${dim['height'] ?? dim['hauteur']}`)
    if (dim['width']  ?? dim['largeur'])  parts.push(`W ${dim['width']  ?? dim['largeur']}`)
    if (dim['depth']  ?? dim['profondeur']) parts.push(`D ${dim['depth'] ?? dim['profondeur']}`)
    if (parts.length) lines.push(
      <span key="dim" style={{ fontFamily: "'PP Air Mono', monospace", fontSize: '0.8rem', color: '#0C524E', letterSpacing: '0.03em' }}>
        {parts.join(' × ')} cm
      </span>
    )
  }

  // Articles / options (aricles typo or articles)
  const arts = (config['aricles'] ?? config['articles']) as unknown[] | undefined
  if (Array.isArray(arts)) {
    arts.forEach((art, i) => {
      if (!art || typeof art !== 'object') return
      const a = art as Record<string, unknown>
      const label = (a['name'] ?? a['label'] ?? a['value']) as string | undefined
      const hex   = (a['color'] ?? a['hex'] ?? a['couleur_hex']) as string | undefined
      if (!label) return
      lines.push(
        <span key={`art-${i}`} style={{ fontSize: '0.88rem', color: '#696761', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            display: 'inline-block', width: 10, height: 10,
            borderRadius: '50%',
            background: hex || '#696761',
            border: '1px solid rgba(0,0,0,0.12)',
            flexShrink: 0,
          }} />
          {label}
        </span>
      )
    })
  }

  // Remaining plain string/number values
  Object.entries(config).forEach(([k, v]) => {
    if (SKIP_KEYS.has(k) || k === 'dimension') return
    if (typeof v === 'string' || typeof v === 'number') {
      lines.push(<span key={k} style={{ fontSize: '0.88rem', color: '#696761' }}>{String(v)}</span>)
    }
  })

  if (!lines.length) return null
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>{lines}</div>
}

function CartItemRow({ item }: { item: CartItem }) {
  const t = useTranslations('cart')
  const { removeItem, updateQuantity } = useCart()
  const { addItem: addToWishlistItem } = useWishlist()
  const toast = useToast()
  const locale = useLocale()
  const [saving, setSaving] = useState(false)

  const configurerHref = (() => {
    const dim = (item.config?.dimension ?? {}) as Record<string, unknown>
    const p = new URLSearchParams()
    p.set('template_id', String(item.productId))
    if (dim.width)  p.set('width',  String(dim.width))
    if (dim.height) p.set('height', String(dim.height))
    if (dim.depth)  p.set('depth',  String(dim.depth))
    return { pathname: '/configurer' as const, query: Object.fromEntries(p.entries()) }
  })()

  async function handleSaveToWishlist() {
    setSaving(true)
    try {
      const added = await addToWishlistItem(item.productId, item.config)
      if (added) {
        await removeItem(item.productId)
        toast.show(t('wishlist_moved'))
      } else {
        toast.show(t('wishlist_already'), 'info')
      }
    } catch (err) {
      console.error('[panier] move-to-wishlist failed:', err)
      toast.show(t('wishlist_move_failed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleRemove() {
    trackRemoveFromCart([{ id: item.productId, price: item.price, quantity: item.quantity }])
    removeItem(item.productId)
  }

  return (
    <div className="cart-item">
      <div style={{ width: 100, height: 100, background: '#ece9e2', position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="100px" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#ece9e2' }} />
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>{item.name}</span>
        {item.config && <CartConfigLines config={item.config} />}
      </div>

      <div className="cart-item-right">
        <span style={{ fontSize: '1.1rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(item.price * item.quantity, locale)}</span>
        <div className="qty-stepper">
          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label={t('aria_decrease')}>−</button>
          <span className="qty-value">{item.quantity}</span>
          <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label={t('aria_increase')}>+</button>
        </div>
        <Link href={configurerHref} className="cart-edit" title={t('btn_edit')}>
          ✎
        </Link>
        <button
          type="button"
          className="cart-save"
          onClick={handleSaveToWishlist}
          disabled={saving}
          title={t('aria_save_wishlist')}
        >
          {saving ? '...' : '♡'}
        </button>
        <button type="button" className="cart-remove" onClick={handleRemove} title={t('aria_remove')}>×</button>
      </div>
    </div>
  )
}

export default function PanierPage() {
  const t = useTranslations('cart')
  const locale = useLocale()
  const router = useRouter()
  const { cart, setTvaRate } = useCart()
  const [promoCode, setPromoCode] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [so1Id, setSo1Id] = useState<string | null>(null)
  const [so1Info, setSo1Info] = useState<So1Info | null>(null)
  const tracked = useRef(false)

  useEffect(() => {
    const id = localStorage.getItem('oaksome_so1_id')
    setSo1Id(id)
    if (id) {
      getSo1Info(parseInt(id, 10)).then(r => {
        if (r.success) {
          setSo1Info(r.data)
          setTvaRate(r.data.tva6 ? 0.06 : 0.21)
        }
      })
    }
  }, [setTvaRate])

  useEffect(() => {
    if (cart.items.length > 0 && !tracked.current) {
      tracked.current = true
      trackViewCart(
        cart.items.map(i => ({ id: i.productId, price: i.price, quantity: i.quantity })),
        cart.subtotal,
      )
    }
  }, [cart.items, cart.subtotal])

  async function handleCheckout() {
    const rawSo1Id = localStorage.getItem('oaksome_so1_id')
    const so1IdNum = rawSo1Id ? parseInt(rawSo1Id, 10) : undefined

    // SO2 flow (technicien) : appel direct sans TVA step
    if (so1IdNum) {
      setCheckoutLoading(true)
      setCheckoutError('')
      try {
        const result = await getCheckoutUrl(undefined, so1IdNum)
        if (result.success && result.data.is_so2) {
          localStorage.removeItem('oaksome_so1_id')
          const qs = new URLSearchParams()
          if (result.data.order_id) qs.set('order', String(result.data.order_id))
          if (result.data.order_name) qs.set('ref', result.data.order_name)
          qs.set('so2', '1')
          qs.set('tech', '1')
          router.push({ pathname: '/checkout/success', query: Object.fromEntries(qs.entries()) })
          return
        }
        setCheckoutError((!result.success && result.error) || 'Une erreur est survenue.')
      } catch {
        setCheckoutError('Une erreur est survenue.')
      } finally {
        setCheckoutLoading(false)
      }
      return
    }

    // SO1 flow : TVA modal + form gérés par /checkout
    router.push('/checkout')
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link href="/">{t('breadcrumb_home')}</Link> ›{' '}
        <span style={{ color: '#696761' }}>{t('breadcrumb_current')}</span>
      </div>

      {/* Banner SO2 technicien */}
      {so1Id && (
        <div style={{
          background: '#0C524E',
          color: '#fff',
          padding: '0.85rem 1.5rem',
          fontSize: '0.85rem',
          lineHeight: 1.5,
        }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600 }}>{t('tech_banner_mode')}</span>
            {so1Info ? (
              <>
                <span>{t('tech_banner_so1')} <strong>{so1Info.name}</strong></span>
                <span>{t('tech_banner_client')} <strong>{so1Info.partner_name}</strong></span>
                {so1Info.so2_name && (
                  <span style={{ color: '#BEECCC' }}>{t('tech_banner_so2_exists')} {so1Info.so2_name}</span>
                )}
              </>
            ) : (
              <span>SO1 #{so1Id}</span>
            )}
            <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: '0.78rem' }}>
              {t('tech_banner_note')}
            </span>
          </div>
        </div>
      )}

      {cart.items.length === 0 ? (
        /* ── Panier vide ── */
        <div style={{
          textAlign: 'center',
          padding: '6rem 2rem 8rem',
          minHeight: '55vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '1.5rem', opacity: 0.3 }}>🛒</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.8rem' }}>{t('empty')}</h1>
          <p style={{ fontSize: '1.05rem', color: '#696761', maxWidth: 420, marginBottom: '2rem', lineHeight: 1.5 }}>
            {t('empty_desc')}
          </p>
          <Link href="/acheter" className="btn btn-primary" style={{ marginBottom: '1rem' }}>
            {t('empty_cta_shop')}
          </Link>
          <Link href="/collections" style={{ color: '#696761', fontSize: '0.9rem', textDecoration: 'none' }}>
            {t('empty_cta_continue')}
          </Link>
        </div>
      ) : (
        /* ── Panier rempli ── */
        <section style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
          <div className="container">
            <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.3rem' }}>
              {t('page_title')}{' '}
              <span style={{ fontSize: '1rem', color: '#696761', fontWeight: 400 }}>
                {cart.totalItems === 1 ? t('count_one', { count: cart.totalItems }) : t('count_other', { count: cart.totalItems })}
              </span>
            </h1>

            <div className="cart-layout">
              {/* Articles */}
              <div>
                {cart.items.map(item => (
                  <CartItemRow key={item.productId} item={item} />
                ))}
              </div>

              {/* Récapitulatif */}
              <div className="cart-summary">
                <h3>
                  {t('summary_title')}
                  {so1Info && (
                    <span style={{ fontFamily: "'PP Air Mono', monospace", fontSize: '0.82rem', fontWeight: 400, color: '#0C524E', marginLeft: '0.6rem', letterSpacing: '0.02em' }}>
                      — {so1Info.name}
                    </span>
                  )}
                </h3>

                {/* SO1 info — mode technicien */}
                {so1Id && (
                  <div style={{
                    background: '#F0F8F6',
                    border: '1px solid #0C524E',
                    borderRadius: 2,
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                  }}>
                    <div style={{ fontWeight: 600, color: '#0C524E', marginBottom: '0.3rem' }}>
                      {t('tech_mode_title')}
                    </div>
                    {so1Info ? (
                      <div style={{ color: '#1a1a1a', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <div><span style={{ color: '#696761' }}>{t('tech_initial_order')} </span><strong>{so1Info.name}</strong></div>
                        <div><span style={{ color: '#696761' }}>{t('tech_client')} </span><strong>{so1Info.partner_name}</strong></div>
                        {so1Info.so2_name && (
                          <div style={{ color: '#696761' }}>{t('tech_so2_exists')} <strong style={{ color: '#0C524E' }}>{so1Info.so2_name}</strong></div>
                        )}

                        {/* Lignes SO1 (hors sections) */}
                        {so1Info.lines.filter(l => !l.is_section).length > 0 && (
                          <div style={{ marginTop: '0.6rem', borderTop: '1px solid #c8e6e0', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {so1Info.lines.filter(l => !l.is_section).map(line => {
                              const isDP = line.is_downpayment || /^acompte/i.test(line.name.trim())
                              const displayName = isDP
                                ? line.name.replace(/\s*\(brouillon\)/i, '').replace(/\s*\(draft\)/i, '').trim()
                                : line.name
                              const amount = isDP
                                ? ((so1Info.amount_deposited ?? 0) > 0 ? so1Info.amount_deposited! : line.subtotal)
                                : line.subtotal
                              return (
                                <React.Fragment key={line.id}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                    <span style={{ color: '#1a1a1a', fontSize: '0.82rem', flex: 1, lineHeight: 1.4 }}>
                                      {displayName}
                                      {!isDP && line.qty > 1 && <span style={{ color: '#696761' }}> ×{line.qty}</span>}
                                    </span>
                                    <span style={{ fontWeight: 500, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{fmtAmount(amount, locale)}</span>
                                  </div>
                                  {isDP && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#696761' }}>
                                      <span>{t('tech_tva', { rate: so1Info.tva6 ? '6' : '21' })}</span>
                                      <span>{fmtAmount(so1Info.amount_tax, locale)}</span>
                                    </div>
                                  )}
                                </React.Fragment>
                              )
                            })}
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #c8e6e0', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('tech_total_ttc')}</span>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0C524E' }}>{fmtAmount(so1Info.amount_total, locale)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: '#696761' }}>SO1 #{so1Id}</div>
                    )}
                  </div>
                )}

                {/* Titre commande finale (SO2) — mode technicien */}
                {so1Id && (
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                    {t('tech_final_order')}
                  </div>
                )}

                <div className="summary-row">
                  <span className="label">{t('summary_subtotal_ht')}</span>
                  <span className="value">{fmtAmount(cart.subtotal, locale)}</span>
                </div>
                <div className="summary-row">
                  <span className="label">
                    {t('summary_tva')} {cart.tvaRate === 0.06 ? (
                      <span style={{ color: '#0C524E', fontWeight: 500 }}>6 %</span>
                    ) : '21 %'}
                  </span>
                  <span className="value">{fmtAmount(cart.subtotal * cart.tvaRate, locale)}</span>
                </div>
                <div className="summary-row">
                  <span className="label">{t('summary_delivery')}</span>
                  <span className="value green">{t('summary_delivery_value')}</span>
                </div>
                <div className="summary-row">
                  <span className="label">{t('summary_installation')}</span>
                  <span className="value green">{t('summary_installation_value')}</span>
                </div>

                <hr className="summary-divider" />

                <div className="promo-input">
                  <input
                    type="text"
                    placeholder={t('promo_placeholder')}
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                  />
                  <button type="button">{t('promo_apply')}</button>
                </div>

                <hr className="summary-divider" />

                <div className="summary-total">
                  <span>{t('total_ttc')}</span>
                  <span className="total-price">{fmtAmount(cart.subtotal * (1 + cart.tvaRate), locale)}</span>
                </div>
                <p className="summary-tva">{t('tva_incl', { rate: cart.tvaRate === 0.06 ? '6 %' : '21 %' })}</p>

                {checkoutError && (
                  <p style={{ color: '#e53e3e', fontSize: '0.9rem', marginBottom: '0.8rem' }}>{checkoutError}</p>
                )}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', textAlign: 'center', display: 'block', opacity: checkoutLoading ? 0.7 : 1, cursor: checkoutLoading ? 'wait' : 'pointer' }}
                >
                  {checkoutLoading ? t('btn_checkout_loading') : t('btn_checkout')}
                </button>

                <div className="trust-row">
                  <div className="trust-item"><span>↻</span>{t('trust_returns')}</div>
                  <div className="trust-item"><span>🛡</span>{t('trust_warranty')}</div>
                  <div className="trust-item"><span>🔒</span>{t('trust_secure')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Assurance />
    </>
  )
}
