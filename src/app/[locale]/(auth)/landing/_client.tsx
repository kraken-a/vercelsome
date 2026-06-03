'use client'

import {useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'
import './landing.css'

const SOCIAL_LINKS = [
    {label: 'Instagram', href: 'https://www.instagram.com/oaksome.be'},
    {label: 'Facebook', href: 'https://www.facebook.com/oaksome.be'},
    {label: 'Pinterest', href: 'https://www.pinterest.com/oaksomebe'},
    {label: 'TikTok', href: 'https://www.tiktok.com/@oaksome.be'},
    {label: 'Linkedin', href: 'https://www.linkedin.com/company/oaksome'},
]

function NewsletterForm() {
    const t = useTranslations('auth.landing')
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email) return
        setLoading(true)
        try {
            await fetch('/api/odoo/newsletter', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email}),
            })
        } catch { /* silent */
        }
        setLoading(false)
        setSubmitted(true)
    }

    if (submitted) {
        return (
            <div className="landing-newsletter">
                <p className="landing-newsletter-success">{t('newsletter_success')}</p>
            </div>
        )
    }

    return (
        <div className="landing-newsletter">
            <form className="ns-form" onSubmit={handleSubmit} noValidate>
                <label className="ns-input-wrap" htmlFor="ns-email">
                    <span style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        overflow: 'hidden',
                        clip: 'rect(0,0,0,0)'
                    }}>{t('newsletter_label')}</span>
                    <input id="ns-email" className="ns-input" type="email" name="email"
                           placeholder={t('newsletter_placeholder')} autoComplete="email" required
                           value={email} onChange={e => setEmail(e.target.value)}/>
                </label>
                <button className="ns-submit" type="submit" disabled={loading} aria-label={t('newsletter_aria')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                         strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                    </svg>
                </button>
            </form>
            <p className="landing-newsletter-consent">
                {t('newsletter_consent')}
            </p>
        </div>
    )
}

export default function LandingPage() {
    const t = useTranslations('auth.landing')
    const [muted, setMuted] = useState(true)
    const videoRef = useRef<HTMLVideoElement>(null)

    function toggleMute() {
        setMuted(prev => {
            const next = !prev
            if (videoRef.current) videoRef.current.muted = next
            return next
        })
    }

    return (
      <div className="landing-root">
        <header className="landing-header">
          <Link href="/">
            <img src="/images/oaksome-logo.svg" alt="Oaksome" style={{ height: '20px' }} />
          </Link>
          <div className="landing-header-meta">
            <div className="country-selectors" id="countrySelectors">
              <div className="country-hover-language" id="countryHoverLanguage"></div>
              <div className="others-country" id="Otherscountry"></div>

              <div className="languages-box" id="currentlanguage">
                FR
              </div>

              <div className="default-country" id="Defaultcountry">
                Belgique
              </div>

              <svg
                className="lang-globe"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 18C7.7615 18 6.59483 17.7632 5.5 17.2895C4.40517 16.8157 3.45167 16.1727 2.6395 15.3605C1.82733 14.5483 1.18433 13.5948 0.7105 12.5C0.236833 11.4052 0 10.2385 0 9C0 7.75767 0.236833 6.59 0.7105 5.497C1.18433 4.40417 1.82733 3.45167 2.6395 2.6395C3.45167 1.82733 4.40517 1.18433 5.5 0.7105C6.59483 0.236833 7.7615 0 9 0C10.2423 0 11.41 0.236833 12.503 0.7105C13.5958 1.18433 14.5483 1.82733 15.3605 2.6395C16.1727 3.45167 16.8157 4.40417 17.2895 5.497C17.7632 6.59 18 7.75767 18 9C18 10.2385 17.7632 11.4052 17.2895 12.5C16.8157 13.5948 16.1727 14.5483 15.3605 15.3605C14.5483 16.1727 13.5958 16.8157 12.503 17.2895C11.41 17.7632 10.2423 18 9 18ZM9 17.0077C9.58717 16.2539 10.0712 15.5135 10.452 14.7865C10.8327 14.0597 11.1423 13.2463 11.3807 12.3463H6.61925C6.88342 13.2974 7.19942 14.1365 7.56725 14.8635C7.93525 15.5903 8.41283 16.3051 9 17.0077ZM7.727 16.8577C7.26033 16.3078 6.83433 15.6279 6.449 14.8182C6.06383 14.0086 5.777 13.1846 5.5885 12.3463H1.75375C2.32692 13.5898 3.13942 14.6096 4.19125 15.4057C5.24325 16.2019 6.42183 16.6859 7.727 16.8577ZM10.273 16.8577C11.5782 16.6859 12.7567 16.2019 13.8087 15.4057C14.8606 14.6096 15.6731 13.5898 16.2463 12.3463H12.4115C12.159 13.1974 11.8401 14.0278 11.4548 14.8375C11.0696 15.6472 10.6757 16.3206 10.273 16.8577ZM1.34625 11.3463H5.38075C5.30508 10.9359 5.25158 10.5362 5.22025 10.147C5.18875 9.758 5.173 9.37567 5.173 9C5.173 8.62433 5.18875 8.242 5.22025 7.853C5.25158 7.46383 5.30508 7.06408 5.38075 6.65375H1.34625C1.23725 6.99992 1.15225 7.37717 1.09125 7.7855C1.03042 8.19383 1 8.59867 1 9C1 9.40133 1.03042 9.80617 1.09125 10.2145C1.15225 10.6228 1.23725 11.0001 1.34625 11.3463ZM6.38075 11.3463H11.6193C11.6949 10.9359 11.7484 10.5426 11.7797 10.1663C11.8112 9.79008 11.827 9.40133 11.827 9C11.827 8.59867 11.8112 8.20992 11.7797 7.83375C11.7484 7.45742 11.6949 7.06408 11.6193 6.65375H6.38075C6.30508 7.06408 6.25158 7.45742 6.22025 7.83375C6.18875 8.20992 6.173 8.59867 6.173 9C6.173 9.40133 6.18875 9.79008 6.22025 10.1663C6.25158 10.5426 6.30508 10.9359 6.38075 11.3463ZM12.6193 11.3463H16.6538C16.7628 11.0001 16.8477 10.6228 16.9088 10.2145C16.9696 9.80617 17 9.40133 17 9C17 8.59867 16.9696 8.19383 16.9088 7.7855C16.8477 7.37717 16.7628 6.99992 16.6538 6.65375H12.6193C12.6949 7.06408 12.7484 7.46383 12.7797 7.853C12.8112 8.242 12.827 8.62433 12.827 9C12.827 9.37567 12.8112 9.758 12.7797 10.147C12.7484 10.5362 12.6949 10.9359 12.6193 11.3463ZM12.4115 5.65375H16.2463C15.6602 4.38458 14.8573 3.36475 13.8375 2.59425C12.8177 1.82375 11.6295 1.33333 10.273 1.123C10.7397 1.73717 11.1593 2.43942 11.5318 3.22975C11.9043 4.02025 12.1975 4.82825 12.4115 5.65375ZM6.61925 5.65375H11.3807C11.1166 4.71542 10.7909 3.86675 10.4038 3.10775C10.0166 2.34875 9.54867 1.64358 9 0.99225C8.45133 1.64358 7.98342 2.34875 7.59625 3.10775C7.20908 3.86675 6.88342 4.71542 6.61925 5.65375ZM1.75375 5.65375H5.5885C5.8025 4.82825 6.09575 4.02025 6.46825 3.22975C6.84075 2.43942 7.26033 1.73717 7.727 1.123C6.35767 1.33333 5.16633 1.82692 4.153 2.60375C3.1395 3.38075 2.33975 4.39742 1.75375 5.65375Z"
                  fill="black"
                />
              </svg>
            </div>
            <span className="landing-header-sep" />
            <Link href="/login" className="landing-header-login">
              {t('login')}
            </Link>
          </div>
        </header>

        <div className="landing-hero">
          <div className="landing-video-wrap">
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={t('video_label')}
            >
                <source
                    src="https://watch.cloudflarestream.com/94e0a6b01355d4137a2ed22ea821b2db"
                    type="video/mp4"
              />
            </video>
            <button
              className="landing-video-sound"
              onClick={toggleMute}
              aria-label={muted ? t('video_unmute') : t('video_mute')}
              aria-pressed={!muted}
            >
              {muted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
          </div>
          <div className="landing-hero-quote">
            <p className="headliner">
              {t('hero_quote_line_1')}
              <br />
              {t('hero_quote_line_2')}
            </p>
          </div>
        </div>

        {/* Headline */}
        <div className="landing-headline">
          <h1>{t('headline')}</h1>
        </div>

        <div className="landing-bottom">
          <div className="landing-social">
            <span className="landing-social-label">{t('follow_us')}</span>
            <span className="landing-social-sep">—</span>
            {SOCIAL_LINKS.map((s, i) => (
              <span key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
                {i < SOCIAL_LINKS.length - 1 && <span className="landing-social-comma"> ,</span>}
              </span>
            ))}
          </div>

          <NewsletterForm />
        </div>
      </div>
    )
}
