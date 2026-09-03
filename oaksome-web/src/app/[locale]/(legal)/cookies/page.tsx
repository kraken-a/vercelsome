import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import './PDC_cookies.css'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.cookies', locale, pathMap: '/cookies' })
}

export default async function CookiesPage() {
  const t = await getTranslations('legal.cookies_page')
  const breadcrumb = await getTranslations('breadcrumb')
  return (
    <main>
      <div className="container">
        <div style={{ padding: '1rem 0', fontSize: '0.9rem' }}>
          <Link href="/">{breadcrumb('home')}</Link> &rsaquo; {t('breadcrumb')}
        </div>
      </div>

      <section style={{ paddingTop: '1rem' }}>
        <div className="container">
          <div className="legal-content">
            <h1 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{t('h1')}</h1>
            <p className="updated">{t('updated')}</p>

            <div className="legal-toc">
              <h3>{t('toc_title')}</h3>
              <ol>
                <li><a href="#pdc1">{t('toc_item1')}</a></li>
                <li><a href="#pdc2">{t('toc_item2')}</a></li>
                <li><a href="#pdc3">{t('toc_item3')}</a></li>
                <li><a href="#pdc4">{t('toc_item4')}</a></li>
                <li><a href="#pdc5">{t('toc_item5')}</a></li>
                <li><a href="#pdc6">{t('toc_item6')}</a></li>
              </ol>
            </div>

            <div className="legal-section" id="pdc1">
              <h2>{t('sec1_title')}</h2>
              <p>{t('sec1_intro')}</p>
              <ul>
                <li><strong>{t('sec1_item1_label')}</strong> {t('sec1_item1_text')}</li>
                <li><strong>{t('sec1_item2_label')}</strong> {t('sec1_item2_text')}</li>
                <li><strong>{t('sec1_item3_label')}</strong> {t('sec1_item3_text')}</li>
                <li><strong>{t('sec1_item4_label')}</strong> {t('sec1_item4_text')}</li>
              </ul>
            </div>

            <div className="legal-section" id="pdc2">
              <h2>{t('sec2_title')}</h2>
              <p>{t('sec2_intro')}</p>
              <ul>
                <li>{t('sec2_item1')}</li>
                <li>{t('sec2_item2')}</li>
                <li>{t('sec2_item3')}</li>
                <li>{t('sec2_item4')}</li>
                <li>{t('sec2_item5')}</li>
              </ul>
              <p>{t('sec2_retention')}</p>
            </div>

            <div className="legal-section" id="pdc3">
              <h2>{t('sec3_title')}</h2>
              <p>{t('sec3_intro')}</p>
              <ul>
                <li><strong>{t('sec3_item1_label')}</strong> {t('sec3_item1_text')}</li>
                <li><strong>{t('sec3_item2_label')}</strong> {t('sec3_item2_text')}</li>
                <li><strong>{t('sec3_item3_label')}</strong> {t('sec3_item3_text')}</li>
              </ul>
              <p>{t('sec3_gdpr')}</p>
            </div>

            <div className="legal-section" id="pdc4">
              <h2>{t('sec4_title')}</h2>
              <p>{t('sec4_intro')}</p>

              <table className="cookie-table">
                <thead>
                  <tr>
                    <th>{t('table_col_cookie')}</th>
                    <th>{t('table_col_type')}</th>
                    <th>{t('table_col_duration')}</th>
                    <th>{t('table_col_purpose')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>oak_session</code></td>
                    <td><span className="cookie-type essential">{t('cookie1_type')}</span></td>
                    <td>{t('cookie1_duration')}</td>
                    <td>{t('cookie1_purpose')}</td>
                  </tr>
                  <tr>
                    <td><code>oak_consent</code></td>
                    <td><span className="cookie-type essential">{t('cookie2_type')}</span></td>
                    <td>{t('cookie2_duration')}</td>
                    <td>{t('cookie2_purpose')}</td>
                  </tr>
                  <tr>
                    <td><code>oak_config</code></td>
                    <td><span className="cookie-type functional">{t('cookie3_type')}</span></td>
                    <td>{t('cookie3_duration')}</td>
                    <td>{t('cookie3_purpose')}</td>
                  </tr>
                  <tr>
                    <td><code>_ga / _gid</code></td>
                    <td><span className="cookie-type analytics">{t('cookie4_type')}</span></td>
                    <td>{t('cookie4_duration')}</td>
                    <td>{t('cookie4_purpose')}</td>
                  </tr>
                  <tr>
                    <td><code>_fbp</code></td>
                    <td><span className="cookie-type marketing">{t('cookie5_type')}</span></td>
                    <td>{t('cookie5_duration')}</td>
                    <td>{t('cookie5_purpose')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="legal-section" id="pdc5">
              <h2>{t('sec5_title')}</h2>
              <p>{t('sec5_intro')}</p>
              <ul>
                <li><strong>{t('sec5_item1_label')}</strong> {t('sec5_item1_text')}</li>
                <li><strong>{t('sec5_item2_label')}</strong> {t('sec5_item2_text')}</li>
                <li><strong>{t('sec5_item3_label')}</strong> {t('sec5_item3_text')}</li>
                <li><strong>{t('sec5_item4_label')}</strong> {t('sec5_item4_text')}</li>
                <li><strong>{t('sec5_item5_label')}</strong> {t('sec5_item5_text')}</li>
                <li><strong>{t('sec5_item6_label')}</strong> {t('sec5_item6_text')}</li>
              </ul>
              <p>{t('sec5_contact')}</p>
            </div>

            <div className="legal-section" id="pdc6">
              <h2>{t('sec6_title')}</h2>
              <p>{t('sec6_intro')}</p>
              <p>
                <strong>{t('sec6_dpo_title')}</strong><br />
                Oaksome Belgium<br />
                {t('sec6_email_label')} privacy@oaksome.be<br />
                {t('sec6_address_label')} Rue de la Loi 1, 1000 Bruxelles, Belgique
              </p>
              <p>{t('sec6_dispute')} <a href="https://www.autoriteprotectiondonnees.be" style={{ color: 'var(--teal)' }} target="_blank" rel="noopener noreferrer">www.autoriteprotectiondonnees.be</a></p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.85rem' }}>Oaksome Belgium — TVA BE 1026.968.692 — Rue Roberts Jones 72, 1180 Uccle</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
