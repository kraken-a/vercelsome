'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import './sample.css'
import { getSlots, getShowroomMobileTeams } from '@/lib/api/appointments'
import type { SlotsResponse, ShowroomMobileTeam } from '@/lib/api/appointments'
import { apiPost } from '@/lib/api/client'
import { createLead } from '@/lib/api/leads'
import { getProfile } from '@/lib/api/profile'

type ColorEntry = { slug: string; hex: string }
type OdooStyle = { id: number; name: string; image?: string }
type OdooCategory = { id: number; name: string; image_128?: string }
type Material = 'melamine' | 'laque' | 'placage'
type KitRequestResponse = { kit_id: number }
type ShowroomRequestResponse = { lead_id: number; showroom_id: number }

const esColors: Record<string, Record<Material, ColorEntry[]>> = {
  line: {
    melamine: [
      { slug: 'blanc_alpin', hex: '#F5F5F0' }, { slug: 'gris_perle', hex: '#D4D2CC' },
      { slug: 'gris_anthracite', hex: '#4A4A4A' }, { slug: 'noir_mat', hex: '#1A1A1A' },
      { slug: 'sable', hex: '#E8E0D0' }, { slug: 'greige', hex: '#C8C0B4' },
    ],
    laque: [{ slug: 'blanc_pur', hex: '#FFFFFF' }, { slug: 'noir_laque', hex: '#0A0A0A' }, { slug: 'gris_clair', hex: '#C0C0C0' }],
    placage: [{ slug: 'chene_naturel', hex: '#C4A872' }, { slug: 'chene_blanchi', hex: '#DDD4C0' }, { slug: 'noyer', hex: '#6B4E37' }, { slug: 'frene_clair', hex: '#D9CDB8' }],
  },
  satori: {
    melamine: [{ slug: 'blanc_zen', hex: '#FAF8F2' }, { slug: 'argile', hex: '#D4BFA0' }, { slug: 'terre_cuite', hex: '#C4926A' }, { slug: 'lin', hex: '#E0D8C8' }, { slug: 'mousse', hex: '#A4AE8C' }],
    laque: [{ slug: 'noir_satine', hex: '#1A1A1A' }, { slug: 'terracotta', hex: '#B86B4A' }],
    placage: [{ slug: 'chene_fume', hex: '#8B7355' }, { slug: 'bambou_naturel', hex: '#C8B88A' }, { slug: 'erable_satine', hex: '#DED0B0' }],
  },
  vista: {
    melamine: [{ slug: 'vert_foret', hex: '#2F5A3B' }, { slug: 'bleu_nuit', hex: '#1E3A5F' }, { slug: 'vert_sauge', hex: '#8B9E7C' }, { slug: 'blanc_nuage', hex: '#F0EDE6' }, { slug: 'gris_orage', hex: '#6B7280' }],
    laque: [{ slug: 'vert_imperial', hex: '#1A4A3A' }, { slug: 'bleu_roi', hex: '#1A3A6A' }],
    placage: [{ slug: 'noyer_americain', hex: '#5A3E28' }, { slug: 'chene_teinte_vert', hex: '#6B7C5A' }, { slug: 'frene_teinte_bleu', hex: '#7A8FA0' }],
  },
  lys: {
    melamine: [{ slug: 'blanc_creme', hex: '#FFF8E8' }, { slug: 'or_pale', hex: '#E8D8A8' }, { slug: 'taupe', hex: '#B0A090' }, { slug: 'bronze', hex: '#8B7355' }, { slug: 'champagne', hex: '#F0E4CC' }],
    laque: [{ slug: 'ivoire_laque', hex: '#EDE5D0' }, { slug: 'gris_rose', hex: '#B8A8A0' }],
    placage: [{ slug: 'chene_dore', hex: '#B89B6A' }, { slug: 'merisier', hex: '#A0704A' }, { slug: 'noyer_clair', hex: '#9B8262' }],
  },
}

const esIntColors: ColorEntry[] = [
  { slug: 'blanc', hex: '#FFFFFF' }, { slug: 'ivoire', hex: '#E8DDD0' },
  { slug: 'sable', hex: '#D4C5A9' }, { slug: 'gris_clair', hex: '#C8C0B4' }, { slug: 'anthracite', hex: '#4A4A4A' },
]

const kdDoors: Record<string, string[]> = {
  line: ['Oslo', 'Bergen'],
  satori: ['Tokyo', 'Osaka', 'Kyoto', 'Nara'],
  vista: ['Milan', 'Ibiza', 'Porto', 'Seville', 'Murano'],
  lys: ['Versailles', 'Chambord', 'Provence', 'Fontaine'],
}

const kdExtColors: Record<string, ColorEntry[]> = {
  line: [{ slug: 'blanc_alpin', hex: '#F5F5F0' }, { slug: 'gris_perle', hex: '#D4D2CC' }, { slug: 'noir_mat', hex: '#1A1A1A' }, { slug: 'sable', hex: '#E8E0D0' }],
  satori: [{ slug: 'blanc_zen', hex: '#FAF8F2' }, { slug: 'argile', hex: '#D4BFA0' }, { slug: 'terre_cuite', hex: '#C4926A' }, { slug: 'lin', hex: '#E0D8C8' }],
  vista: [{ slug: 'vert_foret', hex: '#2F5A3B' }, { slug: 'bleu_nuit', hex: '#1E3A5F' }, { slug: 'vert_sauge', hex: '#8B9E7C' }, { slug: 'blanc_nuage', hex: '#F0EDE6' }],
  lys: [{ slug: 'champagne', hex: '#F0E4CC' }, { slug: 'rose_poudre', hex: '#B5838D' }, { slug: 'ivoire', hex: '#E8DDD0' }, { slug: 'sable', hex: '#D4C5A9' }],
}

const kdIntColors: ColorEntry[] = [
  { slug: 'blanc', hex: '#FFFFFF' }, { slug: 'ivoire', hex: '#E8DDD0' },
  { slug: 'sable', hex: '#D4C5A9' }, { slug: 'gris_clair', hex: '#C8C0B4' },
]

const kdHandles: Record<string, string[]> = {
  line: ['Push-to-open', 'Profilé aluminium', 'Bouton rond noir'],
  satori: ['Push-to-open', 'Bouton rond laiton', 'Encoche rectangulaire'],
  vista: ['Push-to-open', 'Bouton coloré', 'Profilé noir'],
  lys: ['Push-to-open', 'Coquille laiton', 'Bouton porcelaine', 'Anneau laiton'],
}

const MATERIALS: Material[] = ['melamine', 'laque', 'placage']

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function isLight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 > 150
}

type EsPair = { coll: string | null; mat: Material | null; ext: ColorEntry | null; int: ColorEntry | null }
type KdState = { coll: string | null; door: string | null; ext: ColorEntry | null; int: ColorEntry | null; handle: string | null }
type McState = { type: string | null; layout: string | null; room: string | null; collection: string | null }

const emptyPair = (): EsPair => ({ coll: null, mat: null, ext: null, int: null })

export default function EchantillonsPage() {
  const t = useTranslations('shop.echantillons')
  const tShop = useTranslations('shop')
  const cn = (slug: string) => t(`sample_name_${slug}` as Parameters<typeof t>[0])
  const router = useRouter()

  const MC_LAYOUTS = [
    t('mc_layout_linear'), t('mc_layout_l'), t('mc_layout_u'),
    t('mc_layout_walkin'), t('mc_layout_mural'), t('mc_layout_pente'),
  ]

  const MONTHS = [
    t('month_jan'), t('month_feb'), t('month_mar'), t('month_apr'),
    t('month_may'), t('month_jun'), t('month_jul'), t('month_aug'),
    t('month_sep'), t('month_oct'), t('month_nov'), t('month_dec'),
  ]

  const MAT_LABELS: Record<Material, string> = {
    melamine: t('label_melamine'),
    laque: t('label_laque'),
    placage: t('label_placage'),
  }

  const TABS = [
    { id: 'online', tag: t('tab_online_tag'), label: t('tab_online_label'), desc: t('tab_online_desc'), img: '/images/reassurance-online.png', accent: false },
    { id: 'samples', tag: t('tab_samples_tag'), label: t('tab_samples_label'), desc: t('tab_samples_desc'), img: '/images/reassurance-samples.png', accent: true },
    { id: 'kit', tag: t('tab_kit_tag'), label: t('tab_kit_label'), desc: t('tab_kit_desc'), img: '/images/reassurance-kit.png', accent: false },
    { id: 'showroom', tag: t('tab_showroom_tag'), label: t('tab_showroom_label'), desc: t('tab_showroom_desc'), img: '/images/reassurance-showroom.png', accent: false },
  ]

  const TRUST = [
    { stat: t('trust_custom_stat'), label: t('trust_custom_label') },
    { stat: t('trust_warranty_stat'), label: t('trust_warranty_label') },
    { stat: t('trust_delivery_stat'), label: t('trust_delivery_label') },
    { stat: t('trust_leadtime_stat'), label: t('trust_leadtime_label') },
    { stat: t('trust_design_stat'), label: t('trust_design_label') },
  ]

  const FAQ = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
  ]

  const NOTIFS = [
    { unread: true, img: '/images/stock/oaksome-v8-ambiance-line-1.jpg', title: t('notif_1_title'), desc: t('notif_1_desc'), time: t('notif_1_time'), href: '/acheter' },
    { unread: true, img: '/images/stock/oaksome-v8-ambiance-satori-1.jpg', title: t('notif_2_title'), desc: t('notif_2_desc'), time: t('notif_2_time'), href: '/collections' },
    { unread: true, img: '/images/stock/oaksome-v8-ambiance-vista-1.jpg', title: t('notif_3_title'), desc: t('notif_3_desc'), time: t('notif_3_time'), href: '/echantillons' },
    { unread: false, img: '/images/stock/oaksome-v8-ambiance-line-2.jpg', title: t('notif_4_title'), desc: t('notif_4_desc'), time: t('notif_4_time'), href: '/configurer' },
    { unread: false, img: '/images/stock/oaksome-v8-ambiance-lys-1.jpg', title: t('notif_5_title'), desc: t('notif_5_desc'), time: t('notif_5_time'), href: '/comment-ca-marche' },
  ]

  const [categories, setCategories] = useState<OdooCategory[]>([])
  const [spaces, setSpaces] = useState<OdooStyle[]>([])
  const [styles, setStyles] = useState<OdooStyle[]>([])
  const [kitProductId, setKitProductId] = useState<number | null>(null)
  const [kitProductPrice, setKitProductPrice] = useState<number>(100)
  const [showroomProductId, setShowroomProductId] = useState<number | null>(null)
  const [showroomProductPrice, setShowroomProductPrice] = useState<number>(250)
  const [activeTab, setActiveTab] = useState<string>('samples')
  const [notifOpen, setNotifOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    const { signal } = ac
    fetch('/api/odoo/categories', { signal }).then(r => r.json()).then(data => { if (Array.isArray(data)) setCategories(data) }).catch(() => { })
    fetch('/api/odoo/spaces', { signal }).then(r => r.json()).then(data => { if (Array.isArray(data)) setSpaces(data) }).catch(() => { })
    fetch('/api/odoo/styles', { signal }).then(r => r.json()).then(data => { if (Array.isArray(data)) setStyles(data) }).catch(() => { })
    // fetch('/api/oaksome/v1/pack/product', { signal }).then(r => r.json()).then(res => {
    //   const p = res?.data ?? res
    //   if (p?.id) { setKitProductId(p.id); setKitProductPrice(p.list_price ?? 100) }
    // }).catch(() => { })
    fetch('/api/oaksome/v1/showroom/product', { signal }).then(r => r.json()).then(res => {
      const p = res?.data ?? res
      if (p?.id) { setShowroomProductId(p.id); setShowroomProductPrice(p.list_price ?? 250) }
    }).catch(() => { })
    getProfile().then(res => {
      if (res.success && res.data?.name && res.data?.email) {
        const u = { name: res.data.name, email: res.data.email }
        setLoggedInUser(u)
        setShowroomName(u.name)
        setShowroomEmail(u.email)
        setKdName(u.name)
        setKdEmail(u.email)
      }
    }).catch(() => { })
    return () => ac.abort()
  }, [])

  const [esPairs, setEsPairs] = useState<EsPair[]>([emptyPair(), emptyPair()])
  const [esActivePair, setEsActivePair] = useState(0)
  const [esSubmitting, setEsSubmitting] = useState(false)
  const [esBooked, setEsBooked] = useState(false)
  const [esError, setEsError] = useState<string | null>(null)

  const [loggedInUser, setLoggedInUser] = useState<{ name: string; email: string } | null>(null)

  const [kd, setKd] = useState<KdState>({ coll: null, door: null, ext: null, int: null, handle: null })
  const [kdSubmitting, setKdSubmitting] = useState(false)
  const [kdError, setKdError] = useState<string | null>(null)
  const [kdName, setKdName] = useState('')
  const [kdEmail, setKdEmail] = useState('')

  // Mini configurateur
  const [mc, setMc] = useState<McState>({ type: null, layout: null, room: null, collection: null })

  const [calDate, setCalDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [showroomSlots, setShowroomSlots] = useState<SlotsResponse | null>(null)
  const [showroomSlotsLoading, setShowroomSlotsLoading] = useState(false)
  const [showroomSubmitting, setShowroomSubmitting] = useState(false)
  const [showroomBooked, setShowroomBooked] = useState(false)
  const [showroomError, setShowroomError] = useState<string | null>(null)
  const [showroomName, setShowroomName] = useState('')
  const [showroomEmail, setShowroomEmail] = useState('')
  const [showroomTeams, setShowroomTeams] = useState<ShowroomMobileTeam[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  const fetchShowroomSlots = useCallback((date: Date, teamId: number | null) => {
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    setShowroomSlotsLoading(true)
    setShowroomSlots(null)
    getSlots('mobile', monthStr, teamId ?? undefined).then(r => {
      if (r.success) setShowroomSlots(r.data)
      setShowroomSlotsLoading(false)
    })
  }, [])

  // teamsReady: true once the teams fetch has completed (even if empty)
  const [teamsReady, setTeamsReady] = useState(false)
  useEffect(() => {
    getShowroomMobileTeams().then(r => {
      if (r.success) setShowroomTeams(r.data.teams)
      setTeamsReady(true)
    })
  }, [])

  // Effective team id: selected team, or null when no teams configured (show calendar directly)
  const effectiveTeamId = showroomTeams.length === 0 ? null : selectedTeamId
  const calendarReady = teamsReady && (showroomTeams.length === 0 || selectedTeamId !== null)

  useEffect(() => {
    if (activeTab === 'showroom' && calendarReady) fetchShowroomSlots(calDate, effectiveTeamId)
  }, [activeTab, calDate, calendarReady, effectiveTeamId, fetchShowroomSlots])

  const esP = esPairs[esActivePair]

  function esUpdate(idx: number, patch: Partial<EsPair>) {
    setEsPairs(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p))
  }

  const esExtColors: ColorEntry[] = esP.coll && esP.mat ? (esColors[esP.coll.toLowerCase()]?.[esP.mat] ?? []) : []
  const esSummaryLines = esPairs
    .map((p, i) => p.ext && p.int ? t('es_summary_line', { n: i + 1, coll: cap(p.coll!), ext: cn(p.ext.slug), int: cn(p.int.slug) }) : null)
    .filter(Boolean) as string[]

  async function esSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setEsSubmitting(true)
    setEsError(null)
    const p1 = esPairs[0]
    const p2 = esPairs[1]
    const name = fd.get('name') as string
    const email = fd.get('email') as string
    const kitConfig = {
      collection: p1.coll,
      material:   p1.mat,
      ext_color:  p1.ext?.slug,
      int_color:  p1.int?.slug,
      ...(p2.ext && p2.int ? {
        collection_2: p2.coll,
        material_2:   p2.mat,
        ext_color_2:  p2.ext.slug,
        int_color_2:  p2.int.slug,
      } : {}),
    }
    const [result] = await Promise.all([
      apiPost<{ request_id: string }>('/samples/request', {
        name,
        email,
        address: fd.get('address') as string,
        zip:     fd.get('zip') as string,
        city:    fd.get('city') as string,
        kit_config: kitConfig,
      }),
      // createLead({ name, email, origin: 'echantillons', config_data: kitConfig }),
    ])

    // console.log('result for sample :', result)
    setEsSubmitting(false)
    if (result.success) {
      setEsBooked(true)
      setEsPairs([emptyPair(), emptyPair()])
      setEsActivePair(0)
      ;(e.target as HTMLFormElement).reset()
    } else {
      const rawError = result.error ?? ''
      const isHtml = rawError.trimStart().startsWith('<')
      setEsError(isHtml ? 'Une erreur est survenue. Veuillez réessayer.' : rawError || 'Une erreur est survenue. Veuillez réessayer.')
    }
  }

  function ColorZone({ color, label }: { color: ColorEntry; label: string }) {
    const textColor = isLight(color.hex) ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'
    return (
      <div className="es-preview-zone" style={{ background: color.hex }}>
        <span style={{ color: textColor }}>{label}</span>
        <span style={{ color: textColor, fontSize: 11 }}>{cn(color.slug)}</span>
      </div>
    )
  }

  function EsPreview() {
    const p1 = esPairs[0], p2 = esPairs[1]
    const has1 = p1.ext && p1.int, has2 = p2.ext && p2.int
    if (has1 && has2) return (
      <div className="es-preview-split split-4">
        <ColorZone color={p1.ext!} label={t('color_ext1')} />
        <ColorZone color={p2.ext!} label={t('color_ext2')} />
        <ColorZone color={p1.int!} label={t('color_int1')} />
        <ColorZone color={p2.int!} label={t('color_int2')} />
      </div>
    )
    if (has1) return (
      <div className="es-preview-split split-2">
        <ColorZone color={p1.ext!} label={t('color_exterior')} />
        <ColorZone color={p1.int!} label={t('color_interior')} />
      </div>
    )
    if (p1.ext) return (
      <div className="es-preview-split">
        <div className="es-preview-zone" style={{ background: p1.ext.hex }}>
          <span>{cn(p1.ext.slug)}</span>
        </div>
      </div>
    )
    return (
      <div className="es-preview-split">
        <div className="es-preview-empty">
          <img src="/images/reassurance-samples.png" alt={t('samples_img_alt')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
    )
  }

  function esPreviewLabel() {
    const p1 = esPairs[0], p2 = esPairs[1]
    if (p1.ext && p1.int && p2.ext && p2.int) return t('es_preview_both', { coll1: cap(p1.coll!), coll2: cap(p2.coll!) })
    if (p1.ext && p1.int) return `${cap(p1.coll!)} · ${cn(p1.ext.slug)} / ${cn(p1.int.slug)}`
    if (p1.ext) return t('es_preview_pick_int')
    return t('es_preview_pick_ext')
  }

  const mcCurrentImg =
    (mc.collection && styles.find(s => s.name === mc.collection)?.image) ||
    (mc.type && categories.find(c => c.name === mc.type)?.image_128) ||
    '/images/reassurance-online.png'
  const mcShowCTA = !!(mc.room || mc.collection)
  const mcSummary = [mc.type, mc.layout, mc.room, mc.collection].filter(Boolean).join(' · ')
  const mcLaunchUrl = `/configurer${mc.type ? `?type=${encodeURIComponent(mc.type)}${mc.layout ? `&layout=${encodeURIComponent(mc.layout)}` : ''}${mc.collection ? `&collection=${encodeURIComponent(mc.collection)}` : ''}` : ''}`

  async function kdSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!kd.handle) {
      alert(t('kd_alert_select'))
      return
    }

    try {
      setKdSubmitting(true)

      const res = await apiPost<KitRequestResponse>('/kit/request', {
        name: kdName,
        email: kdEmail,
        config: {
          collection: kd.coll,
          door: kd.door,
          ext_color: kd.ext?.slug,
          int_color: kd.int?.slug,
          handle: kd.handle,
        },
      })

      if (!res?.success) {
        setKdSubmitting(false)
        alert(res?.error || 'Kit creation failed')
        return
      }

      const qs = new URLSearchParams()

      qs.set('kit_id', String(res.data.kit_id))

      qs.set('kit', '1')

      if (kd.coll) qs.set('kit_coll', kd.coll)
      if (kd.door) qs.set('kit_door', kd.door)
      if (kd.ext) qs.set('kit_ext', kd.ext.slug)
      if (kd.int) qs.set('kit_int', kd.int.slug)
      if (kd.handle) qs.set('kit_handle', kd.handle)

      router.push({
        pathname: '/checkout',
        query: Object.fromEntries(qs.entries()),
      })

    } catch (err) {
      console.error(err)
      alert('Something went wrong creating your kit')
    } finally {
      setKdSubmitting(false)
    }
  }

  const kdSummary = [kd.coll, kd.door, kd.ext ? cn(kd.ext.slug) : null, kd.int ? cn(kd.int.slug) : null, kd.handle].filter(Boolean).join(' · ')
  const kdPreviewLabel = kd.ext
    ? [kd.coll, kd.door, kd.handle].filter(Boolean).join(' · ')
    : kd.door ? `${kd.coll} · ${kd.door}` : kd.coll ?? t('kd_preview_placeholder')

  function calDays() {
    const y = calDate.getFullYear(), m = calDate.getMonth()
    const pad = (n: number) => String(n).padStart(2, '0')
    let firstDay = new Date(y, m, 1).getDay()
    firstDay = firstDay === 0 ? 6 : firstDay - 1
    const total = new Date(y, m + 1, 0).getDate()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const available = new Set(showroomSlots?.available_days ?? [])
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(<button key={`e${i}`} className="agenda-day empty" disabled />)
    for (let d = 1; d <= total; d++) {
      const date = new Date(y, m, d)
      const dow = date.getDay()
      const key = `${y}-${pad(m + 1)}-${pad(d)}`
      const pastOrWeekend = dow === 0 || dow === 6 || date < today
      const disabled = pastOrWeekend || (!showroomSlotsLoading && !available.has(key))
      const sel = selectedDate?.toDateString() === date.toDateString()
      days.push(
        <button key={d} className={`agenda-day${disabled ? ' disabled' : ''}${sel ? ' selected' : ''}`}
          disabled={disabled} onClick={() => { setSelectedDate(date); setSelectedSlot(null) }}>{d}</button>
      )
    }
    return days
  }

  async function agendaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!selectedDate || !selectedSlot) return

    setShowroomSubmitting(true)
    setShowroomError(null)

    try {
      const pad = (n: number) => String(n).padStart(2, '0')
      const y = selectedDate.getFullYear()
      const m = selectedDate.getMonth()
      const d = selectedDate.getDate()

      const dateKey = `${y}-${pad(m + 1)}-${pad(d)}`

      const [startHH, startMM] = selectedSlot.split(':').map(Number)
      const endTotal = startHH * 60 + startMM + 60

      const dateStart = `${dateKey}T${selectedSlot}:00`
      const dateEnd = `${dateKey}T${pad(Math.floor(endTotal / 60))}:${pad(endTotal % 60)}:00`

      console.log('about to request');

      const res = await apiPost<ShowroomRequestResponse>('/showroom/request', {
        name: showroomName,
        email: showroomEmail,
        config: {
          date_start: dateStart,
          date_end: dateEnd,
          slot: selectedSlot,
          team_id: effectiveTeamId,
        },
      })

      if (!res?.success) {
        setShowroomError(res?.error || 'Showroom booking failed')
        return
      }

      router.push({
        pathname: '/checkout',
        query: {
          showroom_mobile: '1',
          date_start: dateStart,
          date_end: dateEnd,
          team_id: String(effectiveTeamId || ''),
          lead_id: String(res.data.lead_id),
          showroom_id: String(res.data.showroom_id),
        },
      })

    } catch (err) {
      console.error(err)
      setShowroomError('Something went wrong')
    } finally {
      setShowroomSubmitting(false)
    }
  }

  function Chip({ active, onClick, onMouseEnter, onMouseLeave, children }: {
    active?: boolean; onClick: () => void; onMouseEnter?: () => void; onMouseLeave?: () => void; children: React.ReactNode
  }) {
    return <button className={`mc-chip${active ? ' active' : ''}`} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>{children}</button>
  }

  function ColorChip({ color, active, onSelect, border }: { color: ColorEntry; active: boolean; onSelect: () => void; border?: boolean }) {
    return (
      <button className={`es-color-chip${active ? ' active' : ''}`} onClick={onSelect}>
        <span className="es-color-dot" style={{ background: color.hex, ...(border ? { border: '1px solid rgba(0,0,0,0.1)' } : {}) }} />
        {cn(color.slug)}
      </button>
    )
  }

  return (
    <main id="main-content" tabIndex={-1}>
      <div className="breadcrumb container">
        <Link href="/">{tShop('breadcrumb_home')}</Link> › {t('breadcrumb_current')}
      </div>

      <section style={{ padding: '24px 0 0' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: 0 }}>
            <h1 style={{ fontSize: 'clamp(20px, 3vw, 31px)', letterSpacing: '-0.02em', marginBottom: 8 }}>{t('h1')}</h1>
            <p style={{ maxWidth: 560, fontSize: 14, marginBottom: 0 }}>{t('intro')}</p>
          </div>
        </div>
      </section>

      {/* ── Tab bar ── */}
      <section style={{ padding: '16px 0 0' }}>
        <div className="container">
          <div className="re-grid re-tabs-grid" style={{ gap: 16 }}>
            {TABS.map(({ id, tag, label, desc, img, accent }) => (
              <button key={id} className={`re-card re-tab${activeTab === id ? ' active' : ''}`} data-tab={id} onClick={() => setActiveTab(id)}>
                <div className="re-card-photo"><img src={img} alt={label} loading="lazy" /></div>
                <div className="re-card-body">
                  <span className={`re-tag${accent ? ' re-tag--accent' : ''}`}>{tag}</span>
                  <h3>{label}</h3>
                  <p>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="panel-online" className={`re-panel${activeTab === 'online' ? ' active' : ''}`} style={{ padding: '32px 0' }}>
        <div className="container">
          <div className="ms-grid">
            <div className="ms-left">
              <header>
                <span className="re-tag">{t('online_tag')}</span>
                <h2 style={{ margin: '8px 0 8px' }}>{t('online_title')}</h2>
                <p style={{ color: '#000', fontSize: 14 }}>{t('online_desc')}</p>
              </header>
              <div className="mc-steps-all">
                <div className="mc-section">
                  <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_type')}</h3>
                  <div className="mc-chips">
                    {categories.map(c => (
                      <Chip key={c.id} active={mc.type === c.name}
                        onClick={() => setMc({ type: c.name, layout: null, room: null, collection: null })}
                      >{c.name}</Chip>
                    ))}
                  </div>
                </div>

                {mc.type && (
                  <div className="mc-section">
                    <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_layout')}</h3>
                    <div className="mc-chips">
                      {MC_LAYOUTS.map(layout => (
                        <Chip key={layout} active={mc.layout === layout}
                          onClick={() => setMc(s => ({ ...s, layout, room: null, collection: null }))}
                        >{layout}</Chip>
                      ))}
                    </div>
                  </div>
                )}

                {mc.layout && (
                  <div className="mc-section">
                    <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_room')}</h3>
                    <div className="mc-chips">
                      {spaces.map(s => (
                        <Chip key={s.id} active={mc.room === s.name}
                          onClick={() => setMc(st => ({ ...st, room: s.name }))}
                        >{s.name}</Chip>
                      ))}
                    </div>
                  </div>
                )}

                {mc.room && (
                  <div className="mc-section">
                    <h3 className="ms-mono" style={{ marginBottom: 12 }}>
                      {t('step_collection')} <span style={{ fontWeight: 400, color: '#000' }}>{t('step_collection_optional')}</span>
                    </h3>
                    <div className="mc-chips">
                      {styles.map(s => (
                        <Chip key={s.id} active={mc.collection === s.name}
                          onClick={() => setMc(st => ({ ...st, collection: s.name }))}
                        >{s.name}</Chip>
                      ))}
                    </div>
                  </div>
                )}

                {mcShowCTA && (
                  <div className="mc-section" style={{ paddingTop: 16 }}>
                    <a href={mcLaunchUrl} className="btn btn-primary">{t('btn_launch')}</a>
                    <div style={{ fontFamily: "'PP Air Mono',monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', marginTop: 8 }}>{mcSummary}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="ms-preview">
              <div className="ms-preview-main">
                <img src={mcCurrentImg} alt={t('online_preview_alt')} style={{ transition: 'opacity 300ms ease-out' }} />
              </div>
              {mc.type && (
                <div className="ms-preview-overlay" style={{ display: 'flex' }}>
                  <div><div className="ms-ov-label">{t('overlay_type')}</div><div className="ms-ov-value">{mc.type}</div></div>
                  <div><div className="ms-ov-label">{t('overlay_layout')}</div><div className="ms-ov-value">{mc.layout ?? t('overlay_layout_empty')}</div></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="panel-samples" className={`re-panel${activeTab === 'samples' ? ' active' : ''}`} style={{ padding: '32px 0' }}>
        <div className="container">
          <div className="ms-grid">
            <div className="ms-left">
              <header>
                <span className="re-tag re-tag--accent">{t('samples_tag')}</span>
                <h2 style={{ margin: '8px 0 8px' }}>{t('samples_title')}</h2>
                <p style={{ color: '#000', fontSize: 14 }}>{t('samples_desc')}</p>
              </header>
              <div className="mc-steps-all" style={{ marginTop: 24 }}>
                <div className="es-pair-tabs">
                  <Chip active={esActivePair === 0} onClick={() => setEsActivePair(0)}>{t('pair_1')}</Chip>
                  <Chip active={esActivePair === 1} onClick={() => setEsActivePair(1)}>
                    {t('pair_2')} <span style={{ fontSize: 10, color: '#000' }}>{t('pair_optional')}</span>
                  </Chip>
                </div>

                <div className="mc-section">
                  <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_collection')}</h3>
                  <div className="mc-chips">
                    {styles.map(s => (
                      <Chip key={s.id} active={esP.coll === s.name}
                        onClick={() => esUpdate(esActivePair, { coll: s.name, mat: null, ext: null, int: null })}
                      >{s.name}</Chip>
                    ))}
                  </div>
                </div>

                {esP.coll && (
                  <div className="mc-section">
                    <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_material')}</h3>
                    <div className="mc-chips">
                      {MATERIALS.map(mat => (
                        <Chip key={mat} active={esP.mat === mat}
                          onClick={() => esUpdate(esActivePair, { mat, ext: null, int: null })}
                        >
                          {MAT_LABELS[mat]}
                          {mat !== 'melamine' && <span className="mc-badge-atelier">Atelier</span>}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {esP.mat && esExtColors.length > 0 && (
                  <div className="mc-section">
                    <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_ext_color')}</h3>
                    <div className="es-color-chips">
                      {esExtColors.map(c => (
                        <ColorChip key={c.slug} color={c} active={esP.ext?.slug === c.slug}
                          onSelect={() => esUpdate(esActivePair, { ext: c, int: null })} />
                      ))}
                    </div>
                  </div>
                )}

                {esP.ext && (
                  <div className="mc-section">
                    <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_int_color')}</h3>
                    <div className="es-color-chips">
                      {esIntColors.map(c => (
                        <ColorChip key={c.slug} color={c} active={esP.int?.slug === c.slug} border
                          onSelect={() => esUpdate(esActivePair, { int: c })} />
                      ))}
                    </div>
                  </div>
                )}

                {esBooked ? (
                  <div className="mc-section" style={{ paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ padding: 24, background: '#f0faf4', border: '1px solid #b7e5c8' }}>
                      <p style={{ fontWeight: 700, marginBottom: 8 }}>✅ Demande envoyée !</p>
                      <p style={{ fontSize: 14 }}>Vos échantillons sont en cours de préparation. Vous recevrez un e-mail de confirmation.</p>
                    </div>
                  </div>
                ) : esPairs[0].ext && esPairs[0].int && (
                  <div className="mc-section" style={{ paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ fontFamily: "'PP Air Mono',monospace", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
                      {esSummaryLines.map((line, i) => <div key={i}>{line}</div>)}
                    </div>
                    <form className="ech-form" onSubmit={esSubmit}>
                      <input type="text" name="name" placeholder={t('form_name')} required />
                      <input type="email" name="email" placeholder={t('form_email')} required />
                      <input type="text" name="address" placeholder={t('form_address')} required />
                      <div className="ech-form-row">
                        <input type="text" name="zip" placeholder={t('form_zip')} required />
                        <input type="text" name="city" placeholder={t('form_city')} required />
                      </div>
                      {esError && <p style={{ color: '#c00', fontSize: 13, marginBottom: 8 }}>{esError}</p>}
                      <button type="submit" className="ech-form-submit" disabled={esSubmitting}>
                        {esSubmitting ? 'Envoi en cours…' : t('es_submit')}
                      </button>
                      <div className="ech-form-note">{t('es_note')}</div>
                    </form>
                  </div>
                )}
              </div>
            </div>
            <div className="ms-preview">
              <EsPreview />
              <div style={{ fontFamily: "'PP Air Mono',monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', marginTop: 8, textAlign: 'center' }}>
                {esPreviewLabel()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Panel: Kit découverte ── */}
      <section id="panel-kit" className={`re-panel${activeTab === 'kit' ? ' active' : ''}`} style={{ padding: '32px 0' }}>
        <div className="container">
          <div className="ms-grid">
            <div className="ms-left">
              <header>
                <span className="re-tag">{t('kit_tag')}</span>
                <h2 style={{ margin: '8px 0 8px' }}>{t('kit_title')}</h2>
                <p style={{ color: '#000', fontSize: 14 }}>{t('kit_desc')}</p>
              </header>
              <div className="mc-steps-all" style={{ marginTop: 24 }}>
                <div className="mc-section">
                  <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_collection')}</h3>
                  <div className="mc-chips">
                    {styles.map(s => (
                      <Chip key={s.id} active={kd.coll === s.name.toLowerCase()}
                        onClick={() => setKd({ coll: s.name.toLowerCase(), door: null, ext: null, int: null, handle: null })}
                      >{s.name}</Chip>
                    ))}
                  </div>
                </div>

                {kd.coll && (
                  <div className="mc-section">
                    <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_facade')}</h3>
                    <div className="mc-chips">
                      {(kdDoors[kd.coll] ?? []).map(door => (
                        <Chip key={door} active={kd.door === door}
                          onClick={() => setKd(s => ({ ...s, door, ext: null, int: null, handle: null }))}
                        >{door}</Chip>
                      ))}
                    </div>
                  </div>
                )}

                {kd.door && (
                  <div className="mc-section">
                    <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_ext_color')}</h3>
                    <div className="es-color-chips">
                      {(kdExtColors[kd.coll!] ?? []).map(c => (
                        <ColorChip key={c.slug} color={c} active={kd.ext?.slug === c.slug}
                          onSelect={() => setKd(s => ({ ...s, ext: c, int: null, handle: null }))} />
                      ))}
                    </div>
                  </div>
                )}

                {kd.ext && (
                  <div className="mc-section">
                    <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_int_color')}</h3>
                    <div className="es-color-chips">
                      {kdIntColors.map(c => (
                        <ColorChip key={c.slug} color={c} active={kd.int?.slug === c.slug} border
                          onSelect={() => setKd(s => ({ ...s, int: c, handle: null }))} />
                      ))}
                    </div>
                  </div>
                )}

                {kd.int && (
                  <div className="mc-section">
                    <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('step_handle')}</h3>
                    <div className="mc-chips">
                      {(kdHandles[kd.coll!] ?? []).map(h => (
                        <Chip key={h} active={kd.handle === h} onClick={() => setKd(s => ({ ...s, handle: h }))}>{h}</Chip>
                      ))}
                    </div>
                  </div>
                )}

                {kd.handle && (
                  <div className="mc-section" style={{ paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ fontFamily: "'PP Air Mono',monospace", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>{kdSummary}</div>
                      <form className="ech-form" onSubmit={kdSubmit}>
                        {!loggedInUser && (<>
                          <input type="text" placeholder={t('form_name')} required value={kdName} onChange={e => setKdName(e.target.value)} />
                          <input type="email" placeholder={t('form_email')} required value={kdEmail} onChange={e => setKdEmail(e.target.value)} />
                        </>)}
                        {kdError && <p style={{ color: '#c00', fontSize: 13, marginBottom: 8 }}>{kdError}</p>}
                        <button type="submit" className="ech-form-submit" style={{ background: 'var(--color-noir, #000)' }} disabled={kdSubmitting}>
                          {kdSubmitting ? t('kd_redirecting') : `${t('kd_submit')} — ${kitProductPrice} €`}
                        </button>
                        <div className="ech-form-note">{t('kd_note')}</div>
                      </form>
                  </div>
                )}
              </div>
            </div>
            <div className="ms-preview">
              <div style={{ width: '100%', aspectRatio: '4/3', position: 'relative', overflow: 'hidden' }}>
                {kd.ext ? (
                  <div style={{ display: 'flex', position: 'absolute', inset: 0, flexDirection: 'column' }}>
                    <div style={{ flex: 3, background: kd.ext.hex, transition: 'background 300ms ease-out', display: 'flex', alignItems: 'flex-end', padding: 12 }}>
                      <span style={{ fontFamily: "'PP Air Mono',monospace", fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>Ext: {cn(kd.ext.slug)}</span>
                    </div>
                    <div style={{ flex: 1, background: kd.int?.hex ?? '#EEEDE7', transition: 'background 300ms ease-out', borderTop: '2px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', padding: '0 12px', justifyContent: 'flex-end' }}>
                      {kd.int && <span style={{ fontFamily: "'PP Air Mono',monospace", fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000' }}>Int: {cn(kd.int.slug)}</span>}
                    </div>
                  </div>
                ) : (
                  <img
                    src={kd.door && kd.coll ? `images/stock/dressing-${kd.coll}.jpg` : kd.coll ? `images/stock/oaksome-v8-thumb-${kd.coll}.jpg` : '/images/reassurance-kit.png'}
                    alt={t('kit_img_alt')}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 200ms ease-out' }}
                  />
                )}
              </div>
              <div style={{ fontFamily: "'PP Air Mono',monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000', marginTop: 8, textAlign: 'center' }}>{kdPreviewLabel}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="panel-showroom" className={`re-panel${activeTab === 'showroom' ? ' active' : ''}`} style={{ padding: '32px 0' }}>
        <div className="container">
          <div className="ms-grid">
            <div className="ms-left">
              <header>
                <span className="re-tag">{t('showroom_tag')}</span>
                <h2 style={{ margin: '8px 0 16px' }}>{t('showroom_title')}</h2>
                <p style={{ color: '#000', lineHeight: 1.6 }}>{t('showroom_desc')}</p>
              </header>
              {showroomTeams.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 className="ms-mono" style={{ marginBottom: 12 }}>{t('showroom_pick_region')}</h3>
                  <div className="mc-chips">
                    {showroomTeams.map(team => (
                      <Chip key={team.id} active={selectedTeamId === team.id} onClick={() => {
                        setSelectedTeamId(team.id)
                        setSelectedDate(null)
                        setSelectedSlot(null)
                        setShowroomSlots(null)
                      }}>{team.name}</Chip>
                    ))}
                  </div>
                </div>
              )}

              {calendarReady && (<>
                <div style={{ marginTop: 32 }}>
                  <h3 className="ms-mono" style={{ marginBottom: 16 }}>{t('showroom_pick_date')}</h3>
                  <div className="agenda-calendar">
                    <div className="agenda-cal-header">
                      <button onClick={() => setCalDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>←</button>
                      <span style={{ fontFamily: "'PP Air Mono',monospace", fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {MONTHS[calDate.getMonth()]} {calDate.getFullYear()}
                      </span>
                      <button onClick={() => setCalDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>→</button>
                    </div>
                    <div className="agenda-cal-days">
                      {[t('day_mon'), t('day_tue'), t('day_wed'), t('day_thu'), t('day_fri')].map(d => <span key={d}>{d}</span>)}
                      <span className="agenda-weekend">{t('day_sat')}</span>
                      <span className="agenda-weekend">{t('day_sun')}</span>
                    </div>
                    <div className="agenda-cal-grid">{calDays()}</div>
                  </div>
                </div>
                <div style={{ marginTop: 32 }}>
                  <h3 className="ms-mono" style={{ marginBottom: 16 }}>{t('showroom_pick_slot')}</h3>
                  {(() => {
                    if (!selectedDate) return <p style={{ fontSize: 13, color: '#888' }}>Sélectionnez d&apos;abord une date.</p>
                    if (showroomSlotsLoading) return <p style={{ fontSize: 13, color: '#888' }}>Chargement des créneaux…</p>
                    const pad = (n: number) => String(n).padStart(2, '0')
                    const key = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`
                    const slots = showroomSlots?.slots_by_day[key] ?? []
                    if (slots.length === 0) return <p style={{ fontSize: 13, color: '#888' }}>Aucun créneau disponible ce jour.</p>
                    return (
                      <div className="agenda-slots">
                        {slots.map(slot => (
                          <button key={slot} className={`agenda-slot${selectedSlot === slot ? ' selected' : ''}`} onClick={() => setSelectedSlot(slot)}>{slot}</button>
                        ))}
                      </div>
                    )
                  })()}
                </div>
                {showroomBooked ? (
                  <div style={{ marginTop: 32, padding: 24, background: '#f0faf4', border: '1px solid #b7e5c8' }}>
                    <p style={{ fontWeight: 700, marginBottom: 8 }}>✅ Ajouté au panier !</p>
                    <p style={{ fontSize: 14 }}>Finalisez votre commande depuis le panier pour confirmer votre visite showroom.</p>
                  </div>
                ) : (
                  <form className="ech-form" onSubmit={agendaSubmit} style={{ marginTop: 32 }}>
                    {!loggedInUser && (<>
                      <input type="text" placeholder={t('form_name')} required value={showroomName} onChange={e => setShowroomName(e.target.value)} />
                      <input type="email" placeholder={t('form_email')} required value={showroomEmail} onChange={e => setShowroomEmail(e.target.value)} />
                    </>)}
                    {showroomError && <p style={{ color: '#c00', fontSize: 13, marginBottom: 8 }}>{showroomError}</p>}
                    <button type="submit" className="ech-form-submit" disabled={!selectedDate || !selectedSlot || showroomSubmitting || !showroomProductId}>
                      {showroomSubmitting ? 'Ajout en cours…' : `${t('showroom_submit')} — ${showroomProductPrice} €`}
                    </button>
                    <div className="ech-form-note">{t('showroom_note')}</div>
                  </form>
                )}
              </>)}
            </div>
            <div className="ms-preview">
              <div className="ms-preview-main">
                <img src="/images/reassurance-agenda.png" alt={t('showroom_img_alt')} />
              </div>
              <div style={{ display: 'flex', gap: 32, marginTop: 24 }}>
                {[
                  { label: t('showroom_feat_advisor'), icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
                  { label: t('showroom_feat_collections'), icon: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></> },
                  { label: t('showroom_feat_refund'), icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></> },
                ].map(({ label, icon }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0C524E" strokeWidth="1.5">{icon}</svg>
                    <div style={{ fontFamily: "'PP Air Mono',monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 8 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', padding: '120px 0' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 31, letterSpacing: '-0.02em', marginBottom: 48 }}>{t('faq_title')}</h2>
          {FAQ.map(({ q, a }, i) => (
            <div key={i} className={`ech-faq-item${openFaq === i ? ' open' : ''}`}>
              <button className="ech-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {q}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <div className="ech-faq-a"><p>{a}</p></div>
            </div>
          ))}
        </div>
      </section>

      <div className="reassurance-band">
        <div className="container">
          {TRUST.map(({ stat, label }, i) => (
            <Fragment key={stat}>
              {i > 0 && <div className="trust-sep" />}
              <div className="trust-item">
                <span className="trust-stat">{stat}</span>
                <span className="trust-label">{label}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      <div className={`notif-overlay${notifOpen ? ' open' : ''}`} onClick={() => setNotifOpen(false)} />
      <div className={`notif-panel${notifOpen ? ' open' : ''}`}>
        <div className="notif-header">
          <h3>{t('notif_title')}</h3>
          <button className="notif-close" onClick={() => setNotifOpen(false)}>×</button>
        </div>
        <ul className="notif-list">
          {NOTIFS.map(({ unread, img, title, desc, time, href }) => (
            <li key={title} className={`notif-item${unread ? ' unread' : ''}`} onClick={() => { window.location.href = href }}>
              <div className="notif-thumb-wrap">
                {unread && <div className="notif-dot" />}
                <img src={img} alt="" className="notif-thumb" />
              </div>
              <div className="notif-content">
                <div className="notif-title">{title}</div>
                <div className="notif-desc">{desc}</div>
                <span className="notif-time">{time}</span>
              </div>
              <span className="notif-arrow">›</span>
            </li>
          ))}
        </ul>
        <div style={{ padding: '16px 24px', textAlign: 'center' }}>
          <span style={{ fontFamily: "'PP Air Mono',monospace", fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000' }}>
            {t('notif_all_read')}
          </span>
        </div>
      </div>
    </main>
  )
}
