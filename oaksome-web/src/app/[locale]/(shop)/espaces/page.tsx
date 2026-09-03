import {Fragment} from 'react'
import type {Metadata} from 'next'
import {getPageMetadata} from '@/lib/seo/page-metadata'
import Link from 'next/link'
import Image from 'next/image'
import {getTranslations} from 'next-intl/server'
import {getNavigation} from '@/lib/api/navigation'
import {toImageProxyUrl} from '@/lib/image-url'
import '@/css/espace-page.css'
import './spaces.css'
import Newsletter from '@/components/newsletter/newsletter'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const {locale} = await params
    return getPageMetadata({namespace: 'meta.espaces', locale, pathMap: {fr: '/espaces', nl: '/ruimtes'}})
}

export default async function EspacesPage({params}: Props) {
    const {locale} = await params
    const t = await getTranslations()
    const navResult = await getNavigation(locale)
    const spaces = navResult.success ? navResult.data.spaces : []
    console.log('navResult:', JSON.stringify(navResult))

    return (
        <main id="main-content" tabIndex={-1} className="esp-page">

            <div className="breadcrumb ">
                <Link href="/">{t('shop.breadcrumb_home')}</Link> &rsaquo; {t('shop.espaces.breadcrumb_current')}
            </div>

            <section className="cat-hero">
                <div className="container">
                    <h1>{t('shop.espaces.h1')}</h1>
                    <p>{t('shop.espaces.intro')}</p>
                </div>
            </section>

            <section>
                <div className="mx-4 px-2 pt-5 mt-5">
                    <div className="cat-grid">
                        {spaces.map(s => (
                            <Link key={s.slug} href={`/espace/${s.slug}`} className="cat-card">
                                <Image src={toImageProxyUrl(s.image_url)} alt={s.name} fill
                                       style={{objectFit: 'cover'}}/>
                                <span className="cat-card-name">{s.name}</span>
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