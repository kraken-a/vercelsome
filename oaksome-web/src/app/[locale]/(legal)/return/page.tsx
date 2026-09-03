import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import './return.css'
import { Link } from '@/i18n/navigation'
import Assurance from '@/components/assurance/assurance'
import { getTranslations } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.return', locale, pathMap: '/return' })
}

export default async function Returns() {
  const t = await getTranslations('legal.return_page')
  const breadcrumb = await getTranslations('breadcrumb')

  return (
    <main>
      <div className="container">
        <div style={{ padding: '1rem 0', fontSize: '0.9rem' }}>
          <Link href="/">{breadcrumb('home')}</Link> &rsaquo; {t('breadcrumb')}
        </div>
      </div>

      <div className="ret-hero">
        <div className="container">
          <h1>{t('hero_h1')}</h1>
          <p>{t('hero_p')}</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="section-header">
            <h2>{t('retract_h2')}</h2>
          </div>
          <div className="legal-block">
            <h4>{t('retract_h4')}</h4>
            <p>{t('retract_p1')}</p>
            <p style={{ marginTop: '1rem' }}>{t('retract_p2')}</p>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <h2>{t('cases_h2')}</h2>
          </div>
          <div className="case-grid">
            <div className="case-card">
              <span className="case-icon">📦</span>
              <h4>{t('case1_h4')}</h4>
              <p>{t('case1_p')}</p>
              <div className="case-detail">
                <strong>{t('case1_proc_label')}</strong> {t('case1_proc_text')}<br />
                <strong>{t('case1_delay_label')}</strong> {t('case1_delay_text')}
              </div>
            </div>
            <div className="case-card">
              <span className="case-icon">🔧</span>
              <h4>{t('case2_h4')}</h4>
              <p>{t('case2_p')}</p>
              <div className="case-detail">
                <strong>{t('case2_proc_label')}</strong> {t('case2_proc_text')}<br />
                <strong>{t('case2_delay_label')}</strong> {t('case2_delay_text')}
              </div>
            </div>
            <div className="case-card">
              <span className="case-icon">📅</span>
              <h4>{t('case3_h4')}</h4>
              <p>{t('case3_p')}</p>
              <div className="case-detail">
                <strong>{t('case3_proc_label')}</strong> {t('case3_proc_text')}<br />
                <strong>{t('case3_delay_label')}</strong> {t('case3_delay_text')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="section-header">
            <h2>{t('signal_h2')}</h2>
          </div>
          <div className="signal-grid">
            <div className="signal-card">
              <span className="signal-num">1</span>
              <h4>{t('signal_step1_h4')}</h4>
              <p>{t('signal_step1_p')}</p>
            </div>
            <div className="signal-card">
              <span className="signal-num">2</span>
              <h4>{t('signal_step2_h4')}</h4>
              <p>{t('signal_step2_p')}</p>
            </div>
            <div className="signal-card">
              <span className="signal-num">3</span>
              <h4>{t('signal_step3_h4')}</h4>
              <p>{t('signal_step3_p')}</p>
            </div>
          </div>
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/contact" className="btn btn-primary">{t('signal_cta')}</Link>
          </p>
        </div>
      </section>

      <section style={{ background: 'var(--beige)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span className="mono" style={{ color: 'var(--teal)' }}>{t('garantie_mono')}</span>
            <h3 style={{ margin: '0.3rem 0 0', fontSize: '1.3rem' }}>{t('garantie_h3')}</h3>
            <p style={{ color: '#000000', fontSize: '0.9rem', margin: '0.3rem 0 0' }}>{t('garantie_p')}</p>
          </div>
          <Link href="/garantie" className="btn btn-primary">{t('garantie_cta')}</Link>
        </div>
      </section>

      <Assurance />
    </main>
  )
}
