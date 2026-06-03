import React from 'react'
import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getNavigation } from '@/lib/api/navigation'
import { getProducts } from '@/lib/api/products'
import { toImageProxyUrl } from '@/lib/image-url'
import '@/css/collection-slug-page.css'

export const revalidate = 3600

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

  const testimonials = [
    {
      img: '/images/cases/case-satori-hero.jpg',
      text: t('testi_1_text'),
      author: t('testi_1_author'),
      location: t('testi_1_location'),
      tag: 'SATORI',
      slug: '01',
    },
    {
      img: '/images/cases/case-line-hero.jpg',
      text: t('testi_2_text'),
      author: t('testi_2_author'),
      location: t('testi_2_location'),
      tag: 'LINE',
      slug: '02',
    },
    {
      img: '/images/cases/case-vista-hero.jpg',
      text: t('testi_3_text'),
      author: t('testi_3_author'),
      location: t('testi_3_location'),
      tag: 'VISTA',
      slug: '03',
    },
  ]

  const [navResult, productsResult] = await Promise.all([
    getNavigation(),
    getProducts({ collection: slug, limit: '4', sort: 'popular' }),
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

  const products = productsResult.success ? productsResult.data.products : []
  const heroImg = toImageProxyUrl(collection.image_url) || '/images/stock/oaksome-v8-thumb-line.jpg'
  const collName = collection.name
  const collImgs = COLLECTION_IMAGES[slug] ?? DEFAULT_COLLECTION_IMAGES

  const typeNameBySlug = Object.fromEntries(allTypes.map(t => [t.slug, t.name]))
  const spaceNameBySlug = Object.fromEntries(allSpaces.map(s => [s.slug, s.name]))

  return (
    <main className="coll-slug-page">

      {/* view_collection tracking */}
      <script dangerouslySetInnerHTML={{ __html: `
        if(typeof window!=='undefined'&&window.dataLayer){
          window.dataLayer.push({event:'view_collection',collection_name:'${collName}',collection_slug:'${slug}'});
        }
      `}} />

      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link href="/">{shopT('breadcrumb_home')}</Link> › <Link href="/collections">{t('breadcrumb_collections')}</Link> › {collName}
      </div>

      {/* Hero */}
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

      {/* Moodboard strip */}
      <div className="moodboard-strip">
        <Image src={collImgs.moodboard[0]} alt={`${collName} ambiance`} width={800} height={600} style={{ objectFit: 'cover' }} />
        <Image src={collImgs.moodboard[1]} alt={`${collName} collection`} width={800} height={600} style={{ objectFit: 'cover' }} />
        <Image src={collImgs.moodboard[2]} alt={`${collName} détail`} width={800} height={600} style={{ objectFit: 'cover' }} />
        <Image src={collImgs.moodboard[3]} alt={`${collName} style`} width={800} height={600} style={{ objectFit: 'cover' }} />
      </div>

      {/* Description + stats */}
      <section style={{ padding: '5rem 0' }}>
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
          </div>
          <div className="facade-showcase" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
            {facades.map(f => (
              <div key={f.id} className="facade-showcase-item">
                <div className="facade-showcase-preview" style={{ position: 'relative', overflow: 'hidden' }}>
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

      {/* Mini Styler — static configurator teaser */}
      <section className="coll-slug-styler">
        <div className="container">
          <div className="coll-slug-styler-grid">
            <div className="coll-slug-styler-left">
              <header>
                <span className="re-tag">{t('styler_price_from')}</span>
                <h2>{collName} Built-in System</h2>
                <p>{t('band_p')}</p>
              </header>
              <div className="coll-slug-styler-options">
                <div className="coll-slug-styler-section">
                  <h3 className="coll-slug-styler-label">{t('styler_facade_label')}</h3>
                  <div className="coll-slug-styler-chips">
                    <span className="coll-slug-chip active">Oslo</span>
                    <span className="coll-slug-chip">Bergen</span>
                  </div>
                </div>
                <div className="coll-slug-styler-section">
                  <h3 className="coll-slug-styler-label">{t('styler_color_label')}</h3>
                  <div className="coll-slug-styler-colors">
                    {[
                      { name: 'Pure White', hex: '#FFFFFF', border: true },
                      { name: 'Silk Grey', hex: '#E0E0E0' },
                      { name: 'Anthracite', hex: '#2C2C2C' },
                      { name: 'Graphite', hex: '#555555' },
                      { name: 'Snow', hex: '#F5F5F0', border: true },
                      { name: 'Pearl', hex: '#D8D2C2' },
                      { name: 'Slate', hex: '#708090' },
                      { name: 'Obsidian', hex: '#1A1A1A' },
                    ].map((c) => (
                      <span
                        key={c.hex}
                        className="coll-slug-color-chip"
                        title={c.name}
                        style={{ background: c.hex, ...(c.border ? { border: '1px solid rgba(0,0,0,0.1)' } : {}) }}
                      />
                    ))}
                  </div>
                </div>
                <div className="coll-slug-styler-cta">
                  <Link href="/configurer" className="btn btn-primary">{t('styler_cta')}</Link>
                </div>
              </div>
            </div>
            <div className="coll-slug-styler-preview" style={{ position: 'relative', overflow: 'hidden' }}>
              <Image src={collImgs.dressing} alt={`Aperçu ${collName}`} fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
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
          <div className="ambiance-gallery">
            <div className="ambiance-tall" style={{ position: 'relative', overflow: 'hidden' }}>
              <Image src={collImgs.moodboard[0]} alt={`Collection ${collName} — ambiance salon`} fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <Image src={collImgs.moodboard[1]} alt={`Collection ${collName} — ambiance chambre`} fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <Image src={collImgs.moodboard[2]} alt={`Collection ${collName} — ambiance détail`} fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
          <div className="gallery-scroll" style={{ marginTop: '2rem' }}>
            <Image src={collImgs.moodboard[2]} alt={`${collName} — vue 1`} width={500} height={375} style={{ width: '500px', height: 'auto' }} />
            <Image src={collImgs.moodboard[0]} alt={`${collName} — vue 2`} width={400} height={300} style={{ width: '400px', height: 'auto' }} />
            <Image src={collImgs.moodboard[1]} alt={`${collName} — vue 3`} width={400} height={300} style={{ width: '400px', height: 'auto' }} />
            <Image src={collImgs.dressing} alt={`${collName} — aperçu`} width={400} height={300} style={{ width: '400px', height: 'auto' }} />
          </div>
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
              const dots = (p.colors ?? []).slice(0, 3)
              const extra = (p.colors?.length ?? 0) - dots.length
              const typeName = p.type_slug ? typeNameBySlug[p.type_slug] : null
              const spaceName = p.space_slugs?.[0] ? spaceNameBySlug[p.space_slugs[0]] : null
              return (
                <div key={p.id} className="product-card">
                  <div className="product-img">
                    <button className="wishlist-btn">♡</button>
                    <Image src={toImageProxyUrl(p.image_url)} alt={p.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div className="product-info">
                    <p className="price">{new Intl.NumberFormat(locale === 'nl' ? 'nl-BE' : locale === 'en' ? 'en-BE' : 'fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.price_ttc)}</p>
                    <h4>{p.name}</h4>
                  </div>
                  <div className="product-tags">
                    {typeName && <span className="product-tag tag-collection">{typeName.toUpperCase()}</span>}
                    {spaceName && <span className="product-tag tag-collection">{spaceName.toUpperCase()}</span>}
                    <span className="product-tag tag-collection">{collName.toUpperCase()}</span>
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
                    <Link href="/configurer" className="btn-configure">{shopT('btn_configure')}</Link>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href={{ pathname: '/acheter', query: { filters: slug } }} className="btn btn-outline">{t('products_see_all', { name: collName })}</Link>
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
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/configurer" className="btn btn-light">{t('band_cta_open')}</Link>
            <Link href="/contact" className="btn btn-outline-white">{t('band_cta_advisor')}</Link>
          </div>
        </div>
      </div>

      {/* Samples CTA */}
      <section className="coll-slug-samples">
        <div className="container coll-slug-samples-inner">
          <div className="coll-slug-samples-text">
            <h2>{t('samples_h2')}</h2>
            <p>{t('samples_p')}</p>
            <Link href="/echantillons" className="btn btn-primary">{t('samples_cta')}</Link>
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

      {/* Testimonials */}
      <section className="coll-slug-testi">
        <div className="container">
          <div className="coll-slug-testi-header">
            <h2>{t('testi_h2')}</h2>
            <div className="testi-nav">
              <button className="testi-arrow">←</button>
              <span className="testi-counter">{t('testi_counter', { current: 1, total: testimonials.length })}</span>
              <button className="testi-arrow">→</button>
            </div>
          </div>
          <div className="testi-slider">
            {testimonials.map((item, i) => (
              <div key={i} className={`testi-slide${i === 0 ? ' active' : ''}`}>
                <div className="testi-img" style={{ position: 'relative', overflow: 'hidden' }}>
                  <Image src={item.img} alt={item.author} fill style={{ objectFit: 'cover' }} />
                </div>
                <div className="testi-content">
                  <span className="testi-quote">«</span>
                  <p className="testi-text">{item.text}</p>
                  <div className="testi-author">
                    <strong>{item.author}</strong>
                    <span>{item.location}</span>
                  </div>
                  <div className="testi-meta">
                    <span className="product-tag tag-collection">{item.tag}</span>
                    <Link href={{ pathname: '/etude-de-cas/[slug]', params: { slug: item.slug } }} className="testi-link">{t('testi_see_project')}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
