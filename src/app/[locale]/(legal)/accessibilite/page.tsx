import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.accessibilite', locale, pathMap: '/accessibilite' })
}

import '../mentions-legales/legalMentions.css'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export default async function AccessibilitePage() {
  const t = await getTranslations('legal.accessibilite_page')
  const breadcrumb = await getTranslations('breadcrumb')
  return (
    <main id="main-content" tabIndex={-1}>
      <div className="container">
        <div style={{ padding: '1rem 0', fontSize: '0.9rem' }}>
          <Link href="/">{breadcrumb('home')}</Link> &rsaquo; {t('breadcrumb')}
        </div>
      </div>

      <div className="legal-hero">
        <div className="container">
          <h1>{t('breadcrumb')}</h1>
          <p>{t('updated')}</p>
        </div>
      </div>

      <section>
        <div className="container">
          <div className="legal-content">

            <div className="legal-section">
              <h3>{t('sec1_title')}</h3>
              <p>{t('sec1_p1')}</p>
              <p style={{ marginTop: '1rem' }}>{t('sec1_p2')}</p>
            </div>

            <div className="legal-divider" />

            <div className="legal-section">
              <h3>{t('sec2_title')}</h3>
              <p>{t('sec2_p1')}</p>
              <p style={{ marginTop: '1rem' }}>{t('sec2_p2')}</p>
            </div>

            <div className="legal-divider" />

            <div className="legal-section">
              <h3>{t('sec3_title')}</h3>
              <p>{t('sec3_p1_before')} <strong>{t('sec3_p1_partial')}</strong> {t('sec3_p1_after')}</p>
            </div>

            <div className="legal-divider" />

            <div className="legal-section">
              <h3>{t('sec4_title')}</h3>
              <p>{t('sec4_intro')}</p>
              <ul>
                <li>
                  <strong>{t('sec4_item1_label')}</strong> {t('sec4_item1_text')}
                </li>
                <li>
                  <strong>{t('sec4_item2_label')}</strong> {t('sec4_item2_text')}
                </li>
                <li>
                  <strong>{t('sec4_item3_label')}</strong> {t('sec4_item3_text')}
                </li>
                <li>
                  <strong>{t('sec4_item4_label')}</strong> {t('sec4_item4_text')}
                </li>
              </ul>
            </div>

            <div className="legal-divider" />

            <div className="legal-section">
              <h3>{t('sec5_title')}</h3>
              <p>{t('sec5_p1')}</p>
            </div>

            <div className="legal-divider" />

            <div className="legal-section">
              <h3>{t('sec6_title')}</h3>
              <p>{t('sec6_p1')}</p>
              <p style={{ marginTop: '1rem' }}>
                <strong>{t('sec6_email_label')}</strong>
                <a href="mailto:accessibilite@vercelsome.com">accessibilite@vercelsome.com</a>
                <br />
                <strong>{t('sec6_form_label')}</strong>
                <Link href="/contact">{t('sec6_form_link')}</Link>
              </p>
            </div>

            <div className="legal-divider" />

            <div className="legal-section">
              <h3>{t('sec7_title')}</h3>
              <p>{t('sec7_p1')}</p>
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}
