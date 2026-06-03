'use client'

import { Fragment, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Link } from '@/i18n/navigation'
import { register } from '@/lib/api/auth'
import { trackSignUp } from '@/features/tracking/events'
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

export default function RegisterPage() {
  const t = useTranslations('auth')
  const trustT = useTranslations('shop.caseDetail')
  const router = useRouter()
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [postal, setPostal] = useState('')
  const [newsletter, setNewsletter] = useState(false)
  const [cgv, setCgv] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const strength = getStrength(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBanner(null)
    const schema = z.object({
      firstname: z.string().min(1, t('register.error_firstname')),
      lastname: z.string().min(1, t('register.error_lastname')),
      email: z.string().email(t('register.error_email')),
      password: z.string().min(8, t('register.error_password')),
      confirmPassword: z.string(),
      cgv: z.literal(true, { error: t('register.error_cgv') }),
    }).refine((d) => d.password === d.confirmPassword, {
      message: t('register.error_confirm'),
      path: ['confirmPassword'],
    })
    const parsed = schema.safeParse({ firstname, lastname, email, password, confirmPassword, cgv })
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
    const result = await register({
      name: `${firstname} ${lastname}`.trim(),
      email,
      password,
      is_pro: false,
      ...(postal ? { phone: postal } : {}),
    })
    setLoading(false)
    if (!result.success) {
      setBanner({ type: 'error', msg: result.error || t('register.error_generic') })
      return
    }
    trackSignUp()
    setBanner({ type: 'success', msg: t('register.success') })
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <>
    <div className="auth-page">

      {/* Left — visual */}
      <div className="auth-visual" style={{ backgroundImage: "url('/images/stock/oaksome-v8-ambiance-line-1.jpg')" }}>
        <div className="auth-quote">
          <h3>{t('register.quote_title')}</h3>
          <p>{t('register.quote_body')}</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="auth-form-wrap">
        <div className="auth-form">
          <h1>{t('register_title')}.</h1>
          <p>{t('register.intro')}</p>

          {banner && <div className={`auth-banner ${banner.type}`}>{banner.msg}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="firstname">{t('register.firstname')}</label>
                <input
                  type="text"
                  id="firstname"
                  placeholder={t('register.firstname_placeholder')}
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  className={errors.firstname ? 'error' : ''}
                  autoComplete="given-name"
                />
                {errors.firstname && <span className="field-error">{errors.firstname}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="lastname">{t('register.lastname')}</label>
                <input
                  type="text"
                  id="lastname"
                  placeholder={t('register.lastname_placeholder')}
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  className={errors.lastname ? 'error' : ''}
                  autoComplete="family-name"
                />
                {errors.lastname && <span className="field-error">{errors.lastname}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('email')}</label>
              <input
                type="email"
                id="email"
                placeholder={t('register.email_placeholder')}
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
                autoComplete="new-password"
              />
              <div className="pw-strength">
                <div className="bar" style={{ width: strength.width, background: strength.color }} />
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">{t('register.confirm_password')}</label>
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

            <div className="form-group" style={{ maxWidth: '160px' }}>
              <label htmlFor="postal">{t('register.postal')}</label>
              <input
                type="text"
                id="postal"
                placeholder="1000"
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
                autoComplete="postal-code"
              />
            </div>

            <div className="checkbox-row">
              <input type="checkbox" id="cgv" checked={cgv} onChange={(e) => setCgv(e.target.checked)} />
              <label htmlFor="cgv">
                {t('register.cgv_prefix')}
                <Link href="/cgv">{t('register.cgv_link')}</Link>
                {t('register.cgv_separator')}
                <Link href="/mentions-legales">{t('register.privacy_link')}</Link>.
              </label>
            </div>
            {errors.cgv && <span className="field-error" style={{ display: 'block', marginTop: '-0.5rem', marginBottom: '1rem' }}>{errors.cgv}</span>}

            <div className="checkbox-row">
              <input type="checkbox" id="newsletter" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
              <label htmlFor="newsletter">
                {t('register.newsletter')}
              </label>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? t('register.loading') : t('register.submit')}
            </button>
          </form>

          <div className="auth-divider">{t('register.or')}</div>

          <button className="social-btn">🔵 {t('register.google')}</button>
          <button className="social-btn">🍎 {t('register.apple')}</button>

          <div className="auth-footer">
            <p>{t('already_have_account')} <Link href="/login">{t('submit_login')}</Link></p>
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
