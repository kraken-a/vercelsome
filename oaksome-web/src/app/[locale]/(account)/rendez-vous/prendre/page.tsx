import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import ClientPage from './_client'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.rendez_vous_prendre', locale, pathMap: { fr: '/rendez-vous/prendre', nl: '/afspraken/maken', en: '/appointments/book' } })
}

export default function Page() {
  return <ClientPage />
}
