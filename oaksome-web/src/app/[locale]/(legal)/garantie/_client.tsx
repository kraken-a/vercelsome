'use client'

import './waranty.css'
import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import Assurance from '@/components/assurance/assurance'

export default function GarantiePage() {
  const t = useTranslations('legal.garantie_page')
  const breadcrumb = useTranslations('breadcrumb')
  const faqItems = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
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

      <div className="gar-hero">
        <div className="container">
          <h1>{t('hero_h1')}</h1>
          <p>{t('hero_p')}</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="section-header">
            <h2>{t('cover_h2')}</h2>
          </div>
          <div className="cover-grid">
            <div className="cover-card cover-yes">
              <h4>{t('covered_h4')}</h4>
              <ul>
                <li>{t('covered_item1')}</li>
                <li>{t('covered_item2')}</li>
                <li>{t('covered_item3')}</li>
                <li>{t('covered_item4')}</li>
              </ul>
            </div>
            <div className="cover-card cover-no">
              <h4>{t('notcovered_h4')}</h4>
              <ul>
                <li>{t('notcovered_item1')}</li>
                <li>{t('notcovered_item2')}</li>
                <li>{t('notcovered_item3')}</li>
                <li>{t('notcovered_item4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <h2>{t('process_h2')}</h2>
          </div>
          <div className="process-grid">
            <div className="process-card">
              <span className="process-num">1</span>
              <h4>{t('process_step1_h4')}</h4>
              <p>{t('process_step1_p')}</p>
            </div>
            <div className="process-card">
              <span className="process-num">2</span>
              <h4>{t('process_step2_h4')}</h4>
              <p>{t('process_step2_p')}</p>
            </div>
            <div className="process-card">
              <span className="process-num">3</span>
              <h4>{t('process_step3_h4')}</h4>
              <p>{t('process_step3_p')}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-header">
            <h2>{t('delays_h2')}</h2>
          </div>
          <div className="delay-block">
            <div className="big">48 h</div>
            <p style={{ color: 'var(--text)', marginTop: '0.3rem' }}>
              {t('delays_label1')}
            </p>
          </div>
          <div className="delay-block" style={{ marginTop: '1rem' }}>
            <div className="big">10 jours ouvrables</div>
            <p style={{ color: 'var(--text)', marginTop: '0.3rem' }}>
              {t('delays_label2')}
            </p>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <h2>{t('entretien_h2')}</h2>
            <p>{t('entretien_subtitle')}</p>
          </div>
          <div className="entretien-grid">
            <div className="entretien-card">
              <h4>{t('entretien_placage_h4')}</h4>
              <p>{t('entretien_placage_p')}</p>
            </div>
            <div className="entretien-card">
              <h4>{t('entretien_laque_h4')}</h4>
              <p>{t('entretien_laque_p')}</p>
            </div>
            <div className="entretien-card">
              <h4>{t('entretien_stratifie_h4')}</h4>
              <p>{t('entretien_stratifie_p')}</p>
            </div>
          </div>
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
