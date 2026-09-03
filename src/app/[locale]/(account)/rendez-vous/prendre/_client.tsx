'use client'

import { useState, useEffect, useCallback } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { bookAppointment, getSlots, getShowroomMobileTeams } from '@/lib/api/appointments'
import { useNotifications } from '@/features/notifications/hooks'
import type { SlotsResponse, ShowroomMobileTeam } from '@/lib/api/appointments'
import { getProfile } from '@/lib/api/profile'
import { trackAppointmentBooked } from '@/features/tracking/events'
import '@/css/booking-page.css'

type TypeId = 'showroom' | 'video' | 'mobile'

const TYPE_IDS: TypeId[] = ['showroom', 'video', 'mobile']

const BRUSSELS_TZ = 'Europe/Brussels'

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDayOffset(y: number, m: number) {
  const d = new Date(y, m, 1).getDay()
  return d === 0 ? 6 : d - 1
}
function getDayOfWeek(y: number, m: number, d: number) {
  const dow = new Date(y, m, d).getDay()
  return dow === 0 ? 6 : dow - 1
}

const _today  = new Date()
const TODAY_Y = _today.getFullYear()
const TODAY_M = _today.getMonth()
const TODAY_D = _today.getDate()

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

function formatDateFull(y: number, m: number, d: number, locale: string) {
  return new Intl.DateTimeFormat(toDateLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m, d))
}

function formatDateLong(y: number, m: number, d: number, locale: string) {
  return new Intl.DateTimeFormat(toDateLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m, d))
}

function formatMonthTitle(y: number, m: number, locale: string) {
  return new Intl.DateTimeFormat(toDateLocale(locale), {
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m, 1))
}

function getWeekdayLabels(locale: string) {
  const formatter = new Intl.DateTimeFormat(toDateLocale(locale), { weekday: 'short' })
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2026, 0, 5 + i)))
}

function getBrusselsUtcOffsetH(dateKey: string): number {
  const ref  = new Date(`${dateKey}T12:00:00Z`)
  const bStr = ref.toLocaleString('en-US', { timeZone: BRUSSELS_TZ, hour: 'numeric', hour12: false, hourCycle: 'h23' })
  const uStr = ref.toLocaleString('en-US', { timeZone: 'UTC',       hour: 'numeric', hour12: false, hourCycle: 'h23' })
  return parseInt(bStr) - parseInt(uStr)
}

function brusselsToUserTz(dateKey: string, brusselsTime: string, userTz: string, locale: string): string {
  if (userTz === BRUSSELS_TZ) return brusselsTime
  const [hh, mm]       = brusselsTime.split(':').map(Number)
  const brusselsOffset = getBrusselsUtcOffsetH(dateKey)
  const [y, mo, d]     = dateKey.split('-').map(Number)
  const utcDate        = new Date(Date.UTC(y, mo - 1, d, hh - brusselsOffset, mm))
  return utcDate.toLocaleString(toDateLocale(locale), { timeZone: userTz, hour: '2-digit', minute: '2-digit', hour12: false })
}

function userTzToBrussels(dateKey: string, userTime: string, userTz: string): string {
  if (userTz === BRUSSELS_TZ) return userTime
  const [hh, mm]       = userTime.split(':').map(Number)
  const ref            = new Date(`${dateKey}T12:00:00Z`)
  const uStr           = ref.toLocaleString('en-US', { timeZone: userTz,      hour: 'numeric', hour12: false, hourCycle: 'h23' })
  const bStr           = ref.toLocaleString('en-US', { timeZone: BRUSSELS_TZ, hour: 'numeric', hour12: false, hourCycle: 'h23' })
  const utcRef         = ref.toLocaleString('en-US', { timeZone: 'UTC',       hour: 'numeric', hour12: false, hourCycle: 'h23' })
  const userOffset     = parseInt(uStr) - parseInt(utcRef)
  const brusselsOffset = parseInt(bStr) - parseInt(utcRef)
  const pad            = (n: number) => String(n).padStart(2, '0')
  const bHH            = ((hh - userOffset + brusselsOffset) + 24) % 24
  return `${pad(bHH)}:${pad(mm)}`
}

function buildISO(y: number, m: number, d: number, brusselsTime: string): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(m + 1)}-${pad(d)}T${brusselsTime}:00`
}

export default function PrendreRendezVousPage() {
  const t = useTranslations('account.bookAppointment')
  const locale = useLocale()
  const router = useRouter()
  const { refresh: refreshNotifications } = useNotifications()
  const searchParams   = useSearchParams()
  const appointmentId  = searchParams.get('appointment_id') ? Number(searchParams.get('appointment_id')) : null
  const typeFromUrl    = searchParams.get('type') as TypeId | null
  const isReschedule   = appointmentId !== null
  const typeCards: {
    id: TypeId; icon: string; label: string; desc: string; duration: string; special?: boolean
  }[] = [
    {
      id: 'showroom', icon: '🏠', label: t('type_showroom_label'),
      desc: t('type_showroom_desc'),
      duration: t('type_showroom_duration'),
    },
    {
      id: 'video', icon: '💻', label: t('type_video_label'),
      desc: t('type_video_desc'),
      duration: t('type_video_duration'),
    },
    {
      id: 'mobile', icon: '🚐', label: t('type_mobile_label'),
      desc: t('type_mobile_desc'),
      duration: t('type_mobile_duration'),
      special: true,
    },
  ]
  const typeMeta: Record<TypeId, { duration: string; lieu: string; durationMin: number }> = {
    showroom: { duration: t('meta_showroom_duration'), lieu: t('meta_showroom_lieu'), durationMin: 60 },
    video:    { duration: t('meta_video_duration'),    lieu: t('meta_video_lieu'),    durationMin: 30 },
    mobile:   { duration: t('meta_mobile_duration'),   lieu: t('meta_mobile_lieu'),   durationMin: 60 },
  }
  const weekdayLabels = getWeekdayLabels(locale)

  const [selectedType, setSelectedType] = useState<TypeId>(
    typeFromUrl && TYPE_IDS.includes(typeFromUrl) ? typeFromUrl : 'showroom'
  )
  const [calYear,      setCalYear]      = useState(TODAY_Y)
  const [calMonth,     setCalMonth]     = useState(TODAY_M)
  const [selectedDay,  setSelectedDay]  = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [address,      setAddress]      = useState('')
  const [notes,        setNotes]        = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [confirmed,    setConfirmed]    = useState(false)
  const [slotsData,    setSlotsData]    = useState<SlotsResponse | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [userTz,       setUserTz]       = useState<string>(
    typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : BRUSSELS_TZ
  )
  const [showroomTeams,   setShowroomTeams]   = useState<ShowroomMobileTeam[]>([])
  const [teamsLoading,    setTeamsLoading]    = useState(false)
  const [selectedTeamId,  setSelectedTeamId]  = useState<number | null>(null)

  const fetchSlots = useCallback((type: TypeId, year: number, month: number, teamId?: number | null) => {
    setSlotsLoading(true)
    setSlotsData(null)
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
    getSlots(type, monthStr, teamId ?? undefined).then(r => {
      if (r.success) setSlotsData(r.data)
      setSlotsLoading(false)
    })
  }, [])

  useEffect(() => {
    getProfile().then(r => {
      if (r.success) {
        if (r.data.tz) setUserTz(r.data.tz)
        if (r.data.address) {
          const a = r.data.address
          setAddress([a.street, a.zip, a.city].filter(Boolean).join(', '))
        }
      }
    })
  }, [])

  useEffect(() => {
    if (selectedType !== 'mobile') {
      setShowroomTeams([])
      setSelectedTeamId(null)
      return
    }
    setTeamsLoading(true)
    getShowroomMobileTeams().then(r => {
      setShowroomTeams(r.success ? r.data.teams : [])
      setTeamsLoading(false)
    })
  }, [selectedType])

  const effectiveTeamId = showroomTeams.length > 0 ? selectedTeamId : null
  const calendarReady   = selectedType !== 'mobile' || (!teamsLoading && (showroomTeams.length === 0 || selectedTeamId !== null))

  useEffect(() => {
    if (!calendarReady) return
    fetchSlots(selectedType, calYear, calMonth, effectiveTeamId)
  }, [selectedType, calYear, calMonth, fetchSlots, calendarReady, effectiveTeamId])

  const availableDays   = new Set(slotsData?.available_days ?? [])
  const dayKey          = (y: number, m: number, d: number) =>
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
    const key    = dayKey(calYear, calMonth, day)
    const unavail = isUnavailable(calYear, calMonth, day) || (!slotsLoading && !availableDays.has(key))
    if (unavail) return
    setSelectedDay(day); setSelectedTime(null)
  }

  async function confirm() {
    if (!selectedDay || !selectedTime) return
    setSubmitting(true)
    setBookingError(null)
    const meta         = typeMeta[selectedType]
    const pad          = (n: number) => String(n).padStart(2, '0')
    const key          = dayKey(calYear, calMonth, selectedDay)
    const brusselsStart = userTzToBrussels(key, selectedTime, userTz)
    const [startHH, startMM] = brusselsStart.split(':').map(Number)
    const endTotal     = startHH * 60 + startMM + meta.durationMin
    const endTimeStr   = `${pad(Math.floor(endTotal / 60))}:${pad(endTotal % 60)}`
    const dateStart    = buildISO(calYear, calMonth, selectedDay, brusselsStart)
    const dateEnd      = buildISO(calYear, calMonth, selectedDay, endTimeStr)
    const fullNotes    = [address ? t('notes_with_address', { address }) : '', notes].filter(Boolean).join('\n')

    const result = await bookAppointment({
      type:           selectedType,
      date_start:     dateStart,
      date_end:       dateEnd,
      notes:          fullNotes,
      appointment_id: appointmentId ?? undefined,
    })

    if (result.success) {
      trackAppointmentBooked(selectedType, dateStart)
      setConfirmed(true)
      refreshNotifications()
    } else if (result.code === 402 && selectedType === 'mobile') {
      // Showroom mobile requires prior payment — redirect to checkout
      const qs = new URLSearchParams()
      qs.set('showroom_mobile', '1')
      qs.set('date_start', dateStart)
      qs.set('date_end', dateEnd)
      if (effectiveTeamId) qs.set('team_id', String(effectiveTeamId))
      router.push({ pathname: '/checkout', query: Object.fromEntries(qs.entries()) })
    } else {
      setBookingError(result.error)
    }
    setSubmitting(false)
  }

  const activeTypeMeta = typeMeta[selectedType]
  const typeLabel  = typeCards.find(card => card.id === selectedType)?.label ?? ''
  const canConfirm = selectedDay !== null && selectedTime !== null

  if (confirmed && selectedDay !== null && selectedTime !== null) {
    return (
      <div className="booking-confirmed">
        <div className="booking-confirmed-icon">✅</div>
        <h2>{t('confirmed_title')}</h2>
        <p>{t('confirmed_email')}</p>
        <p>{t('confirmed_contact')}</p>
        <div className="booking-confirmed-details">
          <div className="bs-row"><span className="bs-label">{t('label_type')}</span><span className="bs-value">{typeLabel}</span></div>
          <div className="bs-row"><span className="bs-label">{t('label_date')}</span><span className="bs-value">{formatDateLong(calYear, calMonth, selectedDay, locale)}</span></div>
          <div className="bs-row"><span className="bs-label">{t('label_time')}</span><span className="bs-value">{selectedTime}</span></div>
          <div className="bs-row"><span className="bs-label">{t('label_duration')}</span><span className="bs-value">{activeTypeMeta.duration}</span></div>
          <div className="bs-row"><span className="bs-label">{t('label_place')}</span><span className="bs-value">{activeTypeMeta.lieu}</span></div>
        </div>
        <Link href="/rendez-vous" className="booking-confirmed-back">{t('confirmed_back')}</Link>
      </div>
    )
  }

  return (
    <div>
      <Link href="/rendez-vous" className="booking-back">{t('back')}</Link>

      <div className="booking-header">
        <h1>{isReschedule ? t('title_reschedule') : t('title_new')}</h1>
        <p>{isReschedule ? t('subtitle_reschedule') : t('subtitle_new')}</p>
      </div>

      <div className="booking-grid">
        <div>
          <h3 className="booking-step-label">{t('step1_label')}</h3>
          <div className="type-cards">
            {typeCards.map((card) => (
              <div
                key={card.id}
                className={['type-card', selectedType === card.id ? 'selected' : ''].filter(Boolean).join(' ')}
                onClick={() => { setSelectedType(card.id); setSelectedDay(null); setSelectedTime(null) }}
              >
                <div className="type-card-icon">{card.icon}</div>
                <h4>{card.label}</h4>
                <p>{card.desc}</p>
                <div className="type-card-duration">{card.duration}</div>
              </div>
            ))}
          </div>

          {selectedType === 'mobile' && (
            <>
              <h3 className="booking-step-label">{t('step_region_label')}</h3>
              {teamsLoading ? (
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '1rem' }}>{t('step_region_loading')}</p>
              ) : showroomTeams.length > 0 ? (
                <div className="mc-chips" style={{ marginBottom: '1.5rem' }}>
                  {showroomTeams.map(team => (
                    <button
                      key={team.id}
                      className={`mc-chip${selectedTeamId === team.id ? ' active' : ''}`}
                      onClick={() => { setSelectedTeamId(team.id); setSelectedDay(null); setSelectedTime(null) }}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}

          <h3 className="booking-step-label">{t('step2_label')}</h3>
          {!calendarReady ? (
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '1rem' }}>{t('step_region_hint')}</p>
          ) : (
          <div className="cal-wrap">
            <div className="cal-header">
              <h4>{formatMonthTitle(calYear, calMonth, locale)}</h4>
              <div className="cal-nav">
                <button onClick={prevMonth} disabled={isPrevDisabled} aria-label={t('prev_month_aria')}>←</button>
                <button onClick={nextMonth} aria-label={t('next_month_aria')}>→</button>
              </div>
            </div>
            <div className="cal-grid">
              {weekdayLabels.map(d => <div key={d} className="cal-day-name">{d}</div>)}
              {Array.from({ length: firstOffset }, (_, i) => <div key={`e${i}`} className="cal-day cal-empty" />)}
              {slotsLoading && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', fontSize: '13px', color: '#888' }}>
                  {t('loading_slots')}
                </div>
              )}
              {!slotsLoading && Array.from({ length: daysInMonth }, (_, i) => {
                const day         = i + 1
                const key         = dayKey(calYear, calMonth, day)
                const pastOrWeekend = isUnavailable(calYear, calMonth, day)
                const unavail     = pastOrWeekend || !availableDays.has(key)
                const isThisToday = calYear === TODAY_Y && calMonth === TODAY_M && day === TODAY_D
                const isSel       = selectedDay === day
                const cls = ['cal-day',
                  unavail                           ? 'cal-unavailable' : '',
                  !unavail && isSel                 ? 'cal-selected'    : '',
                  !unavail && !isSel && isThisToday ? 'cal-today'       : '',
                ].filter(Boolean).join(' ')
                return <div key={day} className={cls} onClick={() => selectDay(day)}>{day}</div>
              })}
            </div>
          </div>
          )}

          <h3 className="booking-step-label">{t('step3_label')}</h3>
          <p className="booking-step-sub">
            {selectedDay ? t('step3_hint_selected', { date: formatDateLong(calYear, calMonth, selectedDay, locale) }) : t('step3_hint_empty')}
          </p>
          <div className="time-slots">
            {selectedDay === null ? null : slotsLoading ? (
              <p style={{ fontSize: '13px', color: '#888' }}>{t('loading_times')}</p>
            ) : timeSlotsForDay.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#888' }}>{t('no_slots')}</p>
            ) : timeSlotsForDay.map(brusselsTime => {
              const displayTime = brusselsToUserTz(dayKey(calYear, calMonth, selectedDay!), brusselsTime, userTz, locale)
              const isSel       = selectedTime === displayTime
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

        <div>
          <div className="booking-summary">
            <h3>{t('summary_title')}</h3>
            <div className="bs-row"><span className="bs-label">{t('label_type')}</span><span className="bs-value">{typeLabel}</span></div>
            <div className="bs-row">
              <span className="bs-label">{t('label_date')}</span>
              <span className={`bs-value${selectedDay === null ? ' empty' : ''}`}>
                {selectedDay !== null ? formatDateFull(calYear, calMonth, selectedDay, locale) : '—'}
              </span>
            </div>
            <div className="bs-row">
              <span className="bs-label">{t('label_time')}</span>
              <span className={`bs-value${!selectedTime ? ' empty' : ''}`}>{selectedTime ?? '—'}</span>
            </div>
            <div className="bs-row"><span className="bs-label">{t('label_duration')}</span><span className="bs-value">{activeTypeMeta.duration}</span></div>
            <div className="bs-row"><span className="bs-label">{t('label_place')}</span><span className="bs-value">{activeTypeMeta.lieu}</span></div>

            <div className="booking-form">
              <label htmlFor="bk-address">{t('address_label')}</label>
              <input id="bk-address" type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder={t('address_placeholder')} />
              <label htmlFor="bk-notes">{t('notes_label')}</label>
              <textarea id="bk-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes_placeholder')} />
            </div>

            {bookingError && <p className="profile-save-error">{bookingError}</p>}

            <button className="booking-confirm-btn" disabled={!canConfirm || submitting} onClick={confirm}>
              {submitting ? t('in_progress') : isReschedule ? t('modify_btn') : t('confirm_btn')}
            </button>
            <p className="booking-disclaimer">{t('disclaimer')}</p>
            <p className="booking-notif-note">🔔 {t('notif_note')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
