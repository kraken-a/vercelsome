'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getProjectDetail } from '@/lib/api/orders'
import type { ProjectDetail } from '@/types/order'

type Props = {
  projectId: number
  so2Id: number
  notificationId: number
  onCloseAction: () => void
}

function fmt(n: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-BE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n)
}

export function So2ConfirmModal({ projectId, so2Id, notificationId, onCloseAction }: Props) {
  const router = useRouter()
  const t = useTranslations('shop.checkout')
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [cgv, setCgv] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    getProjectDetail(projectId).then(res => {
      if (res.success) setProject(res.data)
      setLoading(false)
    })
  }, [projectId])

  function handleConfirm() {
    if (!cgv || !project?.so2) return
    setConfirming(true)
    const qs = new URLSearchParams({
      order: String(so2Id),
      ref: project.so2.name,
      notif: String(notificationId),
      so2: '1',
      project: String(projectId),
    })
    router.push(`/checkout?${qs.toString()}`)
    onCloseAction()
  }

  const so2 = project?.so2
  const so2Products = project?.products.filter(p => p.so2 && p.so2.qty > 0) ?? []
  const currency = project?.currency ?? 'EUR'
  const so1Paid = project?.payment_schedule?.so1_deposit?.amount ?? 0

  return (
    <>
      <div
        onClick={onCloseAction}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 1100, backdropFilter: 'blur(2px)',
        }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        background: '#fff', zIndex: 1101,
        width: 'min(600px, 95vw)', maxHeight: '90vh',
        overflowY: 'auto', padding: '2.5rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        <button
          onClick={onCloseAction}
          style={{ position: 'absolute', top: '1rem', right: '1.2rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#696761' }}
        >×</button>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.3rem' }}>
          {t('so2_modal_title')}
        </h2>
        {so2 && (
          <p style={{ fontSize: '0.85rem', color: '#696761', marginBottom: '1.5rem', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.03em' }}>
            {so2.name}
          </p>
        )}

        {loading ? (
          <p style={{ color: '#696761', padding: '2rem 0' }}>{t('so2_modal_loading')}</p>
        ) : (
          <>
            {/* Products */}
            {so2Products.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#696761', marginBottom: '0.75rem' }}>
                  {t('so2_modal_products')}
                </h4>
                <div style={{ border: '1px solid #e8e5df' }}>
                  {so2Products.map((p, i) => (
                    <div key={p.product_id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 1rem',
                      borderTop: i > 0 ? '1px solid #e8e5df' : 'none',
                      fontSize: '0.95rem',
                    }}>
                      <span>
                        {p.product_name}
                        {p.so2!.qty > 1 && <span style={{ color: '#696761', marginLeft: '0.3rem' }}>×{p.so2!.qty}</span>}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 500 }}>
                        {fmt(p.so2!.price_subtotal, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment summary */}
            {so2 && (
              <div style={{ background: '#F6F5F0', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  <span style={{ color: '#696761' }}>{t('so2_total_order')}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(so2.amount_total, currency)}</span>
                </div>
                {so1Paid > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#696761' }}>{t('so2_deposit_paid')}</span>
                    <span style={{ color: '#0C524E' }}>−{fmt(so1Paid, currency)}</span>
                  </div>
                )}
                <div style={{ borderTop: '1px solid #e8e5df', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700 }}>
                  <span>{t('so2_second_deposit')}</span>
                  <span style={{ color: '#0C524E' }}>
                    {fmt(so2.amount_total * 0.9 - so1Paid, currency)}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#696761', marginTop: '0.4rem' }}>
                  {t('so2_final_balance')}
                </p>
              </div>
            )}

            {/* CGV */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={cgv}
                onChange={e => setCgv(e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#0C524E', width: 16, height: 16, flexShrink: 0 }}
              />
              <span>{t.rich('so2_modal_cgv', {
                link: (chunks) => (
                  <Link href="/cgv" target="_blank" style={{ color: '#0C524E', textDecoration: 'underline', display: 'inline' }}>{chunks}</Link>
                ),
              })}</span>
            </label>

            <button
              onClick={handleConfirm}
              disabled={!cgv || confirming}
              className="btn btn-primary"
              style={{
                width: '100%', textAlign: 'center', display: 'block',
                opacity: (!cgv || confirming) ? 0.5 : 1,
                cursor: (!cgv || confirming) ? 'not-allowed' : 'pointer',
              }}
            >
              {confirming ? t('so2_modal_redirecting') : t('so2_modal_confirm_btn')}
            </button>
          </>
        )}
      </div>
    </>
  )
}
