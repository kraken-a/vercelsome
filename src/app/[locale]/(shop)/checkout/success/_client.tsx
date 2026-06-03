'use client'

import { useEffect, useRef } from 'react'
import { Link } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCart } from '@/features/cart/hooks'
import { trackPurchase } from '@/features/tracking/events'
import { deleteNotification } from '@/lib/api/notifications'

export default function CheckoutSuccessPage() {
  const t = useTranslations('shop.checkout.success')
  const params = useSearchParams()
  const orderId = params.get('order')
  const projectId = params.get('project')
  const orderRef = params.get('ref') || (orderId ? `OAK-${orderId}` : null)
  const notifId = params.get('notif') ? Number(params.get('notif')) : null
  const isSo2 = params.get('so2') === '1'
  const isTech = params.get('tech') === '1'

  const { clearCart } = useCart()
  const tracked = useRef(false)
  const steps = [
    { title: t('step_confirm_title'), desc: t('step_confirm_desc') },
    { title: t('step_measure_title'), desc: t('step_measure_desc') },
    { title: t('step_production_title'), desc: t('step_production_desc') },
    { title: t('step_delivery_title'), desc: t('step_delivery_desc') },
  ]
  const so2Steps = [
    { title: t('so2_step_confirm_title'), desc: t('so2_step_confirm_desc') },
    { title: t('so2_step_production_title'), desc: t('so2_step_production_desc') },
    { title: t('so2_step_delivery_title'), desc: t('so2_step_delivery_desc') },
  ]

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    // Read cart snapshot saved before Odoo cleared it on order confirmation.
    // Live cart.items is empty by this point (cleared server-side).
    let snapshot: { items: Array<{ productId: number; price: number; quantity: number }>; subtotal: number } | null = null
    try {
      snapshot = JSON.parse(sessionStorage.getItem('oaksome_purchase_cart') ?? 'null')
      sessionStorage.removeItem('oaksome_purchase_cart')
    } catch {}

    if (orderRef && snapshot && snapshot.items.length > 0) {
      trackPurchase(
        orderRef,
        snapshot.subtotal,
        snapshot.items.map(i => ({ id: i.productId, price: i.price, quantity: i.quantity })),
      )
    }

    clearCart()

    if (notifId) {
      deleteNotification(notifId).catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div style={{
        textAlign: 'center',
        padding: '2rem 2rem 6rem',
        paddingTop: 'calc(140px + 2rem)',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Checkmark */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: '#1a1a1a', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.2rem', marginBottom: '1.5rem',
        }}>
          ✓
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {t('thank_you')}
        </h1>

        {orderRef && (
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.95rem', color: '#0C524E', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            {t('order_ref', { ref: orderRef })}
          </div>
        )}

        <p style={{ fontSize: '1rem', color: '#696761', marginBottom: '3rem', maxWidth: 460, lineHeight: 1.6 }}>
          {isTech
            ? t('desc_tech')
            : isSo2
              ? t('desc_so2')
              : t('desc_normal')}
        </p>

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: 480, width: '100%', textAlign: 'left', marginBottom: '3rem' }}>
          {(isTech || isSo2 ? so2Steps : steps).map((step, i) => (
            <div key={step.title} style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: '1rem', paddingBottom: i < (isTech || isSo2 ? so2Steps : steps).length - 1 ? '1.8rem' : 0, position: 'relative', width: '100%' }}>
              {/* Vertical line */}
              {i < (isTech || isSo2 ? so2Steps : steps).length - 1 && (
                <div style={{ position: 'absolute', left: 19, top: 40, bottom: 0, width: 2, background: '#e8e5df' }} />
              )}
              {/* Dot */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 600, zIndex: 1,
                background: i === 0 ? '#1a1a1a' : '#fff',
                color: i === 0 ? '#fff' : '#696761',
                border: i === 0 ? 'none' : '2px solid #e8e5df',
              }}>
                {i === 0 ? '✓' : i + 1}
              </div>
              {/* Content */}
              <div style={{ paddingTop: '0.3rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a', marginBottom: '0.15rem' }}>{step.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#696761' }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
          {!isTech && (
            <Link
              href={projectId
                ? { pathname: '/projets/[id]', params: { id: projectId } }
                : orderId
                  ? { pathname: '/projets/[id]', params: { id: orderId } }
                  : '/projets'}
              className="btn btn-primary"
              style={{ minWidth: 240, textAlign: 'center' }}
            >
              {t('btn_track')}
            </Link>
          )}
          <Link href="/" style={{ color: '#696761', fontSize: '0.9rem', textDecoration: 'none' }}>
            {t('btn_home')}
          </Link>
        </div>
      </div>
    </>
  )
}
