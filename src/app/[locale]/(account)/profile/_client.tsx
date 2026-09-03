'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useAuth } from '@/features/auth/hooks'
import Image from 'next/image'
import { getProfile, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress, changePassword, setPassword } from '@/lib/api/profile'
import '@/css/profile-page.css'
import { getProjects } from '@/lib/api/orders'
import type { Profile, ProfileAddress } from '@/types/user'
import type { Project, OakomeStatus } from '@/types/order'


const STATUS_CLASSES: Record<string, string> = {
  cgv_pending: 'status-pending', deposit_pending: 'status-pending',
  measures_pending: 'status-pending', measures_scheduled: 'status-scheduled',
  plan_validated: 'status-scheduled', manufacturing: 'status-production',
  ready: 'status-production', delivering: 'status-production',
  done: 'status-delivered', '': 'status-pending',
}


function getStatusClass(p: Project) {
  if (p.state === 'cancel') return 'status-cancelled'
  return STATUS_CLASSES[p.status as OakomeStatus] ?? 'status-pending'
}

function formatShortDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}.${mm}.${yy}`
}

function formatLongDate(iso: string | null, locale: string): string {
  if (!iso) return '—'
  const loc = locale === 'nl' ? 'nl-BE' : locale === 'en' ? 'en-GB' : 'fr-BE'
  return new Date(iso).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency', currency: currency || 'EUR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}
function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function getStrength(pw: string): { width: string; color: string } {
  if (pw.length === 0) return { width: '0%', color: '#C1FD48' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const widths = ['15%', '35%', '65%', '100%']
  const colors = ['#c0392b', '#e67e22', '#f1c40f', '#C1FD48']
  return { width: widths[score - 1] ?? '0%', color: colors[score - 1] ?? '#C1FD48' }
}

const SUPPORTED_COUNTRY_CODES = ['BE', 'LU', 'FR', 'NL', 'MA'] as const
type SupportedCountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number]

const LANG_CODES = ['fr', 'nl', 'en'] as const
type LangCode = (typeof LANG_CODES)[number]

type AddrForm = { type: 'delivery' | 'invoice'; street: string; city: string; zip: string; country: string }

const EMPTY_ADDR_FORM: AddrForm = { type: 'delivery', street: '', city: '', zip: '', country: 'BE' }

export default function ProfilePage() {
  const t = useTranslations('account.profile')
  const locale = useLocale()
  const router = useRouter()
  const { user, setUser } = useAuth()

  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [editingInfo,  setEditingInfo]  = useState(false)
  const [savingInfo,   setSavingInfo]   = useState(false)
  const [infoError,    setInfoError]    = useState<string | null>(null)

  const [savingLang, setSavingLang] = useState(false)
  const [langSaved,  setLangSaved]  = useState(false)

  const [editingPwd,   setEditingPwd]   = useState(false)
  const [pwdForm,      setPwdForm]      = useState({ current: '', newPwd: '', confirm: '' })
  const [savingPwd,    setSavingPwd]    = useState(false)
  const [pwdError,     setPwdError]     = useState<string | null>(null)
  const [pwdSuccess,   setPwdSuccess]   = useState(false)
  const [showPwd,      setShowPwd]      = useState({ current: false, newPwd: false, confirm: false })

  const [infoForm, setInfoForm] = useState({ name: '', phone: '' })

  // Address state: editingAddrId = null (not editing), -1 (adding new), or partner id
  const [editingAddrId,  setEditingAddrId]  = useState<number | null>(null)
  const [addrForm,       setAddrForm]       = useState<AddrForm>(EMPTY_ADDR_FORM)
  const [savingAddr,     setSavingAddr]     = useState(false)
  const [addrError,      setAddrError]      = useState<string | null>(null)
  const [deletingAddrId,  setDeletingAddrId]  = useState<number | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null)

  const [recentProjects, setRecentProjects] = useState<Project[]>([])

  function formatCountry(code: string | undefined) {
    const country = code ?? 'BE'
    if (!SUPPORTED_COUNTRY_CODES.includes(country as SupportedCountryCode)) return country
    return t(`country_${country}` as `country_${SupportedCountryCode}`)
  }

  useEffect(() => {
    getProfile().then(result => {
      if (result.success) {
        setProfile(result.data)
        setInfoForm({ name: result.data.name, phone: result.data.phone ?? '' })
      } else {
        setFetchError(result.error)
      }
      setLoading(false)
    })
    getProjects().then(result => {
      if (result.success) {
        setRecentProjects(result.data.projects.slice(0, 2))
      }
    })
  }, [])

  async function saveInfo() {
    setSavingInfo(true)
    setInfoError(null)
    const result = await updateProfile({ name: infoForm.name, phone: infoForm.phone })
    if (result.success) {
      setProfile(p => p ? { ...p, name: infoForm.name, phone: infoForm.phone } : p)
      if (user) setUser({ ...user, name: infoForm.name })
      setEditingInfo(false)
    } else {
      setInfoError(result.error)
    }
    setSavingInfo(false)
  }

  async function saveLang(lang: LangCode) {
    if (savingLang || lang === (profile?.lang ?? locale)) return
    setSavingLang(true)
    setLangSaved(false)
    const result = await updateProfile({ lang })
    if (result.success) {
      setProfile(p => p ? { ...p, lang } : p)
      setLangSaved(true)
      setTimeout(() => setLangSaved(false), 2000)
      router.push('/profile', { locale: lang })
    }
    setSavingLang(false)
  }


  async function savePasswordAction() {
    setPwdError(null)
    setPwdSuccess(false)
    if (pwdForm.newPwd.length < 8) { setPwdError(t('pwd_too_short')); return }
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdError(t('pwd_mismatch')); return }
    setSavingPwd(true)
    const result = profile?.has_password
        ? await changePassword(pwdForm.current, pwdForm.newPwd)
        : await setPassword(pwdForm.newPwd)
    if (result.success) {
      setProfile(p => p ? { ...p, has_password: true } : p)
      setPwdForm({ current: '', newPwd: '', confirm: '' })
      setEditingPwd(false)
      setPwdSuccess(true)
      setTimeout(() => setPwdSuccess(false), 3000)
    } else {
      setPwdError(result.error.includes('incorrect') ? t('pwd_wrong_current') : result.error)
    }
    setSavingPwd(false)
  }

  function startEditAddr(addr: ProfileAddress) {
    setEditingAddrId(addr.id)
    setAddrForm({ type: addr.type ?? 'delivery', street: addr.street, city: addr.city, zip: addr.zip, country: addr.country })
    setAddrError(null)
  }

  function startAddAddr() {
    setEditingAddrId(-1)
    setAddrForm(EMPTY_ADDR_FORM)
    setAddrError(null)
  }

  function cancelAddr() {
    setEditingAddrId(null)
    setAddrError(null)
  }

  async function saveAddr() {
    setSavingAddr(true)
    setAddrError(null)
    let result
    if (editingAddrId === -1) {
      result = await addAddress(addrForm)
    } else {
      result = await updateAddress(editingAddrId!, addrForm)
    }
    if (result.success) {
      setProfile(result.data)
      setEditingAddrId(null)
    } else {
      setAddrError(result.error)
    }
    setSavingAddr(false)
  }

  async function handleSetDefault(id: number) {
    setSettingDefaultId(id)
    setProfile(p => {
      if (!p) return p
      const targetType = (p.addresses ?? []).find(a => a.id === id)?.type
      return {
        ...p,
        addresses: (p.addresses ?? []).map(a =>
          a.type === targetType ? { ...a, is_default: a.id === id } : a
        ),
      }
    })
    const result = await setDefaultAddress(id)
    if (result.success && result.data) setProfile(result.data)
    setSettingDefaultId(null)
  }

  async function handleDeleteAddr(id: number) {
    setDeletingAddrId(id)
    const previous = profile
    setProfile(p => p ? { ...p, addresses: (p.addresses ?? []).filter(a => a.id !== id) } : p)
    const result = await deleteAddress(id)
    if (result.success && result.data) {
      setProfile(result.data)
    } else if (!result.success) {
      setProfile(previous)
    }
    setDeletingAddrId(null)
  }

  if (loading) return <div className="profile-loading">{t('loading')}</div>

  if (fetchError) return (
    <div className="profile-loading" style={{ color: '#c0392b' }}>
      {t('error_prefix')}{fetchError}
    </div>
  )

  const addresses: ProfileAddress[] = profile?.addresses ?? (profile?.address ? [profile.address] : [])

  return (
    <div>
      <h1 className="profile-greeting">{t('greeting', { name: user?.name?.split(' ')[0] ?? '' })}</h1>

      {/* Stats */}
      <div className="profile-stats">
        <Link href="/commandes" className="profile-stat">
          <span className="profile-stat-value">{profile?.project_count ?? 0}</span>
          <span className="profile-stat-label">{t('stat_projects')}</span>
        </Link>
        <div className="profile-stat">
          <span className="profile-stat-value">{profile?.wishlist_count ?? 0}</span>
          <span className="profile-stat-label">{t('stat_wishlist')}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">
            <span className={`profile-badge ${profile?.is_pro ? 'pro' : 'standard'}`}>
              {profile?.is_pro ? t('badge_pro') : t('badge_standard')}
            </span>
          </span>
          <span className="profile-stat-label">{t('stat_account')}</span>
        </div>
      </div>

      {/* Personal info */}
      <div className="profile-section">
        <h2 className="profile-section-title">{t('section_personal')}</h2>

        {infoError && <p className="profile-save-error">{infoError}</p>}

        <div className="info-row">
          <span className="info-label">{t('field_full_name')}</span>
          {!editingInfo
            ? <span className="info-value">{profile?.name ?? '—'}</span>
            : <input className="profile-input info-input" value={infoForm.name}
                onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))} />
          }
          {!editingInfo
            ? <button className="info-edit" onClick={() => { setEditingInfo(true); setInfoError(null) }}>{t('edit')}</button>
            : <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="info-edit" onClick={() => setEditingInfo(false)}>{t('cancel')}</button>
                <button className="profile-section-save" onClick={saveInfo} disabled={savingInfo}>
                  {savingInfo ? t('saving') : t('save')}
                </button>
              </div>
          }
        </div>
        <div className="info-row">
          <span className="info-label">{t('field_email')}</span>
          <span className="info-value">{profile?.email ?? '—'}</span>
          <span />
        </div>
        <div className="info-row">
          <span className="info-label">{t('field_phone')}</span>
          {!editingInfo
            ? <span className={`info-value${profile?.phone ? '' : ' empty'}`}>{profile?.phone || t('phone_empty')}</span>
            : <input className="profile-input info-input" value={infoForm.phone}
                onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))}
                placeholder={t('phone_placeholder')} />
          }
          {!editingInfo
            ? <button className="info-edit" onClick={() => { setEditingInfo(true); setInfoError(null) }}>{t('edit')}</button>
            : <span />
          }
        </div>
      </div>

      {/* Addresses */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h2 className="profile-section-title" style={{ margin: 0 }}>{t('section_address')}</h2>
          {editingAddrId === null && (
            <button className="profile-add-address" onClick={startAddAddr}>
              {t('add_address')}
            </button>
          )}
        </div>

        {addrError && <p className="profile-save-error">{addrError}</p>}

        {/* Existing address cards */}
        {addresses.length > 0 && editingAddrId === null && (
          <div className="address-cards-grid">
            {addresses.map((addr, i) => (
              <div key={addr.id || i} className="address-card">
                <div className="address-card-badges">
                  <span className={`address-type-badge ${addr.type === 'invoice' ? 'invoice' : 'delivery'}`}>
                    {addr.type === 'invoice' ? t('addr_type_invoice') : t('addr_type_delivery')}
                  </span>
                  {addr.is_default && (
                    <span className="address-badge">{t('badge_default')}</span>
                  )}
                </div>
                <p><strong>{profile?.name}</strong></p>
                {addr.street && <p>{addr.street}</p>}
                {(addr.zip || addr.city) && (
                  <p>{[addr.zip, addr.city].filter(Boolean).join(' ')}</p>
                )}
                {addr.country && <p><strong>{formatCountry(addr.country)}</strong></p>}
                <div className="address-card-actions">
                  <button className="info-edit" onClick={() => startEditAddr(addr)}>
                    {t('edit')}
                  </button>
                  {!addr.is_default && (
                    <button
                      className="info-edit"
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={settingDefaultId === addr.id}
                    >
                      {settingDefaultId === addr.id ? t('saving') : t('set_default')}
                    </button>
                  )}
                  {!addr.is_default && (
                    <button
                      className="info-edit address-delete"
                      onClick={() => handleDeleteAddr(addr.id)}
                      disabled={deletingAddrId === addr.id}
                    >
                      {deletingAddrId === addr.id ? t('saving') : t('delete')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit form */}
        {editingAddrId !== null && (
          <div>
            {editingAddrId === -1 && (
              <h3 className="profile-addr-form-title">{t('add_address_title')}</h3>
            )}
            <div className="profile-addr-type-toggle">
              <button
                type="button"
                className={`profile-addr-type-btn${addrForm.type === 'delivery' ? ' active' : ''}`}
                onClick={() => setAddrForm(f => ({ ...f, type: 'delivery' }))}
              >
                {t('addr_type_delivery')}
              </button>
              <button
                type="button"
                className={`profile-addr-type-btn${addrForm.type === 'invoice' ? ' active' : ''}`}
                onClick={() => setAddrForm(f => ({ ...f, type: 'invoice' }))}
              >
                {t('addr_type_invoice')}
              </button>
            </div>
            <div className="profile-field-grid">
              <div className="profile-field">
                <label>{t('field_street')}</label>
                <input className="profile-input" value={addrForm.street}
                  onChange={e => setAddrForm(f => ({ ...f, street: e.target.value }))}
                  placeholder={t('street_placeholder')} />
              </div>
              <div className="profile-field">
                <label>{t('field_city')}</label>
                <input className="profile-input" value={addrForm.city}
                  onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))}
                  placeholder={t('city_placeholder')} />
              </div>
              <div className="profile-field">
                <label>{t('field_zip')}</label>
                <input className="profile-input" value={addrForm.zip}
                  onChange={e => setAddrForm(f => ({ ...f, zip: e.target.value }))}
                  placeholder={t('zip_placeholder')} />
              </div>
              <div className="profile-field">
                <label>{t('field_country')}</label>
                <select className="profile-input" value={addrForm.country}
                  onChange={e => setAddrForm(f => ({ ...f, country: e.target.value }))}>
                  <option value="BE">{t('country_BE')}</option>
                  <option value="LU">{t('country_LU')}</option>
                  <option value="FR">{t('country_FR')}</option>
                  <option value="NL">{t('country_NL')}</option>
                  <option value="MA">{t('country_MA')}</option>
                </select>
              </div>
            </div>
            <div className="profile-addr-form-actions">
              <button className="info-edit" onClick={cancelAddr}>{t('cancel')}</button>
              <button className="profile-section-save" onClick={saveAddr} disabled={savingAddr}>
                {savingAddr ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Security */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h2>{t('section_security')}</h2>
          {!editingPwd ? (
            <button className="profile-section-edit" onClick={() => { setEditingPwd(true); setPwdError(null); setPwdSuccess(false) }}>
              {t('edit')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button className="profile-section-edit" onClick={() => { setEditingPwd(false); setPwdForm({ current: '', newPwd: '', confirm: '' }) }}>{t('cancel')}</button>
              <button className="profile-section-save" onClick={savePasswordAction} disabled={savingPwd}>
                {savingPwd ? t('pwd_saving') : t('pwd_save')}
              </button>
            </div>
          )}
        </div>

        {pwdSuccess && <p className="profile-lang-status saved">{t('pwd_success')}</p>}
        {pwdError   && <p className="profile-save-error">{pwdError}</p>}

        {!editingPwd ? (
          <div className="profile-security-row">
            <div className="profile-security-info">
              <strong>{profile?.has_password ? t('pwd_change_title') : t('pwd_set_title')}</strong>
              {!profile?.has_password && <span>{t('pwd_set_desc')}</span>}
            </div>
          </div>
        ) : (
          <div className="profile-field-grid">
            {profile?.has_password && (
              <div className="profile-field">
                <label>{t('pwd_current')}</label>
                <div className="profile-input-eye">
                  <input className="profile-input" type={showPwd.current ? 'text' : 'password'} value={pwdForm.current}
                    onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))} />
                  <button type="button" onClick={() => setShowPwd(s => ({ ...s, current: !s.current }))}>
                    {showPwd.current ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
            )}
            <div className="profile-field">
              <label>{t('pwd_new')}</label>
              <div className="profile-input-eye">
                <input className="profile-input" type={showPwd.newPwd ? 'text' : 'password'} value={pwdForm.newPwd}
                  onChange={e => setPwdForm(f => ({ ...f, newPwd: e.target.value }))} />
                <button type="button" onClick={() => setShowPwd(s => ({ ...s, newPwd: !s.newPwd }))}>
                  {showPwd.newPwd ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {pwdForm.newPwd.length > 0 && (
                <div style={{ marginTop: '4px', height: '3px', background: '#eee', borderRadius: 0 }}>
                  <div style={{ height: '100%', width: getStrength(pwdForm.newPwd).width, background: getStrength(pwdForm.newPwd).color, transition: 'width 0.3s' }} />
                </div>
              )}
            </div>
            <div className="profile-field">
              <label>{t('pwd_confirm')}</label>
              <div className="profile-input-eye">
                <input className="profile-input" type={showPwd.confirm ? 'text' : 'password'} value={pwdForm.confirm}
                  onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} />
                <button type="button" onClick={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))}>
                  {showPwd.confirm ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="profile-security-row">
          <div className="profile-security-info">
            <strong>{t('email_label')}</strong>
            <span>{profile?.email ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="profile-section">
        <div className="profile-section-header">
          <h2>{t('section_language')}</h2>
        </div>
        <p className="profile-lang-desc">{t('language_desc')}</p>
        <div className="profile-lang-buttons">
          {LANG_CODES.map((code) => {
            const active = (profile?.lang ?? locale) === code
            return (
              <button
                key={code}
                className={`profile-lang-btn${active ? ' active' : ''}`}
                onClick={() => saveLang(code)}
                disabled={savingLang}
              >
                {t(`lang_${code}` as `lang_fr` | `lang_nl` | `lang_en`)}
              </button>
            )
          })}
        </div>
        {savingLang && <p className="profile-lang-status">{t('lang_saving')}</p>}
        {langSaved  && <p className="profile-lang-status saved">{t('lang_saved')}</p>}
      </div>

      {/* Recent orders */}
      {recentProjects.length > 0 && (
        <div className="profile-section">
          <div className="profile-section-header">
            <h2>{t('section_recent_orders')}</h2>
            <Link href="/commandes" className="profile-view-all">{t('view_all')}</Link>
          </div>

          {recentProjects.map(project => {
            const odooUrl = process.env.NEXT_PUBLIC_ODOO_URL || ''
            const statusClass = getStatusClass(project)
            return (
              <div key={project.id} className="profile-order-row">
                <div className="profile-order-img">
                  {project.product_image_id ? (
                    <Image
                      src={`${odooUrl}/web/image/product.template/${project.product_image_id}/image`}
                      alt={project.name}
                      width={175}
                      height={175}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/stock/dressing-satori.jpg' }}
                    />
                  ) : (
                    <img src="/images/stock/dressing-satori.jpg" alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>

                <div className="profile-order-infos">
                  <div className="profile-order-top">
                    <div className="profile-order-left">
                      <span className="profile-order-name">{project.name}</span>
                      <div className="profile-order-status">
                        <span className={`profile-order-status-label ${statusClass}`}>
                          {t(`status_${project.status || 'default'}` as 'status_default')}
                        </span>
                        {project.date && <span className="profile-order-status-date">&nbsp;· {formatShortDate(project.date)}</span>}
                      </div>
                    </div>
                    <div className="profile-order-meta">
                      <span className="profile-order-price">{formatPrice(project.amount_total, project.currency)}</span>
                      <span className="profile-order-meta-sub">{project.product_count} {t('articles')}</span>
                      <span className="profile-order-meta-sub">{formatLongDate(project.date, locale)}</span>
                    </div>
                  </div>

                  <div className="profile-order-bottom">
                    <Link href={`/commandes/${project.so1_id}`} className="profile-order-action">
                      {t('order_detail')}
                    </Link>
                    <span className="profile-order-sep" />
                    <button className="profile-order-action profile-order-action--inert">{t('make_return')}</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
