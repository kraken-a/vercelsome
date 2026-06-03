'use client'

import '../case.css'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

type OdooCase = {
  id: number
  name: string
  slug: string
  image: string | false
  gallery_image_ids: { id: number; name: string; image: string | false }[]
  description: string | false
  style_ids: { id: number; name: string }[]
  space_ids: { id: number; name: string }[]
  city: string | false
  min_budget: number | false
  max_budget: number | false
  currency_id: [number, string] | false
  dim_width: number | false
  dim_height: number | false
  dim_depth: number | false
  delay_weeks: number | false
}

function toImg(b64: string | false) {
  if (!b64) return ''
  if (b64.startsWith('http') || b64.startsWith('data:')) return b64
  return `data:image/jpeg;base64,${b64}`
}

function currencyLocale(locale: string) {
  return locale === 'nl' ? 'nl-BE' : locale === 'en' ? 'en-BE' : 'fr-BE'
}

function buildSpecs(c: OdooCase, labels: Record<string, string>): Record<string, string> {
  const specs: Record<string, string> = {}
  if (c.style_ids[0]?.name) specs[labels.collection] = c.style_ids[0].name
  if (c.space_ids[0]?.name) specs[labels.room] = c.space_ids[0].name
  if (c.city) specs[labels.city] = c.city
  if (c.delay_weeks) specs[labels.delivery] = labels.deliveryValue.replace('{weeks}', String(c.delay_weeks))
  return specs
}

function buildDetailSpecs(c: OdooCase, labels: Record<string, string>, locale: string): Record<string, string> {
  const specs: Record<string, string> = {}
  if (c.dim_width && c.dim_height && c.dim_depth)
    specs[labels.dimensions] = `${c.dim_width} × ${c.dim_height} × ${c.dim_depth}m`
  if (c.style_ids[0]?.name) specs[labels.collection] = c.style_ids[0].name
  if (c.min_budget && c.max_budget) {
    const currency = c.currency_id ? c.currency_id[1] : ''
    specs[labels.budget] = `${c.min_budget.toLocaleString(currencyLocale(locale))} – ${c.max_budget.toLocaleString(currencyLocale(locale))} ${currency}`.trim()
  }
  if (c.delay_weeks) specs[labels.delay] = labels.deliveryValue.replace('{weeks}', String(c.delay_weeks))
  return specs
}

export default function EtudeDeCasPage() {
  const params = useParams()
  const slug = params?.slug as string
  const locale = useLocale()
  const t = useTranslations('shop.caseDetail')
  const shopT = useTranslations('shop')

  const [cases, setCases] = useState<OdooCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/odoo/case')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCases(data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>{t('loading')}</div>
  }

  const project = cases.find(c => c.slug === slug)
  const others = cases.filter(c => c.slug !== slug)

  if (!project) {
    return <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>{t('not_found')}</div>
  }

  const hero = toImg(project.image)
  const extra = [project.style_ids[0]?.name, project.space_ids[0]?.name, project.city].filter(Boolean).join(' · ')
  const specLabels = {
    collection: t('spec_collection'),
    room: t('spec_room'),
    city: t('spec_city'),
    delivery: t('spec_delivery'),
    deliveryValue: t('spec_delivery_value', { weeks: '{weeks}' }),
    dimensions: t('spec_dimensions'),
    budget: t('spec_budget'),
    delay: t('spec_delay'),
  }
  const specs = buildSpecs(project, specLabels)
  const detailSpecs = buildDetailSpecs(project, specLabels, locale)
  const gallery = project.gallery_image_ids.map(g => toImg(g.image)).filter(Boolean)
  const detailImg = gallery[0] || hero

  return (
    <>
      <div className="breadcrumb container">
        <Link href="/">{shopT('breadcrumb_home')}</Link> &rsaquo; <Link href="/etudes-de-cas">{t('breadcrumb_cases')}</Link> &rsaquo; <span>{project.name}</span>
      </div>

      <div className="cs-hero">
        <img src={hero} alt={project.name} loading="eager" />
      </div>

      <div className="cs-header">
        <span className="cs-label">{t('label_oaksome')}</span>
        <h1>{project.name}</h1>
        <p className="cs-subtitle">{t('collection_prefix')} {extra}</p>
        <div className="cs-specs">
          {Object.entries(specs).map(([key, value]) => (
            <div key={key}>
              <span className="cs-spec-label">{key}</span>
              <span className="cs-spec-value">{value}</span>

            </div>
          ))}
          {/*  <div>
            <span className="cs-spec-label">LIVRAISON</span>
            <span className="cs-spec-value">8 semaines</span>
          </div> */}
        </div>
      </div>

      {project.description && (
        <div className="cs-story">
          <div className="cs-story-block">
            <div className="cs-story-text">
              <h2>{t('story_brief')}</h2>
              <p dangerouslySetInnerHTML={{ __html: project.description }} />
            </div>
            <div className="cs-story-img">
              <img src={hero} alt={t('brief_img_alt', { name: project.name })} />
            </div>
          </div>
        </div>
      )}

      {gallery.length > 0 && (
        <div className="cs-story">
          <div className="cs-story-block reversed">
            <div className="cs-story-img">
              <img src={detailImg} alt={t('detail_img_alt', { name: project.name })} />
            </div>
            <div className="cs-story-text">
              <h2>{t('story_solution')}</h2>
                            {/*TODO : make it dynamic per case (new field)*/}

              <p>{t('story_solution_placeholder')}</p>
            </div>
          </div>
        </div>
      )}

      {gallery.length > 0 && (
        <div className="cs-gallery">
          <div className="cs-gallery-grid">
            {gallery.map((src, i) => (
              <img key={i} src={src} alt={t('gallery_alt', { name: project.name, index: i + 1 })} loading="lazy" />
            ))}
          </div>
        </div>
      )}

      {Object.keys(detailSpecs).length > 0 && (
        <div className="cs-detail-specs">
          <div className="cs-detail-specs-inner">
            {Object.entries(detailSpecs).map(([key, value]) => (
              <div key={key} className="cs-detail-item">
                <span className="cs-detail-label">{key}</span>
                <span className="cs-detail-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <section style={{ background: '#000', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', minHeight: '400px' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={hero}
              alt="Projet Oaksome"
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '64px 48px' }}>
            <span style={{ fontFamily: "'PP Air Mono',monospace", fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(246,245,240,0.4)', display: 'block', marginBottom: '24px' }}>
              {t('cta_mono')}
            </span>
            <h2 style={{ fontSize: 'clamp(25px, 3vw, 39px)', color: '#F6F5F0', letterSpacing: '-0.02em', lineHeight: '1.2', margin: '0 0 32px' }}>
              {t('cta_h2')}
            </h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link
                href="/configurer"
                style={{ display: 'inline-block', padding: '14px 32px', background: '#F6F5F0', color: '#000', fontFamily: "'PP Air Mono',monospace", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}
              >
                {t('cta_configure')}
              </Link>
              <Link
                href="/contact"
                style={{ display: 'inline-block', padding: '14px 32px', border: '1px solid rgba(246,245,240,0.3)', color: '#F6F5F0', fontFamily: "'PP Air Mono',monospace", fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', textDecoration: 'none' }}
              >
                {t('cta_contact')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <div className="cs-others">
          <h3>{t('others_title')}</h3>
          <div className="cs-others-grid">
            {others.map(p => (
              <Link key={p.id} href={{ pathname: '/etude-de-cas/[slug]', params: { slug: p.slug } }} className="cs-card">
                <div className="cs-card-img">
                  <img src={toImg(p.image)} alt={p.name} loading="lazy" />
                </div>
                <div className="cs-card-body">
                  <span className="cs-label">{t('label_oaksome')}</span>
                  <h4>{p.name}</h4>
                  <p>{[p.style_ids[0]?.name, p.space_ids[0]?.name, p.city].filter(Boolean).join(' · ')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="reassurance-band">
        <div className="container">
          <div className="trust-item">
            <span className="trust-stat">{t('trust_custom_stat')}</span>
            <span className="trust-label">{t('trust_custom_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">{t('trust_warranty_stat')}</span>
            <span className="trust-label">{t('trust_warranty_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">{t('trust_delivery_stat')}</span>
            <span className="trust-label">{t('trust_delivery_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">{t('trust_leadtime_stat')}</span>
            <span className="trust-label">{t('trust_leadtime_label')}</span>
          </div>
          <div className="trust-sep"></div>
          <div className="trust-item">
            <span className="trust-stat">{t('trust_design_stat')}</span>
            <span className="trust-label">{t('trust_design_label')}</span>
          </div>
        </div>
      </div>

      <Script src="/js/nav-scroll.js" strategy="afterInteractive" />
    </>
  )
}
