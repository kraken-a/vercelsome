import {Fragment} from 'react'
import type {Metadata} from 'next'
import {getPageMetadata} from '@/lib/seo/page-metadata'
import Link from 'next/link'
import Image from 'next/image'
import {getTranslations} from 'next-intl/server'
import {getNavigation} from '@/lib/api/navigation'
import {toImageProxyUrl} from '@/lib/image-url'
import Newsletter from '@/components/newsletter/newsletter'
import '@/css/collection-page.css'
import './collections.css'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const {locale} = await params
    return getPageMetadata({namespace: 'meta.collections', locale, pathMap: {fr: '/collections', nl: '/collecties'}})
}

export default async function CollectionsPage({params}: Props) {
    const {locale} = await params
    const t = await getTranslations()
    const navResult = await getNavigation(locale)
    const collections = navResult.success ? navResult.data.collections : []

    const compareRows = [
        {
            label: t('shop.collections.compare_style'),
            values: ['Minimaliste', 'Japonisant', 'Contemporain', 'Classique']
        },
        {
            label: t('shop.collections.compare_facades'),
            values: ['Lisses, géométriques', 'Textures bois, naturel', 'Lignes sculptées', 'Moulures classiques']
        },
        {
            label: t('shop.collections.compare_materials'),
            values: ['Mélaminé, laque', 'Placages bois, stratifiés', 'Mélaminé, placages', 'Placages, stratifiés']
        },
        {
            label: t('shop.collections.compare_price'),
            values: ['890 – 8 490 €', '590 – 7 890 €', '890 – 6 750 €', '1 590 – 5 990 €'],
            isPrice: true
        },
        {
            label: t('shop.collections.compare_spirit'),
            values: ['Studio, loft, bureau', 'Maison, famille, sérénité', 'Audacieux, couleurs', 'Intemporel, élégant']
        },
    ]
    const count = collections.length;
    const countWord = t(`shop.collections.numberWords.${count}`, {defaultValue: count});

    return (
        <main id="main-content" tabIndex={-1} className="coll-page">

            <div className="breadcrumb" style={{marginTop:'40px'}}>
                <Link href="/">{t('shop.breadcrumb_home')}</Link> &rsaquo; {t('shop.collections.breadcrumb_current')}
            </div>

            <section className="cat-hero">
                <div className="container">
                    <h1>{t('shop.collections.h1', {countWord})}</h1>                    <p>
                    {t('shop.collections.intro')}
                </p>
                </div>
            </section>

            <section>
                <div className="mx-4 px-2 pt-5 mt-5">
                    <div className="coll-grid">
                        {collections.map(c => (
                            <Link key={c.slug} href={`/collection/${c.slug}`} className="coll-card">
                                <div className="coll-card-media">
                                    <Image src={toImageProxyUrl(c.image_url)} alt={c.name} width={800} height={533}
                                           style={{width: '100%', height: 'auto', objectFit: 'cover'}}/>
                                </div>
                                <div className="coll-card-foot">
                                    <span className="coll-card-name">{c.name}</span>
                                    {c.description && <span className="coll-card-tag">{c.description}</span>}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <div className="band">
                <div className="container">
                    <h2>{t('shop.collections.band_h2')}</h2>
                    <p>{t('shop.collections.band_p')}</p>
                    <Link href="/espaces" className="mega-cta-discover mega-cta-discover--light">
                        <span className="cta-label">{t('cta.discover')}</span>
                        <span className="cta-action">{t('shop.collections.band_cta')} <span
                            className="cta-arrow">→</span></span>
                    </Link>
                </div>
            </div>

            <section id="comparateur" className="compare-section">
                <div className="container">
                    <div style={{marginBottom: '64px'}}>
                        <span className="compare-label">{t('shop.collections.compare_label')}</span>
                        <h2 className="compare-title">{t('shop.collections.compare_title')}</h2>
                    </div>

                    <div className="compare-table-wrap">
                        <table className="compare-table">
                            <thead>
                            <tr>
                                <th></th>
                                {collections.map(c => (
                                    <th key={c.slug}><Link href={`/collection/${c.slug}`}>{c.name}</Link></th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {compareRows.map((row, i) => (
                                <tr key={row.label} className={i % 2 === 0 ? 'compare-row-alt' : undefined}>
                                    <td>{row.label}</td>
                                    {row.values.map((v, j) => (
                                        <td key={j} className={row.isPrice ? 'compare-price' : undefined}>{v}</td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                            <tfoot>
                            <tr>
                                <td></td>
                                {collections.map(c => (
                                    <td key={c.slug}>
                                        <Link href={`/collection/${c.slug}`}>img
                                            {t('shop.collections.discover')} {c.name}
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7"/>
                                            </svg>
                                        </Link>
                                    </td>
                                ))}
                            </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="compare-cards-mobile">
                        {collections.map(c => (
                            <div key={c.slug} className="compare-card">
                                <Link href={`/collection/${c.slug}`} className="compare-card-name">{c.name}</Link>
                                <dl>
                                    {compareRows.map((row, idx) => (
                                        <div key={row.label} className="compare-card-row">
                                            <dt>{row.label}</dt>
                                            <dd>{row.values[collections.indexOf(c)] ?? row.values[idx]}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <Link href={`/collection/${c.slug}`} className="compare-card-link">
                                    {t('shop.collections.discover')} {c.name}img
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7"/>
                                    </svg>
                                </Link>
                            </div>
                        ))}
                    </div>

                    <div className="quiz-teaser">
                        <h3>{t('shop.collections.quiz_title')}</h3>
                        <p>{t('shop.collections.quiz_desc')}</p>
                        <Link href="/configurer" className="cta-single">{t('shop.collections.quiz_cta')} <span
                            className="cta-arrow">→</span></Link>
                    </div>
                </div>
            </section>

            <section className="bento-section">
                <div className="container">
                    <div className="compare-bento">
                        <div className="compare-bento-main">
                            <Image src="/images/stock/oaksome-v8-ambiance-satori-2.jpg"
                                   alt={t('shop.collections.bento_main_alt')} fill style={{objectFit: 'cover'}}/>
                            <div className="compare-bento-caption">
                                <span className="compare-label">{t('shop.collections.bento_label')}</span>
                                <p>{t('shop.collections.bento_main_caption')}</p>
                            </div>
                        </div>
                        <div className="compare-bento-side">
                            <div className="compare-bento-img">
                                <Image src="/images/stock/oaksome-v8-ambiance-line-2.jpg"
                                       alt={t('shop.collections.bento_side_alt')} fill style={{objectFit: 'cover'}}/>
                            </div>
                            <div className="compare-bento-cta">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path
                                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"/>
                                </svg>
                                <div>
                                    <h3>{t('shop.collections.bento_cta_title')}</h3>
                                    <p>{t('shop.collections.bento_cta_desc')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="insp-section">
                <div className="container">
                    <div className="insp-head">
                        <div>
                            <span className="mono">{t('shop.collections.inspo_mono')}</span>
                            <h3>{t('shop.collections.inspo_h3')}</h3>
                            <p>{t('shop.collections.inspo_p')}</p>
                        </div>
                        <Link href="/inspirations" className="mega-cta-discover">
                            <span className="cta-label">{t('cta.discover')}</span>
                            <span className="cta-action">{t('shop.collections.inspo_cta')} <span
                                className="cta-arrow">→</span></span>
                        </Link>
                    </div>
                    <div className="insp-grid">
                        {['satori-3', 'line-1', 'vista-1', 'lys-2'].map((img, i) => (
                            <Link key={img} href="/inspirations" className="insp-thumb">
                                <Image src={`/images/stock/oaksome-v8-ambiance-${img}.jpg`}
                                       alt={t('shop.collections.inspo_alt')} fill style={{objectFit: 'cover'}}/>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <Newsletter/>

            <section className="usp-band">
                <div className="container">
                    <div className="spaces-pills">
                        <div className="spaces-pills-row">
                            <span
                                className="spaces-pill"><strong>{t('home.trust_band.delivery_stat')}</strong>&nbsp;{t('home.trust_band.delivery_label')}</span>
                            <span
                                className="spaces-pill"><strong>{t('home.trust_band.leadtime_stat')}</strong>&nbsp;{t('home.trust_band.leadtime_label')}</span>
                            <span
                                className="spaces-pill"><strong>{t('home.trust_band.warranty_stat')}</strong>&nbsp;{t('home.trust_band.warranty_label')}</span>
                            <span
                                className="spaces-pill"><strong>{t('home.trust_band.design_stat')}</strong>&nbsp;{t('home.trust_band.design_label')}</span>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    )
}
