import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import './prise.css'
import { Link } from '@/i18n/navigation'
import Assurance from '@/components/assurance/assurance'
import { getTranslations } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.prise_mesures', locale, pathMap: { fr: '/prise-mesures', nl: '/opmeten', en: '/measurements' } })
}

export default async function PriseDeMesuresPage() {
  const t = await getTranslations('legal.prise_mesures_page')
  const breadcrumb = await getTranslations('breadcrumb')

  return (
    <main>
      <div className="container">
        <div style={{ padding: '1rem 0', fontSize: '0.9rem' }}>
          <Link href="/">{breadcrumb('home')}</Link> &rsaquo; <Link href="/comment-ca-marche">{t('breadcrumb_comment')}</Link> &rsaquo; {t('breadcrumb_current')}
        </div>
      </div>

      <section style={{ paddingTop: '1rem' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{t('h1')}</h1>
          <p style={{ maxWidth: '600px', marginBottom: '3rem' }}>{t('intro')}</p>

          <div className="measure-layout">
            <div className="measure-steps">
              <div className="measure-step">
                <div className="measure-num">1</div>
                <div>
                  <h4>{t('step1_h4')}</h4>
                  <p>{t('step1_p')}</p>
                </div>
              </div>

              <div className="measure-step">
                <div className="measure-num">2</div>
                <div>
                  <h4>{t('step2_h4')}</h4>
                  <p>{t('step2_p')}</p>
                </div>
              </div>

              <div className="measure-step">
                <div className="measure-num">3</div>
                <div>
                  <h4>{t('step3_h4')}</h4>
                  <p>{t('step3_p')}</p>
                </div>
              </div>

              <div className="measure-step">
                <div className="measure-num">4</div>
                <div>
                  <h4>{t('step4_h4')}</h4>
                  <p>{t('step4_p')}</p>
                </div>
              </div>

              <div className="measure-step">
                <div className="measure-num">5</div>
                <div>
                  <h4>{t('step5_h4')}</h4>
                  <p>{t('step5_p')}</p>
                </div>
              </div>
            </div>

            <div className="measure-illus">
              <div className="placeholder" />
              <p className="mono" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{t('illus_label')}</p>
              <p style={{ fontSize: '0.85rem' }}>{t('illus_caption')}</p>
            </div>
          </div>

          <div className="tips-grid">
            <div className="tip-card">
              <div className="tip-icon">📏</div>
              <h4>{t('tip1_h4')}</h4>
              <p>{t('tip1_p')}</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">✌️</div>
              <h4>{t('tip2_h4')}</h4>
              <p>{t('tip2_p')}</p>
            </div>
            <div className="tip-card">
              <div className="tip-icon">📸</div>
              <h4>{t('tip3_h4')}</h4>
              <p>{t('tip3_p')}</p>
            </div>
          </div>

          <div className="download-section">
            <div>
              <h4>{t('download_h4')}</h4>
              <p>{t('download_p')}</p>
            </div>
            <Link href="/contact" className="btn btn-secondary">{t('download_cta')}</Link>
          </div>

          <div className="cta-band">
            <h2>{t('cta_h2')}</h2>
            <p>{t('cta_p')}</p>
            <Link href="/rendez-vous" className="btn btn-light">{t('cta_btn')}</Link>
          </div>
        </div>
      </section>

      <Assurance />
    </main>
  )
}
