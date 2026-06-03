import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import ClientPage from './_client'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params
  return getPageMetadata({
    namespace: 'meta.projet_detail',
    locale,
    pathMap: { fr: '/projets/[id]', nl: '/projecten/[id]' },
    params: { id },
    tParams: { id },
  })
}

export default function Page() {
  return <ClientPage />
}
