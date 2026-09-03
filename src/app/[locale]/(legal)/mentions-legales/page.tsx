import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import './legalMentions.css'
import { Link } from '@/i18n/navigation'
import NextLink from 'next/link'
import { getTranslations } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.mentions_legales', locale, pathMap: '/mentions-legales' })
}

export default async function MentionsLegalesPage() {
  const t = await getTranslations('legal.mentions_page')
  const breadcrumb = await getTranslations('breadcrumb')

  return (
    <main>
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
              <ul>
                <li><strong>{t('sec1_item1_label')}</strong> Oaksome</li>
                <li><strong>{t('sec1_item2_label')}</strong> Fox Ventures SA</li>
                <li><strong>{t('sec1_item3_label')}</strong> {t('sec1_item3_text')}</li>
                <li><strong>{t('sec1_item4_label')}</strong> [À CONFIRMER]</li>
                <li><strong>{t('sec1_item5_label')}</strong> BE 1026.968.692</li>
                <li><strong>{t('sec1_item6_label')}</strong> info@oaksome.be</li>
              </ul>
            </div>

            <div className="legal-divider" />

            <div className="legal-section">
              <h3>{t('sec2_title')}</h3>
              <ul>
                <li><strong>{t('sec2_prod_intro')}</strong> Vercel Inc.</li>
                <li><strong>{t('sec2_prod_item2_label')}</strong> 440 N Barranca Ave #4133, Covina, CA 91723, {t('country_us')}</li>
                <li><strong>{t('sec2_prod_item3_label')}</strong> vercel.com</li>
              </ul>
            </div>

            <div className="legal-divider" />

            <div className="legal-section">
              <h3>{t('sec3_title')}</h3>
              <p>{t('sec3_p1')}</p>
              <p style={{ marginTop: '1rem' }}>{t('sec3_p2')}</p>
            </div>

            <div className="legal-divider" />

            <div className="legal-section">
              <h3>{t('sec4_title')}</h3>
              <p>{t('sec4_p1_before')} <NextLink href="/cookies">{t('sec4_p1_link')}</NextLink>{t('sec4_p1_after')}</p>
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
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}
