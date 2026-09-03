'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

type Props = {
  readonly promo: React.ReactNode
  readonly header: React.ReactNode
  readonly footer: React.ReactNode
  readonly children: React.ReactNode
}

const HIDE_CHROME_PATTERNS: readonly RegExp[] = [
  /^\/[^/]+\/landing\/?$/,
  /^\/[^/]+\/login\/?$/,
]

function shouldHideChrome(pathname: string): boolean {
  return HIDE_CHROME_PATTERNS.some((re) => re.test(pathname))
}

export function LayoutChrome({ promo, header, footer, children }: Props) {
  const pathname = usePathname()
  const t = useTranslations('a11y')

  if (shouldHideChrome(pathname)) {
    return (
      <>
        <a href="#main-content" className="skip-link">{t('skip')}</a>
        {children}
      </>
    )
  }

  return (
    <>
      <a href="#main-content" className="skip-link">{t('skip')}</a>
      {promo}
      {header}
      {children}
      {footer}
    </>
  )
}
