'use client'

import { useTranslations } from 'next-intl'

type Props = {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

export default function Error({ error, reset }: Props) {
  const t = useTranslations('common')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-bold mb-4">{t('error')}</h1>
      <p className="text-beige-fonce text-lg mb-8">
        {error.digest ? `Ref: ${error.digest}` : ''}
      </p>
      <button
        onClick={reset}
        type="button"
        className="bg-vert-persan text-white px-6 py-3 text-sm font-medium uppercase tracking-wider hover:opacity-90 transition-premium duration-premium ease-premium"
      >
        {t('retry')}
      </button>
    </main>
  )
}
