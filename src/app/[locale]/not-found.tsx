import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'notFound' })
  return {
    title: t('errorCode'),
    description: t('intro'),
  }
}

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-beige-fonce text-lg mb-8">
        Cette page n&apos;existe pas.
      </p>
      <Link
        href="/"
        className="bg-vert-persan text-white px-6 py-3 text-sm font-medium uppercase tracking-wider hover:opacity-90 transition-premium duration-premium ease-premium"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  )
}
