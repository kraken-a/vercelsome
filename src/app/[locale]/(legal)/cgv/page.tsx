import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import './cgv.css'
import { Link } from '@/i18n/navigation'
import NextLink from 'next/link'
import { getTranslations } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.cgv', locale, pathMap: '/cgv' })
}

export default async function CGVPage() {
  const t = await getTranslations('legal.cgv_page')
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
                <li><a href="#art1">{t('toc_item1')}</a></li>
                <li><a href="#art2">{t('toc_item2')}</a></li>
                <li><a href="#art3">{t('toc_item3')}</a></li>
                <li><a href="#art4">{t('toc_item4')}</a></li>
                <li><a href="#art5">{t('toc_item5')}</a></li>
                <li><a href="#art6">{t('toc_item6')}</a></li>
                <li><a href="#art7">{t('toc_item7')}</a></li>
                <li><a href="#art8">{t('toc_item8')}</a></li>
              </ol>
            </div>

            <div className="legal-section" id="art1">
              <h2>{t('art1_title')}</h2>
              <p>{t('art1_p1')}</p>
              <p>{t('art1_p2')}</p>
            </div>

            <div className="legal-section" id="art2">
              <h2>{t('art2_title')}</h2>
              <p>{t('art2_p1')}</p>
              <p>{t('art2_p2')}</p>
              <ul>
                <li>{t('art2_item1')}</li>
                <li>{t('art2_item2')}</li>
                <li>{t('art2_item3')}</li>
              </ul>
              <p>{t('art2_p3')}</p>
            </div>

            <div className="legal-section" id="art3">
              <h2>{t('art3_title')}</h2>
              <p>{t('art3_p1')}</p>
              <p>{t('art3_p2')}</p>
            </div>

            <div className="legal-section" id="art4">
              <h2>{t('art4_title')}</h2>
              <p>{t('art4_p1')}</p>
              <p>{t('art4_p2')}</p>
            </div>

            <div className="legal-section" id="art5">
              <h2>{t('art5_title')}</h2>
              <p>{t('art5_p1')}</p>
              <p>{t('art5_p2')}</p>
            </div>

            <div className="legal-section" id="art6">
              <h2>{t('art6_title')}</h2>
              <p>{t('art6_p1')}</p>
              <p>{t('art6_p2')}</p>
            </div>

            <div className="legal-section" id="art7">
              <h2>{t('art7_title')}</h2>
              <p>{t('art7_p1')}</p>
              <p>{t('art7_p2')}</p>
            </div>

            <div className="legal-section" id="art8">
              <h2>{t('art8_title')}</h2>
              <p>{t('art8_p1_before')} <NextLink href="/cookies" style={{ color: 'var(--teal)' }}>{t('art8_p1_link')}</NextLink>.</p>
              <p>{t('art8_p2')}</p>
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
