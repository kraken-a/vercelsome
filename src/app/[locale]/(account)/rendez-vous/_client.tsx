'use client'

import { useState, useEffect } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { getAppointments, cancelAppointment } from '@/lib/api/appointments'
import type { Appointment } from '@/lib/api/appointments'
import { useNotifications } from '@/features/notifications/hooks'
import '@/css/rendez-vous-page.css'

function ConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const t = useTranslations('account.appointments')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', padding: '2rem 2.5rem',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
          </svg>
        </div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#1a1a1a' }}>
          {t('cancel_modal_title')}
        </h3>
        <p style={{ margin: '0 0 1.75rem', fontSize: '0.9rem', color: '#696761', lineHeight: 1.5 }}>
          {t('cancel_modal_body')}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'none', border: '1.5px solid rgba(0,0,0,0.15)',
              padding: '0.6rem 1.5rem', fontSize: '0.85rem',
              fontFamily: 'inherit', cursor: 'pointer', color: '#1a1a1a',
            }}
          >
            {t('cancel_modal_keep')}
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: '#c0392b', border: 'none', color: '#fff',
              padding: '0.6rem 1.5rem', fontSize: '0.85rem',
              fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            {t('cancel_modal_confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

function toDateLocale(locale: string) {
  if (locale === 'nl') return 'nl-BE'
  if (locale === 'en') return 'en-GB'
  return 'fr-BE'
}

function formatRdvDate(iso: string | null, locale: string): { day: string; month: string } {
  if (!iso) return { day: '—', month: '—' }
  const d = new Date(iso)
  return {
    day:   String(d.getDate()).padStart(2, '0'),
    month: new Intl.DateTimeFormat(toDateLocale(locale), {
      month: 'short',
      year: 'numeric',
    }).format(d),
  }
}

function formatRdvTime(iso: string | null, locale: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString(toDateLocale(locale), { hour: '2-digit', minute: '2-digit' })
}

function parseType(rdv: Appointment, t: ReturnType<typeof useTranslations<'account.appointments'>>): string {
  const lower = `${rdv.slot_type ?? ''} ${rdv.name}`.toLowerCase()
  if (lower.includes('mesures') || lower.includes('measurement') || lower.includes('opmet')) return t('type_mesures')
  if (lower.includes('installation')) return t('type_installation')
  if (lower.includes('showroom')) return lower.includes('mobile') ? t('type_mobile') : t('type_showroom')
  if (lower.includes('video') || lower.includes('vidéo')) return t('type_video')
  if (lower.includes('mobile')) return t('type_mobile')
  return rdv.name
}

function localizeDescription(description: string, t: ReturnType<typeof useTranslations<'account.appointments'>>): string {
  return description.replace(/^Adresse\s*:\s*/i, t('card_address_prefix'))
}

function CalendarIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="0" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

type RdvCardProps = {
  rdv: Appointment
  past?: boolean
  cancelling: number | null
  onRequestCancel: (id: number) => void
}

function RdvCard({ rdv, past, cancelling, onRequestCancel }: RdvCardProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('account.appointments')
  const { day, month } = formatRdvDate(rdv.start, locale)
  const time = formatRdvTime(rdv.start, locale)
  const label = parseType(rdv, t)

  function handleModify() {
    if (rdv.order_id) {
      router.push({ pathname: '/projets/[id]/rendez-vous', params: { id: String(rdv.order_id) } })
    } else {
      const type = rdv.slot_type || 'showroom'
      router.push({ pathname: '/rendez-vous/prendre', query: { type, appointment_id: String(rdv.id) } })
    }
  }

  return (
    <div className={`rdv-card${past ? ' rdv-card--past' : ''}`}>
      <div className="rdv-card-date">
        <span className="rdv-day">{day}</span>
        <span className="rdv-month">{month}</span>
      </div>

      <div className="rdv-card-info">
        <span className="rdv-badge rdv-badge--mesures">{label}</span>
        <p className="rdv-card-time">{time}</p>
        {rdv.description && (
          <p className="rdv-card-address">{localizeDescription(rdv.description, t)}</p>
        )}
        {rdv.order_name && (
          <p className="rdv-card-order">
            {t('card_project_prefix')}<Link href={{ pathname: '/projets/[id]', params: { id: String(rdv.order_id) } }} style={{ color: '#0C524E', textDecoration: 'none', fontWeight: 600 }}>{rdv.order_name}</Link>
          </p>
        )}
      </div>

      {!past && (
        <div className="rdv-card-actions" style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
          <button className="rdv-action-btn" onClick={handleModify}>
            {t('card_modify')}
          </button>
          <button
            className="rdv-action-btn rdv-action-btn--cancel"
            onClick={() => onRequestCancel(rdv.id)}
            disabled={cancelling === rdv.id}
            style={{ borderColor: cancelling === rdv.id ? '#ccc' : undefined, color: cancelling === rdv.id ? '#999' : '#c0392b' }}
          >
            {cancelling === rdv.id ? t('card_cancelling') : t('card_cancel')}
          </button>
        </div>
      )}
    </div>
  )
}

export default function RendezVousPage() {
  const t = useTranslations('account.appointments')
  const [appointments,   setAppointments]   = useState<Appointment[]>([])
  const [loading,        setLoading]        = useState(true)
  const [cancelling,     setCancelling]     = useState<number | null>(null)
  const [confirmId,      setConfirmId]      = useState<number | null>(null)
  const [error,          setError]          = useState<string | null>(null)
  const { refresh: refreshNotifications } = useNotifications()

  function loadAppointments() {
    return getAppointments().then(result => {
      if (result.success) setAppointments([...result.data])
      setLoading(false)
    })
  }

  useEffect(() => { loadAppointments() }, [])

  async function doCancel(id: number) {
    setConfirmId(null)
    setCancelling(id)
    setError(null)
    const result = await cancelAppointment(id)
    setCancelling(null)
    if (result.success) {
      setAppointments(prev => prev.filter(a => a.id !== id))
      refreshNotifications()
    } else {
      setError(t('cancel_error'))
    }
  }

  const upcoming = appointments.filter(a => !a.past)
  const past     = appointments.filter(a =>  a.past)

  return (
    <div>
      {confirmId !== null && (
        <ConfirmModal
          onConfirm={() => doCancel(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="profile-header">
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
      </div>

      {error && (
        <div style={{ background: '#ffeaea', border: '1px solid #e74c3c', color: '#c0392b', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Upcoming */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h2>{t('upcoming_section')}</h2>
          <Link href="/rendez-vous/prendre" className="btn btn-primary rdv-book-btn">
            {t('book_btn')}
          </Link>
        </div>

        {loading ? (
          <p className="rdv-empty-sub">{t('loading')}</p>
        ) : upcoming.length === 0 ? (
          <div className="rdv-empty">
            <div className="rdv-empty-icon"><CalendarIcon /></div>
            <p className="rdv-empty-title">{t('empty_upcoming_title')}</p>
            <p className="rdv-empty-sub">
              {t('empty_upcoming_sub')}
            </p>
            <Link href="/projets" className="btn btn-primary rdv-cta">
              {t('see_projects')}
            </Link>
          </div>
        ) : (
          <div className="rdv-list">
            {upcoming.map(rdv => (
              <RdvCard key={rdv.id} rdv={rdv} cancelling={cancelling} onRequestCancel={setConfirmId} />
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h2>{t('past_section')}</h2>
        </div>

        {!loading && past.length === 0 ? (
          <p className="rdv-empty-sub" style={{ padding: '0.5rem 0' }}>
            {t('no_past')}
          </p>
        ) : (
          <div className="rdv-list rdv-list--past">
            {past.map(rdv => (
              <RdvCard key={rdv.id} rdv={rdv} past cancelling={cancelling} onRequestCancel={setConfirmId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
