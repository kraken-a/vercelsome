import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.tva_6', locale, pathMap: '/tva-6' })
}

export default function TVA6Page() {
  return (
    <main>
      <h1>TVA6</h1>
    </main>
  )
}
