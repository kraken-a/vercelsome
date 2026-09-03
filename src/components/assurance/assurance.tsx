'use client'
import { useTranslations } from 'next-intl'
import './assurance.css'

export default function Assurance() {
  const t = useTranslations('assurance')
  return (
    <>
      <div className="reassurance-band">
        <div className="container">
          <div className="trust-item">
            <span className="trust-stat">{t('custom_stat')}</span>
            <span className="trust-label">{t('custom_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">{t('warranty_stat')}</span>
            <span className="trust-label">{t('warranty_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">{t('delivery_stat')}</span>
            <span className="trust-label">{t('delivery_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">{t('leadtime_stat')}</span>
            <span className="trust-label">{t('leadtime_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">{t('design_stat')}</span>
            <span className="trust-label">{t('design_label')}</span>
          </div>
        </div>
      </div>
    </>
  )
}
