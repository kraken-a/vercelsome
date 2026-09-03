import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.pro_inscription', locale, pathMap: { fr: '/pro/inscription', nl: '/pro/registratie' } })
}

export default function ProInscriptionPage() {
  return (
    <main>
      <h1>ProInscription</h1>
    </main>
  )
}
