'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { Link } from '@/i18n/navigation'
import { useParams, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { getProjectDetail } from '@/lib/api/orders'
import { getOrderAppointment } from '@/lib/api/appointments'
import type { OrderAppointment } from '@/lib/api/appointments'
import { submitPhotos, fileToBase64 } from '@/lib/api/photos'
import type { ProjectDetail, ProjectProduct, OakomeStatus } from '@/types/order'
import { So2ConfirmModal } from '@/components/notifications/so2-confirm-modal'
import '@/css/order-detail-page.css'

const STATUS_CLASSES: Record<string, string> = {
  cgv_pending: 'status-pending',
  deposit_pending: 'status-pending',
  measures_pending: 'status-pending',
  measures_scheduled: 'status-scheduled',
  plan_validated: 'status-scheduled',
  manufacturing: 'status-production',
  ready: 'status-production',
  delivering: 'status-production',
  done: 'status-delivered',
  '': 'status-pending',
}

function getStatusKey(project: ProjectDetail) {
  if (project.state === 'cancel') return 'status_cancelled'
  return `status_${project.status || 'default'}`
}

function getStatusClass(project: ProjectDetail) {
  if (project.state === 'cancel') return 'status-cancelled'
  return STATUS_CLASSES[project.status as OakomeStatus] ?? 'status-pending'
}

const STATUS_ORDER: OakomeStatus[] = [
  'cgv_pending', 'deposit_pending', 'measures_pending', 'measures_scheduled',
  'plan_validated', 'manufacturing', 'ready', 'delivering', 'done',
]

type TlState = 'done' | 'active' | 'pending'

function getTimelineSteps(project: ProjectDetail, t: ReturnType<typeof useTranslations>, locale: string): Array<{ label: string; detail: string; state: TlState }> {
  const idx = STATUS_ORDER.indexOf(project.status as OakomeStatus)
  const confirmed = project.state === 'sale' || project.state === 'done'

  const step1: TlState = confirmed ? 'done' : 'active'
  const step2: TlState = idx > 3 ? 'done' : idx >= 2 ? 'active' : 'pending'
  const step3: TlState = idx > 6 ? 'done' : idx >= 5 ? 'active' : 'pending'
  const step4: TlState = idx === 8 ? 'done' : idx === 7 ? 'active' : 'pending'

  return [
    { label: t('account.projectDetail.timeline_step1_label'), state: step1, detail: formatDate(project.date, locale) },
    { label: t('account.projectDetail.timeline_step2_label'), state: step2, detail: step2 === 'done' ? t('account.projectDetail.timeline_done') : step2 === 'active' ? t('account.projectDetail.timeline_to_plan') : t('account.projectDetail.timeline_upcoming') },
    { label: t('account.projectDetail.timeline_step3_label'), state: step3, detail: step3 === 'active' ? t('account.projectDetail.timeline_in_progress') : step3 === 'done' ? t('account.projectDetail.timeline_finished') : t('account.projectDetail.timeline_upcoming') },
    { label: t('account.projectDetail.timeline_step4_label'), state: step4, detail: step4 === 'done' ? t('account.projectDetail.timeline_done') : step4 === 'active' ? t('account.projectDetail.timeline_in_progress') : t('account.projectDetail.timeline_estimated_soon') },
  ]
}

function getRdvCTA(project: ProjectDetail, t: ReturnType<typeof useTranslations>): { show: boolean; label: string; sub: string } {
  if (project.state === 'cancel') return { show: false, label: '', sub: '' }
  const status = project.status
  const so2Status = project.so2_status
  if (status === 'measures_pending' || status === 'measures_scheduled') {
    return { show: true, label: t('account.projectDetail.rdv_cta_mesures_label'), sub: t('account.projectDetail.rdv_cta_mesures_sub') }
  }
  if (so2Status === 'ready' || so2Status === 'delivering') {
    return { show: true, label: t('account.projectDetail.rdv_cta_installation_label'), sub: t('account.projectDetail.rdv_cta_installation_sub') }
  }
  return { show: false, label: '', sub: '' }
}

function toDateLocale(locale: string) {
  if (locale === 'nl') return 'nl-BE'
  if (locale === 'en') return 'en-GB'
  return 'fr-BE'
}

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(toDateLocale(locale), { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatPrice(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(toDateLocale(locale), {
    style: 'currency', currency: currency || 'EUR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(toDateLocale(locale), {
    style: 'currency', currency: currency || 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount)
}

function formatDimensions(configJson: Record<string, unknown> | null): string | null {
  if (!configJson) return null
  const dim = configJson['dimension'] as Record<string, unknown> | undefined
  if (!dim) return null
  const h = dim['height'] ?? dim['hauteur']
  const w = dim['width']  ?? dim['largeur']
  const d = dim['depth']  ?? dim['profondeur']
  if (!h && !w && !d) return null
  const parts: string[] = []
  if (h) parts.push(`H ${h}`)
  if (w) parts.push(`W ${w}`)
  if (d) parts.push(`D ${d}`)
  return parts.join(' × ') + ' cm'
}

function TimelineIcon({ state, step }: { state: TlState; step: number }) {
  if (state === 'done')   return <span>✓</span>
  if (state === 'active') return <div className="pulse-dot" />
  return <span>{step}</span>
}

function OdooImage({ productId, alt }: { productId: number | null; alt: string }) {
  const odooUrl = process.env.NEXT_PUBLIC_ODOO_URL || ''
  if (!productId) {
    return <img src="/images/stock/dressing-satori.jpg" alt={alt} className="product-compare-img" />
  }
  return (
    <img
      src={`${odooUrl}/web/image/product.template/${productId}/image`}
      alt={alt}
      className="product-compare-img"
      onError={(e) => { (e.target as HTMLImageElement).src = '/images/stock/dressing-satori.jpg' }}
    />
  )
}

function ProductCompareRow({ product, currency, hasSo2Header, locale, t }: { product: ProjectProduct; currency: string; hasSo2Header: boolean; locale: string; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="pcr">
      {/* Left: image + name */}
      <div className="pcr-identity">
        <OdooImage productId={product.product_image_id} alt={product.product_name} />
        <div className="pcr-name">{product.product_name}</div>
      </div>

      {/* SO1 card */}
      <div className="pcr-card pcr-card-so1">
        {product.so1 ? (
          <>
            <div className="pcr-desc">{product.so1.description}</div>
            {(() => { const dims = formatDimensions(product.so1.configuration_json); return dims ? <div className="pcr-dims">{dims}</div> : null })()}
            <div className="pcr-meta">
              <span className="pcr-qty">×{product.so1.qty}</span>
              <span className="pcr-unit">{formatPrice(product.so1.price_unit, currency, locale)} / {t('account.projectDetail.unit_short')}</span>
            </div>
            <div className="pcr-total">{formatPrice(product.so1.price_subtotal, currency, locale)}</div>
          </>
        ) : (
          <div className="pcr-absent">{t('account.projectDetail.product_absent')}</div>
        )}
      </div>

      {/* Arrow — only if SO2 exists */}
      {hasSo2Header && (
        <div className="pcr-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BEECCC" strokeWidth="2" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
      )}

      {/* SO2 card */}
      {hasSo2Header && (
        <div className={`pcr-card pcr-card-so2${product.so2 ? '' : ' pcr-card-empty'}`}>
          {product.so2 ? (
            <>
              <div className="pcr-desc">{product.so2.description}</div>
              {(() => { const dims = formatDimensions(product.so2.configuration_json); return dims ? <div className="pcr-dims">{dims}</div> : null })()}
              <div className="pcr-meta">
                <span className="pcr-qty">×{product.so2.qty}</span>
                <span className="pcr-unit">{formatPrice(product.so2.price_unit, currency, locale)} / {t('account.projectDetail.unit_short')}</span>
              </div>
              <div className="pcr-total">{formatPrice(product.so2.price_subtotal, currency, locale)}</div>
              {product.delta !== null && product.delta !== 0 && (
                <div className={`pcr-delta ${product.delta > 0 ? 'pcr-delta-up' : 'pcr-delta-down'}`}>
                  {product.delta > 0 ? '▲' : '▼'} {product.delta > 0 ? '+' : ''}{formatPrice(product.delta, currency, locale)}
                </div>
              )}
            </>
          ) : (
            <div className="pcr-absent">{t('account.projectDetail.product_awaiting_final')}</div>
          )}
        </div>
      )}
    </div>
  )
}

function PhotoSubmitSection({ orderId, t }: { orderId: number; t: ReturnType<typeof useTranslations> }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [files,       setFiles]       = useState<{ file: File; preview: string }[]>([])
  const [description, setDescription] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function onFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, 10 - files.length)
    const entries = await Promise.all(
      selected.map(async f => ({ file: f, preview: URL.createObjectURL(f) }))
    )
    setFiles(prev => [...prev, ...entries].slice(0, 10))
    e.target.value = ''
  }

  function removeFile(idx: number) {
    setFiles(prev => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function handleSubmit() {
    if (files.length === 0) return
    setSubmitting(true)
    setError(null)
    const b64s = await Promise.all(files.map(f => fileToBase64(f.file)))
    const result = await submitPhotos({ order_id: orderId, photos: b64s, description })
    if (result.success) {
      setSuccess(true)
      setFiles([])
      setDescription('')
    } else {
      setError(result.error)
    }
    setSubmitting(false)
  }

  if (success) return (
    <p className="photo-success">{t('account.projectDetail.photo_success')}</p>
  )

  return (
    <div>
      <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#696761" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p>{t('account.projectDetail.photo_upload_click')}</p>
        <p>{t('account.projectDetail.photo_upload_hint')}</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={onFilesChange}
        />
      </div>

      {files.length > 0 && (
        <div className="photo-previews">
          {files.map((f, i) => (
            <div key={i} className="photo-preview-item">
              <img src={f.preview} alt={`photo ${i + 1}`} />
              <button className="photo-remove-btn" onClick={() => removeFile(i)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <textarea
        className="photo-desc-input"
        placeholder={t('account.projectDetail.photo_desc_placeholder')}
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      {error && <p className="photo-error">{error}</p>}

      <button
        className="photo-submit-btn"
        disabled={files.length === 0 || submitting}
        onClick={handleSubmit}
      >
        {submitting ? t('account.projectDetail.photo_submitting') : files.length > 0 ? t('account.projectDetail.photo_submit_idle', { count: files.length }) : t('account.projectDetail.photo_submit_empty')}
      </button>
    </div>
  )
}

function ProjetDetailPageContent() {
  const t = useTranslations()
  const locale = useLocale()
  const [project,      setProject]      = useState<ProjectDetail | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [so2Modal,     setSo2Modal]     = useState<{ so2Id: number; notifId: number } | null>(null)
  const [measuresAppt, setMeasuresAppt] = useState<OrderAppointment | null>(null)
  const [installAppt,  setInstallAppt]  = useState<OrderAppointment | null>(null)

  const params = useParams<{ id: string }>()
  const projectId = params?.id ? Number(params.id) : NaN
  const searchParams = useSearchParams()

  useEffect(() => {
    if (Number.isNaN(projectId)) {
      setError(t('account.projectDetail.not_found_sub'))
      setLoading(false)
      return
    }
    getProjectDetail(projectId).then(result => {
      if (result.success) {
        setProject(result.data)
        const status    = result.data.status
        const so2Status = result.data.so2_status
        // Fetch existing mesures appointment
        if (status === 'measures_scheduled' && result.data.so1_id) {
          getOrderAppointment(result.data.so1_id, 'mesures').then(r => {
            if (r.success && r.data) setMeasuresAppt(r.data)
          })
        }
        // Fetch existing installation appointment
        if (so2Status === 'delivering' && result.data.so1_id) {
          getOrderAppointment(result.data.so1_id, 'installation').then(r => {
            if (r.success && r.data) setInstallAppt(r.data)
          })
        }
      } else {
        setError(result.error)
      }
      setLoading(false)
    })
  }, [projectId])

  useEffect(() => {
    const so2Confirm = searchParams.get('so2_confirm')
    if (so2Confirm) {
      setSo2Modal({
        so2Id: Number(so2Confirm),
        notifId: Number(searchParams.get('notif')) || 0,
      })
    }
  }, [searchParams])

  if (loading) return (
    <div className="orders-empty">
      <p className="orders-empty-title">{t('account.projectDetail.loading')}</p>
    </div>
  )

  if (error || !project) return (
    <div className="orders-empty">
      <p className="orders-empty-title">{t('account.projectDetail.not_found_title')}</p>
      <p className="orders-empty-sub">{error ?? t('account.projectDetail.not_found_sub')}</p>
      <Link href="/projets" className="order-detail-back">{t('account.projectDetail.back')}</Link>
    </div>
  )

  const statusLabel = t(`account.projectDetail.${getStatusKey(project)}`)
  const statusCls = getStatusClass(project)
  const timeline = getTimelineSteps(project, t, locale)
  const rdvCTA   = getRdvCTA(project, t)

  return (
    <div>
      <Link href="/projets" className="order-detail-back">
        {t('account.projectDetail.back')}
      </Link>

      {/* Header */}
      <span className="order-detail-mono">{t('account.projectDetail.mono_label')}</span>
      <div className="order-detail-title-row">
        <h1>{project.name}</h1>
        <span className={`order-detail-status-badge ${statusCls}`}>{statusLabel}</span>
      </div>
      <p className="order-detail-date">{t('account.projectDetail.started_on', { date: formatDate(project.date, locale) })}</p>

      {/* RDV CTA */}
      {rdvCTA.show && (() => {
        const existingAppt = measuresAppt ?? installAppt
        return (
          <div className="rdv-cta-banner">
            <p>
              <strong>{rdvCTA.label}</strong>
              {existingAppt
                ? <span> — {t('account.projectDetail.appointment_scheduled_on', { date: formatDate(existingAppt.start, locale) })}</span>
                : rdvCTA.sub
              }
            </p>
            <Link href={{ pathname: '/projets/[id]/rendez-vous', params: { id: params.id } }} className="rdv-cta-link">
              {existingAppt ? `${t('account.appointments.card_modify')} →` : t('account.projectDetail.rdv_cta_choose_date')}
            </Link>
          </div>
        )
      })()}

      {/* Timeline */}
      <div className="detail-card">
        <h3>{t('account.projectDetail.timeline_title')}</h3>
        <div className="timeline">
          {timeline.map((step, i) => (
            <div key={i} className={`timeline-step ${step.state}`}>
              <div className="timeline-icon">
                <TimelineIcon state={step.state} step={i + 1} />
              </div>
              <div className="timeline-content">
                <h4>{step.label}</h4>
                <p>{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products comparison */}
      <div className="detail-card">
        <h3>{project.products.length > 1 ? t('account.projectDetail.products_title_plural') : t('account.projectDetail.products_title')}</h3>

        {/* Column headers */}
        <div className="pcr-header">
          <div className="pcr-header-identity" />
          <div className="pcr-header-label">
            <span className="pcr-header-tag pcr-header-tag-so1">{t('account.projectDetail.quote_initial')}</span>
          </div>
          {project.so2 && (
            <>
              <div className="pcr-header-arrow" />
              <div className="pcr-header-label">
                <span className="pcr-header-tag pcr-header-tag-so2">{t('account.projectDetail.quote_final')}</span>
              </div>
            </>
          )}
        </div>

        <div className="product-compare-list">
          {project.products.filter(p => (p.so1 && p.so1.qty > 0) || (p.so2 && p.so2.qty > 0)).map((product) => (
            <ProductCompareRow
              key={product.product_id}
              product={product}
              currency={project.currency}
              hasSo2Header={!!project.so2}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="detail-card">
        <h3>{t('account.projectDetail.financial_title')}</h3>
        {(() => {
          const ps = project.payment_schedule
          const cur = project.currency
          const totalTtc = ps?.project_total ?? (project.so2?.amount_total ?? project.amount_total)
          const tvaAmt   = ps?.tva_amount   ?? (project.so2?.amount_tax   ?? project.amount_tax)
          const tvaRate  = totalTtc > 0 ? Math.round((tvaAmt / totalTtc) * 100) : 0
          return (
            <>
              {/* Total projet */}
              <div className="summary-row total" style={{ marginBottom: '1rem' }}>
                <span>{project.so2 ? t('account.projectDetail.total_ttc_final') : t('account.projectDetail.total_ttc_initial')}</span>
                <span>{formatAmount(totalTtc, cur, locale)}</span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e0ddd7', margin: '0 0 1rem' }} />

              {/* 1er acompte SO1 */}
              <div className="summary-row">
                <span style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                  <span>{t('account.projectDetail.deposit_1')}</span>
                  {ps?.so1_deposit?.date && (
                    <span style={{ fontSize: '0.78rem', color: '#696761' }}>{formatDate(ps.so1_deposit.date, locale)}</span>
                  )}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                  <span>{ps?.so1_deposit ? formatAmount(ps.so1_deposit.amount, cur, locale) : '—'}</span>
                  {ps?.so1_deposit && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: ps.so1_deposit.paid ? '#0C524E' : '#158AFF' }}>
                      {ps.so1_deposit.paid ? t('account.projectDetail.paid') : t('account.projectDetail.to_pay')}
                    </span>
                  )}
                </span>
              </div>

              {/* 2ème acompte SO2 */}
              <div className="summary-row">
                <span style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                  <span>{t('account.projectDetail.deposit_2')}</span>
                  {ps?.so2_deposit?.date && (
                    <span style={{ fontSize: '0.78rem', color: '#696761' }}>{formatDate(ps.so2_deposit.date, locale)}</span>
                  )}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                  {ps?.so2_deposit ? (
                    <>
                      <span>{formatAmount(ps.so2_deposit.amount, cur, locale)}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: ps.so2_deposit.paid ? '#0C524E' : '#158AFF' }}>
                        {ps.so2_deposit.paid ? t('account.projectDetail.paid') : t('account.projectDetail.to_pay')}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: '#696761' }}>
                      {project.so2 ? '—' : t('account.projectDetail.awaiting_final_quote')}
                    </span>
                  )}
                </span>
              </div>

              {/* Solde final */}
              <div className="summary-row">
                <span style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                  <span>{t('account.projectDetail.balance')}</span>
                  <span style={{ fontSize: '0.78rem', color: '#696761' }}>{t('account.projectDetail.balance_sub')}</span>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                  {ps?.balance != null ? (
                    <>
                      <span>{formatAmount(ps.balance, cur, locale)}</span>
                      <span style={{ fontSize: '0.75rem', color: '#696761' }}>{t('account.projectDetail.after_installation')}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: '#696761' }}>—</span>
                  )}
                </span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e0ddd7', margin: '0.5rem 0' }} />

              {/* TVA */}
              <div className="summary-row" style={{ fontSize: '0.88rem', color: '#696761' }}>
                <span>{tvaRate > 0 ? t('account.projectDetail.vat_included', { rate: tvaRate }) : t('account.projectDetail.vat_included_no_rate')}</span>
                <span>{formatAmount(tvaAmt, cur, locale)}</span>
              </div>
            </>
          )
        })()}
      </div>

      {/* Documents */}
      <div className="detail-card">
        <h3>{t('account.projectDetail.documents_title')}</h3>
        <div className="doc-row">
          <span className="doc-name">{t('account.projectDetail.doc_cgv')}</span>
          <span className={`doc-status ${project.cgv_signed ? 'signed' : 'pending'}`}>
            {project.cgv_signed ? t('account.projectDetail.doc_status_signed') : t('account.projectDetail.doc_status_pending')}
          </span>
        </div>
        {project.so2 && (
          <div className="doc-row">
            <span className="doc-name">{t('account.projectDetail.doc_quote_final_named', { name: project.so2.name })}</span>
            <span className="doc-status signed">{t('account.projectDetail.doc_status_available')}</span>
          </div>
        )}
      </div>

      {/* Photo submission — visible uniquement quand livré */}
      {project.status === 'done' && (
        <div className="detail-card">
          <h3>{t('account.projectDetail.photos_title')}</h3>
          <p style={{ fontSize: '0.875rem', color: '#696761', marginBottom: '1.25rem', marginTop: 0 }}>
            {t('account.projectDetail.photos_sub')}
          </p>
          <PhotoSubmitSection orderId={project.id} t={t} />
        </div>
      )}

      {/* Help CTA */}
      <div className="help-cta">
        <p>
          <strong>{t('account.projectDetail.help_text')}</strong>
        </p>
        <Link href="/contact" className="help-cta-link">
          {t('account.projectDetail.help_cta')}
        </Link>
      </div>

      {so2Modal && (
        <So2ConfirmModal
          projectId={projectId}
          so2Id={so2Modal.so2Id}
          notificationId={so2Modal.notifId}
          onCloseAction={() => setSo2Modal(null)}
        />
      )}

    </div>
  )
}

export default function ProjetDetailPage() {
  return (
    <Suspense>
      <ProjetDetailPageContent />
    </Suspense>
  )
}
