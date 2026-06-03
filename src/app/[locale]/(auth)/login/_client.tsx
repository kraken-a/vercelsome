'use client'

/**
 * /login — kickoff layout (FIX-AUTH-003).
 *
 * Minimal landing-style shell. The previous rich split-screen layout is
 * preserved at `./_components/rich-login-form.tsx` (not routed).
 */

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { Link } from '@/i18n/navigation'
import { login } from '@/lib/api/auth'
import { useAuth } from '@/features/auth/hooks'
import { trackLogin } from '@/features/tracking/events'
import { isSafeRedirect } from '@/lib/safe-redirect'
import { grantInviteToken } from './_actions'
import './login.css'

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
    })
    document.cookie = 'vercelsome_auth=1; path=/; SameSite=Lax'
    trackLogin()
    await grantInviteToken()
    router.push(next)
  }

  return (
    <div className="login-root">
      <header className="login-header">
        <Link href="/">
          <img src="/images/oaksome-logo.svg" alt="Vercelsome" style={{ height: '20px' }} />
        </Link>
        <div className="login-header-meta">
          <div className="country-selectors">
            <div className="languages-box">FR</div>
            <div className="default-country">Belgique</div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M9 18C7.7615 18 6.59483 17.7632 5.5 17.2895C4.40517 16.8157 3.45167 16.1727 2.6395 15.3605C1.82733 14.5483 1.18433 13.5948 0.7105 12.5C0.236833 11.4052 0 10.2385 0 9C0 7.75767 0.236833 6.59 0.7105 5.497C1.18433 4.40417 1.82733 3.45167 2.6395 2.6395C3.45167 1.82733 4.40517 1.18433 5.5 0.7105C6.59483 0.236833 7.7615 0 9 0C10.2423 0 11.41 0.236833 12.503 0.7105C13.5958 1.18433 14.5483 1.82733 15.3605 2.6395C16.1727 3.45167 16.8157 4.40417 17.2895 5.497C17.7632 6.59 18 7.75767 18 9C18 10.2385 17.7632 11.4052 17.2895 12.5C16.8157 13.5948 16.1727 14.5483 15.3605 15.3605C14.5483 16.1727 13.5958 16.8157 12.503 17.2895C11.41 17.7632 10.2423 18 9 18Z"
                fill="black"
                fillOpacity="0.6"
              />
            </svg>
          </div>
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
