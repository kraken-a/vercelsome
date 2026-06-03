'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/features/auth/hooks'
import { getProfile, updateProfile } from '@/lib/api/profile'
import type { Profile } from '@/types/user'
import '@/css/profile-page.css'

const SUPPORTED_COUNTRY_CODES = ['BE', 'LU', 'FR', 'NL', 'MA'] as const
type SupportedCountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number]

export default function ProfilePage() {
  const t = useTranslations('account.profile')
  const { user, setUser } = useAuth()

  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [editingInfo,    setEditingInfo]    = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [savingInfo,     setSavingInfo]     = useState(false)
  const [savingAddress,  setSavingAddress]  = useState(false)
  const [infoError,      setInfoError]      = useState<string | null>(null)
  const [addressError,   setAddressError]   = useState<string | null>(null)

  const [infoForm, setInfoForm] = useState({ name: '', phone: '' })
  const [addrForm, setAddrForm] = useState({ street: '', city: '', zip: '', country: 'BE' })

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
        setAddrForm({
          street:  result.data.address?.street  ?? '',
          city:    result.data.address?.city    ?? '',
          zip:     result.data.address?.zip     ?? '',
          country: result.data.address?.country ?? 'BE',
        })
      } else {
        setFetchError(result.error)
      }
      setLoading(false)
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

  async function saveAddress() {
    setSavingAddress(true)
    setAddressError(null)
    const result = await updateProfile({ address: addrForm })
    if (result.success) {
      setProfile(p => p ? { ...p, address: addrForm } : p)
      setEditingAddress(false)
    } else {
      setAddressError(result.error)
    }
    setSavingAddress(false)
  }

  if (loading) return <div className="profile-loading">{t('loading')}</div>

  if (fetchError) return (
    <div className="profile-loading" style={{ color: '#c0392b' }}>
      {t('error_prefix')}{fetchError}
    </div>
  )

  return (
    <div>
      <div className="profile-header">
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <Link href="/projets" className="profile-stat">
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

      
      <div className="profile-section">
        <div className="profile-section-header">
          <h2>{t('section_personal')}</h2>
          {!editingInfo ? (
            <button className="profile-section-edit" onClick={() => { setEditingInfo(true); setInfoError(null) }}>
              {t('edit')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button className="profile-section-edit" onClick={() => setEditingInfo(false)}>{t('cancel')}</button>
              <button className="profile-section-save" onClick={saveInfo} disabled={savingInfo}>
                {savingInfo ? t('saving') : t('save')}
              </button>
            </div>
          )}
        </div>

        {infoError && <p className="profile-save-error">{infoError}</p>}

        <div className="profile-field-grid">
          <div className="profile-field">
            <label>{t('field_full_name')}</label>
            {!editingInfo
              ? <span>{profile?.name ?? '—'}</span>
              : <input className="profile-input" value={infoForm.name}
                  onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))} />
            }
          </div>
          <div className="profile-field">
            <label>{t('field_email')}</label>
            <span>{profile?.email ?? '—'}</span>
          </div>
          <div className="profile-field">
            <label>{t('field_phone')}</label>
            {!editingInfo
              ? <span className={profile?.phone ? '' : 'empty'}>{profile?.phone || t('phone_empty')}</span>
              : <input className="profile-input" value={infoForm.phone}
                  onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder={t('phone_placeholder')} />
            }
          </div>
        </div>
      </div>

      
      <div className="profile-section">
        <div className="profile-section-header">
          <h2>{t('section_address')}</h2>
          {!editingAddress ? (
            <button className="profile-section-edit" onClick={() => { setEditingAddress(true); setAddressError(null) }}>
              {t('edit')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button className="profile-section-edit" onClick={() => setEditingAddress(false)}>{t('cancel')}</button>
              <button className="profile-section-save" onClick={saveAddress} disabled={savingAddress}>
                {savingAddress ? t('saving') : t('save')}
              </button>
            </div>
          )}
        </div>

        {addressError && <p className="profile-save-error">{addressError}</p>}

        <div className="profile-field-grid">
          <div className="profile-field">
            <label>{t('field_street')}</label>
            {!editingAddress
              ? <span className={profile?.address?.street ? '' : 'empty'}>{profile?.address?.street || t('street_empty')}</span>
              : <input className="profile-input" value={addrForm.street}
                  onChange={e => setAddrForm(f => ({ ...f, street: e.target.value }))}
                  placeholder={t('street_placeholder')} />
            }
          </div>
          <div className="profile-field">
            <label>{t('field_city')}</label>
            {!editingAddress
              ? <span className={profile?.address?.city ? '' : 'empty'}>{profile?.address?.city || t('city_empty')}</span>
              : <input className="profile-input" value={addrForm.city}
                  onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))}
                  placeholder={t('city_placeholder')} />
            }
          </div>
          <div className="profile-field">
            <label>{t('field_zip')}</label>
            {!editingAddress
              ? <span className={profile?.address?.zip ? '' : 'empty'}>{profile?.address?.zip || t('zip_empty')}</span>
              : <input className="profile-input" value={addrForm.zip}
                  onChange={e => setAddrForm(f => ({ ...f, zip: e.target.value }))}
                  placeholder={t('zip_placeholder')} />
            }
          </div>
          <div className="profile-field">
            <label>{t('field_country')}</label>
            {!editingAddress
              ? <span>{formatCountry(profile?.address?.country)}</span>
              : <select className="profile-input" value={addrForm.country}
                  onChange={e => setAddrForm(f => ({ ...f, country: e.target.value }))}>
                  <option value="BE">{t('country_BE')}</option>
                  <option value="LU">{t('country_LU')}</option>
                  <option value="FR">{t('country_FR')}</option>
                  <option value="NL">{t('country_NL')}</option>
                  <option value="MA">{t('country_MA')}</option>
                </select>
            }
          </div>
        </div>
      </div>

      
      <div className="profile-section">
        <div className="profile-section-header">
          <h2>{t('section_security')}</h2>
        </div>
        <div className="profile-security-row">
          <div className="profile-security-info">
            <strong>{t('password_label')}</strong>
            <span>{t('password_desc')}</span>
          </div>
          <Link href="/password-recover" className="profile-security-action">{t('password_change')}</Link>
        </div>
        <div className="profile-security-row">
          <div className="profile-security-info">
            <strong>{t('email_label')}</strong>
            <span>{profile?.email ?? '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
