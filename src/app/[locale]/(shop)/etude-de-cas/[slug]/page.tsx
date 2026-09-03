import type {Metadata} from 'next'
import {getPageMetadata} from '@/lib/seo/page-metadata'
import ClientPage from './_client'

export async function generateMetadata({params}: {
    params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
    const {locale, slug} = await params
    return getPageMetadata({
        namespace: 'meta.etude_de_cas_slug',
        locale,
        pathMap: {
            fr: '/etude-de-cas/[slug]',
            nl: '/casestudy/[slug]',
            en: '/case-study/[slug]',
        },
        params: {slug},
        tParams: {slug},
    })
}

export default function Page() {
    return <ClientPage/>
}
