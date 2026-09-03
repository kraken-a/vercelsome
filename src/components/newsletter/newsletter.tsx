'use client'
import {useState} from 'react'
import {useTranslations} from 'next-intl'
import './newsletter.css'

export default function Newsletter() {
    const t = useTranslations('common')
    const [email, setEmail] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
    }

    return (
        <section className="newsletter-stoemp" aria-labelledby="ns-title">
            <div className="ns-inner">
                <h2 id="ns-title" className="ns-title">
                    {t('newsletter_title_line_1')}<br/>{t('newsletter_title_line_2')}
                </h2>
                <form className="ns-form" onSubmit={handleSubmit}>
                    <label className="ns-input-wrap" htmlFor="ns-email">
            <span
                className="visually-hidden"
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    margin: '-1px',
                    overflow: 'hidden',
                    clip: 'rect(0,0,0,0)',
                    border: 0
                }}
            >
              {t('newsletter_email_label')}
            </span>
                        <input
                            id="ns-email"
                            className="ns-input"
                            type="email"
                            name="email"
                            placeholder={t('newsletter_email_placeholder')}
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>
                    <button className="ns-submit" type="submit" aria-label={t('newsletter_submit_aria')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                             strokeLinejoin="round" aria-hidden="true">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <polyline points="12 5 19 12 12 19"/>
                        </svg>
                    </button>
                </form>
                <div className="ns-legend">
                    <p className="ns-consent">{t('newsletter_consent')}</p>
                </div>
            </div>
        </section>
    )
}