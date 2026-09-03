'use client'

import {useEffect, useRef, useState} from 'react'
import {useLocale, useTranslations} from 'next-intl'
import {Link, useRouter} from '@/i18n/navigation'
import dynamic from 'next/dynamic'
import './landing.css'

const Stream = dynamic(() => import('@cloudflare/stream-react').then(m => ({ default: m.Stream })), { ssr: false })

const LOCALES = [
    {code: 'fr', labels: {fr: 'Français',    en: 'French',  nl: 'Frans'      }},
    {code: 'en', labels: {fr: 'Anglais',     en: 'English', nl: 'Engels'     }},
    {code: 'nl', labels: {fr: 'Néerlandais', en: 'Dutch',   nl: 'Nederlands' }},
] as const

function LocaleSwitcher() {
    const locale = useLocale()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        function handleOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [open])

    return (
        <div className="locale-switcher" ref={ref}>
            <button
                className="locale-trigger"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="Changer de langue"
            >
                <svg className="lang-globe" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18C7.7615 18 6.59483 17.7632 5.5 17.2895C4.40517 16.8157 3.45167 16.1727 2.6395 15.3605C1.82733 14.5483 1.18433 13.5948 0.7105 12.5C0.236833 11.4052 0 10.2385 0 9C0 7.75767 0.236833 6.59 0.7105 5.497C1.18433 4.40417 1.82733 3.45167 2.6395 2.6395C3.45167 1.82733 4.40517 1.18433 5.5 0.7105C6.59483 0.236833 7.7615 0 9 0C10.2423 0 11.41 0.236833 12.503 0.7105C13.5958 1.18433 14.5483 1.82733 15.3605 2.6395C16.1727 3.45167 16.8157 4.40417 17.2895 5.497C17.7632 6.59 18 7.75767 18 9C18 10.2385 17.7632 11.4052 17.2895 12.5C16.8157 13.5948 16.1727 14.5483 15.3605 15.3605C14.5483 16.1727 13.5958 16.8157 12.503 17.2895C11.41 17.7632 10.2423 18 9 18ZM9 17.0077C9.58717 16.2539 10.0712 15.5135 10.452 14.7865C10.8327 14.0597 11.1423 13.2463 11.3807 12.3463H6.61925C6.88342 13.2974 7.19942 14.1365 7.56725 14.8635C7.93525 15.5903 8.41283 16.3051 9 17.0077ZM7.727 16.8577C7.26033 16.3078 6.83433 15.6279 6.449 14.8182C6.06383 14.0086 5.777 13.1846 5.5885 12.3463H1.75375C2.32692 13.5898 3.13942 14.6096 4.19125 15.4057C5.24325 16.2019 6.42183 16.6859 7.727 16.8577ZM10.273 16.8577C11.5782 16.6859 12.7567 16.2019 13.8087 15.4057C14.8606 14.6096 15.6731 13.5898 16.2463 12.3463H12.4115C12.159 13.1974 11.8401 14.0278 11.4548 14.8375C11.0696 15.6472 10.6757 16.3206 10.273 16.8577ZM1.34625 11.3463H5.38075C5.30508 10.9359 5.25158 10.5362 5.22025 10.147C5.18875 9.758 5.173 9.37567 5.173 9C5.173 8.62433 5.18875 8.242 5.22025 7.853C5.25158 7.46383 5.30508 7.06408 5.38075 6.65375H1.34625C1.23725 6.99992 1.15225 7.37717 1.09125 7.7855C1.03042 8.19383 1 8.59867 1 9C1 9.40133 1.03042 9.80617 1.09125 10.2145C1.15225 10.6228 1.23725 11.0001 1.34625 11.3463ZM6.38075 11.3463H11.6193C11.6949 10.9359 11.7484 10.5426 11.7797 10.1663C11.8112 9.79008 11.827 9.40133 11.827 9C11.827 8.59867 11.8112 8.20992 11.7797 7.83375C11.7484 7.45742 11.6949 7.06408 11.6193 6.65375H6.38075C6.30508 7.06408 6.25158 7.45742 6.22025 7.83375C6.18875 8.20992 6.173 8.59867 6.173 9C6.173 9.40133 6.18875 9.79008 6.22025 10.1663C6.25158 10.5426 6.30508 10.9359 6.38075 11.3463ZM12.6193 11.3463H16.6538C16.7628 11.0001 16.8477 10.6228 16.9088 10.2145C16.9696 9.80617 17 9.40133 17 9C17 8.59867 16.9696 8.19383 16.9088 7.7855C16.8477 7.37717 16.7628 6.99992 16.6538 6.65375H12.6193C12.6949 7.06408 12.7484 7.46383 12.7797 7.853C12.8112 8.242 12.827 8.62433 12.827 9C12.827 9.37567 12.8112 9.758 12.7797 10.147C12.7484 10.5362 12.6949 10.9359 12.6193 11.3463ZM12.4115 5.65375H16.2463C15.6602 4.38458 14.8573 3.36475 13.8375 2.59425C12.8177 1.82375 11.6295 1.33333 10.273 1.123C10.7397 1.73717 11.1593 2.43942 11.5318 3.22975C11.9043 4.02025 12.1975 4.82825 12.4115 5.65375ZM6.61925 5.65375H11.3807C11.1166 4.71542 10.7909 3.86675 10.4038 3.10775C10.0166 2.34875 9.54867 1.64358 9 0.99225C8.45133 1.64358 7.98342 2.34875 7.59625 3.10775C7.20908 3.86675 6.88342 4.71542 6.61925 5.65375ZM1.75375 5.65375H5.5885C5.8025 4.82825 6.09575 4.02025 6.46825 3.22975C6.84075 2.43942 7.26033 1.73717 7.727 1.123C6.35767 1.33333 5.16633 1.82692 4.153 2.60375C3.1395 3.38075 2.33975 4.39742 1.75375 5.65375Z" fill="black"/>
                </svg>
                <span className="locale-badge">{locale.toUpperCase()}</span>
            </button>
            {open && (
                <ul className="locale-dropdown" role="listbox">
                    {LOCALES.map(l => (
                        <li key={l.code} role="option" aria-selected={locale === l.code}>
                            <button
                                onClick={() => {
                                    router.push('/landing', {locale: l.code})
                                    setOpen(false)
                                }}
                                className={locale === l.code ? 'active' : ''}
                            >
                                {l.labels[locale as keyof typeof l.labels]}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

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

    function toggleMute() {
        setMuted(prev => !prev)
    }

    return (
      <div className="landing-root">
        <header className="landing-header">
          <Link href="/">
            <img src="/images/oaksome-logo.svg" alt="Oaksome" style={{ height: '20px' }} />
          </Link>
          <div className="landing-header-meta">
            <LocaleSwitcher />
            <span className="landing-header-sep" />
            <Link href="/login" className="landing-header-login">
              {t('login')}
            </Link>
          </div>
        </header>

        <div className="landing-hero">
          <div className="landing-video-wrap">
            <Stream
              src="94e0a6b01355d4137a2ed22ea821b2db"
              autoplay
              muted={muted}
              loop
              controls={false}
              responsive={false}
              className="landing-video-frame"
            />
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

        <div className="landing-headline">
          <h1>{t('headline')}</h1>
        </div>

        <div className="landing-mobile-login-bar">
          <Link href="/login" className="landing-mobile-login-link">
            <svg width="25" height="28" viewBox="0 0 25 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.44 3.4526C14.8963 3.4526 17.2136 3.98693 19.392 5.05559C21.5702 6.12425 23.3867 7.66406 24.8416 9.67502C24.9864 9.85916 25.0319 10.0267 24.9782 10.1778C24.9246 10.3285 24.8326 10.4536 24.7022 10.553C24.5716 10.6523 24.4248 10.6966 24.2617 10.6858C24.0986 10.6752 23.9558 10.584 23.8334 10.412C22.5376 8.56197 20.8806 7.14734 18.8623 6.16817C16.8442 5.18899 14.7034 4.69941 12.44 4.69941C10.1863 4.69941 8.06765 5.19346 6.08395 6.18156C4.10002 7.16989 2.45309 8.58006 1.14317 10.412C1.0126 10.6053 0.86332 10.7093 0.69534 10.7238C0.52736 10.7382 0.378083 10.6912 0.24751 10.5829C0.116239 10.4836 0.0365467 10.3593 0.00843384 10.2102C-0.019679 10.061 0.0224904 9.90613 0.134942 9.74548C1.5845 7.76717 3.38686 6.22383 5.54202 5.11548C7.69742 4.00689 9.99675 3.4526 12.44 3.4526ZM12.4407 6.76427C15.5589 6.76427 18.2381 7.81473 20.4783 9.91565C22.7187 12.0166 23.839 14.6193 23.839 17.7238C23.839 18.8789 23.4343 19.8434 22.6251 20.6173C21.8159 21.3912 20.8301 21.7781 19.6677 21.7781C18.5095 21.7781 17.5131 21.3912 16.6785 20.6173C15.8438 19.8434 15.4264 18.8789 15.4264 17.7238C15.4264 16.9306 15.1352 16.2608 14.553 15.7142C13.9705 15.1677 13.2751 14.8944 12.4668 14.8944C11.6513 14.8944 10.9497 15.1665 10.3619 15.7107C9.77428 16.2547 9.48049 16.9257 9.48049 17.7238C9.48049 20.0291 10.1574 21.9541 11.5112 23.4988C12.8651 25.0435 14.5991 26.1212 16.7134 26.7319C16.9004 26.7939 17.0276 26.8973 17.095 27.0419C17.1622 27.1866 17.1725 27.3416 17.126 27.507C17.0796 27.6517 16.9956 27.7781 16.8741 27.8864C16.7525 27.9949 16.5918 28.0257 16.3917 27.9787C14.011 27.3681 12.0584 26.1592 10.534 24.3521C9.00943 22.5448 8.24713 20.3353 8.24713 17.7238C8.24713 16.5675 8.66092 15.5992 9.48851 14.8187C10.3159 14.0382 11.309 13.648 12.4679 13.648C13.6266 13.648 14.6148 14.0382 15.4326 14.8187C16.2507 15.5992 16.6597 16.5675 16.6597 17.7238C16.6597 18.5219 16.9577 19.1929 17.5536 19.7369C18.1496 20.2811 18.8529 20.5532 19.6635 20.5532C20.4739 20.5532 21.1668 20.2799 21.7423 19.7333C22.3178 19.1868 22.6056 18.517 22.6056 17.7238C22.6056 14.9763 21.6079 12.667 19.6126 10.7961C17.6171 8.92484 15.2342 7.98924 12.4641 7.98924C9.69389 7.98924 7.31476 8.92614 5.32664 10.7999C3.3383 12.6737 2.34412 14.9744 2.34412 17.702C2.34412 18.2703 2.40314 18.9807 2.52117 19.8331C2.63896 20.6852 2.89093 21.6749 3.27708 22.8023C3.33772 22.9867 3.33412 23.1498 3.26627 23.2916C3.19843 23.4335 3.08052 23.5397 2.91254 23.6101C2.74456 23.6806 2.58459 23.6789 2.43265 23.6052C2.2807 23.5312 2.17429 23.41 2.11341 23.2416C1.75608 22.2984 1.49969 21.3792 1.34426 20.4841C1.18859 19.5888 1.11076 18.6687 1.11076 17.7238C1.11076 14.6193 2.22528 12.0166 4.45433 9.91565C6.68338 7.81473 9.3455 6.76427 12.4407 6.76427ZM12.4668 0C13.942 0 15.3826 0.182025 16.7887 0.546074C18.1948 0.910123 19.5548 1.43271 20.8686 2.11383C21.0687 2.22234 21.1839 2.35199 21.2144 2.50278C21.2448 2.65357 21.2296 2.80224 21.1687 2.9488C21.1081 3.09512 21.003 3.20622 20.8537 3.28208C20.7045 3.35794 20.536 3.3462 20.3483 3.24685C19.126 2.58546 17.8519 2.08682 16.5259 1.75096C15.1999 1.41486 13.8447 1.24681 12.4602 1.24681C11.0992 1.24681 9.76371 1.41439 8.45379 1.74955C7.14364 2.08471 5.88274 2.58381 4.6711 3.24685C4.52984 3.33704 4.37743 3.35736 4.21386 3.3078C4.0503 3.25801 3.93099 3.15278 3.85595 2.99213C3.7809 2.83125 3.75999 2.68128 3.79321 2.54224C3.82621 2.40296 3.92216 2.28365 4.08108 2.1843C5.37334 1.47076 6.7281 0.928326 8.14536 0.556995C9.56262 0.185665 11.0031 0 12.4668 0ZM12.4675 10.1954C14.6099 10.1954 16.4483 10.9203 17.9827 12.3702C19.517 13.82 20.2842 15.6046 20.2842 17.7238C20.2842 17.9108 20.2276 18.0614 20.1145 18.1758C20.0016 18.29 19.8526 18.347 19.6677 18.347C19.5085 18.347 19.366 18.29 19.2401 18.1758C19.1139 18.0614 19.0508 17.9108 19.0508 17.7238C19.0508 15.9442 18.3996 14.4523 17.0971 13.2481C15.7944 12.0439 14.2511 11.4418 12.4672 11.4418C10.6833 11.4418 9.14709 12.0439 7.85854 13.2481C6.57 14.4523 5.92573 15.9438 5.92573 17.7227C5.92573 19.644 6.25541 21.2703 6.91479 22.6018C7.57439 23.9333 8.53151 25.2766 9.78613 26.6318C9.92553 26.7744 9.9885 26.9284 9.97502 27.0937C9.96155 27.2591 9.89858 27.3987 9.78613 27.5126C9.66462 27.6355 9.52208 27.6991 9.35851 27.7036C9.19495 27.708 9.04788 27.6444 8.9173 27.5126C7.57346 26.0745 6.5334 24.5956 5.79713 23.076C5.06062 21.5566 4.69236 19.7725 4.69236 17.7234C4.69236 15.6044 5.45257 13.82 6.97299 12.3702C8.49364 10.9203 10.3252 10.1954 12.4675 10.1954ZM12.416 17.1006C12.6 17.1006 12.7491 17.1629 12.8634 17.2876C12.978 17.4121 13.0353 17.5575 13.0353 17.7238C13.0353 19.513 13.6692 20.9803 14.9371 22.1255C16.2052 23.2705 17.6891 23.843 19.3889 23.843C19.5729 23.843 19.7927 23.8313 20.0483 23.8078C20.3038 23.7843 20.5665 23.749 20.8362 23.7021C21.0098 23.6643 21.1586 23.6892 21.2827 23.7768C21.407 23.8644 21.4923 24.0012 21.5388 24.1872C21.5853 24.3528 21.5548 24.4976 21.4475 24.6216C21.3404 24.7458 21.2029 24.8314 21.0349 24.8784C20.6971 24.9686 20.3757 25.0264 20.0709 25.0518C19.7663 25.0771 19.539 25.0898 19.3889 25.0898C17.3478 25.0898 15.5731 24.3915 14.0647 22.995C12.5562 21.5987 11.8019 19.8416 11.8019 17.7238C11.8019 17.5575 11.8582 17.4121 11.9709 17.2876C12.0834 17.1629 12.2317 17.1006 12.416 17.1006Z" fill="black"/>
            </svg>
            <span className="landing-mobile-login-label">Login</span>
          </Link>
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
