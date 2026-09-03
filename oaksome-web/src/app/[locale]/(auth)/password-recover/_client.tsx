'use client'

import { Fragment, useState } from 'react'
import { useTranslations } from 'next-intl'
import { z } from 'zod'
import { Link } from '@/i18n/navigation'
import { recoverPassword } from '@/lib/api/auth'
import '@/css/auth-pages.css'

export default function PasswordRecoverPage() {
  const t = useTranslations('auth')
  const trustT = useTranslations('shop.caseDetail')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)
    const schema = z.object({
      email: z.string().email(t('recover.error_email')),
    })
    const parsed = schema.safeParse({ email })
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
    const result = await recoverPassword(email)
    setLoading(false)
    if (!result.success) {
      setBanner({ type: 'error', msg: result.error || t('recover.error_generic') })
      return
    }
    setBanner({ type: 'success', msg: t('recover.success') })
  }

  return (
    <>
    <div className="auth-page">

      {/* Left — visual */}
      <div className="auth-visual">
        <div className="auth-quote">
          <h3>{t('recover.quote_title')}</h3>
          <p>{t('recover.quote_body')}</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="auth-form-wrap">
        <div className="auth-form">
          <h1>{t('recover.title')}</h1>
          <p>{t('recover.intro')}</p>

          {banner && <div className={`auth-banner ${banner.type}`}>{banner.msg}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">{t('email')}</label>
              <input
                type="email"
                id="email"
                placeholder={t('recover.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'error' : ''}
                autoComplete="email"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? t('recover.loading') : t('recover.submit')}
            </button>
          </form>

          <div className="auth-footer">
            <p>{t('recover.remember')} <Link href="/login">{t('submit_login')}</Link></p>
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
