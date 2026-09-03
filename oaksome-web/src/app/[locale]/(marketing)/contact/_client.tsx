'use client';
import './contact.css';
import Assurance from "@/components/assurance/assurance";

import { useState } from "react";
import { useTranslations } from 'next-intl'
import { trackContactForm } from "@/features/tracking/events";
import { Link } from "@/i18n/navigation";

export default function ContactPage() {
  const t = useTranslations('contact')

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    subject: '', message: '', source: '',
    type: 'commercial' as 'commercial' | 'support' | 'pro',
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
        type: form.type,
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message,
        utm_source: form.source || undefined,
      }),
    })

    const data = await res.json()
    if (data.success) {
      trackContactForm(form.type)
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
          <Link href="/">{t('breadcrumb_home')}</Link> › {t('breadcrumb_current')}
        </div>
      </div>

      <section style={{ paddingTop: '1rem' }}>
        <div className="container">
          <div className="contact-grid">
            <div>
              <span className="mono" style={{ color: 'var(--primary)' }}>{t('mono_label')}</span>
              <h1 style={{ fontSize: '2.5rem', margin: '0.5rem 0 0.5rem' }}>{t('h1')}</h1>
              <p style={{ marginBottom: '2rem' }}>{t('intro')}</p>

              {status === 'success' ? (
                <div style={{ padding: '2rem', background: 'var(--mint)', textAlign: 'center' }}>
                  <p style={{ fontWeight: 600 }}>{t('success_title')}</p>
                  <p>{t('success_body')}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {status === 'error' && (
                    <p style={{ color: 'red', marginBottom: '1rem' }}>{errorMsg}</p>
                  )}
                  <div className="form-group">
                    <label>{t('label_type')}</label>
                    <select name="type" value={form.type} onChange={handleChange}>
                      <option value="commercial">{t('type_commercial')}</option>
                      <option value="pro">{t('type_pro')}</option>
                      <option value="support">{t('type_support')}</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('label_first_name')}</label>
                      <input type="text" name="firstName" maxLength={60} placeholder={t('ph_first_name')} value={form.firstName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('label_last_name')}</label>
                      <input type="text" name="lastName" maxLength={60} placeholder={t('ph_last_name')} value={form.lastName} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>{t('label_email')}</label>
                      <input type="email" name="email" maxLength={254} placeholder={t('ph_email')} value={form.email} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('label_phone')}</label>
                      <input type="tel" name="phone" maxLength={30} placeholder={t('ph_phone')} value={form.phone} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t('label_subject')}</label>
                    <select name="subject" value={form.subject} onChange={handleChange}>
                      <option value="">{t('subject_placeholder')}</option>
                      <option value="Dressing ou armoire">{t('subject_dressing')}</option>
                      <option value="Mobilier de salon">{t('subject_living')}</option>
                      <option value="Mobilier de chambre">{t('subject_bedroom')}</option>
                      <option value="Mobilier de bureau">{t('subject_office')}</option>
                      <option value="Plusieurs pièces">{t('subject_multiple')}</option>
                      <option value="Autre">{t('subject_other')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('label_message')}</label>
                    <textarea name="message" maxLength={5000} placeholder={t('ph_message')} value={form.message} onChange={handleChange}></textarea>
                  </div>
                  <div className="form-group">
                    <label>{t('label_source')}</label>
                    <select name="source" value={form.source} onChange={handleChange}>
                      <option value="">{t('source_placeholder')}</option>
                      <option value="Instagram">{t('source_instagram')}</option>
                      <option value="Recherche Google">{t('source_google')}</option>
                      <option value="Ami ou famille">{t('source_friend')}</option>
                      <option value="Visite showroom">{t('source_showroom')}</option>
                      <option value="Autre">{t('source_other')}</option>
                    </select>
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

            <div style={{ paddingTop: '4rem' }}>
              <div className="info-card">
                <h4>&#128222; {t('card_phone_title')}</h4>
                <p>{t('card_phone_number')}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{t('card_phone_hours')}</p>
              </div>
              <div className="info-card">
                <h4>&#128205; {t('card_showroom_title')}</h4>
                <p>{t('card_showroom_name')}</p>
                <p>{t('card_showroom_address')}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.3rem' }}>{t('card_showroom_note')}</p>
                <Link
                  href="/rendez-vous"
                  style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}
                >
                  {t('card_showroom_cta')} &rarr;
                </Link>
              </div>
              <div className="info-card">
                <h4>&#9993; {t('card_email_title')}</h4>
                <p>{t('card_email_value')}</p>
              </div>

              <div className="info-card" style={{ marginTop: '1.5rem' }}>
                <h4>{t('card_mobile_title')}</h4>
                <p>{t('card_mobile_desc')}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--teal)', fontWeight: 600, marginTop: '0.3rem' }}>{t('card_mobile_price')}</p>
                <Link
                  href="/echantillons"
                  style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}
                >
                  {t('card_mobile_cta')} &rarr;
                </Link>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>{t('next_title')}</h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>1</div>
                  <div><p style={{ fontSize: '0.9rem' }}><strong>{t('next_1')}</strong> {t('next_1_body')}</p></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>2</div>
                  <div><p style={{ fontSize: '0.9rem' }}><strong>{t('next_2')}</strong> {t('next_2_body')}</p></div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>3</div>
                  <div><p style={{ fontSize: '0.9rem' }}><strong>{t('next_3')}</strong> {t('next_3_body')}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Assurance />
    </main>
  );
}
