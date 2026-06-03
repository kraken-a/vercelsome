import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Fragment } from 'react'
import { getNavigation } from '@/lib/api/navigation'
import { getProducts } from '@/lib/api/products'
import { getHomepageInspirations } from '@/lib/api/homepage-inspirations'
import { toImageProxyUrl } from '@/lib/image-url'
import '@/css/espace-slug-page.css'

export const revalidate = 3600

export async function generateStaticParams() {
  const nav = await getNavigation()
  const spaces = nav.success ? nav.data.spaces : []
  return spaces.map(s => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params
  const nav = await getNavigation()
  const spaces = nav.success ? nav.data.spaces : []
  const space = spaces.find(s => s.slug === slug)
  if (!space) return {}
  const t = await getTranslations({ locale, namespace: 'meta.espace' })
  const title = t('title', { name: space.name })
  return {
    title,
    description: t('description', { name: space.name.toLowerCase() }),
    openGraph: { title, images: space.image_url ? [space.image_url] : [] },
  }
}

function isLight(hex: string) {
  const h = hex.replace('#', '')
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 230
}

type Props = { params: Promise<{ slug: string }> }

export default async function EspacePage({ params }: Props) {
  const { slug } = await params

  const t = await getTranslations('shop.espaceDetail')
  const tShop = await getTranslations('shop')

  const DIMS = [
    { title: t('dim_1_title'), text: t('dim_1_text') },
    { title: t('dim_2_title'), text: t('dim_2_text') },
    { title: t('dim_3_title'), text: t('dim_3_text') },
    { title: t('dim_4_title'), text: t('dim_4_text') },
  ]

  const [navResult, productsResult, inspirationsResult] = await Promise.all([
    getNavigation(),
    getProducts({ space: slug, limit: '4' }),
    getHomepageInspirations(),
  ])

  const spaces = navResult.success ? navResult.data.spaces : []
  const allTypes = navResult.success ? navResult.data.types : []
  const allCollections = navResult.success ? navResult.data.collections : []
  const space = spaces.find(s => s.slug === slug)
  if (!space) notFound()

  const categorySlugs = (space as { category_slugs?: string[] }).category_slugs ?? []
  const types = allTypes.filter(type => categorySlugs.includes(type.slug))

  const products = productsResult.success ? productsResult.data.products : []
  const allCombos = inspirationsResult.success ? inspirationsResult.data.combos : []
  const spaceCombos = allCombos.filter(c => c.space_slug === slug)

  const heroImg = toImageProxyUrl(space.image_url) || '/images/stock/oaksome-v8-thumb-chambre.jpg'
  const spaceName = space.name

  return (
    <main id="main-content" tabIndex={-1} className="esp-slug-page">

      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link href="/">{tShop('breadcrumb_home')}</Link> › <Link href="/espaces">{t('breadcrumb_par_piece')}</Link> › {spaceName}
      </div>

      {/* Hero */}
      <div className="esp-slug-hero">
        <Image src={heroImg} alt={spaceName} fill priority style={{ objectFit: 'cover' }} />
        <div className="esp-slug-hero-overlay" />
        <div className="esp-slug-hero-content">
          <h1>{spaceName}.</h1>
          {space.description && <p>{space.description}</p>}
        </div>
      </div>

      {/* Types de meubles */}
      {types.length > 0 && (
      <section className="esp-slug-types">
        <div className="container">
          <div className="esp-slug-types-header">
            <h2>{t('types_h2')}</h2>
            <p>{t('types_p')}</p>
          </div>
          <div className="esp-slug-types-grid">
            {types.map(type => (
              <Link key={type.slug} href={`/gamme/${type.slug}`} className="esp-slug-type-card">
                <div className="esp-slug-type-card-img" style={{ position: 'relative', overflow: 'hidden' }}>
                  <Image src={toImageProxyUrl(type.image_url)} alt={type.name} fill style={{ objectFit: 'cover' }} />
                </div>
                <div className="esp-slug-type-card-body">
                  <span className="esp-slug-type-card-label">{t('types_card_label')}</span>
                  <h3>{type.name}</h3>
                  {type.category_desc && <p>{type.category_desc}</p>}
                  <span className="esp-slug-type-discover">{t('types_card_discover')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Collections — ambiances par espace */}
      {spaceCombos.length > 0 && (
        <section className="esp-slug-collections">
          <div className="container">
            <div className="section-header">
              <h2>
                {spaceCombos.length > 1
                  ? t('collections_h2_plural', { name: spaceName, count: spaceCombos.length })
                  : t('collections_h2', { name: spaceName, count: spaceCombos.length })
                }
              </h2>
              <p>{t('collections_p')}</p>
            </div>
            <div className="grid-4">
              {spaceCombos.map((c) => {
                type Facade = { id: number; name: string }
                const col = allCollections.find(col => col.slug === c.style_slug)
                const colFacades: Facade[] = (col as { facades?: Facade[] } | undefined)?.facades ?? []
                const facadesLabel = colFacades.length > 0
                  ? t('facades_prefix') + colFacades.map(f => f.name).join(' · ')
                  : ''
                return (
                  <Link key={c.id} href={`/collection/${c.style_slug}`} className="collection-card">
                    <Image src={toImageProxyUrl(c.image_url)} alt={`${spaceName} ${c.style_name}`} fill style={{ objectFit: 'cover' }} />
                    <div className="card-overlay">
                      <span className="mono" style={{ color: 'var(--light-gray, #C0C0C0)' }}>{t('collections_card_in', { name: spaceName.toUpperCase() })}</span>
                      <h3 style={{ fontSize: '1.3rem' }}>{c.style_name}</h3>
                      {facadesLabel && <p style={{ fontSize: '0.8rem', color: '#fff' }}>{facadesLabel}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Dimensions */}
      <section className="esp-slug-dims-section">
        <div className="container esp-slug-dims">
          <h2>{t('dims_h2')}</h2>
          <div className="esp-slug-dims-grid">
            {DIMS.map(d => (
              <div key={d.title}>
                <h4>{d.title}</h4>
                <p>{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Band CTA */}
      <div className="band">
        <div className="container">
          <h2>{t('band_h2')}</h2>
          <p style={{ color: '#000', margin: '1rem 0 1.5rem' }}>
            {t('band_p')}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/configurer" className="btn btn-light">{t('band_cta_configure')}</Link>
            <Link href="/acheter" className="btn btn-outline-white">{t('band_cta_see')}</Link>
          </div>
        </div>
      </div>

      {/* Products */}
      {products.length > 0 && (
      <section className="esp-slug-products">
        <div className="container">
          <div className="section-header">
            <h2>{t('products_h2', { name: spaceName.toLowerCase() })}</h2>
            <p>{t('products_p')}</p>
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
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href={`/acheter?filters=${slug}`} className="btn btn-outline">{t('products_cta', { name: spaceName.toLowerCase() })}</Link>
          </div>
        </div>
      </section>
      )}

      {/* Inspirations */}
      <section className="esp-slug-inspo">
        <div className="container esp-slug-inspo-inner">
          <div>
            <span className="mono" style={{ color: 'var(--teal, #0C524E)' }}>{t('inspo_mono')}</span>
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
