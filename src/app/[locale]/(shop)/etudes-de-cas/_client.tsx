'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import './etudes-de-cas.css'
import Assurance from '@/components/assurance/assurance'

type OdooCase = {
  id: number
  name: string
  slug: string
  image: string | false
  style_ids: { id: number; name: string }[]
  space_ids: { id: number; name: string }[]
  city: string | false
  min_budget: number | false
  max_budget: number | false
  currency_id: [number, string] | false
  delay_weeks: number | false
}

function toImg(b64: string | false) {
  if (!b64) return '/images/stock/oaksome-v8-featured-vista.jpg'
  if (b64.startsWith('http') || b64.startsWith('data:')) return b64
  return `data:image/jpeg;base64,${b64}`
}

export default function EtudesDeCasPage() {
  const t = useTranslations('shop.etudes')
  const shopT = useTranslations('shop')
  const [cases, setCases] = useState<OdooCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/odoo/case')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setCases(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main>
      <div className="breadcrumb container">
        <Link href="/">{shopT('breadcrumb_home')}</Link> &rsaquo; {t('breadcrumb_current')}
      </div>

      <section style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="cases-hero">
            <h1>{t('h1')}</h1>
            <p>{t('intro')}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          {loading ? (
            <div className="projects-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="project-card" style={{ minHeight: 320, background: '#f0efea' }} />
              ))}
            </div>
          ) : cases.length > 0 ? (
            <div className="projects-grid">
              {cases.map((c, i) => {
                const style = c.style_ids[0]?.name
                const space = c.space_ids[0]?.name
                const subtitle = [style, space, c.city].filter(Boolean).join(' · ')
                return (
                  <Link key={c.id} href={{ pathname: '/etude-de-cas/[slug]', params: { slug: c.slug } }} className="project-card">
                    <div className="project-card-img">
                      <img src={toImg(c.image)} alt={c.name} loading={i === 0 ? 'eager' : 'lazy'} />
                    </div>
                    <div className="project-card-body">
                      <span className="mono">{t('card_mono')} {String(i + 1).padStart(2, '0')}</span>
                      <h3>{c.name}</h3>
                      {subtitle && <p className="project-card-subtitle">{subtitle}</p>}
                      <span className="project-card-cta">{t('card_cta')} &rarr;</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="coming-soon">
              <span className="mono">{t('empty_label')}</span>
              <h3>{t('empty_h3')}</h3>
              <p>{t('empty_p')}</p>
            </div>
          )}
        </div>
      </section>

      <section style={{ background: '#000', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', minHeight: 400 }}>
          <div style={{ position: 'relative' }}>
            <img
              src="/images/cases/case-line-hero.jpg"
              alt={t('cta_hero_alt')}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 48px' }}>
            <h2 style={{ fontSize: 'clamp(25px, 3vw, 39px)', color: '#F6F5F0', letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 32px' }}>
              {t('cta_title')}
            </h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link
                href="/configurer"
                style={{ display: 'inline-block', padding: '14px 32px', background: '#F6F5F0', color: '#000', fontFamily: "'PP Air Mono', monospace", fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}
              >
                {t('cta_configure')} →
              </Link>
              <Link
                href="/contact"
                style={{ display: 'inline-block', padding: '14px 32px', border: '1px solid rgba(246,245,240,0.3)', color: '#F6F5F0', fontFamily: "'PP Air Mono', monospace", fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}
              >
                {t('cta_contact')} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Assurance />
    </main>
  )
}
