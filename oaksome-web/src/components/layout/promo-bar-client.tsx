'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  topNotice?: { message: string; badge?: string } | null
}

const PROMO_H = '64px'

export function PromoBarClient({ topNotice }: Props) {
  const t = useTranslations('promo')
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const visible = !!topNotice && !hidden
    document.documentElement.style.setProperty('--promo-h', visible ? PROMO_H : '0px')
    return () => {
      document.documentElement.style.setProperty('--promo-h', '0px')
    }
  }, [topNotice, hidden])

  if (hidden || !topNotice) return null

  const text = (
    <>
      {topNotice.badge && <span className="promo-badge-v2">{topNotice.badge}</span>}
      <span>{topNotice.message}</span>
    </>
  )

  return (
    <div className="promo-bar-v2" id="promoBar">
      <div className="promo-marquee" id="promoMarquee">
        <div className="promo-marquee-text">{text}</div>
        <div className="promo-marquee-text" aria-hidden="true">{text}</div>
      </div>
      <button
        className="promo-close-v2"
        onClick={() => setHidden(true)}
        aria-label={t('close_label')}
      >
        ×
      </button>
    </div>
  )
}
