'use client'

import { Fragment, Suspense, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { Link } from '@/i18n/navigation'
import { resetPassword } from '@/lib/api/auth'
import { trackPasswordReset } from '@/features/tracking/events'
import '@/css/auth-pages.css'

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

function PasswordResetForm() {
  const t = useTranslations('auth')
  const trustT = useTranslations('shop.caseDetail')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const strength = getStrength(password)

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-visual">
          <div className="auth-quote">
            <h3>{t('reset.quote_title')}</h3>
            <p>{t('reset.quote_body')}</p>
          </div>
        </div>
        <div className="auth-form-wrap">
          <div className="auth-form">
            <div className="auth-banner error">
              {t('reset.invalid_link')} <Link href="/password-recover">{t('reset.invalid_link_cta')}</Link>.
            </div>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)
    const schema = z.object({
      password: z.string().min(8, t('reset.error_password')),
      confirmPassword: z.string(),
    }).refine((d) => d.password === d.confirmPassword, {
      message: t('reset.error_confirm'),
      path: ['confirmPassword'],
    })
    const parsed = schema.safeParse({ password, confirmPassword })
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
    const result = await resetPassword(token, password)
    setLoading(false)
    if (!result.success) {
      setBanner({ type: 'error', msg: result.error || t('reset.error_generic') })
      return
    }
    trackPasswordReset()
    setBanner({ type: 'success', msg: t('reset.success') })
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <>
    <div className="auth-page">

      {/* Left — visual */}
      <div className="auth-visual">
        <div className="auth-quote">
          <h3>{t('reset.quote_title')}</h3>
          <p>{t('reset.quote_body')}</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="auth-form-wrap">
        <div className="auth-form">
          <h1>{t('reset.title')}</h1>
          <p>{t('reset.intro')}</p>

          {banner && <div className={`auth-banner ${banner.type}`}>{banner.msg}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="password">{t('reset.new_password')}</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'error' : ''}
                autoComplete="new-password"
              />
              <div className="pw-strength">
                <div className="bar" style={{ width: strength.width, background: strength.color }} />
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">{t('reset.confirm_password')}</label>
              <input
                type="password"
                id="confirm-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={errors.confirmPassword ? 'error' : ''}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? t('reset.loading') : t('reset.submit')}
            </button>
          </form>

          <div className="auth-footer">
            <p>{t('reset.back_to_login')} <Link href="/login">{t('reset.back_to_login_link')}</Link></p>
          </div>
        </div>
      </div>

    </div>

    <div className="reassurance-band">
      <div className="container">
        {[
          { stat: trustT('trust_custom_stat'), label: trustT('trust_custom_label') },
          { stat: trustT('trust_warranty_stat'), label: trustT('trust_warranty_label') },
          { stat: trustT('trust_delivery_stat'), label: trustT('trust_delivery_label') },
          { stat: trustT('trust_leadtime_stat'), label: trustT('trust_leadtime_label') },
          { stat: trustT('trust_design_stat'), label: trustT('trust_design_label') },
        ].map((item, i, arr) => (
          <Fragment key={item.stat}>
            <div className="trust-item">
              <span className="trust-stat">{item.stat}</span>
              <span className="trust-label">{item.label}</span>
            </div>
            {i < arr.length - 1 && <div key={`sep-${i}`} className="trust-sep" />}
          </Fragment>
        ))}
      </div>
    </div>
    </>
  )
}

export default function PasswordResetPage() {
  return (
    <Suspense>
      <PasswordResetForm />
    </Suspense>
  )
}
