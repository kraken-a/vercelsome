'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { toImageProxyUrl } from '@/lib/image-url'

type Testimonial = {
  id: number
  author: string
  location: string | null
  text: string
  image_url: string | null
  collection: { name: string } | null
  case_study_slug: string | null
}

type Props = {
  testimonials: Testimonial[]
  heading: string
  seeProjectLabel: string
}

export function TestimonialsSlider({ testimonials, heading, seeProjectLabel }: Props) {
  const [idx, setIdx] = useState(0)
  const total = testimonials.length

  if (total === 0) return null

  const item = testimonials[idx]

  const prev = () => setIdx((idx - 1 + total) % total)
  const next = () => setIdx((idx + 1) % total)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '30px', lineHeight: '32px', letterSpacing: 0, marginTop: '8px' }}>{heading}</h2>
        <div className="testi-nav">
          <button className="testi-arrow" onClick={prev} aria-label="Précédent">←</button>
          <span className="testi-counter">{idx + 1} / {total}</span>
          <button className="testi-arrow" onClick={next} aria-label="Suivant">→</button>
        </div>
      </div>
      <div className="testi-slider">
        <div className="testi-slide active">
          {item.image_url && (
            <div className="testi-img">
              <Image src={toImageProxyUrl(item.image_url)} alt={item.author} width={800} height={600} style={{ objectFit: 'cover' }} />
            </div>
          )}
          <div className="testi-content">
            <span className="testi-quote">«</span>
            <p className="testi-text">{item.text}</p>
            <div className="testi-author">
              <strong>{item.author}</strong>
              {item.location && <span>{item.location}</span>}
            </div>
            <div className="testi-meta">
              {item.collection && (
                <span className="product-tag tag-collection">{item.collection.name.toUpperCase()}</span>
              )}
              {item.case_study_slug && (
                <Link
                  href={{ pathname: '/etude-de-cas/[slug]', params: { slug: item.case_study_slug } }}
                  className="testi-link"
                >
                  {seeProjectLabel} →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
