'use client'

import './pro.css'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import Assurance from '@/components/assurance/assurance'

export default function ProPage() {
  const t = useTranslations('pro')
  const values = [
    { icon: '⚙', title: t('v1_title'), desc: t('v1_desc') },
    { icon: '★', title: t('v2_title'), desc: t('v2_desc') },
    { icon: '📄', title: t('v3_title'), desc: t('v3_desc') },
    { icon: '📑', title: t('v4_title'), desc: t('v4_desc') },
  ]
  const steps = [
    { title: t('s1_title'), desc: t('s1_desc') },
    { title: t('s2_title'), desc: t('s2_desc') },
    { title: t('s3_title'), desc: t('s3_desc') },
    { title: t('s4_title'), desc: t('s4_desc') },
  ]
  const checklist = [t('form_check_1'), t('form_check_2'), t('form_check_3')]
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', specialty: '', message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/odoo/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'pro',
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: `${t('breadcrumb_current')} — ${form.specialty}`,
        message: t('notes_with_company', { company: form.company, message: form.message }),
      }),
    })

    const data = await res.json()
    if (data.success) {
      setStatus('success')
    } else {
      setStatus('error')
      setErrorMsg(data.error || t('error_generic'))
    }
  }

  return (
    <main>
      <div className="container">
        <div style={{ padding: '1rem 0', fontSize: '0.9rem' }}>
          <Link href="/">{t('breadcrumb_home')}</Link> &rsaquo; {t('breadcrumb_current')}
        </div>
      </div>

      <div className="pro-hero">
        <img src="/images/stock/oaksome-v8-thumb-bureau-piece.jpg" alt={t('hero_alt')} />
        <div className="pro-hero-content">
          <h1 style={{ color: '#fff' }}>{t('hero_h1')}</h1>
          <p>{t('hero_intro')}</p>
          <div style={{ marginTop: '2rem' }}>
            <a href="#inscription" className="btn btn-light">{t('hero_cta')}</a>
          </div>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="section-header">
            <h2>{t('values_title')}</h2>
          </div>
          <div className="value-grid">
            {values.map(v => (
              <div key={v.title} className="value-card">
                <span className="card-icon">{v.icon}</span>
                <h4>{v.title}</h4>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <h2>{t('steps_title')}</h2>
          </div>
          <div className="value-grid" style={{ marginTop: '2rem' }}>
            {steps.map((s, i) => (
              <div key={i} className="value-card">
                <span className="card-icon" style={{ fontSize: '1rem', fontFamily: "'PP Air Mono', monospace", color: 'var(--primary)' }}>0{i + 1}</span>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-header">
            <h2>{t('tests_title')}</h2>
          </div>
          <div className="testimonial-placeholder">
            <h3 style={{ fontSize: '1.3rem' }}>{t('tests_h3')}</h3>
            <p>{t('tests_intro')}</p>
            <a href="#inscription" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>{t('tests_cta')}</a>
          </div>
        </div>
      </section>

      <section id="inscription" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="pro-form-section">
            <div className="pro-form-info">
              <h2 style={{ margin: '0.5rem 0' }}>{t('form_title')}</h2>
              <p style={{ marginBottom: '1.5rem' }}>{t('form_intro')}</p>
              <div style={{ marginTop: '1rem' }}>
                {checklist.map(item => (
                  <div key={item} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>✓</div>
                    <p style={{ fontSize: '0.9rem', margin: 0, alignSelf: 'center' }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {status === 'success' ? (
                <div style={{ padding: '2rem', background: 'var(--mint)', textAlign: 'center' }}>
                  <p style={{ fontWeight: 600 }}>{t('form_success_title')}</p>
                  <p>{t('form_success_body')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {status === 'error' && (
                    <p style={{ color: 'red', marginBottom: '1rem' }}>{errorMsg}</p>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('label_name')}</label>
                      <input type="text" name="name" placeholder={t('ph_name')} value={form.name} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('label_company')}</label>
                      <input type="text" name="company" placeholder={t('ph_company')} value={form.company} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('label_email')}</label>
                      <input type="email" name="email" placeholder={t('ph_email')} value={form.email} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('label_phone')}</label>
                      <input type="tel" name="phone" placeholder={t('ph_phone')} value={form.phone} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t('label_specialty')}</label>
                    <select name="specialty" value={form.specialty} onChange={handleChange}>
                      <option value="">{t('specialty_placeholder')}</option>
                      <option value="Architecte">{t('specialty_architect')}</option>
                      <option value="Designer d'intérieur">{t('specialty_interior')}</option>
                      <option value="Promoteur immobilier">{t('specialty_promoter')}</option>
                      <option value="Autre">{t('specialty_other')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('label_message')}</label>
                    <textarea name="message" placeholder={t('ph_message')} value={form.message} onChange={handleChange} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }} disabled={status === 'loading'}>
                    {status === 'loading' ? t('submit_loading') : t('submit_idle')}
                  </button>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.8rem', textAlign: 'center' }}>
                    {t('submit_note')}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Assurance />
    </main>
  )
}
