'use client'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import './samples.css'

export default function Samples() {
  const t = useTranslations('samples')
  return (
    <>
      <section className="reassurance-editorial">
        <div className="container">
          <div className="section-header">
            <span className="mono" style={{ color: 'var(--color-vert-persan, #0C524E)' }}>
              {t('eyebrow')}
            </span>
            <h2>{t('title')}</h2>
            <p>{t('subtitle')}</p>
          </div>

          <div className="re-grid">
            <Link href={{ pathname: '/echantillons', hash: 'online' }} className="re-card">
              <div className="re-card-photo">
                <img src="/images/reassurance-online.png" alt={t('online_alt')} loading="eager" />
              </div>
              <div className="re-card-body">
                <span className="re-tag">{t('online_tag')}</span>
                <h3>{t('online_title')}</h3>
                <p>{t('online_desc')}</p>
              </div>
            </Link>

            <Link
              href={{ pathname: '/echantillons', hash: 'samples' }}
              className="re-card re-card--highlight"
            >
              <div className="re-card-photo">
                <img
                  src="/images/reassurance-samples.png"
                  alt={t('samples_alt')}
                  loading="eager"
                />
              </div>
              <div className="re-card-body">
                <span className="re-tag re-tag--accent">{t('samples_tag')}</span>
                <h3>{t('samples_title')}</h3>
                <p>{t('samples_desc')}</p>
              </div>
            </Link>

            <Link href={{ pathname: '/echantillons', hash: 'kit' }} className="re-card">
              <div className="re-card-photo">
                <img src="/images/reassurance-kit.png" alt={t('kit_alt')} loading="eager" />
              </div>
              <div className="re-card-body">
                <span className="re-tag">{t('kit_tag')}</span>
                <h3>{t('kit_title')}</h3>
                <p>{t('kit_desc')}</p>
              </div>
            </Link>

            <Link href={{ pathname: '/echantillons', hash: 'showroom' }} className="re-card">
              <div className="re-card-photo">
                <img src="/images/reassurance-showroom.png" alt={t('showroom_alt')} loading="eager" />
              </div>
              <div className="re-card-body">
                <span className="re-tag">{t('showroom_tag')}</span>
                <h3>{t('showroom_title')}</h3>
                <p>{t('showroom_desc')}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
