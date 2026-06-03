'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function TestimonialsSlider() {
  const t = useTranslations('home')
  const [idx, setIdx] = useState(0)

  const slides = [
    { img: '/images/cases/case-satori-hero.jpg', alt: t('testimonial_1_img_alt'), quote: t('testimonial_1_quote'), name: t('testimonial_1_name'), role: t('testimonial_1_role'), collection: 'SATORI', href: '/etudes-de-cas' },
    { img: '/images/cases/case-line-hero.jpg', alt: t('testimonial_2_img_alt'), quote: t('testimonial_2_quote'), name: t('testimonial_2_name'), role: t('testimonial_2_role'), collection: 'LINE', href: '/etudes-de-cas' },
    { img: '/images/cases/case-vista-hero.jpg', alt: t('testimonial_3_img_alt'), quote: t('testimonial_3_quote'), name: t('testimonial_3_name'), role: t('testimonial_3_role'), collection: 'VISTA', href: '/etudes-de-cas' },
  ]

  const prev = () => setIdx(i => (i - 1 + slides.length) % slides.length)
  const next = () => setIdx(i => (i + 1) % slides.length)

  const slide = slides[idx]

  return (
    <section style={{ padding: 'clamp(64px, 10vw, 120px) 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <h2 style={{ fontSize: 'clamp(25px, 4vw, 39px)', letterSpacing: '-0.02em', margin: 0 }}>
            {t('testimonial_h2')}
          </h2>
          <div className="testi-nav">
            <button className="testi-arrow" onClick={prev} aria-label={t('testimonial_prev')}>←</button>
            <span className="testi-counter">{idx + 1} / {slides.length}</span>
            <button className="testi-arrow" onClick={next} aria-label={t('testimonial_next')}>→</button>
          </div>
        </div>
        <div className="testi-slider">
          <div className="testi-slide active">
            <div className="testi-img">
              <img src={slide.img} alt={slide.alt} loading="eager" />
            </div>
            <div className="testi-content">
              <span className="testi-quote">«</span>
              <p className="testi-text">{slide.quote}</p>
              <div className="testi-author">
                <strong>{slide.name}</strong>
                <span>{slide.role}</span>
              </div>
              <div className="testi-meta">
                <span className="product-tag tag-collection">{slide.collection}</span>
                <Link href={slide.href} className="testi-link">{t('testimonial_see_project')}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
