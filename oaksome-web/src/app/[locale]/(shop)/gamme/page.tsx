import type {Metadata} from 'next'
import {getPageMetadata} from '@/lib/seo/page-metadata'
import Link from 'next/link'
import Image from 'next/image'
import {getTranslations} from 'next-intl/server'
import {getNavigation} from '@/lib/api/navigation'
import {toImageProxyUrl} from '@/lib/image-url'
import Newsletter from '@/components/newsletter/newsletter'
import '@/css/espace-page.css'
import './categories.css'

type Props = {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const {locale} = await params

    return getPageMetadata({
        namespace: 'meta.gammes',
        locale,
        pathMap: {
            fr: '/gamme',
            nl: '/gamma',
        }
    })
}

export default async function GammesPage({params}: Props) {
    const {locale} = await params

    const t = await getTranslations()
    const navResult = await getNavigation(locale)

    const types = navResult.success ? navResult.data.types : []

    return (
        <main id="main-content" tabIndex={-1} className="esp-page">
            <div className="breadcrumb">
                <Link href="/">
                    {t('shop.breadcrumb_home')}
                </Link>
                &rsaquo; {t('shop.gamme.breadcrumb_current')}
            </div>

            <section className="cat-hero">
                <div className="container">
                    <h1>{t('shop.gamme.h1')}</h1>
                    <p>
                        {t('shop.gamme.intro')}
                        {/*<br/>*/}
                        {/*{t('shop.gamme.intro_2')}*/}
                    </p>
                </div>
            </section>

            <section>
                <div className="mx-4 px-2 ">
                    <div className="cat-grid">
                        {types.map(type => (
                            <Link
                                key={type.slug}
                                href={`/gamme/${type.slug}`}
                                className="cat-card"
                            >
                                <Image
                                    src={toImageProxyUrl(type.image_url)}
                                    alt={type.name}
                                    fill
                                    style={{objectFit: 'cover'}}
                                />

                                <span className="cat-card-name">
                                    {type.name}
                                </span>
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

                            <span className="spaces-pill">
                                <strong>{t('home.trust_band.delivery_stat')}</strong>
                                &nbsp;
                                {t('home.trust_band.delivery_label')}
                            </span>

                            <span className="spaces-pill">
                                <strong>{t('home.trust_band.leadtime_stat')}</strong>
                                &nbsp;
                                {t('home.trust_band.leadtime_label')}
                            </span>

                            <span className="spaces-pill">
                                <strong>{t('home.trust_band.warranty_stat')}</strong>
                                &nbsp;
                                {t('home.trust_band.warranty_label')}
                            </span>

                            <span className="spaces-pill">
                                <strong>{t('home.trust_band.design_stat')}</strong>
                                &nbsp;
                                {t('home.trust_band.design_label')}
                            </span>

                        </div>
                    </div>
                </div>
            </section>

        </main>
    )
}