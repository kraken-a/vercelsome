import React from 'react'
import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getNavigation } from '@/lib/api/navigation'
import { getProducts } from '@/lib/api/products'
import { getComboConfig } from '@/lib/api/combo-config'
import { getCollection } from '@/lib/api/collections'
import { toImageProxyUrl } from '@/lib/image-url'
import { buildDataLayerPushScript } from '@/features/tracking/inline-script'
import { ProductCard } from '@/components/cards/product-card'
import { HeroComboCollection } from './_components/hero-combo-collection'
import { StylerTeaser } from './_components/styler-teaser'
import { TestimonialsSlider } from './_components/testimonials-slider'
import '@/css/collection-slug-page.css'

export const dynamic = 'force-dynamic'

// Moodboard slots match prototype exactly: collection-{slug}.html moodboard-strip order
const COLLECTION_IMAGES: Record<string, { moodboard: [string, string, string, string]; dressing: string }> = {
  line:   { moodboard: ['/images/stock/oaksome-v8-ambiance-line-1.jpg',   '/images/stock/oaksome-v8-ambiance-line-2.jpg',   '/images/stock/oaksome-v8-thumb-line.jpg',   '/images/stock/oaksome-v8-ambiance-line-1.jpg'],   dressing: '/images/stock/oaksome-v8-dressing-line.jpg' },
  lys:    { moodboard: ['/images/stock/oaksome-v8-ambiance-lys-1.jpg',    '/images/stock/oaksome-v8-ambiance-lys-2.jpg',    '/images/stock/oaksome-v8-thumb-lys.jpg',    '/images/stock/oaksome-v8-ambiance-lys-1.jpg'],    dressing: '/images/stock/oaksome-v8-dressing-lys.jpg' },
  satori: { moodboard: ['/images/stock/oaksome-v8-ambiance-satori-1.jpg', '/images/stock/oaksome-v8-ambiance-satori-2.jpg', '/images/stock/oaksome-v8-ambiance-satori-3.jpg', '/images/stock/oaksome-v8-thumb-satori.jpg'], dressing: '/images/stock/oaksome-v8-dressing-satori.jpg' },
  vista:  { moodboard: ['/images/stock/oaksome-v8-ambiance-vista-1.jpg',  '/images/stock/oaksome-v8-thumb-ensemble-mural.jpg', '/images/stock/oaksome-v8-thumb-vista.jpg', '/images/stock/oaksome-v8-ambiance-vista-1.jpg'], dressing: '/images/stock/oaksome-v8-dressing-vista.jpg' },
}
const DEFAULT_COLLECTION_IMAGES = COLLECTION_IMAGES.line

export async function generateStaticParams() {
  const nav = await getNavigation()
  const collections = nav.success ? nav.data.collections : []
  return collections.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params
  return getPageMetadata({
    namespace: 'meta.collection_slug',
    locale,
    pathMap: { fr: '/collection/[slug]', nl: '/collectie/[slug]', en: '/collection/[slug]' },
    params: { slug },
    tParams: { slug },
  })
}

function isLight(hex: string) {
  const h = hex.replace('#', '')
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 230
}

type Props = { params: Promise<{ slug: string; locale: string }> }

const FACADE_SAMPLES = [
  { bg: 'linear-gradient(135deg,#FAFAFA,#F0EFED)' },
  { bg: 'linear-gradient(135deg,#C8C6C1,#B8B6B0)' },
  { bg: 'linear-gradient(135deg,#D4B896,#C0A47C)' },
  { bg: 'linear-gradient(135deg,#2C2C2C,#1A1A1A)' },
]

export default async function CollectionPage({ params }: Props) {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'shop.collection' })
  const shopT = await getTranslations({ locale, namespace: 'shop' })


  const [navResult, productsResult, comboConfig, collectionDetail, testimonialsResult] = await Promise.all([
    getNavigation(locale),
    getProducts({ collection: slug, limit: '4', sort: 'popular', lang: locale }),
    getComboConfig(locale),
    getCollection(slug, locale),
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/odoo/testimonials?collection=${slug}&lang=${locale}`, { next: { revalidate: 60, tags: ['testimonials'] } })
      .then(r => r.json()).then(d => Array.isArray(d) ? d : []).catch(() => []),
  ])

  const collections = navResult.success ? navResult.data.collections : []
  const allTypes = navResult.success ? navResult.data.types : []
  const allSpaces = navResult.success ? navResult.data.spaces : []
  const collection = collections.find(c => c.slug === slug)
  if (!collection) notFound()

  const categorySlugs = (collection as { category_slugs?: string[] }).category_slugs ?? []
  const types = allTypes.filter(t => categorySlugs.includes(t.slug))

  type Facade = { id: number; name: string; description: string; image_url: string }
  const facades: ReadonlyArray<Facade> = collection.facades ?? []
  const facadeCount = facades.length
  const typeCount = types.length
  const finitionCount = collection.finition_ids?.length ?? 0

  const spaceSlugs = collection.space_slugs ?? []
  const spaces = allSpaces.filter(s => spaceSlugs.includes(s.slug))

  const comboData = comboConfig.success && comboConfig.data ? comboConfig.data : null
  const collectionBanners = comboData?.banners ? comboData.banners.filter(b => b.style?.slug === slug) : []
  const collectionComboConfig = comboData && collectionBanners.length > 0 ? { ...comboData, banners: collectionBanners } : null
  const allStyles = comboData?.banners
    ? Array.from(new Map(comboData.banners.filter(b => b.style).map(b => [b.style!.slug, b.style!])).values())
    : []

  const products = productsResult.success ? productsResult.data.products : []
  const heroImg = toImageProxyUrl(collection.image_url) || '/images/stock/oaksome-v8-thumb-line.jpg'
  const collName = collection.name
  const collImgs = COLLECTION_IMAGES[slug] ?? DEFAULT_COLLECTION_IMAGES
  const rawImages = collectionDetail.success ? (collectionDetail.data.images ?? []) : []
  const galleryImages = rawImages.length > 0
    ? rawImages.slice().sort((a, b) => a.sequence - b.sequence)
    : null

  const typeNameBySlug = Object.fromEntries(allTypes.map(t => [t.slug, t.name]))
  const spaceNameBySlug = Object.fromEntries(allSpaces.map(s => [s.slug, s.name]))

  return (
    <main className={`coll-slug-page${collectionComboConfig ? ' coll-slug-page--combo' : ''}`}>

      {/* view_collection tracking */}
      <script dangerouslySetInnerHTML={{ __html: buildDataLayerPushScript({ event: 'view_collection', collection_name: collName, collection_slug: slug }) }} />

      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link href="/">{shopT('breadcrumb_home')}</Link> › <Link href="/collections">{t('breadcrumb_collections')}</Link> › <span className="breadcrumb-current">{collName}</span>
      </div>

      {/* Hero */}
      {collectionComboConfig ? (
        <HeroComboCollection
          config={collectionComboConfig}
          style={{ name: collName, slug }}
          allStyles={allStyles}
        />
      ) : (
        <div className="coll-slug-hero">
          <Image src={heroImg} alt={`Collection ${collName}`} fill priority style={{ objectFit: 'cover' }} />
          <div className="coll-slug-hero-overlay" />
          <div className="coll-slug-hero-content">
            <h1>{collName}</h1>
            {collection.description
              ? <p>{collection.description}</p>
              : <p>{t('hero_default_p')}</p>
            }
            <p className="coll-slug-hero-price mono">{t('hero_price_from')}</p>
            <div className="coll-slug-hero-ctas">
              <Link href="/acheter" className="btn btn-light">{t('hero_cta_discover')}</Link>
              <Link href="/configurer" className="btn btn-outline" style={{ color: 'white', borderColor: '#000' }}>{t('hero_cta_configure')}</Link>
            </div>
          </div>
        </div>
      )}

      {/* Moodboard strip — dynamique si galerie disponible */}
      {galleryImages && (
        <div className="moodboard-strip">
          {galleryImages.slice(0, 4).map(img => (
            <Image key={img.url} src={toImageProxyUrl(img.url)} alt={img.caption ?? img.name ?? collName} width={800} height={600} style={{ objectFit: 'cover' }} />
          ))}
        </div>
      )}

      {/* Description + stats */}
      <section className="coll-slug-desc-section">
        <div className="container coll-slug-desc">
          <h2>{t('desc_h2')}</h2>
          <p>{t('desc_p1')}</p>
          <p>{t('desc_p2_facades', { count: facadeCount, suffix: facadeCount > 1 ? 's' : '', name: collName })}</p>
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-number">{facadeCount}</div>
              <div className="stat-label">{t('stat_facades')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{typeCount}</div>
              <div className="stat-label">{t('stat_types')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{finitionCount}</div>
              <div className="stat-label">{t('stat_finitions')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{t('stat_combos_value')}</div>
              <div className="stat-label">{t('stat_combos')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Facade models */}
      {facades.length > 0 && (
      <section className="coll-slug-facades">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'left' }}>
            <h2>{facades.length > 1 ? t('facades_h2_plural', { count: facades.length }) : t('facades_h2_single')}</h2>
            {facades.length >= 2 && (
              <p>{t('facades_subtitle', { names: facades.map(f => f.name).join(locale === 'nl' ? ' en ' : ' et ') })}</p>
            )}
          </div>
          <div className="facade-showcase">
            {facades.map(f => (
              <div key={f.id} className="facade-showcase-item">
                <div className="facade-showcase-preview">
                  <Image src={toImageProxyUrl(f.image_url)} alt={f.name} fill style={{ objectFit: 'cover' }} />
                </div>
                <div className="facade-showcase-info">
                  <h3>{f.name}</h3>
                  {f.description && <p>{f.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Mini Styler — interactive client teaser */}
      <section className="coll-slug-styler">
        <StylerTeaser
          collName={collName}
          previewSrc={galleryImages?.[0] ? toImageProxyUrl(galleryImages[0].url) : (toImageProxyUrl(collection.image_url) || collImgs.dressing)}
          ctaHref="/configurer"
          labels={{
            price:    t('styler_price_from'),
            desc:     t('styler_desc'),
            facade:   t('styler_facade_label'),
            extColor: t('styler_ext_color_label'),
            intColor: t('styler_int_color_label'),
            handle:   t('styler_handle_label'),
            cta:      t('styler_cta'),
          }}
        />
      </section>

      {/* Furniture types */}
      {types.length > 0 && (
      <section className="coll-slug-types">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'left' }}>
            <h2>{t('types_h2', { count: types.length, suffix: types.length > 1 ? 's' : '' })}</h2>
            <p style={{ marginLeft: 0, maxWidth: '600px' }}>{t('types_p', { name: collName })}</p>
          </div>
          <div className="furniture-grid">
            {types.map(type => (
              <Link key={type.slug} href={{ pathname: '/gamme/[slug]', params: { slug: type.slug } }} className="furniture-card">
                <div className="furniture-card-img" style={{ position: 'relative', overflow: 'hidden' }}>
                  <Image src={toImageProxyUrl(type.image_url)} alt={type.name} fill style={{ objectFit: 'cover' }} />
                </div>
                <div className="furniture-card-body">
                  <h4>{type.name}</h4>
                  <p>{t('types_price_from')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Ambiance gallery */}
      <section className="coll-slug-ambiance">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'left' }}>
            <h2>{t('ambiance_h2', { name: collName })}</h2>
            <p style={{ marginLeft: 0 }}>{t('ambiance_p', { name: collName })}</p>
          </div>
          {galleryImages && (
            <>
              <div className="ambiance-gallery">
                {galleryImages.slice(0, 3).map((img, i) => (
                  <div key={img.url} className={i === 0 ? 'ambiance-tall' : ''} style={{ position: 'relative', overflow: 'hidden' }}>
                    <Image src={toImageProxyUrl(img.url)} alt={img.caption ?? img.name ?? collName} fill style={{ objectFit: 'cover' }} loading="lazy" />
                  </div>
                ))}
              </div>
              {galleryImages.length > 3 && (
                <div className="gallery-scroll" style={{ marginTop: '2rem' }}>
                  {galleryImages.slice(3).map(img => (
                    <Image
                      key={img.url}
                      src={toImageProxyUrl(img.url)}
                      alt={img.caption ?? img.name ?? collName}
                      width={600}
                      height={450}
                      style={{ height: '350px', width: 'auto', flexShrink: 0, objectFit: 'cover', display: 'block' }}
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Products */}
      {products.length > 0 && (
      <section className="coll-slug-products">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'left' }}>
            <h2>{t('products_h2', { name: collName })}</h2>
          </div>
          <div className="grid-4">
            {products.map(p => {
              const typeName = p.type_slug ? typeNameBySlug[p.type_slug] : null
              const spaceName = p.space_slugs?.[0] ? spaceNameBySlug[p.space_slugs[0]] : null
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
            <Link href={{ pathname: '/acheter', query: { filters: slug } }} className="mega-cta-discover">
              <span className="cta-label">{t('products_see_all_voir')}</span>
              <span className="cta-action">{t('products_see_all_label', { name: collName })} <span className="cta-arrow">→</span></span>
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* CTA band */}
      <div className="band">
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="mono" style={{ color: '#000', display: 'block', marginBottom: '0.5rem' }}>{t('band_mono', { name: collName })}</span>
          <h2>{t('band_h2', { name: collName })}</h2>
          <p style={{ color: '#000', margin: '1rem auto 2rem', maxWidth: '500px' }}>{t('band_p')}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="product-cta" style={{ padding: 0 }}>
              <Link href="/configurer" className="btn-configure">{t('band_cta_open')}</Link>
              <span className="action-sep" />
              <button type="button" className="btn-add-product" aria-label="+">+</button>
            </div>
            <Link href="/contact" className="cta-single">
              {t('band_cta_advisor')} <span className="cta-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Samples CTA */}
      <section className="coll-slug-samples">
        <div className="container coll-slug-samples-inner">
          <div className="coll-slug-samples-text">
            <h2 style={{ margin: '0.5rem 0 1rem' }}>{t('samples_h2')}</h2>
            <p style={{ color: '#000', lineHeight: 1.7 }}>{t('samples_p')}</p>
            <Link href="/echantillons" className="cta-single" style={{ marginTop: '1.5rem' }}>
              {t('samples_cta')} <span className="cta-arrow">→</span>
            </Link>
          </div>
          <div className="coll-slug-samples-swatches">
            {FACADE_SAMPLES.map((s, i) => (
              <div key={i} className="coll-slug-swatch" style={{ background: s.bg }} />
            ))}
          </div>
        </div>
      </section>

      {/* Par Pièce */}
      {spaces.length > 0 && (
      <section className="coll-slug-spaces">
        <div className="container coll-slug-spaces-inner">
          <span className="mono" style={{ color: '#0C524E' }}>{t('spaces_mono')}</span>
          <h3>{t('spaces_h3')}</h3>
          <p>{t('spaces_p')}</p>
          <div className="coll-slug-space-pills">
            {spaces.map(s => (
              <Link key={s.slug} href={{ pathname: '/espace/[slug]', params: { slug: s.slug } }} className="coll-slug-space-pill">{s.name}</Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Testimonials — dynamique Odoo, filtrés par collection */}
      {testimonialsResult.length > 0 && (
      <section className="coll-slug-testi">
        <div className="container">
          <TestimonialsSlider
            testimonials={testimonialsResult}
            heading={t('testi_h2')}
            seeProjectLabel={t('testi_see_project')}
          />
        </div>
      </section>
      )}

      {/* Reassurance */}
      <div className="reassurance-band">
        <div className="container">
          {[
            { stat: t('trust_custom_stat'), label: t('trust_custom_label') },
            { stat: t('trust_warranty_stat'), label: t('trust_warranty_label') },
            { stat: t('trust_delivery_stat'), label: t('trust_delivery_label') },
            { stat: t('trust_leadtime_stat'), label: t('trust_leadtime_label') },
            { stat: t('trust_design_stat'), label: t('trust_design_label') },
          ].map((item, i, arr) => (
            <React.Fragment key={item.stat}>
              <div className="trust-item">
                <span className="trust-stat">{item.stat}</span>
                <span className="trust-label">{item.label}</span>
              </div>
              {i < arr.length - 1 && <div className="trust-sep" />}
            </React.Fragment>
          ))}
        </div>
      </div>

    </main>
  )
}
