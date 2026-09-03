'use client'
// import '../case.css'
import Script from 'next/script'
import {useEffect, useState} from 'react'
import {useParams} from 'next/navigation'
import {useLocale, useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'
import Image from 'next/image'
import DOMPurify from 'dompurify'
import './styles.css'

type OdooCase = {
    id: number
    name: string
    slug: string
    image: string | false
    gallery_image_ids: { id: number; name: string; image: string | false }[]
    description: string
    style_ids: { id: number; name: string }[]
    space_ids: { id: number; name: string }[]
    city: string | false
    min_budget: number | false
    max_budget: number | false
    currency_id: [number, string] | false
    dim_width: number | false
    dim_height: number | false
    dim_depth: number | false
    delay_weeks: number | false
}

const COLLECTIONS = [
    {key: 'line', name: 'Line', img: '/images/stock/oaksome-v8-ambiance-line-1.jpg', href: '/collection/line'},
    {key: 'satori', name: 'Satori', img: '/images/stock/oaksome-v8-ambiance-satori-1.jpg', href: '/collection/satori'},
    {key: 'vista', name: 'Vista', img: '/images/stock/oaksome-v8-ambiance-vista-1.jpg', href: '/collection/vista'},
    {key: 'lys', name: 'Lys', img: '/images/stock/oaksome-v8-ambiance-lys-1.jpg', href: '/collection/lys'},
]

function toImg(b64: string | false) {
    if (!b64) return ''
    if (b64.startsWith('http') || b64.startsWith('data:')) return b64
    return `data:image/jpeg;base64,${b64}`
}

function currencyLocale(locale: string) {
    return locale === 'nl' ? 'nl-BE' : locale === 'en' ? 'en-BE' : 'fr-BE'
}

export default function EtudeDeCasPage() {
    const params = useParams()
    const slug = params?.slug as string
    const locale = useLocale()
    const t = useTranslations('shop.caseDetail')
    const shopT = useTranslations('shop')
    const [cases, setCases] = useState<OdooCase[]>([])
    const [loading, setLoading] = useState(true)

    const [project, setProject] = useState<OdooCase | null>(null)

    const others = project
        ? cases.filter(c => c.slug !== project.slug)
        : []
    useEffect(() => {
        Promise.all([
            fetch(`/api/odoo/case?slug=${slug}`).then(r => r.json()),
            fetch('/api/odoo/case').then(r => r.json()),
        ])
            .then(([projectData, casesData]) => {
                setProject(projectData)

                if (Array.isArray(casesData)) {
                    setCases(casesData)
                }
            })
            .finally(() => setLoading(false))
    }, [slug])
    if (loading) {
        return <div className="container" style={{padding: '120px 0', textAlign: 'center'}}>{t('loading')}</div>
    }


    if (!project) {
        return <div className="container" style={{padding: '120px 0', textAlign: 'center'}}>{t('not_found')}</div>
    }

    const hero = toImg(project.image)
    const extra = [project.style_ids[0]?.name, project.space_ids[0]?.name, project.city].filter(Boolean).join(' · ')
    const gallery = project.gallery_image_ids.map(g => toImg(g.image)).filter(Boolean)
    const detailImg = gallery[0] || hero
    const pool = [hero, ...gallery]
    const poolImg = (i: number) => pool[i] || hero

    const sanitize = (html: string) =>
        DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                'p',
                'br',
                'b',
                'i',
                'em',
                'strong',
                'ul',
                'ol',
                'li',
                'a',
            ],
            ALLOWED_ATTR: ['href'],
        })
    console.log(project.description)
    return (
        <>
            <div className="breadcrumb container">
                <Link href="/">{shopT('breadcrumb_home')}</Link> &rsaquo;{' '}
                <Link href="/etudes-de-cas">{t('breadcrumb_cases')}</Link> &rsaquo;{' '}
                <span>{project.name}</span>
            </div>

            <section className="cs-landing">
                <div className="cs-landing-text">
                    <h1 className="cs-landing-title">{project.name}</h1>
                    <p className="cs-landing-sub">{extra}</p>
                </div>
                <div className="cs-landing-media">
                    {hero && (
                        <img src={hero} alt={project.name} loading="eager"/>
                    )}
                    <Link className="cs-floatcard" href="/configurer">
                        <div className="cs-floatcard-img">
                            {detailImg && (
                                <img src={detailImg} alt={project.name} loading="lazy"/>
                            )}
                        </div>
                        <div className="cs-floatcard-row">
                            <div>
                                <div className="cs-floatcard-name">
                                    {project.space_ids[0]?.name || project.name}
                                </div>
                                <div className="cs-floatcard-name" style={{color: 'var(--cs-text-tertiary)'}}>
                                    {project.min_budget
                                        ? `dès ${project.min_budget.toLocaleString(currencyLocale(locale))} €`
                                        : ''}
                                </div>
                            </div>
                            <span className="cs-floatcard-add" aria-hidden="true">+</span>
                        </div>
                    </Link>
                </div>
            </section>

            <section className="cs-feature container">
                <div className="cs-feature-imgwrap">
                    {poolImg(0) && (
                        <img src={poolImg(0)} alt={project.name} loading="lazy"/>
                    )}
                    {project.space_ids[0]?.name && (
                        <span className="cs-tag cs-tag--room">
                            {project.space_ids[0].name.toUpperCase()}
                        </span>
                    )}
                    {project.style_ids[0]?.name && (
                        <span className="cs-tag cs-tag--type">
                            {project.style_ids[0].name.toUpperCase()}
                        </span>
                    )}
                    {project.city && (
                        <span className="cs-tag cs-tag--collection">
                            {project.city.toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="cs-feature-text">
                    {project.description && (
                        <div
                            dangerouslySetInnerHTML={{
                                __html: sanitize(project.description),
                            }}
                        />
                    )}
                </div>
            </section>

            <section className="cs-imgtag container">
                <div className="cs-imgtag-img">
                    {poolImg(1) && (
                        <img src={poolImg(1)} alt={project.name} loading="lazy"/>
                    )}
                </div>
                <div className="cs-imgtag-text">
                    <h2>Fait sur mesure.<br/>Fait pour durer.</h2>
                    <p>Chaque meuble Oaksome est dessiné, fabriqué et posé pour votre espace &mdash; au millimètre.</p>
                </div>
            </section>

            <section className="cs-imgright container">
                <div className="cs-imgright-img">
                    {poolImg(2) && (
                        <img src={poolImg(2)} alt={project.name} loading="lazy"/>
                    )}
                </div>
            </section>

            <section className="cs-bigimg container">
                {poolImg(3) && (
                    <img src={poolImg(3)} alt={project.name} loading="lazy"/>
                )}
            </section>

            <section className="cs-fullbleed">
                {poolImg(4) && (
                    <img src={poolImg(4)} alt={project.name} loading="lazy"/>
                )}
            </section>

            <section className="cs-bigimg container">
                {poolImg(5) && (
                    <img src={poolImg(5)} alt={project.name} loading="lazy"/>
                )}
            </section>

            <section className="cs-carousel">
                <div className="container">
                    <div className="cs-carousel-head cs-carousel-center">
                        <h2>{t('discover_collections')}</h2>
                    </div>
                    <div className="cs-carousel-track">
                        {COLLECTIONS.map(c => (
                            <Link key={c.key} href={{pathname: '/collection/[slug]', params: {slug: c.key}}} className="cs-carousel-card">
                                <div className="cs-carousel-card-img">
                                    <img
                                        src={c.img}
                                        alt={`Collection ${c.name}`}
                                        loading="lazy"
                                    />
                                </div>
                                <span className="cs-carousel-card-label">Collection</span>
                                <h3>{c.name}</h3>
                            </Link>
                        ))}
                    </div>
                    <div className="products-footer">
                        <Link href="/collections" className="mega-cta-discover">
                            <span className="cta-label">{t('cta_discover')}</span>
                            <span className="cta-action">
                                {t('collections_cta')} <span className="cta-arrow">→</span>
                            </span>
                        </Link>
                        <div className="products-footer-line">
                            <span/><span/><span/><span/><span/>
                        </div>
                    </div>
                </div>
            </section>

            {others.length > 0 && (
                <section className="cs-carousel" style={{paddingBottom: 'clamp(64px, 9vw, 130px)'}}>
                    <div className="container">
                        <div className="cs-carousel-head cs-carousel-center">
                            <h2>{t('others_title')}</h2>
                        </div>
                        <div className="cs-carousel-track cs-carousel--projects">
                            {others.map(p => {
                                const pImg = toImg(p.image)
                                return (
                                    <Link key={p.id} href={{pathname: '/etude-de-cas/[slug]', params: {slug: p.slug}}} className="cs-carousel-card">
                                        <div className="cs-carousel-card-img">
                                            {pImg && (
                                                <img src={pImg} alt={p.name} loading="lazy"/>
                                            )}
                                        </div>
                                        <span className="cs-carousel-card-label">{t('label_oaksome')}</span>
                                        <h3>{p.name}</h3>
                                    </Link>
                                )
                            })}
                        </div>
                        <div className="products-footer">
                            <Link href="/inspirations" className="mega-cta-discover">
                                <span className="cta-label">{t('cta_discover')}</span>
                                <span className="cta-action">
                                    {t('inspirations_cta')} <span className="cta-arrow">→</span>
                                </span>
                            </Link>
                            <div className="products-footer-line">
                                <span/><span/><span/><span/><span/>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <section className="usp-band">
                <div className="container">
                    <div className="spaces-pills">
                        <div className="spaces-pills-row">
                            <span className="spaces-pill">
                                <strong>{t('trust_delivery_stat')}</strong>&nbsp;{t('trust_delivery_label')}
                            </span>
                            <span className="spaces-pill">
                                <strong>{t('trust_leadtime_stat')}</strong>&nbsp;{t('trust_leadtime_label')}
                            </span>
                            <span className="spaces-pill">
                                <strong>{t('trust_warranty_stat')}</strong>&nbsp;{t('trust_warranty_label')}
                            </span>
                            <span className="spaces-pill">
                                <strong>{t('trust_design_stat')}</strong>&nbsp;{t('trust_design_label')}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <Script src="/js/nav-scroll.js" strategy="afterInteractive"/>
        </>
    )
}
