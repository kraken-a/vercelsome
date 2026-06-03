'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import './newsletter.css'

export default function Newsletter() {
  const t = useTranslations('common')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="newsletter-section">
      <div className="container">
        <h3>{t('newsletter_title')}</h3>
        <p>{t('newsletter_desc')}</p>
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder={t('newsletter_email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">{t('newsletter_submit')}</button>
        </form>
      </div>
    </div>
  )
}
