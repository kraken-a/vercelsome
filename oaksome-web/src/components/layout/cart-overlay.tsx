'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { useCart } from '@/features/cart/hooks'
import { useAuth } from '@/features/auth/hooks'
import { trackViewCart, trackRemoveFromCart } from '@/features/tracking/events'
import { getCheckoutUrl } from '@/lib/api/cart'
import type { CartItem } from '@/features/cart/types'
import { getSo1Info } from '@/lib/api/orders'
import type { So1Info } from '@/lib/api/orders'

function fmt(price: number, locale: string) {
  const formatLocale = locale === 'nl' ? 'nl-BE' : locale === 'en' ? 'en-BE' : 'fr-BE'
  return new Intl.NumberFormat(formatLocale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price)
}

function CartItemRow({ item }: { item: CartItem }) {

  const t = useTranslations('cart')
  const locale = useLocale()
  const { removeItem, updateQuantity } = useCart()

  function handleRemove() {
    trackRemoveFromCart([{ id: item.productId, price: item.price, quantity: item.quantity }])
    removeItem(item.productId)
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '90px 1fr auto',
      gap: '1.2rem',
      padding: '1.25rem 0',
      borderTop: '1px solid #e8e5df',
      alignItems: 'start',
    }}>
      {/* Image */}
      <div style={{ width: 90, height: 90, background: '#ece9e2', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {item.image ? (
          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#ece9e2' }} />
        )}
      </div>

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{fontSize: '0.95rem', fontWeight: 500, color: '#1a1a1a', lineHeight: 1.3}}>{item.name}</span>
          {item.config && (() => {
              const cfg = item.config!
              const form = cfg['form'] as Record<string, unknown> | undefined

              const toCm = (val: unknown) => {
                  const n = Number(val)
                  return Number.isFinite(n) ? n / 10 : null
              }

              const height = form?.['ZF_HEIGHT'] !== undefined ? toCm(form['ZF_HEIGHT']) : null
              const width = form?.['ZF_WIDTH'] !== undefined ? toCm(form['ZF_WIDTH']) : null
              const depth = form?.['ZF_DEPTH'] !== undefined ? toCm(form['ZF_DEPTH']) : null

              const dimStr = (height || width || depth)
                  ? [
                  height && `H ${height}`,
                  width && `W ${width}`,
                  depth && `D ${depth}`,
              ].filter(Boolean).join(' × ') + ' cm'
                  : null

              const arts = (cfg['aricles'] ?? cfg['articles']) as unknown[] | undefined

              return (
                  <>
                      {dimStr && (
                          <span style={{
                              fontFamily: "'PP Air Mono', monospace",
                              fontSize: '0.75rem',
                              color: '#0C524E',
                              letterSpacing: '0.03em'
                          }}>
          {dimStr}
        </span>
                      )}
                      {Array.isArray(arts) && arts.map((art, i) => {
                          if (!art || typeof art !== 'object') return null
                          const a = art as Record<string, unknown>
                          const label = String(a['name'] ?? a['label'] ?? a['value'] ?? '')
                          const hex = a['color'] ?? a['hex'] ?? a['couleur_hex']
                          if (!label) return null
                          return (
                              <span key={i} style={{
                                  fontSize: '0.82rem',
                                  color: '#696761',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                              }}>
            <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: typeof hex === 'string' ? hex : '#696761',
                border: '1px solid rgba(0,0,0,0.12)',
                flexShrink: 0,
                display: 'inline-block'
            }}/>
                                  {label}
          </span>
                          )
                      })}
                  </>
              )
          })()}
        {/* Qty stepper */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          border: '1.5px solid #e8e5df',
          marginTop: '0.5rem',
          width: 'fit-content',
        }}>
          <button
            type="button"
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            style={{ width: 32, height: 32, border: 'none', background: '#fff', fontSize: '1rem', cursor: 'pointer', color: '#1a1a1a', transition: 'background 500ms ease-out' }}
            aria-label={t('aria_decrease')}
          >−</button>
          <span style={{ width: 36, textAlign: 'center', fontSize: '0.9rem', fontWeight: 500, borderLeft: '1.5px solid #e8e5df', borderRight: '1.5px solid #e8e5df', lineHeight: '32px' }}>
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            style={{ width: 32, height: 32, border: 'none', background: '#fff', fontSize: '1rem', cursor: 'pointer', color: '#1a1a1a', transition: 'background 500ms ease-out' }}
            aria-label={t('aria_increase')}
          >+</button>
        </div>
      </div>

      {/* Price + remove */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap' }}>
          {fmt(item.price * item.quantity, locale)}
        </span>
        <button
          type="button"
          onClick={handleRemove}
          style={{ background: 'none', border: 'none', color: '#696761', fontSize: '1.1rem', cursor: 'pointer', padding: '0.1rem', lineHeight: 1, transition: 'color 500ms ease-out' }}
          aria-label={t('aria_remove')}
          title={t('aria_remove')}
        >×</button>
      </div>
    </div>
  )
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  const t = useTranslations('cart')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '3rem 2rem' }}>
      <div style={{ fontSize: '4rem', lineHeight: 1, marginBottom: '1.2rem', opacity: 0.25 }}>🛒</div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.6rem', color: '#1a1a1a' }}>{t('empty')}</h2>
      <p style={{ fontSize: '0.95rem', color: '#696761', maxWidth: 280, marginBottom: '1.8rem', lineHeight: 1.5 }}>
        {t('empty_desc')}
      </p>
      <Link
        href="/acheter"
        onClick={onClose}
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.8rem',
          background: '#0C524E',
          color: '#fff',
          textDecoration: 'none',
          fontSize: '0.95rem',
          fontWeight: 500,
          borderRadius: 0,
          marginBottom: '1rem',
          transition: 'background 500ms ease-out',
        }}
      >
        {t('discover_furniture')}
      </Link>
      <button
        type="button"
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#696761', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
      >
        {t('continue_shopping')} →
      </button>
    </div>
  )
}

export function CartOverlay() {
  const { cart, cartOpen, setCartOpen } = useCart()
  const { user, isLoading: authLoading } = useAuth()
  const t = useTranslations('cart')
  const locale = useLocale()
  const router = useRouter()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [so1Info, setSo1Info] = useState<So1Info | null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const hasTracked = useRef(false)

  useEffect(() => {
    if (authLoading) return  // wait for auth before touching localStorage
    if (!user?.isInternal) {
      localStorage.removeItem('oaksome_so1_id')
      setProjectId(null)
      setSo1Info(null)
      return
    }
    const id = localStorage.getItem('oaksome_so1_id')
    setProjectId(id)
    if (id) {
      getSo1Info(parseInt(id, 10)).then(r => {
        if (r.success) setSo1Info(r.data)
      })
    } else {
      setSo1Info(null)
    }
  }, [authLoading, cartOpen, user?.isInternal])

  useEffect(() => {
    if (cartOpen && cart.items.length > 0 && !hasTracked.current) {
      hasTracked.current = true
      trackViewCart(
        cart.items.map(i => ({ id: i.productId, price: i.price, quantity: i.quantity })),
        cart.subtotal,
      )
    }
    if (!cartOpen) {
      hasTracked.current = false
    }
  }, [cartOpen, cart.items, cart.subtotal])

  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [cartOpen])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCartOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [setCartOpen])

  function handleCheckout() {
    setCartOpen(false)
    router.push('/panier')
  }

  if (!cartOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setCartOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1000,
          animation: 'fadeIn 300ms ease-out',
        }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('your_cart_aria')}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 480,
          background: '#F6F5F0',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 350ms ease-out',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.2rem 1.5rem',
          borderBottom: '1px solid #e8e5df',
          flexShrink: 0,
        }}>
          <div>
            <span style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1a1a1a' }}>{t('your_cart_aria')}</span>
            {cart.totalItems > 0 && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.95rem', color: '#696761', fontWeight: 400 }}>
                {cart.totalItems === 1 ? t('count_one', { count: cart.totalItems }) : t('count_other', { count: cart.totalItems })}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label={t('close_cart_aria')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#1a1a1a',
              fontSize: '1.4rem',
              lineHeight: 1,
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {projectId && (
          <div style={{
            background: '#0C524E',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            fontSize: '0.82rem',
            flexShrink: 0,
          }}>
            <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
              {t('tech_banner_mode')}
            </div>
            <div style={{ opacity: 0.85, lineHeight: 1.5 }}>
              {so1Info ? (
                <>
                  <span>{t('tech_banner_so1')} <strong>{so1Info.name}</strong></span>
                  {' · '}
                  <span>{t('tech_banner_client')} <strong>{so1Info.partner_name}</strong></span>
                  {so1Info.so2_name && (
                    <span style={{ marginLeft: 6, color: '#BEECCC' }}>
                      · {t('tech_banner_so2_exists')} {so1Info.so2_name}
                    </span>
                  )}
                </>
              ) : (
                <span>{t('tech_banner_so1')} #{projectId}</span>
              )}
            </div>
            <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', opacity: 0.7 }}>
              {t('tech_banner_note')}
            </div>
          </div>
        )}

        {cart.items.length === 0 ? (
          <EmptyCart onClose={() => setCartOpen(false)} />
        ) : (
          <>
            {/* Items list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.5rem' }}>
              {cart.items.map(item => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </div>

            {/* Summary */}
            <div style={{
              flexShrink: 0,
              borderTop: '1px solid #e8e5df',
              padding: '1.2rem 1.5rem 1.5rem',
              background: '#fff',
            }}>
              {/* Rows */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.95rem' }}>
                <span style={{ color: '#696761' }}>{t('summary_subtotal_ht')}</span>
                <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{fmt(cart.subtotal / (1 + cart.tvaRate), locale)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.95rem' }}>
                <span style={{ color: '#696761' }}>{t('summary_delivery')}</span>
                <span style={{ fontWeight: 500, color: '#0C524E' }}>{t('summary_delivery_value')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.95rem' }}>
                <span style={{ color: '#696761' }}>{t('summary_installation')}</span>
                <span style={{ fontWeight: 500, color: '#0C524E' }}>{t('summary_installation_value')}</span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e8e5df', margin: '0.75rem 0' }} />

              {/* Promo */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder={t('promo_placeholder')}
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.9rem',
                    border: '1.5px solid #e8e5df',
                    borderRadius: 0,
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    background: '#fff',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  style={{
                    padding: '0.6rem 1rem',
                    border: '1.5px solid #1a1a1a',
                    borderRadius: 0,
                    background: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 500ms ease-out',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('promo_apply')}
                </button>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e8e5df', margin: '0.75rem 0' }} />

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1a1a1a' }}>{t('total_ttc')}</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a1a1a' }}>{fmt(cart.subtotal, locale)}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#696761', textAlign: 'right', margin: '0 0 1rem' }}>{t('tva_incl', { rate: 21 })}</p>

              {/* CTA */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkoutLoading}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.9rem',
                  background: '#0C524E',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 0,
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: checkoutLoading ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 500ms ease-out',
                  opacity: checkoutLoading ? 0.7 : 1,
                }}
              >
                {checkoutLoading ? t('btn_checkout_loading') : t('btn_checkout')}
              </button>

              {/* Trust row */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e8e5df' }}>
                <div style={{ fontSize: '0.72rem', color: '#696761', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>↻</div>
                  {t('trust_returns')}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#696761', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>🛡</div>
                  {t('trust_warranty')}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#696761', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>🔒</div>
                  {t('payment_secure')}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
