import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { getNavigation } from '@/lib/api/navigation'
import { getProducts } from '@/lib/api/products'
import { Fragment } from 'react'
import { toImageProxyUrl } from '@/lib/image-url'
import '@/css/collection-page.css'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.collections', locale, pathMap: '/collections' })
}

function isLight(hex: string) {
  const h = hex.replace('#', '')
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 230
}

const STATIC_SWATCHES = [
  { num: '01', taglineKey: 'tagline_line',   imageLeft: true,  swatches: ['#FFFFFF','#C0C0C0','#2C2C2C','#D4C5A9'], swatchBorders: [true,false,false,false] },
  { num: '02', taglineKey: 'tagline_satori', imageLeft: false, swatches: ['#C4956A','#8B6914','#D4B896','#F5F0E8'], swatchBorders: [false,false,false,false] },
  { num: '03', taglineKey: 'tagline_vista',  imageLeft: true,  swatches: ['#4A7C59','#E8A87C','#355C7D','#C94C4C'], swatchBorders: [false,false,false,false] },
  { num: '04', taglineKey: 'tagline_lys',    imageLeft: false, swatches: ['#C8AD7F','#E8DDD0','#7D8471','#B5838D'], swatchBorders: [false,false,false,false] },
]

export default async function CollectionsPage() {
  const t = await getTranslations('shop.collections')

  const COMPARE_ROWS = [
    { slug: 'line',   style: t('compare.line.style'),   facades: t('compare.line.facades'),   materiaux: t('compare.line.materiaux'),   prix: t('compare.line.prix'),   esprit: t('compare.line.esprit') },
    { slug: 'satori', style: t('compare.satori.style'), facades: t('compare.satori.facades'), materiaux: t('compare.satori.materiaux'), prix: t('compare.satori.prix'), esprit: t('compare.satori.esprit') },
    { slug: 'vista',  style: t('compare.vista.style'),  facades: t('compare.vista.facades'),  materiaux: t('compare.vista.materiaux'),  prix: t('compare.vista.prix'),  esprit: t('compare.vista.esprit') },
    { slug: 'lys',    style: t('compare.lys.style'),    facades: t('compare.lys.facades'),    materiaux: t('compare.lys.materiaux'),    prix: t('compare.lys.prix'),    esprit: t('compare.lys.esprit') },
  ]
  const tShop = await getTranslations('shop')

  const [navResult, productsResult] = await Promise.all([
    getNavigation(),
    getProducts({ limit: '4', sort: 'popular' }),
  ])
  const collectionsData = navResult.success ? navResult.data.collections : []
  const products = productsResult.success ? productsResult.data.products : []

  return (
    <main id="main-content" tabIndex={-1} className="coll-page">

      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link href="/">{tShop('breadcrumb_home')}</Link> › {t('breadcrumb_current')}
      </div>

      {/* Hero */}
      <section className="coll-hero">
        <div className="container">
          <div className="section-header">
            <h1>{t('h1')}</h1>
            <p style={{ maxWidth: '650px', margin: '1.5rem auto 0' }}>
              {t('intro')}
            </p>
          </div>
        </div>
      </section>

      {/* Collection cards */}
      <section className="coll-cards-section">
        <div className="container">
          {collectionsData.map((c, i) => {
            const s = STATIC_SWATCHES[i] ?? { num: String(i + 1).padStart(2, '0'), taglineKey: null, imageLeft: i % 2 === 0, swatches: [], swatchBorders: [] }
            const tagline = s.taglineKey ? t(s.taglineKey as 'tagline_line' | 'tagline_satori' | 'tagline_vista' | 'tagline_lys') : ''
            const image = toImageProxyUrl(c.image_url)

            const imgCard = (
              <Link key="img" href={`/collection/${c.slug}`} className="collection-card">
                {image && <Image src={image} alt={`${t('card_label')} ${c.name}`} fill style={{ objectFit: 'cover' }} />}
                <div className="card-overlay">
                  <span className="mono">{s.num}</span>
                  <h3>{c.name}</h3>
                </div>
              </Link>
            )

            const bodyCard = (
              <div key="body" className="coll-body">
                <span className="coll-body-label">{t('card_label')}</span>
                <h2>{c.name}</h2>
                {tagline && <p className="coll-body-tagline">{tagline}</p>}
                {c.description && <p className="coll-body-desc">{c.description}</p>}
                <div className="coll-body-btns">
                  <Link href={`/collection/${c.slug}`} className="btn btn-primary">{t('btn_discover', { name: c.name })}</Link>
                  <Link href="/configurer" className="btn btn-secondary">{t('btn_configure', { name: c.name })}</Link>
                </div>
                <div className="coll-body-swatches">
                  {s.swatches.map((color, j) => (
                    <span
                      key={j}
                      className="coll-swatch"
                      style={{ background: color, border: s.swatchBorders?.[j] ? '1px solid #ddd' : '1px solid transparent' }}
                    />
                  ))}
                </div>
              </div>
            )

            return (
              <div key={c.slug} className="grid-2 coll-cards-row">
                {s.imageLeft ? [imgCard, bodyCard] : [bodyCard, imgCard]}
              </div>
            )
          })}
        </div>
      </section>

      {/* Cross-link band */}
      <div className="band">
        <div className="container">
          <h2>{t('band_h2')}</h2>
          <p style={{ color: '#000000', margin: '1rem 0 1.5rem' }}>{t('band_p')}</p>
          <Link href="/espaces" className="btn btn-light">{t('band_cta')}</Link>
        </div>
      </div>

      {/* Popular products */}
      <section className="coll-products">
        <div className="container">
          <div className="section-header">
            <h2>{t('products_h2')}</h2>
          </div>
          <div className="grid-4">
            {products.map(p => {
              const dots = (p.colors ?? []).slice(0, 3)
              const extra = (p.colors?.length ?? 0) - dots.length
              return (
                <div key={p.id} className="product-card">
                  <div className="product-img">
                    <button className="wishlist-btn">♡</button>
                    <Image src={toImageProxyUrl(p.image_url)} alt={p.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div className="product-info">
                    <p className="price">{p.price_ttc.toLocaleString('fr-BE')} €</p>
                    <h4>{p.name}</h4>
                  </div>
                  <div className="product-footer">
                    <div className="color-dots">
                      {dots.map((c, j) => (
                        <span
                          key={j}
                          className="color-dot"
                          style={{ background: c.hex, ...(isLight(c.hex) ? { border: '1px solid #ddd' } : {}) }}
                        />
                      ))}
                      {extra > 0 && <span className="color-more">+{extra}</span>}
                    </div>
                    <Link href="/configurer" className="btn-configure">{tShop('btn_configure')}</Link>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="coll-products-more">
            <Link href="/acheter" className="btn btn-outline" style={{ fontFamily: "'PP Air Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {t('products_cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Espace cross-links */}
      <section className="coll-espaces">
        <div className="container coll-espaces-inner">
          <span className="coll-mono">{t('espaces_mono')}</span>
          <h3>{t('espaces_h3')}</h3>
          <div className="coll-espace-btns">
            {(navResult.success ? navResult.data.spaces : []).map(s => (
              <Link key={s.slug} href={`/espace/${s.slug}`} className="btn btn-outline">{s.name}</Link>
            ))}
          </div>
        </div>
      </section>

      {/* Comparateur */}
      <section className="coll-compare" id="comparateur">
        <div className="container">
          <div className="coll-compare-header">
            <span className="coll-compare-label">{t('compare_label')}</span>
            <h2 className="coll-compare-title">{t('compare_h2')}</h2>
          </div>

          {/* Desktop table */}
          <div className="coll-compare-wrap">
            <table className="coll-compare-table">
              <thead>
                <tr>
                  <th></th>
                  {collectionsData.map(c => (
                    <th key={c.slug}><Link href={`/collection/${c.slug}`}>{c.name}</Link></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="coll-row-alt">
                  <td>{t('compare_row_style')}</td>
                  {COMPARE_ROWS.map(r => <td key={r.slug}>{r.style}</td>)}
                </tr>
                <tr>
                  <td>{t('compare_row_facades')}</td>
                  {COMPARE_ROWS.map(r => <td key={r.slug}>{r.facades}</td>)}
                </tr>
                <tr className="coll-row-alt">
                  <td>{t('compare_row_materiaux')}</td>
                  {COMPARE_ROWS.map(r => <td key={r.slug}>{r.materiaux}</td>)}
                </tr>
                <tr>
                  <td>{t('compare_row_prix')}</td>
                  {COMPARE_ROWS.map(r => <td key={r.slug} className="coll-compare-price">{r.prix}</td>)}
                </tr>
                <tr className="coll-row-alt">
                  <td>{t('compare_row_esprit')}</td>
                  {COMPARE_ROWS.map(r => <td key={r.slug}>{r.esprit}</td>)}
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td></td>
                  {collectionsData.map(c => (
                    <td key={c.slug}><Link href={`/collection/${c.slug}`}>{t('compare_discover', { name: c.name })}</Link></td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="coll-cards-mobile">
            {COMPARE_ROWS.map((row, i) => {
              const c = collectionsData[i]
              if (!c) return null
              return (
                <div key={c.slug} className="coll-mobile-card">
                  <Link href={`/collection/${c.slug}`} className="coll-mobile-card-name">{c.name}</Link>
                  <dl>
                    <div className="coll-mobile-row"><dt>{t('compare_row_style')}</dt><dd>{row.style}</dd></div>
                    <div className="coll-mobile-row"><dt>{t('compare_row_facades')}</dt><dd>{row.facades}</dd></div>
                    <div className="coll-mobile-row"><dt>{t('compare_row_materiaux')}</dt><dd>{row.materiaux}</dd></div>
                    <div className="coll-mobile-row"><dt>{t('compare_row_prix')}</dt><dd>{row.prix}</dd></div>
                    <div className="coll-mobile-row"><dt>{t('compare_row_esprit')}</dt><dd>{row.esprit}</dd></div>
                  </dl>
                  <Link href={`/collection/${c.slug}`} className="coll-mobile-card-link">{t('compare_discover', { name: c.name })}</Link>
                </div>
              )
            })}
          </div>

          {/* Quiz teaser */}
          <div className="coll-quiz-teaser">
            <h3>{t('quiz_h3')}</h3>
            <p>{t('quiz_p')}</p>
            <Link href="/configurer" className="btn btn-primary">{t('quiz_cta')}</Link>
          </div>
        </div>
      </section>

      {/* Bento visual */}
      <section className="coll-bento-section">
        <div className="container">
          <div className="coll-bento">
            <div className="coll-bento-main" style={{ position: 'relative', overflow: 'hidden' }}>
              <Image src="/images/stock/oaksome-v8-ambiance-satori-1.jpg" alt="Collection Satori — l'art du bois" fill style={{ objectFit: 'cover' }} />
              <div className="coll-bento-caption">
                <span className="coll-bento-label">{t('bento_label')}</span>
                <p>{t('bento_caption')}</p>
              </div>
            </div>
            <div className="coll-bento-side">
              <div className="coll-bento-img" style={{ position: 'relative', overflow: 'hidden' }}>
                <Image src="/images/stock/oaksome-v8-ambiance-line-1.jpg" alt="Finitions premium Line" fill style={{ objectFit: 'cover' }} />
              </div>
              <div className="coll-bento-cta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
                </svg>
                <div>
                  <h3>{t('bento_mfg_h3')}</h3>
                  <p>{t('bento_mfg_p')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inspirations */}
      <section className="coll-inspo">
        <div className="container coll-inspo-inner">
          <div>
            <span className="coll-mono" style={{ color: 'var(--teal, #0C524E)' }}>{t('inspo_mono')}</span>
            <h3>{t('inspo_h3')}</h3>
            <p>{t('inspo_p')}</p>
          </div>
          <Link href="/inspirations" className="btn btn-primary">{t('inspo_cta')}</Link>
        </div>
      </section>

      {/* Reassurance */}
      <div className="reassurance-band">
        <div className="container">
          {([
            { statKey: 'trust_custom_stat' as const,   labelKey: 'trust_custom_label' as const },
            { statKey: 'trust_warranty_stat' as const,  labelKey: 'trust_warranty_label' as const },
            { statKey: 'trust_delivery_stat' as const,  labelKey: 'trust_delivery_label' as const },
            { statKey: 'trust_leadtime_stat' as const,  labelKey: 'trust_leadtime_label' as const },
            { statKey: 'trust_design_stat' as const,    labelKey: 'trust_design_label' as const },
          ]).map((item, i, arr) => (
            <Fragment key={item.statKey}>
              <div className="trust-item">
                <span className="trust-stat">{t(item.statKey)}</span>
                <span className="trust-label">{t(item.labelKey)}</span>
              </div>
              {i < arr.length - 1 && <div className="trust-sep" />}
            </Fragment>
          ))}
        </div>
      </div>

    </main>
  )
}
