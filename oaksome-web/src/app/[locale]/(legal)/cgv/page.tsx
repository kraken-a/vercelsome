import type {Metadata} from 'next'
import {getPageMetadata} from '@/lib/seo/page-metadata'
import './cgv.css'
import {Link} from '@/i18n/navigation'
import {getTranslations} from 'next-intl/server'
import CGVAccordion from './_accordion'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const {locale} = await params
    return getPageMetadata({namespace: 'meta.cgv', locale, pathMap: '/cgv'})
}

export default async function CGVPage() {
    const t = await getTranslations('legal.cgv_page')
    const breadcrumb = await getTranslations('breadcrumb')

    return (
        <main>
            <div className="container">
                <div style={{padding: '1rem 0', fontSize: '0.9rem'}}>
                    <Link href="/">{breadcrumb('home')}</Link> &rsaquo; {t('breadcrumb')}
                </div>
            </div>

            <section style={{paddingTop: '1rem'}}>
                <div className="container">
                    <div className="legal-content py-5 my-5 legal-acc">
                        <h1 style={{fontSize: '2.5rem', margin: '0.5rem 0'}}>{t('h1')}</h1>
                        <p className="updated">{t('updated')}</p>

                        <CGVAccordion/>

                        <div style={{
                            textAlign: 'center',
                            marginTop: '3rem',
                            paddingTop: '2rem',
                            borderTop: '1px solid var(--border)'
                        }}>
                            <p style={{fontSize: '0.85rem'}}>Oaksome Belgium — TVA BE 1026.968.692 — Rue Roberts Jones
                                72, 1180 Uccle</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}