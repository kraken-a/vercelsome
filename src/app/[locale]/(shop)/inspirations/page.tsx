import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import ClientPage from './_client'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.inspirations', locale, pathMap: { fr: '/inspirations', nl: '/inspiraties', en: '/inspirations' } })
}

export default function Page() {
  return <ClientPage />
}
