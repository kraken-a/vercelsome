'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import Assurance from '@/components/assurance/assurance'

import './inspiration.css'

export default function InspirationsPage() {
  const t = useTranslations('shop.inspirations')
  const breadcrumb = useTranslations('breadcrumb')

  function normalizeImage(src?: string | false): string {
    if (!src) return ''
    if (src.startsWith('http') || src.startsWith('data:')) return src
    return `data:image/jpeg;base64,${src}`
  }

  function closeMobileMenu() {
    document.getElementById('mobileMenu')?.classList.remove('open')
    document.getElementById('mobileMenuOverlay')?.classList.remove('open')
  }

  function closeNotifPanel() {
    document.getElementById('notifPanel')?.classList.remove('open')
    document.getElementById('notifOverlay')?.classList.remove('open')
  }

  function closeLightbox() {
    document.getElementById('inspoLightbox')?.classList.remove('open')
    document.body.style.overflow = ''
  }

  function filterInspo(source: string, btn: HTMLElement) {
    const cards = document.querySelectorAll<HTMLElement>('#inspoGrid .inspo-card')
    let count = 0
    cards.forEach((card) => {
      if (source === 'all' || card.getAttribute('data-source') === source) {
        card.classList.remove('hidden')
        count++
      } else {
        card.classList.add('hidden')
      }
    })
    document.querySelectorAll('.inspo-filter-btn').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    const counter = document.getElementById('inspoCounter')
    if (counter) counter.textContent = count === 1 ? t('counter_one', { count }) : t('counter_other', { count })
  }

  function openLightbox(card: HTMLElement) {
    const img = card.querySelector<HTMLImageElement>('.inspo-card-img img')
    const tag = card.querySelector('.inspo-tag')
    const caption = card.querySelector('.inspo-card-body p')
    const lightboxImg = document.getElementById('lightboxImg') as HTMLImageElement | null
    if (img && lightboxImg) {
      lightboxImg.src = img.src
      lightboxImg.alt = img.alt
    }
    const lbTag = document.getElementById('lightboxTag')
    if (lbTag && tag) {
      lbTag.textContent = tag.textContent
      lbTag.className =
        'inspo-tag ' + Array.from(tag.classList).find((c) => c.startsWith('inspo-tag-'))
    }
    const captionEl = document.getElementById('lightboxCaption')
    if (captionEl) captionEl.textContent = caption?.textContent ?? ''
    document.getElementById('inspoLightbox')?.classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  const [inspirations, setInspirations] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    fetch('/api/odoo/inspiration')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setInspirations(data)
      })
  }, [])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu()
        closeNotifPanel()
        closeLightbox()
      }
    }
    document.querySelectorAll('.mobile-menu a').forEach((link) => {
      link.addEventListener('click', closeMobileMenu)
    })
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <div className="breadcrumb container">
        <Link href="/">{breadcrumb('home')}</Link> &rsaquo; {t('breadcrumb_current')}
      </div>

      <div className="inspo-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src="/images/stock/oaksome-inspo-hero.jpg"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.3,
          }}
        />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="inspo-hero-inner">
            <span className="inspo-label">{t('hero_label')}</span>
            <h1>
              {t('hero_title_line1')}
              <br />
              {t('hero_title_line2')}
            </h1>
            <p>
              {t('hero_desc')}
            </p>
            <a href="#inspoGrid" className="inspo-hero-cta">
              {t('hero_cta')} &darr;
            </a>
          </div>
        </div>
      </div>

      <div className="inspo-filter-bar">
        <div className="container inspo-filter-inner">
          <div className="inspo-filters">
            <button
              className="inspo-filter-btn active"
              data-filter="all"
              onClick={(e) => filterInspo('all', e.currentTarget)}
            >
              {t('filter_all')}
            </button>
            <button
              className="inspo-filter-btn"
              data-filter="vercelsome"
              onClick={(e) => filterInspo('vercelsome', e.currentTarget)}
            >
              {t('filter_vercelsome')}
            </button>
            <button
              className="inspo-filter-btn"
              data-filter="instagram"
              onClick={(e) => filterInspo('instagram', e.currentTarget)}
            >
              {t('filter_instagram')}
            </button>
            <button
              className="inspo-filter-btn"
              data-filter="pinterest"
              onClick={(e) => filterInspo('pinterest', e.currentTarget)}
            >
              {t('filter_pinterest')}
            </button>
          </div>
          <span className="inspo-counter" id="inspoCounter">
            {inspirations.length === 1 ? t('counter_one', { count: inspirations.length }) : t('counter_other', { count: inspirations.length })}
          </span>
        </div>
      </div>

      <div className="container">
        <div id="inspoGrid">
          {(
            inspirations as {
              id: number
              name?: string
              image?: string
              source: string
              style_ids?: { name: string }[]
              case_id?: { slug: string } | null
              account_holder?: string
              source_url?: string
            }[]
          ).map((item) => {
            const imgSrc = normalizeImage(item.image)
            const sourceStr = typeof item.source === 'string' ? item.source : ''
            const tagClass = `inspo-tag inspo-tag-${sourceStr}`
            const tagLabel = sourceStr ? sourceStr.charAt(0).toUpperCase() + sourceStr.slice(1) : ''
            const styleMeta = (item.style_ids as { name: string }[] | undefined)
              ?.map((s) => s.name)
              .join(' · ')

            if (item.source === 'vercelsome') {
              const caseSlug = item.case_id?.slug ?? null
              return (
                <Link
                  key={item.id}
                  href={
                    caseSlug
                      ? { pathname: '/etude-de-cas/[slug]', params: { slug: caseSlug } }
                      : '/'
                  }
                  className="inspo-card"
                  data-source="vercelsome"
                >
                  <div className="inspo-card-img">
                    <img src={imgSrc} alt={item.name} loading="lazy" />
                  </div>
                  <div className="inspo-card-body">
                    <span className={tagClass}>{tagLabel}</span>
                    <h3>{item.name}</h3>
                    {styleMeta && <span className="inspo-card-meta">{styleMeta}</span>}
                    <span className="inspo-cta">
                      {t('see_project')} <span className="inspo-cta-arrow">&rarr;</span>
                    </span>
                  </div>
                </Link>
              )
            }

            return (
              <div
                key={item.id}
                className="inspo-card"
                data-source={item.source}
                onClick={(e) => openLightbox(e.currentTarget)}
              >
                <div className="inspo-card-img">
                  <img src={imgSrc} alt={item.name} loading="lazy" />
                </div>
                <div className="inspo-card-body">
                  <span className={tagClass}>{tagLabel}</span>
                  <h3>{item.name}</h3>
                  {item.account_holder && <p>{item.account_holder}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="inspo-cta-band">
        <div className="container inspo-cta-band-inner">
          <div className="inspo-cta-band-text">
            <h2>{t('cta_h2')}</h2>
            <p>{t('cta_p')}</p>
          </div>
          <Link href="/contact" className="inspo-cta-btn">
            {t('cta_btn')} <span>&rarr;</span>
          </Link>
        </div>
      </div>

      <div
        className="inspo-lightbox"
        id="inspoLightbox"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLightbox()
        }}
      >
        <div className="inspo-lightbox-content">
          <button className="inspo-lightbox-close" onClick={closeLightbox}>
            &times;
          </button>
          <img id="lightboxImg" src={undefined} alt="" />
          <div className="inspo-lightbox-body">
            <span className="inspo-tag" id="lightboxTag"></span>
            <p id="lightboxCaption"></p>
          </div>
        </div>
      </div>

      <Assurance />

      <Script src="/js/nav-scroll.js" strategy="afterInteractive" />
    </>
  )
}
