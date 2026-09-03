'use client'

import {useEffect, useState} from 'react'
import {Link} from '@/i18n/navigation'
import Image from 'next/image'
import {useTranslations} from 'next-intl'
import {toImageProxyUrl} from '@/lib/image-url'
import '@/css/stitch-polish.css'

type CaseStudy = {
    id: number
    name: string
    slug: string
    image_url: string
    city: string | false
    style_ids: {
        id: number
        name: string
    }[]
}

export function TestimonialsSlider() {
    const t = useTranslations('home')
    const [slides, setSlides] = useState<CaseStudy[]>([])
    const [idx, setIdx] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/odoo/case')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setSlides(data)
                }
            })
            .finally(() => setLoading(false))
    }, [])

    if (loading || !slides.length) {
        return null
    }

    const prev = () => setIdx(i => (i - 1 + slides.length) % slides.length)
    const next = () => setIdx(i => (i + 1) % slides.length)

    const slide = slides[idx]

    console.log(slide);

    return (
        <section style={{padding: 'clamp(64px, 10vw, 120px) 0'}}>
            <div className="container">

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginBottom: '32px'
                    }}
                >
                    <h2
                        style={{
                            fontSize: 'clamp(25px, 4vw, 39px)',
                            letterSpacing: '-0.02em',
                            margin: 0
                        }}
                    >
                        {t('testimonial_h2')}
                    </h2>

                    <div className="testi-nav">
                        <button
                            className="testi-arrow"
                            onClick={prev}
                            aria-label={t('testimonial_prev')}
                        >
                            ←
                        </button>

                        <span className="testi-counter">
                            {idx + 1} / {slides.length}
                        </span>

                        <button
                            className="testi-arrow"
                            onClick={next}
                            aria-label={t('testimonial_next')}
                        >
                            →
                        </button>
                    </div>
                </div>

                <div
                    className="testi-slider"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '48px',
                        alignItems: 'center',
                    }}
                >
                    <div className="testi-slide active">
                        <div
                            className="testi-img"
                            style={{
                                position: 'relative',
                                aspectRatio: '4 / 3',
                                overflow: 'hidden',
                            }}
                        >
                            <Image
                                src={toImageProxyUrl(slide.image_url)}
                                alt={slide.name}
                                fill
                                priority
                                style={{objectFit: 'cover'}}
                            />
                        </div>

                        <div className="testi-content">
                            <span className="testi-quote">«</span>
                            <p className="testi-text">
                                {slide.city || ''}
                            </p>
                            <div className="testi-author">
                                <strong>{slide.name}</strong>
                                <span>{slide.city || ''}</span>
                            </div>
                            <div className="testi-meta">

                                {slide.style_ids.length > 0 && (
                                    <span className="product-tag tag-collection">
                                        {slide.style_ids[0].name.toUpperCase()}
                                    </span>
                                )}
                                <Link
                                    href={{pathname: '/etude-de-cas/[slug]', params: {slug: slide.slug}}}
                                    className="testi-link"
                                >
                                    {t('testimonial_see_project')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
