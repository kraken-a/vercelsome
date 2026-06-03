'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createLead } from '@/lib/api/leads'
import { useToast } from '@/features/toast/context'

type Props = {
  readonly productId: number | null
  readonly onCloseAction: () => void
}

export function AnonWishlistModal({ productId, onCloseAction }: Props) {
  const t = useTranslations('shop.wishlist')
  const toast = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (productId === null) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!consent) {
      setError(t('anon_consent_error'))
      return
    }
    setSubmitting(true)
    const result = await createLead({
      name: name.trim() || t('anon_visitor'),
      email: email.trim(),
      product_id: productId ?? undefined,
      source: 'wishlist_save_anon',
      message: t('anon_lead_message'),
    })
    setSubmitting(false)
    if (result.success) {
      toast.show(t('anon_success'), 'success')
      onCloseAction()
    } else {
      setError(result.error || t('anon_error'))
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="anon-wish-title"
      onClick={onCloseAction}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: '#fff', padding: '2rem', width: 440, maxWidth: '90vw',
          borderRadius: 4, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onCloseAction}
          aria-label={t('close_modal')}
          style={{
            position: 'absolute', top: '0.75rem', right: '1rem',
            background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer',
            color: '#696761', lineHeight: 1,
          }}
        >×</button>

        <h3 id="anon-wish-title" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
          {t('anon_title')}
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#696761', margin: 0 }}>
          {t('anon_desc')}
        </p>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
          {t('anon_name')}
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="name"
            style={{ padding: '0.6rem 0.8rem', border: '1px solid #ccc', fontSize: '0.95rem', fontFamily: 'inherit' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
          {t('anon_email')}
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            style={{ padding: '0.6rem 0.8rem', border: '1px solid #ccc', fontSize: '0.95rem', fontFamily: 'inherit' }}
          />
        </label>

        <label style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: '#444', alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            style={{ marginTop: '0.2rem' }}
          />
          <span>
            {t('anon_consent')}
          </span>
        </label>

        {error && (
          <p role="alert" style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.85rem 1.5rem', background: '#0C524E', color: '#fff',
            border: 'none', fontSize: '1rem', fontWeight: 500, fontFamily: 'inherit',
            cursor: submitting ? 'wait' : 'pointer',
          }}
        >
          {submitting ? t('anon_loading') : t('anon_submit')}
        </button>
      </form>
    </div>
  )
}
