'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const STORAGE_KEY = 'oaksome-cookie-consent'

export function CookieBanner() {
  const t = useTranslations('cookies')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  function dismiss(choice: 'accepted' | 'refused') {
    try { localStorage.setItem(STORAGE_KEY, choice) } catch { /* noop */ }
    if (choice === 'accepted') {
      window.__oaksomeConsent = { analytics: true, ads: true }
      const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
      if (typeof gtag === 'function') {
        gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        })
      }
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookies-banner" role="region" aria-label="Consentement aux cookies">
      <div className="cookies-content">
        <p className="cookies-title">{t('title')}</p>
        <p className="cookies-text">{t('text')}</p>
      </div>
      <div className="cookies-actions">
        <button type="button" className="cookies-action" onClick={() => dismiss('accepted')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {t('accept')}
        </button>
        <button type="button" className="cookies-action" onClick={() => dismiss('refused')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          {t('refuse')}
        </button>
        <Link href="/cookies" className="cookies-action">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
          </svg>
          {t('customize')}
        </Link>
      </div>
    </div>
  )
}
