'use client'

/**
 * Rich split-screen login layout (visual + form + reassurance band).
 *
 * NOT routed: the underscore-prefixed `_components` folder is excluded by
 * the Next.js App Router. Kept in code so we can swap back to this layout
 * after the kickoff launch without recovering it from git history.
 */

import { Suspense, useState, useEffect, Fragment } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { login } from '@/lib/api/auth'
import { useAuth } from '@/features/auth/hooks'
import { trackLogin } from '@/features/tracking/events'
import '@/css/auth-pages.css'
import { isSafeRedirect } from '@/lib/safe-redirect'

function RichLoginFormInner() {
  const t = useTranslations('auth')
  const tTrust = useTranslations('auth.trust')
  const { setUser, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawNext = searchParams.get('next')
  const next = isSafeRedirect(rawNext) ? rawNext : '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(next)
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
    router.push(next)
  }

  return (
    <>
      <div className="auth-page">
        <div className="auth-visual">
          <div className="auth-quote">
            <h3>{t('login.quote_title')}</h3>
            <p>{t('login.intro')}</p>
          </div>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-form">
            <h1>{t('login.welcome')}</h1>
            <p>{t('login.intro')}</p>

            {banner && <div className="auth-banner error">{banner}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">{t('email')}</label>
                <input
                  type="email"
                  id="email"
                  placeholder={t('login.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'error' : ''}
                  autoComplete="email"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">{t('password')}</label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'error' : ''}
                  autoComplete="current-password"
                />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              <div className="form-row">
                <label>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  {t('login.remember')}
                </label>
                <Link href="/password-recover">{t('forgot_password')}</Link>
              </div>

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? t('login.loading') : t('submit_login')}
              </button>
            </form>

            <div className="auth-divider">{t('login.or')}</div>

            <button className="social-btn">🔵 {t('login.google')}</button>
            <button className="social-btn">🍎 {t('login.apple')}</button>

            <div className="auth-footer">
              <p>{t('no_account_yet')} <Link href="/register">{t('register_title')}</Link></p>
            </div>
          </div>
        </div>
      </div>

      <div className="reassurance-band">
        <div className="container">
          {[
            { stat: 'AU CM', label: tTrust('custom_label') },
            { stat: '10 ANS', label: tTrust('guarantee_label') },
            { stat: '0 €', label: tTrust('delivery_label') },
            { stat: '6-8 SEM.', label: tTrust('delay_label') },
            { stat: '100%', label: tTrust('design_label') },
          ].map((item, i, arr) => (
            <Fragment key={item.stat}>
              <div className="trust-item">
                <span className="trust-stat">{item.stat}</span>
                <span className="trust-label">{item.label}</span>
              </div>
              {i < arr.length - 1 && <div className="trust-sep" />}
            </Fragment>
          ))}
        </div>
      </div>
    </>
  )
}

export function RichLoginForm() {
  return (
    <Suspense>
      <RichLoginFormInner />
    </Suspense>
  )
}
