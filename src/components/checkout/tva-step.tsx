'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { updateProfile } from '@/lib/api/profile'
import { useCart } from '@/features/cart/hooks'

type Props = {
  subtotal: number
  onConfirmAction: (buildingYear?: number) => void
  onCloseAction: () => void
}

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR_FOR_TVA = CURRENT_YEAR - 10

function toCurrencyLocale(locale: string) {
  if (locale === 'nl') return 'nl-BE'
  if (locale === 'en') return 'en-BE'
  return 'fr-BE'
}

export function TvaStep({ subtotal, onConfirmAction, onCloseAction }: Props) {
  const t = useTranslations('shop.checkout.tva')
  const locale = useLocale()
  const { setTvaRate } = useCart()
  const [step, setStep] = useState<'question' | 'year'>('question')
  const [year, setYear] = useState('')
  const [yearError, setYearError] = useState('')
  const [loading, setLoading] = useState(false)

  const saving = Math.round(subtotal * (0.21 - 0.06) / 1.21)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseAction() }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKey)
    }
  }, [onCloseAction])

  async function handleYesConfirm() {
    const y = parseInt(year)
    if (!year || isNaN(y) || y < 1900 || y > CURRENT_YEAR) {
      setYearError(t('error_invalid_year'))
      return
    }
    if (y > MIN_YEAR_FOR_TVA) {
      setYearError(t('error_too_recent', { year: MIN_YEAR_FOR_TVA + 1 }))
      return
    }
    setLoading(true)
    await updateProfile({ building_year: y })
    setTvaRate(0.06)
    setLoading(false)
    onConfirmAction(y)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCloseAction}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000 }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tva-title"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2001,
          width: '90%',
          maxWidth: 520,
          background: '#F6F5F0',
          padding: '2.5rem',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onCloseAction}
          aria-label={t('close_aria')}
          style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: '#696761', lineHeight: 1 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {step === 'question' ? (
          <>
            {/* Icon */}
            <div style={{ fontSize: '2.5rem', marginBottom: '1.2rem', lineHeight: 1 }}>🏠</div>

            <h2 id="tva-title" style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.6rem', lineHeight: 1.3 }}>
              {t('title')}
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#696761', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {t('intro')}
            </p>

            {/* Conditions mini */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { icon: '🏠', label: t('condition_age') },
                { icon: '👥', label: t('condition_private') },
                { icon: '🔧', label: t('condition_pro') },
              ].map(({ icon, label }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid #e8e5df', padding: '0.9rem 0.6rem', textAlign: 'center', borderRadius: 0 }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>{icon}</div>
                  <div style={{ fontSize: '0.75rem', color: '#1a1a1a', lineHeight: 1.3 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Saving */}
            {saving > 0 && (
              <div style={{ background: '#fff', border: '1px solid #e8e5df', padding: '1rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#696761', marginBottom: '0.3rem' }}>{t('saving_overline')}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0C524E' }}>{t('saving_amount', { amount: saving.toLocaleString(toCurrencyLocale(locale)) })}</div>
                <div style={{ fontSize: '0.8rem', color: '#696761', marginTop: '0.25rem' }}>{t('saving_rate')}</div>
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              onClick={() => setStep('year')}
              style={{ display: 'block', width: '100%', padding: '0.9rem', background: '#0C524E', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '0.75rem', transition: 'background 500ms ease-out' }}
            >
              {t('yes_btn')}
            </button>
            <button
              type="button"
              onClick={() => onConfirmAction(undefined)}
              style={{ display: 'block', width: '100%', padding: '0.9rem', background: 'transparent', color: '#696761', border: '1px solid #e8e5df', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 500ms ease-out' }}
            >
              {t('no_btn')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep('question')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#696761', fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {t('back')}
            </button>

            <h2 id="tva-title" style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('year_title')}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#696761', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {t('year_intro')}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.5rem', color: '#1a1a1a' }}>
                {t('year_label')}
              </label>
              <input
                type="number"
                placeholder="2005"
                value={year}
                onChange={e => { setYear(e.target.value); setYearError('') }}
                min={1900}
                max={MIN_YEAR_FOR_TVA}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  border: `1.5px solid ${yearError ? '#e53e3e' : '#e8e5df'}`,
                  borderRadius: 0,
                  fontSize: '1.1rem',
                  fontFamily: 'inherit',
                  background: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
              {yearError && (
                <p style={{ fontSize: '0.82rem', color: '#e53e3e', marginTop: '0.4rem' }}>{yearError}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleYesConfirm}
              disabled={loading}
              style={{ display: 'block', width: '100%', padding: '0.9rem', background: '#0C524E', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 500, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, transition: 'background 500ms ease-out' }}
            >
              {loading ? t('saving') : t('confirm_btn')}
            </button>
          </>
        )}
      </div>
    </>
  )
}
