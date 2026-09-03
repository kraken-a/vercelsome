'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function HelpFab() {
  const t = useTranslations('nav.help')
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="help-fab" onClick={() => setOpen(o => !o)} aria-label={t('aria_open')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>{t('label')}</span>
      </button>

      <div className={`help-chat${open ? ' open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <strong>{t('brand')}</strong>
          <span onClick={() => setOpen(false)} style={{ cursor: 'pointer', fontSize: '1.2rem' }}>&times;</span>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#000' }}>
          {t('soon')}
        </p>
        <Link
          href="/contact"
          className="btn btn-primary"
          style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}
          onClick={() => setOpen(false)}
        >
          {t('cta')}
        </Link>
      </div>
    </>
  )
}
