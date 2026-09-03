'use client'

import './livraison.css'
import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import Assurance from '@/components/assurance/assurance'

export default function LivraisonPage() {
  const t = useTranslations('legal.livraison_page')
  const breadcrumb = useTranslations('breadcrumb')
  const poseSteps = [
    { num: '1', title: t('pose_step1_title'), desc: t('pose_step1_desc') },
    { num: '2', title: t('pose_step2_title'), desc: t('pose_step2_desc') },
    { num: '3', title: t('pose_step3_title'), desc: t('pose_step3_desc') },
    { num: '4', title: t('pose_step4_title'), desc: t('pose_step4_desc') },
  ]
  const faqItems = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
    { q: t('faq_q5'), a: t('faq_a5') },
  ]
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggle = (i: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(i)) {
        next.delete(i)
      } else {
        next.add(i)
      }
      return next
    })
  }

  return (
    <main>
      <div className="container">
        <div style={{ padding: '1rem 0', fontSize: '0.9rem' }}>
          <Link href="/">{breadcrumb('home')}</Link> &rsaquo; {t('breadcrumb')}
        </div>
      </div>

      <div className="livr-hero">
        <div className="container">
          <h1>{t('hero_h1')}</h1>
          <p>{t('hero_p')}</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="section-header">
            <h2>{t('zones_h2')}</h2>
          </div>
          <div className="zone-grid">
            <div className="zone-card">
              <span className="zone-flag">🇧🇪</span>
              <h4>{t('zone_be_h4')}</h4>
              <p>{t('zone_be_p')}</p>
            </div>
            <div className="zone-card">
              <span className="zone-flag">🇱🇺</span>
              <h4>{t('zone_lu_h4')}</h4>
              <p>{t('zone_lu_p')}</p>
            </div>
          </div>
          <p
            style={{
              textAlign: 'center',
              color: '#000000',
              fontSize: '0.9rem',
              marginTop: '1.5rem',
            }}
          >
            {t('zones_coming')}
          </p>
        </div>
      </section>

      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <h2>{t('timeline_h2')}</h2>
            <p>{t('timeline_subtitle')}</p>
          </div>
          <div className="steps">
            <div className="step">
              <h4>{t('step_order_h4')}</h4>
              <p>{t('step_order_p')}</p>
            </div>
            <div className="step">
              <h4>{t('step_metre_h4')}</h4>
              <p>{t('step_metre_p')}</p>
            </div>
            <div className="step">
              <h4>{t('step_valid_h4')}</h4>
              <p>{t('step_valid_p')}</p>
            </div>
            <div className="step">
              <h4>{t('step_prod_h4')}</h4>
              <p>{t('step_prod_p')}</p>
            </div>
            <div className="step">
              <h4>{t('step_pose_h4')}</h4>
              <p>{t('step_pose_p')}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-header">
            <h2>{t('pose_h2')}</h2>
          </div>
          <div className="pose-grid">
            {poseSteps.map((s) => (
              <div key={s.num} className="pose-card">
                <span className="pose-num">{s.num}</span>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <h2>{t('payment_h2')}</h2>
            <p>{t('payment_subtitle')}</p>
          </div>
          <div className="payment-visual">
            <div className="payment-step">
              <div className="payment-pct">{t('payment_step1_pct')}</div>
              <div className="payment-label">{t('payment_step1_label')}</div>
            </div>
            <span className="payment-arrow">&rarr;</span>
            <div className="payment-step">
              <div className="payment-pct">{t('payment_step2_pct')}</div>
              <div className="payment-label">{t('payment_step2_label')}</div>
            </div>
            <span className="payment-arrow">&rarr;</span>
            <div className="payment-step">
              <div className="payment-pct">{t('payment_step3_pct')}</div>
              <div className="payment-label">{t('payment_step3_label')}</div>
            </div>
          </div>
          <p
            style={{
              textAlign: 'center',
              color: '#000000',
              fontSize: '0.85rem',
              marginTop: '1.5rem',
            }}
          >
            {t('payment_note')}
          </p>
        </div>
      </section>

      <section>
        <div className="container" style={{ maxWidth: '720px' }}>
          <div className="section-header">
            <h2>{t('faq_h2')}</h2>
          </div>
          <div className="faq-list">
            {faqItems.map((item, i) => (
              <div key={i} className={`faq-item${openItems.has(i) ? ' open' : ''}`}>
                <div className="faq-question" onClick={() => toggle(i)}>
                  {item.q}
                </div>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="band">
        <div className="container">
          <h2>{t('band_h2')}</h2>
          <p style={{ color: '#000000', margin: '1rem 0 1.5rem' }}>
            {t('band_p')}
          </p>
          <Link href="/contact" className="btn btn-light">
            {t('band_cta')}
          </Link>
        </div>
      </div>

      <Assurance />
    </main>
  )
}
