'use client'

/**
 * /login — kickoff layout (FIX-AUTH-003).
 *
 * Minimal landing-style shell. The previous rich split-screen layout is
 * preserved at `./_components/rich-login-form.tsx` (not routed).
 */

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter as useIntlRouter } from '@/i18n/navigation'
import { z } from 'zod'
import { Link } from '@/i18n/navigation'
import { login } from '@/lib/api/auth'
import { useAuth } from '@/features/auth/hooks'
import { trackLogin } from '@/features/tracking/events'
import { isSafeRedirect } from '@/lib/safe-redirect'
import { grantInviteToken } from './_actions'
import './login.css'

const LOCALES = [
  { code: 'fr', labels: { fr: 'Français',    en: 'French',  nl: 'Frans'      } },
  { code: 'en', labels: { fr: 'Anglais',     en: 'English', nl: 'Engels'     } },
  { code: 'nl', labels: { fr: 'Néerlandais', en: 'Dutch',   nl: 'Nederlands' } },
] as const

function LocaleSwitcher() {
  const locale = useLocale()
  const router = useIntlRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div className="locale-switcher" ref={ref}>
      <button
        className="locale-trigger"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Changer de langue"
      >
        <svg className="lang-globe" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18C7.7615 18 6.59483 17.7632 5.5 17.2895C4.40517 16.8157 3.45167 16.1727 2.6395 15.3605C1.82733 14.5483 1.18433 13.5948 0.7105 12.5C0.236833 11.4052 0 10.2385 0 9C0 7.75767 0.236833 6.59 0.7105 5.497C1.18433 4.40417 1.82733 3.45167 2.6395 2.6395C3.45167 1.82733 4.40517 1.18433 5.5 0.7105C6.59483 0.236833 7.7615 0 9 0C10.2423 0 11.41 0.236833 12.503 0.7105C13.5958 1.18433 14.5483 1.82733 15.3605 2.6395C16.1727 3.45167 16.8157 4.40417 17.2895 5.497C17.7632 6.59 18 7.75767 18 9C18 10.2385 17.7632 11.4052 17.2895 12.5C16.8157 13.5948 16.1727 14.5483 15.3605 15.3605C14.5483 16.1727 13.5958 16.8157 12.503 17.2895C11.41 17.7632 10.2423 18 9 18ZM9 17.0077C9.58717 16.2539 10.0712 15.5135 10.452 14.7865C10.8327 14.0597 11.1423 13.2463 11.3807 12.3463H6.61925C6.88342 13.2974 7.19942 14.1365 7.56725 14.8635C7.93525 15.5903 8.41283 16.3051 9 17.0077ZM7.727 16.8577C7.26033 16.3078 6.83433 15.6279 6.449 14.8182C6.06383 14.0086 5.777 13.1846 5.5885 12.3463H1.75375C2.32692 13.5898 3.13942 14.6096 4.19125 15.4057C5.24325 16.2019 6.42183 16.6859 7.727 16.8577ZM10.273 16.8577C11.5782 16.6859 12.7567 16.2019 13.8087 15.4057C14.8606 14.6096 15.6731 13.5898 16.2463 12.3463H12.4115C12.159 13.1974 11.8401 14.0278 11.4548 14.8375C11.0696 15.6472 10.6757 16.3206 10.273 16.8577ZM1.34625 11.3463H5.38075C5.30508 10.9359 5.25158 10.5362 5.22025 10.147C5.18875 9.758 5.173 9.37567 5.173 9C5.173 8.62433 5.18875 8.242 5.22025 7.853C5.25158 7.46383 5.30508 7.06408 5.38075 6.65375H1.34625C1.23725 6.99992 1.15225 7.37717 1.09125 7.7855C1.03042 8.19383 1 8.59867 1 9C1 9.40133 1.03042 9.80617 1.09125 10.2145C1.15225 10.6228 1.23725 11.0001 1.34625 11.3463ZM6.38075 11.3463H11.6193C11.6949 10.9359 11.7484 10.5426 11.7797 10.1663C11.8112 9.79008 11.827 9.40133 11.827 9C11.827 8.59867 11.8112 8.20992 11.7797 7.83375C11.7484 7.45742 11.6949 7.06408 6.38075 6.65375ZM12.6193 11.3463H16.6538C16.7628 11.0001 16.8477 10.6228 16.9088 10.2145C16.9696 9.80617 17 9.40133 17 9C17 8.59867 16.9696 8.19383 16.9088 7.7855C16.8477 7.37717 16.7628 6.99992 16.6538 6.65375H12.6193C12.6949 7.06408 12.7484 7.46383 12.7797 7.853C12.8112 8.242 12.827 8.62433 12.827 9C12.827 9.37567 12.8112 9.758 12.7797 10.147C12.7484 10.5362 12.6949 10.9359 12.6193 11.3463ZM12.4115 5.65375H16.2463C15.6602 4.38458 14.8573 3.36475 13.8375 2.59425C12.8177 1.82375 11.6295 1.33333 10.273 1.123C10.7397 1.73717 11.1593 2.43942 11.5318 3.22975C11.9043 4.02025 12.1975 4.82825 12.4115 5.65375ZM6.61925 5.65375H11.3807C11.1166 4.71542 10.7909 3.86675 10.4038 3.10775C10.0166 2.34875 9.54867 1.64358 9 0.99225C8.45133 1.64358 7.98342 2.34875 7.59625 3.10775C7.20908 3.86675 6.88342 4.71542 6.61925 5.65375ZM1.75375 5.65375H5.5885C5.8025 4.82825 6.09575 4.02025 6.46825 3.22975C6.84075 2.43942 7.26033 1.73717 7.727 1.123C6.35767 1.33333 5.16633 1.82692 4.153 2.60375C3.1395 3.38075 2.33975 4.39742 1.75375 5.65375Z" fill="black"/>
        </svg>
        <span className="locale-badge">{locale.toUpperCase()}</span>
      </button>
      {open && (
        <ul className="locale-dropdown" role="listbox">
          {LOCALES.map(l => (
            <li key={l.code} role="option" aria-selected={locale === l.code}>
              <button
                onClick={() => { router.push('/login', { locale: l.code }); setOpen(false) }}
                className={locale === l.code ? 'active' : ''}
              >
                {l.labels[locale as keyof typeof l.labels]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LoginInner() {
  const t = useTranslations('auth')
  const { setUser, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawNext = searchParams.get('next')
  const next = isSafeRedirect(rawNext) ? rawNext : '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      grantInviteToken().then(() => router.replace(next))
    }
  }, [isLoading, isAuthenticated, next, router])

  if (isLoading || isAuthenticated) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)
    const schema = z.object({
      email: z.string().email(t('login.error_email')),
      password: z.string().min(1, t('login.error_password')),
    })
    const parsed = schema.safeParse({ email, password })
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((err: z.ZodIssue) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    const result = await login({ login: email, password })
    setLoading(false)
    if (!result.success) {
      setBanner(result.error || t('login.error_invalid'))
      return
    }
    setUser({
      id: result.data.user_id,
      name: result.data.name,
      email: result.data.email,
      isPro: result.data.is_pro,
      isInternal: false,
    })
    trackLogin()
    await grantInviteToken()
    router.push(next)
  }

  return (
    <div className="login-root">
      <header className="login-header">
        <Link href="/">
          <img src="/images/oaksome-logo.svg" alt="Oaksome" style={{ height: '20px' }} />
        </Link>
        <div className="login-header-meta">
          <LocaleSwitcher />
        </div>
      </header>

      <main className="login-main">
        <div className="login-card">
          <h1>{t('login.welcome')}</h1>
          <p className="login-intro">{t('login.intro')}</p>

          {banner && <div className="login-banner">{banner}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="email">{t('email')}</label>
              <input
                type="email"
                id="email"
                placeholder={t('login.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'error' : ''}
                autoComplete="email"
                required
              />
              {errors.email && <span className="login-field-error">{errors.email}</span>}
            </div>

            <div className="login-field">
              <label htmlFor="password">{t('password')}</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'error' : ''}
                autoComplete="current-password"
                required
              />
              {errors.password && <span className="login-field-error">{errors.password}</span>}
            </div>

            <div className="login-row">
              <Link href="/password-recover">{t('forgot_password')}</Link>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? t('login.loading') : t('submit_login')}
            </button>
          </form>

          {/* Google OAuth — temporairement masqué, à réactiver quand prêt
          <div className="login-divider">{t('login.or')}</div>

          <div className="login-social">
            <a
              href={`/api/auth/google?next=${encodeURIComponent(next)}`}
              className="login-social-btn"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {t('login.google')}
            </a>
          </div>
          */}
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
