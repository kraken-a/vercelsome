'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { bookAppointment, getSlots, getOrderAppointment } from '@/lib/api/appointments'
import { useNotifications } from '@/features/notifications/hooks'
import type { SlotsResponse, OrderAppointment } from '@/lib/api/appointments'
import { getProjectDetail } from '@/lib/api/orders'
import { getProfile } from '@/lib/api/profile'
import { trackAppointmentBooked } from '@/features/tracking/events'
import '@/css/booking-page.css'

type TypeId = 'mesures' | 'installation' | 'showroom' | 'video' | 'mobile'

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOffset(y: number, m: number) {
  const d = new Date(y, m, 1).getDay()
  return d === 0 ? 6 : d - 1
}
function getDayOfWeek(y: number, m: number, d: number) {
  const dow = new Date(y, m, d).getDay()
  return dow === 0 ? 6 : dow - 1
}

const _today   = new Date()
const TODAY_Y  = _today.getFullYear()
const TODAY_M  = _today.getMonth()
const TODAY_D  = _today.getDate()

function isUnavailable(y: number, m: number, d: number) {
  if (new Date(y, m, d) < new Date(TODAY_Y, TODAY_M, TODAY_D)) return true
  const dow = getDayOfWeek(y, m, d)
  return dow === 5 || dow === 6
}
function toDateLocale(locale: string) {
  if (locale === 'nl') return 'nl-BE'
  if (locale === 'en') return 'en-GB'
  return 'fr-BE'
}
function dateFromParts(y: number, m: number, d: number) { return new Date(y, m, d) }
function formatDateFull(y: number, m: number, d: number, locale: string) {
  return new Intl.DateTimeFormat(toDateLocale(locale), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(dateFromParts(y, m, d))
}
function formatDateLong(y: number, m: number, d: number, locale: string) {
  return new Intl.DateTimeFormat(toDateLocale(locale), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dateFromParts(y, m, d))
}
function getMonthLabel(y: number, m: number, locale: string) {
  return new Intl.DateTimeFormat(toDateLocale(locale), { month: 'long', year: 'numeric' }).format(dateFromParts(y, m, 1))
}
function getWeekdayLabels(locale: string) {
  const base = new Date(2024, 0, 1) // Monday
  return Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(toDateLocale(locale), { weekday: 'short' }).format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)))
}

const BRUSSELS_TZ = 'Europe/Brussels'

function getBrusselsUtcOffsetH(dateKey: string): number {
  const ref = new Date(`${dateKey}T12:00:00Z`)
  const bStr = ref.toLocaleString('en-US', { timeZone: BRUSSELS_TZ, hour: 'numeric', hour12: false, hourCycle: 'h23' })
  const uStr = ref.toLocaleString('en-US', { timeZone: 'UTC',             hour: 'numeric', hour12: false, hourCycle: 'h23' })
  return parseInt(bStr) - parseInt(uStr)
}

// Convert a Brussels HH:MM slot to user's timezone display string
function brusselsToUserTz(dateKey: string, brusselsTime: string, userTz: string, locale: string): string {
  if (userTz === BRUSSELS_TZ) return brusselsTime
  const [hh, mm] = brusselsTime.split(':').map(Number)
  const brusselsOffset = getBrusselsUtcOffsetH(dateKey)
  const [y, mo, d] = dateKey.split('-').map(Number)
  const utcDate = new Date(Date.UTC(y, mo - 1, d, hh - brusselsOffset, mm))
  return utcDate.toLocaleString(toDateLocale(locale), { timeZone: userTz, hour: '2-digit', minute: '2-digit', hour12: false })
}

// Convert user's displayed HH:MM back to Brussels HH:MM for booking
function userTzToBrussels(dateKey: string, userTime: string, userTz: string): string {
  if (userTz === BRUSSELS_TZ) return userTime
  const [hh, mm] = userTime.split(':').map(Number)
  const ref = new Date(`${dateKey}T12:00:00Z`)
  const uStr = ref.toLocaleString('en-US', { timeZone: userTz,        hour: 'numeric', hour12: false, hourCycle: 'h23' })
  const bStr = ref.toLocaleString('en-US', { timeZone: BRUSSELS_TZ,   hour: 'numeric', hour12: false, hourCycle: 'h23' })
  const userOffset = parseInt(uStr) - parseInt(ref.toLocaleString('en-US', { timeZone: 'UTC', hour: 'numeric', hour12: false, hourCycle: 'h23' }))
  const brusselsOffset = parseInt(bStr) - parseInt(ref.toLocaleString('en-US', { timeZone: 'UTC', hour: 'numeric', hour12: false, hourCycle: 'h23' }))
  const pad = (n: number) => String(n).padStart(2, '0')
  const bHH = ((hh - userOffset + brusselsOffset) + 24) % 24
  return `${pad(bHH)}:${pad(mm)}`
}

function buildISO(y: number, m: number, d: number, brusselsTime: string): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(m + 1)}-${pad(d)}T${brusselsTime}:00`
}

export default function BookingPage() {
  const t = useTranslations('account.projectAppointment')
  const locale = useLocale()
  const typeCards = [
    { id: 'mesures' as const, icon: '📏', label: t('type_mesures_label'), desc: t('type_mesures_desc'), duration: t('type_mesures_duration') },
    { id: 'installation' as const, icon: '🔧', label: t('type_installation_label'), desc: t('type_installation_desc'), duration: t('type_installation_duration') },
    { id: 'showroom' as const, icon: '🏠', label: t('type_showroom_label'), desc: t('type_showroom_desc'), duration: t('type_showroom_duration') },
    { id: 'video' as const, icon: '💻', label: t('type_video_label'), desc: t('type_video_desc'), duration: t('type_video_duration') },
    { id: 'mobile' as const, icon: '🚐', label: t('type_mobile_label'), desc: t('type_mobile_desc'), duration: t('type_mobile_duration'), special: true },
  ]
  const typeMeta: Record<TypeId, { duration: string; lieu: string; durationMin: number }> = {
    mesures: { duration: t('meta_mesures_duration'), lieu: t('place_home'), durationMin: 45 },
    installation: { duration: t('meta_installation_duration'), lieu: t('place_home'), durationMin: 180 },
    showroom: { duration: t('meta_showroom_duration'), lieu: t('place_showroom'), durationMin: 60 },
    video: { duration: t('meta_video_duration'), lieu: t('place_video'), durationMin: 30 },
    mobile: { duration: t('meta_mobile_duration'), lieu: t('place_home'), durationMin: 60 },
  }
  const params = useParams<{ id: string }>()
  const projectId = params?.id ? Number(params.id) : NaN
  const { refresh: refreshNotifications } = useNotifications()

  const [so1Id,        setSo1Id]        = useState<number>(projectId)
  const [orderName,    setOrderName]    = useState<string>('')
  const [orderStatus,  setOrderStatus]  = useState<string>('')
  const [so2Status,    setSo2Status]    = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<TypeId>('mesures')
  const [calYear,      setCalYear]      = useState(TODAY_Y)
  const [calMonth,     setCalMonth]     = useState(TODAY_M)
  const [selectedDay,  setSelectedDay]  = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [address,      setAddress]      = useState('')
  const [notes,        setNotes]        = useState('')
  const [submitting,          setSubmitting]          = useState(false)
  const [bookingError,        setBookingError]        = useState<string | null>(null)
  const [confirmed,           setConfirmed]           = useState(false)
  const [existingAppointment, setExistingAppointment] = useState<OrderAppointment | null>(null)
  const [isModifying,         setIsModifying]         = useState(false)
  const [slotsData,    setSlotsData]    = useState<SlotsResponse | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [userTz,       setUserTz]       = useState<string>(
    typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : BRUSSELS_TZ
  )

  const fetchKeyRef = useRef(0)

  const fetchSlots = useCallback((type: TypeId, year: number, month: number) => {
    const key = ++fetchKeyRef.current
    setSlotsLoading(true)
    setSlotsData(null)
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
    getSlots(type, monthStr).then(r => {
      if (fetchKeyRef.current !== key) return  // réponse périmée, ignorer
      if (r.success) setSlotsData(r.data)
      setSlotsLoading(false)
    })
  }, [])

  useEffect(() => {
    getProjectDetail(projectId).then(r => {
      if (r.success) {
        const fetchedSo1Id = r.data.so1_id
        setSo1Id(fetchedSo1Id)
        setOrderName(r.data.name)
        const status = r.data.status ?? ''
        const fetchedSo2Status = r.data.so2_status ?? null
        setOrderStatus(status)
        setSo2Status(fetchedSo2Status)
        // Auto-select the relevant type based on status
        // Mesures : SO1 phase (before SO2 creation)
        if (status === 'measures_pending' || status === 'measures_scheduled') {
          setSelectedType('mesures')
          if (status === 'measures_scheduled') {
            getOrderAppointment(fetchedSo1Id, 'mesures').then(r => {
              if (r.success) setExistingAppointment(r.data)
            })
          }
        // Installation : SO2 phase — se base sur so2_status
        } else if (fetchedSo2Status === 'ready' || fetchedSo2Status === 'delivering') {
          setSelectedType('installation')
          if (fetchedSo2Status === 'delivering') {
            getOrderAppointment(fetchedSo1Id, 'installation').then(r => {
              if (r.success) setExistingAppointment(r.data)
            })
          }
        } else {
          setSelectedType('showroom')
        }
      }
    })
    getProfile().then(r => {
      if (r.success) {
        if (r.data.tz) setUserTz(r.data.tz)
        if (r.data.address) {
          const a = r.data.address
          const parts = [a.street, a.zip, a.city].filter(Boolean)
          setAddress(parts.join(', '))
        }
      }
    })
  }, [projectId])

  // Fetch slots when type or month changes
  useEffect(() => {
    fetchSlots(selectedType, calYear, calMonth)
  }, [selectedType, calYear, calMonth, fetchSlots])

  const availableDays = new Set(slotsData?.available_days ?? [])
  const dayKey = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const timeSlotsForDay = selectedDay !== null
    ? (slotsData?.slots_by_day[dayKey(calYear, calMonth, selectedDay)] ?? [])
    : []

  const daysInMonth    = getDaysInMonth(calYear, calMonth)
  const firstOffset    = getFirstDayOffset(calYear, calMonth)
  const isPrevDisabled = calYear === TODAY_Y && calMonth === TODAY_M

  function prevMonth() {
    if (isPrevDisabled) return
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
    setSelectedDay(null); setSelectedTime(null)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
    setSelectedDay(null); setSelectedTime(null)
  }
  function selectDay(day: number) {
    const key = dayKey(calYear, calMonth, day)
    const unavail = isUnavailable(calYear, calMonth, day) || (!slotsLoading && !availableDays.has(key))
    if (unavail) return
    setSelectedDay(day); setSelectedTime(null)
  }

  async function confirm() {
    if (!selectedDay || !selectedTime) return
    setSubmitting(true)
    setBookingError(null)
    const meta = typeMeta[selectedType]
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateKey = dayKey(calYear, calMonth, selectedDay)
    // Convert displayed (user tz) time back to Brussels for booking
    const brusselsStart = userTzToBrussels(dateKey, selectedTime, userTz)
    const [startHH, startMM] = brusselsStart.split(':').map(Number)
    const endTotal = startHH * 60 + startMM + meta.durationMin
    const endTimeStr = `${pad(Math.floor(endTotal / 60))}:${pad(endTotal % 60)}`
    const dateStart = buildISO(calYear, calMonth, selectedDay, brusselsStart)
    const dateEnd   = buildISO(calYear, calMonth, selectedDay, endTimeStr)
    const fullNotes = [address ? t('notes_address_prefix', { address }) : '', notes].filter(Boolean).join('\n')

    const result = await bookAppointment({
      type:       selectedType,
      date_start: dateStart,
      date_end:   dateEnd,
      order_id:   so1Id,
      notes:      fullNotes,
    })

    if (result.success) {
      trackAppointmentBooked(selectedType, dateStart, so1Id)
      setConfirmed(true)
      refreshNotifications()
    } else {
      setBookingError(result.error)
    }
    setSubmitting(false)
  }

  // Only show the card relevant to the current project status
  const visibleCards = typeCards.filter(card => {
    if (orderStatus === 'measures_pending' || orderStatus === 'measures_scheduled') return card.id === 'mesures'
    if (so2Status === 'ready' || so2Status === 'delivering') return card.id === 'installation'
    return false
  })

  const selectedTypeMeta = typeMeta[selectedType]
  const typeLabel = typeCards.find(card => card.id === selectedType)?.label ?? ''
  const canConfirm = selectedDay !== null && selectedTime !== null

  if (confirmed && selectedDay !== null && selectedTime !== null) {
    return (
      <div className="booking-confirmed">
        <div className="booking-confirmed-icon">✅</div>
        <h2>{t('confirmed_title')}</h2>
        <p>{t('confirmed_email')}</p>
        <p>{t('confirmed_contact')}</p>
        <div className="booking-confirmed-details">
          <div className="bs-row">
            <span className="bs-label">{t('label_type')}</span>
            <span className="bs-value">{typeLabel}</span>
          </div>
          <div className="bs-row">
            <span className="bs-label">{t('label_date')}</span>
            <span className="bs-value">{formatDateLong(calYear, calMonth, selectedDay, locale)}</span>
          </div>
          <div className="bs-row">
            <span className="bs-label">{t('label_time')}</span>
            <span className="bs-value">{selectedTime}</span>
          </div>
          <div className="bs-row">
            <span className="bs-label">{t('label_duration')}</span>
            <span className="bs-value">{selectedTypeMeta.duration}</span>
          </div>
          <div className="bs-row">
            <span className="bs-label">{t('label_place')}</span>
            <span className="bs-value">{selectedTypeMeta.lieu}</span>
          </div>
          {orderName && (
            <div className="bs-row">
              <span className="bs-label">{t('label_project')}</span>
              <span className="bs-value">{orderName}</span>
            </div>
          )}
        </div>
        <Link href={`/projets/${params?.id ?? ''}`} className="booking-confirmed-back">
          {t('back_project')}
        </Link>
      </div>
    )
  }

  // ── Recap view for measures_scheduled (existing appointment) ────────────
  if (orderStatus === 'measures_scheduled' && existingAppointment && !isModifying) {
    const apptDate = new Date(existingAppointment.start)
    const dateStr  = apptDate.toLocaleDateString(toDateLocale(locale), {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: userTz,
    })
    const timeStr  = apptDate.toLocaleTimeString(toDateLocale(locale), {
      hour: '2-digit', minute: '2-digit', timeZone: userTz,
    })
    return (
      <div>
        <Link href={`/projets/${params?.id ?? ''}`} className="booking-back">
          {t('back_to_project')}
        </Link>
        <div className="booking-header">
          <h1>{t('recap_title')}</h1>
          <p>{t('recap_subtitle', { name: orderName })}</p>
        </div>
        <div className="booking-confirmed" style={{ textAlign: 'left', padding: '2rem' }}>
          <div className="booking-confirmed-icon">📅</div>
          <h2 style={{ textAlign: 'center' }}>{t('confirmed_short')}</h2>
          <div className="booking-confirmed-details">
            <div className="bs-row">
              <span className="bs-label">{t('label_type')}</span>
              <span className="bs-value">{t('type_mesures_label')}</span>
            </div>
            <div className="bs-row">
              <span className="bs-label">{t('label_date')}</span>
              <span className="bs-value" style={{ textTransform: 'capitalize' }}>{dateStr}</span>
            </div>
            <div className="bs-row">
              <span className="bs-label">{t('label_time')}</span>
              <span className="bs-value">{timeStr}{userTz !== BRUSSELS_TZ ? ` (${userTz})` : ''}</span>
            </div>
            <div className="bs-row">
              <span className="bs-label">{t('label_duration')}</span>
              <span className="bs-value">{t('meta_mesures_duration')}</span>
            </div>
            {existingAppointment.technician && (
              <div className="bs-row">
                <span className="bs-label">{t('label_technician')}</span>
                <span className="bs-value">{existingAppointment.technician}</span>
              </div>
            )}
            {orderName && (
              <div className="bs-row">
                <span className="bs-label">{t('label_project')}</span>
                <span className="bs-value">{orderName}</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="booking-confirm-btn"
              style={{ width: 'auto', padding: '0.75rem 2rem' }}
              onClick={() => setIsModifying(true)}
            >
              {t('modify_appointment')}
            </button>
            <Link href={`/projets/${params?.id ?? ''}`} className="booking-confirmed-back">
              {t('back_to_project')}
            </Link>
          </div>
          <p className="booking-disclaimer" style={{ marginTop: '1rem' }}>
            {t('help')} <a href="mailto:info@oaksome.be">info@oaksome.be</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link href={`/projets/${params?.id ?? ''}`} className="booking-back">
        {t('back_to_project')}
      </Link>

      <div className="booking-header">
        <h1>{isModifying ? t('title_modify') : t('title_new')}</h1>
        <p>{t('intro')}</p>
      </div>

      <div className="booking-grid">
        {/* ── Left: steps ── */}
        <div>
          <h3 className="booking-step-label">{t('step_type')}</h3>
          {visibleCards.length === 0 && (
            <p className="booking-status-note">
              {t('unavailable')}
            </p>
          )}
          <div className="type-cards">
            {visibleCards.map((card) => (
              <div
                key={card.id}
                className={[
                  'type-card',
                  selectedType === card.id ? 'selected' : '',
                  card.special ? 'special' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => { setSelectedType(card.id); setSelectedDay(null); setSelectedTime(null) }}
              >
                <div className="type-card-icon">{card.icon}</div>
                <h4>{card.label}</h4>
                <p>{card.desc}</p>
                <div className="type-card-duration">{card.duration}</div>
              </div>
            ))}
          </div>

          <h3 className="booking-step-label">{t('step_date')}</h3>
          {userTz !== BRUSSELS_TZ && (
            <p className="booking-tz-note">🕐 {t('timezone_note', { tz: userTz })}</p>
          )}
          <div className="cal-wrap">
            <div className="cal-header">
              <h4>{getMonthLabel(calYear, calMonth, locale)}</h4>
              <div className="cal-nav">
                <button onClick={prevMonth} disabled={isPrevDisabled} aria-label={t('prev_month')}>←</button>
                <button onClick={nextMonth} aria-label={t('next_month')}>→</button>
              </div>
            </div>
            <div className="cal-grid">
              {getWeekdayLabels(locale).map(d => <div key={d} className="cal-day-name">{d}</div>)}
              {Array.from({ length: firstOffset }, (_, i) => (
                <div key={`e${i}`} className="cal-day cal-empty" />
              ))}
              {slotsLoading && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', fontSize: '13px', color: '#888' }}>
                  {t('loading_slots')}
                </div>
              )}
              {!slotsLoading && Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const key = dayKey(calYear, calMonth, day)
                const pastOrWeekend = isUnavailable(calYear, calMonth, day)
                const unavail = pastOrWeekend || !availableDays.has(key)
                const isThisToday = calYear === TODAY_Y && calMonth === TODAY_M && day === TODAY_D
                const isSel = selectedDay === day
                const cls = [
                  'cal-day',
                  unavail                           ? 'cal-unavailable' : '',
                  !unavail && isSel                 ? 'cal-selected'    : '',
                  !unavail && !isSel && isThisToday ? 'cal-today'       : '',
                ].filter(Boolean).join(' ')
                return (
                  <div key={day} className={cls} onClick={() => selectDay(day)}>
                    {day}
                  </div>
                )
              })}
            </div>
          </div>

          <h3 className="booking-step-label">{t('step_slot')}</h3>
          <p className="booking-step-sub">
            {selectedDay
              ? t('slots_for', { date: formatDateLong(calYear, calMonth, selectedDay, locale) })
              : t('select_date_first')}
          </p>
          <div className="time-slots">
            {selectedDay === null ? null
              : slotsLoading ? (
                <p style={{ fontSize: '13px', color: '#888' }}>{t('loading')}</p>
              ) : timeSlotsForDay.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#888' }}>{t('no_slot')}</p>
              ) : timeSlotsForDay.map(brusselsTime => {
                const displayTime = brusselsToUserTz(dayKey(calYear, calMonth, selectedDay!), brusselsTime, userTz, locale)
                const isSel = selectedTime === displayTime
                return (
                  <div
                    key={brusselsTime}
                    className={`time-slot${isSel ? ' time-selected' : ''}`}
                    onClick={() => setSelectedTime(displayTime)}
                  >
                    {displayTime}
                  </div>
                )
              })}
          </div>
        </div>

        {/* ── Right: summary ── */}
        <div>
          <div className="booking-summary">
            <h3>{t('summary_title')}</h3>
            <div className="bs-row">
              <span className="bs-label">{t('label_type')}</span>
              <span className="bs-value">{typeLabel}</span>
            </div>
            <div className="bs-row">
              <span className="bs-label">{t('label_date')}</span>
              <span className={`bs-value${selectedDay === null ? ' empty' : ''}`}>
                {selectedDay !== null ? formatDateFull(calYear, calMonth, selectedDay, locale) : '—'}
              </span>
            </div>
            <div className="bs-row">
              <span className="bs-label">{t('label_time')}</span>
              <span className={`bs-value${!selectedTime ? ' empty' : ''}`}>
                {selectedTime ?? '—'}
              </span>
            </div>
            <div className="bs-row">
              <span className="bs-label">{t('label_duration')}</span>
              <span className="bs-value">{selectedTypeMeta.duration}</span>
            </div>
            <div className="bs-row">
              <span className="bs-label">{t('label_place')}</span>
              <span className="bs-value">{selectedTypeMeta.lieu}</span>
            </div>
            {orderName && (
              <div className="bs-row">
                <span className="bs-label">{t('label_project')}</span>
                <span className="bs-value">{orderName}</span>
              </div>
            )}

            <div className="booking-form">
              <label htmlFor="bk-address">{t('address_label')}</label>
              <input
                id="bk-address"
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={t('address_placeholder')}
              />
              <label htmlFor="bk-notes">{t('notes_label')}</label>
              <textarea
                id="bk-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('notes_placeholder')}
              />
            </div>

            {bookingError && (
              <p className="profile-save-error">{bookingError}</p>
            )}

            <button
              className="booking-confirm-btn"
              disabled={!canConfirm || submitting}
              onClick={confirm}
            >
              {submitting ? t('submitting') : t('confirm_btn')}
            </button>
            <p className="booking-disclaimer">
              {t('free_note')}
            </p>
            <p className="booking-notif-note">
              🔔 {t('notif_note')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
