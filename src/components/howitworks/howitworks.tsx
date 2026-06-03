'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import './howitworks.css'

export default function HowItWorks() {
  const t = useTranslations('howitworks')
  return (
    <section className="howworks-section">
      <div className="container">
        <div className="section-header">
          <span className="mono" style={{ color: 'var(--color-vert-persan, #0C524E)' }}>
            {t('eyebrow')}
          </span>
          <h2>{t('h2')}</h2>
        </div>

        <div className="re-grid">
          <div className="hw-card">
            <div className="re-card-photo">
              <img
                src="/images/howworks-configure.png"
                alt={t('step1_alt')}
                loading="eager"
              />
            </div>
            <div className="re-card-body">
              <span className="re-tag">01</span>
              <h3>{t('step1_title')}</h3>
              <p>{t('step1_desc')}</p>
              <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.5)', marginTop: '8px' }}>
                {t('step1_note')}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                <Link
                  href="/configurer"
                  className="btn btn-primary"
                  style={{ fontSize: '11px', padding: '10px 20px' }}
                >
                  {t('step1_cta_configure')}
                </Link>
                <Link
                  href="/echantillons"
                  className="btn btn-outline"
                  style={{ fontSize: '11px', padding: '10px 20px' }}
                >
                  {t('step1_cta_samples')}
                </Link>
              </div>
            </div>
          </div>

          <div className="hw-card">
            <div className="re-card-photo">
              <img src="/images/howworks-order.png" alt={t('step2_alt')} loading="eager" />
            </div>
            <div className="re-card-body">
              <span className="re-tag">02</span>
              <h3>{t('step2_title')}</h3>
              <p>{t('step2_desc')}</p>
            </div>
          </div>

          <div className="hw-card">
            <div className="re-card-photo">
              <img
                src="/images/howworks-measure.png"
                alt={t('step3_alt')}
                loading="eager"
              />
            </div>
            <div className="re-card-body">
              <span className="re-tag">03</span>
              <h3>{t('step3_title')}</h3>
              <p>{t('step3_desc')}</p>
            </div>
          </div>

          <div className="hw-card">
            <div className="re-card-photo">
              <img
                src="/images/howworks-install.png"
                alt={t('step4_alt')}
                loading="eager"
              />
            </div>
            <div className="re-card-body">
              <span className="re-tag">04</span>
              <h3>{t('step4_title')}</h3>
              <p>{t('step4_desc')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
