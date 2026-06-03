import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'

type Props = { params: Promise<{ locale: string; token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.config_token', locale, pathMap: '/config/[token]' })
}

export default function SharedConfigPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <h1>SharedConfig</h1>
    </main>
  )
}
