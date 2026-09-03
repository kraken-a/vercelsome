import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import './engagements.css'
import { Link } from '@/i18n/navigation'
import Assurance from '@/components/assurance/assurance'
import { getTranslations } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.engagements', locale, pathMap: '/engagements' })
}

const SECTIONS = [
  {
    label: '01',
    key: 's1',
    img: { src: '/images/stock/oaksome-v8-atelier-general.jpg' },
  },
  {
    label: '02',
    key: 's2',
    img: { src: '/images/stock/oaksome-v8-stock-panneaux.jpg' },
  },
  {
    label: '03',
    key: 's3',
    img: { src: '/images/stock/oaksome-v8-placage-detail.jpg' },
  },
  {
    label: '04',
    key: 's4',
    img: { src: '/images/stock/oaksome-v8-charniere-blum.jpg' },
  },
  {
    label: '05',
    key: 's5',
    img: { src: '/images/stock/oaksome-v8-dressing-vecu.jpg' },
  },
  {
    label: '06',
    key: 's6',
    img: { src: '/images/stock/oaksome-v8-operateur-cnc.jpg' },
  },
] as const

export default async function EngagementsPage() {
  const t = await getTranslations('engagements')

  return (
    <main>
      <div className="container">
        <div style={{ padding: '1rem 0', fontSize: '0.9rem' }}>
          <Link href="/">{t('breadcrumb_home')}</Link> &rsaquo; {t('breadcrumb_current')}
        </div>
      </div>

      <div className="engage-hero">
        <div className="container">
          <span className="mono" style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.8rem' }}>{t('mono_label')}</span>
          <h1>{t('h1')}</h1>
          <p>{t('intro')}</p>
        </div>
      </div>

      <section className="engage-wrap">
        <div className="container">
          {SECTIONS.map(s => (
            <div key={s.label} className="engage-section">
              <div className="engage-text">
                <span className="mono">{s.label}</span>
                <h2>{t(`${s.key}_title`)}</h2>
                <p>{t(`${s.key}_p1`)}</p>
                <p>{t(`${s.key}_p2`)}</p>
              </div>
              <div className="engage-img">
                <img src={s.img.src} alt={t(`${s.key}_alt`)} loading="lazy" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="engage-cta">
        <div className="container">
          <h2>{t('cta_title')}</h2>
          <p>{t('cta_body')}</p>
          <Link href="/configurer" className="btn btn-light">{t('cta_button')}</Link>
        </div>
      </div>
      <Assurance />
    </main>
  )
}
