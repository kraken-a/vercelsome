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
import { getComboConfig } from '@/lib/api/combo-config'
import { toImageProxyUrl } from '@/lib/image-url'
import { ProductCard } from '@/components/cards/product-card'
import { HeroComboSpace } from './_components/hero-combo-space'
import '@/css/espace-slug-page.css'

export const dynamic = 'force-dynamic'

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


type Props = { params: Promise<{ slug: string; locale: string }> }

export default async function EspacePage({ params }: Props) {
  const { slug, locale } = await params

  const t = await getTranslations('shop.espaceDetail')
  const tShop = await getTranslations('shop')
  const tNl = await getTranslations('home.newsletter')

  const DIMS = [
    { title: t('dim_1_title'), text: t('dim_1_text') },
    { title: t('dim_2_title'), text: t('dim_2_text') },
    { title: t('dim_3_title'), text: t('dim_3_text') },
    { title: t('dim_4_title'), text: t('dim_4_text') },
  ]

  const [navResult, productsResult, inspirationsResult, comboConfig] = await Promise.all([
    getNavigation(locale),
    getProducts({ space: slug, limit: '4', lang: locale }),
    getHomepageInspirations(locale),
    getComboConfig(locale),
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
  const typeNameBySlug = Object.fromEntries(allTypes.map(t => [t.slug, t.name]))
  const collectionNameBySlug = Object.fromEntries(allCollections.map(c => [c.slug, c.name]))

  const heroImg = toImageProxyUrl(space.image_url) || '/images/stock/oaksome-v8-thumb-chambre.jpg'
  const spaceName = space.name

  const comboData = comboConfig.success && comboConfig.data ? comboConfig.data : null
  const spaceBanners = comboData ? comboData.banners.filter(b => b.space?.id === space.id) : []
  const spaceComboConfig = comboData && spaceBanners.length > 0 ? { ...comboData, banners: spaceBanners } : null
  const allSpaces = comboData?.banners
    ? Array.from(new Map(comboData.banners.filter(b => b.space).map(b => [b.space!.id, b.space!])).values())
    : []

  return (
    <main id="main-content" tabIndex={-1} className={`esp-slug-page${spaceComboConfig ? ' esp-slug-page--combo' : ''}`}>

      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link href="/">{tShop('breadcrumb_home')}</Link> › <Link href="/espaces">{t('breadcrumb_par_piece')}</Link> › <span className="breadcrumb-current">{spaceName}</span>
      </div>

      {/* Hero */}
      {spaceComboConfig ? (
        <HeroComboSpace
          config={spaceComboConfig}
          space={{ id: space.id, name: spaceName, slug }}
          allSpaces={allSpaces}
        />
      ) : (
        <div className="esp-slug-hero">
          <Image src={heroImg} alt={spaceName} fill priority style={{ objectFit: 'cover' }} />
          <div className="esp-slug-hero-overlay" />
          <div className="esp-slug-hero-content">
            <h1>{spaceName}.</h1>
            {space.description && <p>{space.description}</p>}
          </div>
        </div>
      )}

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
                  <Image src={toImageProxyUrl(type.image_url) || '/images/stock/oaksome-v8-hero-biblio.jpg'} alt={type.name} fill style={{ objectFit: 'cover' }} />
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

      {/* Spec / détail signature */}
      <section className="esp-slug-spec">
        <div className="container">
          <div className="esp-slug-spec-intro">
            <h2>{t('spec_h2')}</h2>
            <p>{t('spec_p')}</p>
          </div>
          <div className="esp-slug-spec-grid">
            {([
              { src: '/images/dressing/int-tiroirs.jpg', alt: t('spec_1_title'), title: t('spec_1_title'), desc: t('spec_1_desc') },
              { src: '/images/dressing/int-bijoux.jpg',  alt: t('spec_2_title'), title: t('spec_2_title'), desc: t('spec_2_desc') },
              { src: '/images/dressing/int-miroir.jpg',  alt: t('spec_3_title'), title: t('spec_3_title'), desc: t('spec_3_desc') },
              { src: '/images/biblio/int-eclairage.jpg', alt: t('spec_4_title'), title: t('spec_4_title'), desc: t('spec_4_desc') },
              { src: '/images/pont/detail-hinge.jpg',    alt: t('spec_5_title'), title: t('spec_5_title'), desc: t('spec_5_desc') },
              { src: '/images/dressing/int-tringle.jpg', alt: t('spec_6_title'), title: t('spec_6_title'), desc: t('spec_6_desc') },
            ]).map(card => (
              <div key={card.src} className="esp-slug-spec-card">
                <Image src={card.src} alt={card.alt} width={600} height={600} style={{ objectFit: 'cover' }} loading="lazy" />
                <div className="esp-slug-spec-card-body">
                  <h4>{card.title}</h4>
                  <p>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            <div className="esp-slug-collections-grid">
              {spaceCombos.map((c) => {
                type Facade = { id: number; name: string }
                const col = allCollections.find(col => col.slug === c.style_slug)
                const colFacades: Facade[] = (col as { facades?: Facade[] } | undefined)?.facades ?? []
                const facadesLabel = colFacades.length > 0
                  ? t('facades_prefix') + colFacades.map(f => f.name).join(' · ')
                  : ''
                return (
                  <Link key={c.id} href={`/collection/${c.style_slug}`} className="esp-slug-coll-card">
                    <Image src={toImageProxyUrl(c.image_url)} alt={`${spaceName} ${c.style_name}`} width={600} height={750} style={{ objectFit: 'cover', width: '100%', height: 'auto' }} loading="lazy" />
                    <div className="esp-slug-coll-cap">
                      <span className="esp-slug-coll-cap-eyebrow">{t('collections_card_in', { name: spaceName.toUpperCase() })}</span>
                      <h3>{c.style_name}</h3>
                      {facadesLabel && <p>{facadesLabel}</p>}
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
          <p style={{ color: '#000', margin: '1rem auto 1.5rem' }}>{t('band_p')}</p>
          <div className="cta-discover-double">
            <Link href={`/acheter?filters=${slug}`} className="cta-label">{t('band_cta_see')}</Link>
            <Link href="/configurer" className="cta-action">{t('band_cta_configure')} <span className="cta-arrow">→</span></Link>
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
              const badge = p.is_new
                ? { key: 'new', label: 'NOUVEAUTÉ' }
                : p.is_premium
                  ? { key: 'premium', label: 'PREMIUM' }
                  : p.is_basic
                    ? { key: 'basic', label: 'BASIQUES' }
                    : null
              const dimParts = [
                (p.dim_width ?? 0) > 0 ? `L ${p.dim_width}` : null,
                (p.dim_height ?? 0) > 0 ? `H ${p.dim_height}` : null,
                (p.dim_length ?? 0) > 0 ? `P ${p.dim_length}` : null,
              ].filter(Boolean)
              const dimensions = dimParts.length > 0 ? `${dimParts.join(' × ')} cm` : null
              const typeName = p.type_slug ? typeNameBySlug[p.type_slug] : null
              const collName = p.collection_slug ? collectionNameBySlug[p.collection_slug] : null
              const tags = [typeName, spaceName, collName].filter(Boolean).map(s => s!.toUpperCase())
              return (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  imageUrl={p.image_url}
                  priceTtc={p.price_ttc}
                  badge={badge}
                  dimensions={dimensions}
                  tags={tags}
                  href={`/produit/${p.id}`}
                  configureHref={`/configurer?template_id=${p.id}`}
                />
              )
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <div className="cta-discover-double">
              <Link href={`/acheter?filters=${slug}`} className="cta-label">{t('products_cta_label')}</Link>
              <Link href={`/acheter?filters=${slug}`} className="cta-action">{t('products_cta', { name: spaceName.toUpperCase() })} <span className="cta-arrow">→</span></Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Inspirations — masqué (absent du prototype espace singulier) */}
      {/* <section className="esp-slug-inspo">
        <div className="container esp-slug-inspo-inner">
          <div>
            <span className="mono" style={{ color: 'var(--teal, #0C524E)' }}>{t('inspo_mono')}</span>
            <h3>{t('inspo_h3')}</h3>
            <p>{t('inspo_p')}</p>
          </div>
          <Link href="/inspirations" className="btn btn-primary">{t('inspo_cta')}</Link>
        </div>
      </section> */}

      {/* Newsletter — même composant que homepage */}
      <section className="newsletter-stoemp" aria-labelledby="esp-ns-title">
        <div className="ns-inner">
          <h2 id="esp-ns-title" className="ns-title">
            {tNl('title_line_1')}<br />{tNl('title_line_2')}
          </h2>
          <form className="ns-form" action="#" method="post" noValidate>
            <label className="ns-input-wrap" htmlFor="esp-ns-email">
              <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>{tNl('email_label')}</span>
              <input id="esp-ns-email" className="ns-input" type="email" name="email" placeholder={tNl('email_placeholder')} autoComplete="email" required />
            </label>
            <button className="ns-submit" type="submit" aria-label={tNl('submit_label')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>
          <div className="ns-legend">
            <p className="ns-consent">{tNl('consent')}</p>
          </div>
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
