'use client'

import {useState, useEffect} from 'react'
import './about.css'
import Script from 'next/script'
import {useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'

import {getHomepageProductTagMap, type HomepageProductTags} from '@/lib/api/home-product-tags'
import type {HomepageBestseller} from '@/lib/api/home'
import {ProductCard} from '@/components/cards/product-card'
import {getTranslations} from 'next-intl/server'
import {getHomeData} from '@/lib/api/home'


function getHomepageProductTags(
    product: HomepageBestseller,
    currentTags?: HomepageProductTags,
): string[] {
    const category = currentTags?.category?.name ?? product.public_categ_ids?.[0]?.name ?? product.category
    const space = currentTags?.space?.name ?? product.oaksome_space_ids?.[0]?.name
    const style = currentTags?.style?.name ?? product.oaksome_style_ids?.[0]?.name
    return [category, space, style].filter((tag): tag is string => Boolean(tag)).map(tag => tag.toUpperCase())
}

export function useNotifPanel() {
    const [isOpen, setIsOpen] = useState(false)

    const toggleNotifPanel = () => setIsOpen(prev => !prev)
    const closeNotifPanel = () => setIsOpen(false)

    useEffect(() => {
        function handleKeydown(e: KeyboardEvent) {
            if (e.key === 'Escape') closeNotifPanel()
        }

        document.addEventListener('keydown', handleKeydown)
        return () => document.removeEventListener('keydown', handleKeydown)
    }, [])

    return {isOpen, toggleNotifPanel, closeNotifPanel}
}

type LegalSection = {
    key: string
    href: string
    isList?: boolean
}

const legalSections: LegalSection[] = [
    {key: 'legal_samples', href: '/echantillons'},
    {key: 'legal_measures', href: '/prise-mesures'},
    {key: 'legal_sav', href: '', isList: true},
    {key: 'legal_materials', href: '/gamme'},
    {key: 'legal_commitments', href: '/engagements'},
    {key: 'legal_tecnibo', href: ''},
    {key: 'legal_pro', href: '/pro'},
]

export default function AProposPage() {
    const t = useTranslations('about')
    const homeT = useTranslations('home')
    const [bestsellers, setBestsellers] = useState<HomepageBestseller[]>([])
    const [tagMap, setTagMap] = useState<Map<number, HomepageProductTags>>(new Map())
    const [loading, setLoading] = useState(true)
    // -1 = all collapsed, otherwise the index of the open section (first one open by default)
    const [openLegal, setOpenLegal] = useState(0)

    function toggleLegal(idx: number) {
        setOpenLegal(prev => (prev === idx ? -1 : idx))
    }

    useEffect(() => {
        let cancelled = false

        async function load() {
            try {
                const homeResult = await getHomeData('fr') // swap for real locale logic
                const list = homeResult.success ? homeResult.data.bestsellers : []
                const map = await getHomepageProductTagMap(list.map(p => p.id))
                if (!cancelled) {
                    setBestsellers([...list])
                    setTagMap(map)
                }
            } catch (err) {
                console.error('Failed to load bestsellers', err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [])

    return (
        <>
            <div className="breadcrumb">
                <Link href="/">{t('breadcrumb_home')}</Link> &rsaquo; {t('breadcrumb_about')}
            </div>

            <section className="ab-hero">
                <div className="container">
                    <h1 className="ab-hero-tagline">
                        {t('hero_tagline_line1')}<br/> {t('hero_tagline_line2')}
                    </h1>
                </div>
                <div className="ab-hero-media">
                    <img src="/images/stock/oaksome-v8-about-equipe.jpg" alt={t('hero_image_alt')}
                         loading="eager"/>

                </div>
            </section>

            <section className="ab-why">
                <div className="container">
                    <h2 className="ab-why-tagline">{t('why_tagline')}</h2>
                    <div className="ab-why-col">
                        <p className="ab-why-lead">{t('why_lead')}</p>
                        <span className="ab-tag">{t('why_tag')}</span>
                        <div className="ab-pillars">
                            <div className="ab-pillar">
                                <h3>{t('pillar_1_title')}</h3>
                                <p>{t('pillar_1_text')}</p>
                            </div>
                            <div className="ab-pillar">
                                <h3>{t('pillar_2_title')}</h3>
                                <p>{t('pillar_2_text')}</p>
                            </div>
                            <div className="ab-pillar">
                                <h3>{t('pillar_3_title')}</h3>
                                <p>{t('pillar_3_text')}</p>
                            </div>
                            <div className="ab-pillar">
                                <h3>{t('pillar_4_title')}</h3>
                                <p>{t('pillar_4_text')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="ab-steps">
                <div className="container">
                    <div className="ab-steps-grid">
                        <div className="ab-steps-media">
                            <img src="/images/stock/oaksome-v8-about-atelier.jpg"
                                 alt={t('steps_image_alt')}/>
                        </div>
                        <div className="ab-steps-body">
                            <span className="ab-tag">{t('steps_tag')}</span>
                            <h2>{t('steps_title')}</h2>
                            <p>{t('steps_text')}</p>
                            <Link href="/comment-ca-marche" className="mega-cta-discover"><span
                                className="cta-label">{t('steps_cta_label')}</span><span
                                className="cta-action">{t('steps_cta_action')} <span
                                className="cta-arrow">→</span></span></Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="ab-after">
                <div className="container">
                    <div className="ab-after-head">
                        <span className="ab-tag">{t('after_tag')}</span>
                        <h2>{t('after_title')}</h2>
                        <p>{t('after_text')}</p>
                    </div>
                    <div className="legal-acc">
                        {legalSections.map((section, idx) => {
                            const isOpen = openLegal === idx
                            return (
                                <div
                                    key={section.key}
                                    className={`legal-section${isOpen ? '' : ' collapsed'}`}
                                >
                                    <h2
                                        role="button"
                                        tabIndex={0}
                                        aria-expanded={isOpen}
                                        onClick={() => toggleLegal(idx)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                toggleLegal(idx)
                                            }
                                        }}
                                    >
                                        {t(`${section.key}_title`)}
                                        <span className="legal-toggle" aria-hidden="true">
                                            {isOpen ? '×' : '+'}
                                        </span>
                                    </h2>
                                    <div className="legal-body">
                                        {section.isList ? (
                                            <ul>
                                                <li>{t(`${section.key}_item_1`)}</li>
                                                <li>{t(`${section.key}_item_2`)}</li>
                                                <li>{t(`${section.key}_item_3`)}</li>
                                            </ul>
                                        ) : section.href ? (
                                            <p>
                                                {t(`${section.key}_text`)}{' '}
                                                <Link href={section.href as Parameters<typeof Link>[0]['href']}>{t(`${section.key}_cta`)}</Link>
                                            </p>
                                        ) : (
                                            <p>{t(`${section.key}_text`)}</p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section className="ab-contact">
                <div className="container">
                    <h2>{t('contact_title')}</h2>
                    <div className="ab-contact-pills">
                        <Link href="/faq" className="cta-single">{t('contact_faq_cta')} <span
                            className="cta-arrow">→</span></Link>
                        <Link href="/contact" className="cta-single">{t('contact_advisor_cta')} <span
                            className="cta-arrow">→</span></Link>
                    </div>
                </div>
            </section>

            <section className="products-section">
                <div className="container">
                    <h2 className="products-title">{t('products_title')}</h2>
                </div>
                <div className="products-scroll">
                    {loading ? (
                        <p>{t('products_loading')}</p>
                    ) : (
                        bestsellers.map(p => (
                            <ProductCard
                                key={p.id}
                                id={p.id}
                                name={p.name}
                                imageUrl={p.image_url}
                                priceTtc={p.price_ttc}
                                badge={p.badge ?? null}
                                dimensions={p.dimensions ?? null}
                                tags={getHomepageProductTags(p, tagMap.get(p.id))}
                                href={`/produit/${p.id}`}
                                className="product-card--home"
                            />
                        ))
                    )}
                </div>
                <div className="container">
                    <div className="products-footer">
                        <Link href="/acheter" className="mega-cta-discover"><span
                            className="cta-label">{t('products_cta_label')}</span><span
                            className="cta-action">{t('products_cta_action')} <span
                            className="cta-arrow">→</span></span></Link>
                        <div className="products-footer-line">
                            <span></span><span></span><span></span><span></span><span></span></div>
                    </div>
                </div>
            </section>

            <div className="reassurance-band">
                <div className="container">
                    <div className="trust-item">
                        <span className="trust-stat">{t('trust_custom_stat')}</span>
                        <span className="trust-label">{t('trust_custom_label')}</span>
                    </div>
                    <div className="trust-sep"></div>
                    <div className="trust-item">
                        <span className="trust-stat">{t('trust_warranty_stat')}</span>
                        <span className="trust-label">{t('trust_warranty_label')}</span>
                    </div>
                    <div className="trust-sep"></div>
                    <div className="trust-item">
                        <span className="trust-stat">{t('trust_delivery_stat')}</span>
                        <span className="trust-label">{t('trust_delivery_label')}</span>
                    </div>
                    <div className="trust-sep"></div>
                    <div className="trust-item">
                        <span className="trust-stat">{t('trust_delay_stat')}</span>
                        <span className="trust-label">{t('trust_delay_label')}</span>
                    </div>
                    <div className="trust-sep"></div>
                    <div className="trust-item">
                        <span className="trust-stat">{t('trust_design_stat')}</span>
                        <span className="trust-label">{t('trust_design_label')}</span>
                    </div>
                </div>
            </div>
            <section className="newsletter-stoemp" aria-labelledby="ns-title">
                <div className="ns-inner">
                    <h2 id="ns-title" className="ns-title">
                        {homeT('newsletter.title_line_1')}
                        <br/>{homeT('newsletter.title_line_2')}
                    </h2>
                    <form className="ns-form" action="#" method="post" noValidate>
                        <label className="ns-input-wrap" htmlFor="ns-email">
                            <span style={{
                                position: 'absolute',
                                width: '1px',
                                height: '1px',
                                overflow: 'hidden',
                                clip: 'rect(0,0,0,0)'
                            }}>{homeT('newsletter.email_label')}</span>
                            <input id="ns-email" className="ns-input" type="email" name="email"
                                   placeholder={homeT('newsletter.email_placeholder')} autoComplete="email" required/>
                        </label>
                        <button className="ns-submit" type="submit" aria-label={homeT('newsletter.submit_label')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                                <polyline points="12 5 19 12 12 19"/>
                            </svg>
                        </button>
                    </form>
                    <div className="ns-legend">
                        <p className="ns-consent">
                            {homeT('newsletter.consent')}
                        </p>
                    </div>
                </div>
            </section>
            <Script src="/js/nav-scroll.js" strategy="afterInteractive"/>
        </>
    )
}
