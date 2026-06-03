'use client'

import './about.css'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function AProposPage() {
  const t = useTranslations('about')

  return (
    <>
      <div className="breadcrumb">
        <Link href="/">{t('breadcrumb_home')}</Link> &rsaquo; {t('breadcrumb_about')}
      </div>

      <div className="hero-about">
        <img
          src="/images/stock/oaksome-v8-about-equipe.jpg"
          alt={t('hero_img_alt')}
        />
        <div className="overlay"></div>
        <div className="hero-inner">
          <span
            className="mono"
            style={{ color: 'var(--text-light)', display: 'block', marginBottom: '0.8rem' }}
          >
            {t('hero_tag')}
          </span>
          <h1>{t('hero_h1')}</h1>
          <p>{t('hero_p')}</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="mission-grid">
            <div className="mission-text">
              <span
                className="mono"
                style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.8rem' }}
              >
                {t('mission_tag')}
              </span>
              <h2>{t('mission_h2')}</h2>
              <p>{t('mission_p1')}</p>
              <p>{t('mission_p2')}</p>
            </div>
            <img
              src="/images/stock/oaksome-v8-about-atelier.jpg"
              alt={t('mission_img_alt')}
            />
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="mono">{t('values_tag')}</span>
            <h2>{t('values_h2')}</h2>
          </div>
          <div className="values-grid">
            <div className="value-card" style={{ background: 'var(--beige)' }}>
              <div className="value-icon">&#10022;</div>
              <h4>{t('value_1_title')}</h4>
              <p>{t('value_1_desc')}</p>
            </div>
            <div className="value-card" style={{ background: 'var(--beige)' }}>
              <div className="value-icon">&#9670;</div>
              <h4>{t('value_2_title')}</h4>
              <p>{t('value_2_desc')}</p>
            </div>
            <div className="value-card" style={{ background: 'var(--beige)' }}>
              <div className="value-icon">&#9675;</div>
              <h4>{t('value_3_title')}</h4>
              <p>{t('value_3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="showroom-band">
        <div className="container">
          <span
            className="mono"
            style={{ color: 'var(--secondary)', display: 'block', marginBottom: '1rem' }}
          >
            {t('showroom_tag')}
          </span>
          <h2>{t('showroom_h2')}</h2>
          <p>{t('showroom_p')}</p>
          <Link href="/contact" className="btn btn-light">
            {t('showroom_cta')}
          </Link>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="section-header">
            <span className="mono">{t('numbers_tag')}</span>
            <h2>{t('numbers_h2')}</h2>
          </div>
          <div className="numbers-grid">
            <div className="number-item">
              <div className="number">4</div>
              <p>{t('number_1_label')}</p>
            </div>
            <div className="number-item">
              <div className="number">10 ans</div>
              <p>{t('number_2_label')}</p>
            </div>
            <div className="number-item">
              <div className="number">200 000+</div>
              <p>{t('number_3_label')}</p>
            </div>
            <div className="number-item">
              <div className="number">100%</div>
              <p>{t('number_4_label')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="quote-band">
        <div className="container">
          <blockquote>
            &quot;{t('quote_text')}&quot;
          </blockquote>
          <div className="quote-author">— {t('quote_author')}</div>
        </div>
      </div>

      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <span className="mono">{t('steps_tag')}</span>
            <h2>{t('steps_h2')}</h2>
          </div>
          <div className="steps">
            <div className="step">
              <h4>{t('step_1_title')}</h4>
              <p>{t('step_1_desc')}</p>
            </div>
            <div className="step">
              <h4>{t('step_2_title')}</h4>
              <p>{t('step_2_desc')}</p>
            </div>
            <div className="step">
              <h4>{t('step_3_title')}</h4>
              <p>{t('step_3_desc')}</p>
            </div>
            <div className="step">
              <h4>{t('step_4_title')}</h4>
              <p>{t('step_4_desc')}</p>
            </div>
            <div className="step">
              <h4>{t('step_5_title')}</h4>
              <p>{t('step_5_desc')}</p>
            </div>
            <div className="step">
              <h4>{t('step_6_title')}</h4>
              <p>{t('step_6_desc')}</p>
            </div>
            <div className="step">
              <h4>{t('step_7_title')}</h4>
              <p>{t('step_7_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>{t('cta_h2')}</h2>
          <p>{t('cta_p')}</p>
          <div className="cta-buttons">
            <Link href="/contact" className="btn btn-primary">
              {t('cta_contact')}
            </Link>
            <Link href="/configurer" className="btn btn-secondary">
              {t('cta_configurator')}
            </Link>
          </div>
        </div>
      </section>

      <div className="reassurance-band">
        <div className="container">
          <div className="trust-item">
            <span className="trust-stat">AU CM</span>
            <span className="trust-label">{t('trust_custom_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">10 ANS</span>
            <span className="trust-label">{t('trust_warranty_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">0 &euro;</span>
            <span className="trust-label">{t('trust_delivery_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">6-8 SEM.</span>
            <span className="trust-label">{t('trust_delay_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">100%</span>
            <span className="trust-label">{t('trust_design_label')}</span>
          </div>
        </div>
      </div>

      <Script src="/js/nav-scroll.js" strategy="afterInteractive" />
    </>
  )
}
