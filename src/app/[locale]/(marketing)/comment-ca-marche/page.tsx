import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import ClientPage from './_client'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.comment_ca_marche', locale, pathMap: { fr: '/comment-ca-marche', nl: '/hoe-het-werkt', en: '/how-it-works' } })
}

export default function Page() {
  return <ClientPage />
}
