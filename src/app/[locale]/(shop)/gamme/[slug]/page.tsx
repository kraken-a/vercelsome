import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getNavigation } from '@/lib/api/navigation'
import { getProducts } from '@/lib/api/products'
import { getTranslations } from 'next-intl/server'
import { Fragment } from 'react'
import { toImageProxyUrl } from '@/lib/image-url'
import '@/css/gamme-slug-page.css'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const nav = await getNavigation()
  const types = nav.success ? nav.data.types : []
  return types.map(t => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params
  const nav = await getNavigation()
  const types = nav.success ? nav.data.types : []
  const type = types.find(t => t.slug === slug)
  const name = type?.name ?? slug
  return getPageMetadata({
    namespace: 'meta.gamme_slug',
    locale,
    pathMap: { fr: '/gamme/[slug]', nl: '/gamma/[slug]' },
    params: { slug },
    tParams: { name },
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

const LAYOUT_IMGS = [
  '/images/biblio/layout-1.jpg',
  '/images/biblio/layout-2.jpg',
  '/images/biblio/layout-3.jpg',
  '/images/biblio/detail-col.jpg',
  '/images/biblio/hero-wide.jpg',
]

const FACADE_IMGS = [
  '/images/biblio/facade-ouvert.jpg',
  '/images/biblio/facade-vitree.jpg',
  '/images/biblio/facade-mixte.jpg',
]

const INTERIOR_IMGS = [
  '/images/biblio/int-etageres.jpg',
  '/images/biblio/int-supports.jpg',
  '/images/biblio/int-tiroirs.jpg',
  '/images/biblio/int-niche.jpg',
  '/images/biblio/int-eclairage.jpg',
  '/images/biblio/int-panneau.jpg',
]

export default async function GammePage({ params }: Props) {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'shop.gammeSlug' })

  const LAYOUTS = [
    { img: LAYOUT_IMGS[0], title: t('layout_1_title'), desc: t('layout_1_desc') },
    { img: LAYOUT_IMGS[1], title: t('layout_2_title'), desc: t('layout_2_desc') },
    { img: LAYOUT_IMGS[2], title: t('layout_3_title'), desc: t('layout_3_desc') },
    { img: LAYOUT_IMGS[3], title: t('layout_4_title'), desc: t('layout_4_desc') },
    { img: LAYOUT_IMGS[4], title: t('layout_5_title'), desc: t('layout_5_desc') },
  ]

  const FACADES = [
    { img: FACADE_IMGS[0], title: t('facade_1_title'), desc: t('facade_1_desc') },
    { img: FACADE_IMGS[1], title: t('facade_2_title'), desc: t('facade_2_desc') },
    { img: FACADE_IMGS[2], title: t('facade_3_title'), desc: t('facade_3_desc') },
  ]

  const INTERIORS = [
    { img: INTERIOR_IMGS[0], title: t('interior_1_title'), desc: t('interior_1_desc') },
    { img: INTERIOR_IMGS[1], title: t('interior_2_title'), desc: t('interior_2_desc') },
    { img: INTERIOR_IMGS[2], title: t('interior_3_title'), desc: t('interior_3_desc') },
    { img: INTERIOR_IMGS[3], title: t('interior_4_title'), desc: t('interior_4_desc') },
    { img: INTERIOR_IMGS[4], title: t('interior_5_title'), desc: t('interior_5_desc') },
    { img: INTERIOR_IMGS[5], title: t('interior_6_title'), desc: t('interior_6_desc') },
  ]
  const tShop = await getTranslations({ locale, namespace: 'shop' })

  const [navResult, productsResult] = await Promise.all([
    getNavigation(),
    getProducts({ type: slug, limit: '8' }),
  ])

  const allTypes = navResult.success ? navResult.data.types : []
  const collections = navResult.success ? navResult.data.collections : []

  const type = allTypes.find(t => t.slug === slug)
  if (!type) notFound()

  const linkedCollections = collections.filter(c =>
    ((c as { category_slugs?: string[] }).category_slugs ?? []).includes(slug)
  )

  const products = productsResult.success ? productsResult.data.products : []
  const heroImg = toImageProxyUrl(type.image_url) || '/images/stock/oaksome-v8-hero-biblio.jpg'

  const allSpaces = navResult.success ? navResult.data.spaces : []
  const typeNameBySlug = Object.fromEntries(allTypes.map(t => [t.slug, t.name]))
  const spaceNameBySlug = Object.fromEntries(allSpaces.map(s => [s.slug, s.name]))
  const collectionNameBySlug = Object.fromEntries(collections.map(c => [c.slug, c.name]))
  const typeName = type.name

  return (
    <main className="gamme-slug-page">

      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link href="/">{tShop('breadcrumb_home')}</Link> › <Link href="/acheter">{t('breadcrumb_par_type')}</Link> › {typeName}
      </div>

      {/* Range tabs */}
      <section className="gamme-slug-tabs">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>{t('h2_compare')}</h2>
          <div className="gamme-slug-chips">
            {allTypes.map(t => (
              <Link key={t.slug} href={`/gamme/${t.slug}`} className={`filter-chip${t.slug === slug ? ' active' : ''}`}>
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Hero split */}
      <div className="hero-split">
        <div className="hero-content" style={{ padding: '4rem' }}>
          <h1>{t('h1_article')} {typeName.toLowerCase()}.</h1>
          {type.category_desc
            ? <p style={{ fontSize: '1.1rem' }}>{type.category_desc}</p>
            : <p style={{ fontSize: '1.1rem' }}>{t('desc_fallback')}</p>
          }
          <p>{t('desc_detail')}</p>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/configurer" className="btn btn-primary">{t('cta_configure', { typeName: typeName.toLowerCase() })}</Link>
          </div>
        </div>
        <div className="hero-image" style={{ position: 'relative', overflow: 'hidden' }}>
          <Image src={heroImg} alt={t('img_alt', { typeName })} fill priority style={{ objectFit: 'cover' }} />
        </div>
      </div>

      {/* USPs */}
      <section style={{ background: '#fff' }}>
        <div className="container">
          <div className="usp-bar">
            <div className="usp-item">
              <div className="usp-icon">▢</div>
              <h4>{t('usp_custom_title')}</h4>
              <p>{t('usp_custom_desc')}</p>
            </div>
            <div className="usp-item">
              <div className="usp-icon">◕</div>
              <h4>{linkedCollections.length} {linkedCollections.length > 1 ? t('usp_collections_plural') : t('usp_collections_singular')}</h4>
              <p>{t('usp_collections_desc', { list: linkedCollections.length > 0 ? linkedCollections.map(c => c.name).join(', ') : '—' })}</p>
            </div>
            <div className="usp-item">
              <div className="usp-icon">⚙</div>
              <h4>{t('usp_shelves_title')}</h4>
              <p>{t('usp_shelves_desc')}</p>
            </div>
            <div className="usp-item">
              <div className="usp-icon">★</div>
              <h4>{t('usp_install_title')}</h4>
              <p>{t('usp_install_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product grid */}
      {products.length > 0 && (
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div className="section-header">
            <h2>{t('h2_popular', { typeName: typeName.toLowerCase() })}</h2>
          </div>
          <div className="grid-4">
            {products.slice(0, 4).map(p => {
              const dots = (p.colors ?? []).slice(0, 3)
              const extra = (p.colors?.length ?? 0) - dots.length
              const pTypeName = p.type_slug ? typeNameBySlug[p.type_slug] : null
              const pSpaceName = p.space_slugs?.[0] ? spaceNameBySlug[p.space_slugs[0]] : null
              const pCollName = p.collection_slugs?.[0] ? collectionNameBySlug[p.collection_slugs[0]] : null
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
                  <div className="product-tags">
                    {pTypeName && <span className="product-tag tag-collection">{pTypeName.toUpperCase()}</span>}
                    {pSpaceName && <span className="product-tag tag-collection">{pSpaceName.toUpperCase()}</span>}
                    {pCollName && <span className="product-tag tag-collection">{pCollName.toUpperCase()}</span>}
                  </div>
                  <div className="gamme-slug-micro-badges">
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0C524E" strokeWidth="2"><path d="M3 3h18v18H3z"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>
                      {t('badge_measure')}
                    </span>
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0C524E" strokeWidth="2"><rect x="1" y="6" width="22" height="12" rx="1"/><path d="M12 6v12"/></svg>
                      {t('badge_delivery')}
                    </span>
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0C524E" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {t('badge_contact')}
                    </span>
                  </div>
                  <div className="product-footer">
                    <div className="color-dots">
                      {dots.map((c, j) => (
                        <span key={j} className="color-dot"
                          style={{ background: c.hex, ...(isLight(c.hex) ? { border: '1px solid #ddd' } : {}) }} />
                      ))}
                      {extra > 0 && <span className="color-more">+{extra}</span>}
                    </div>
                    <Link href="/configurer" className="btn-configure">{t('btn_configure_short')}</Link>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href={`/acheter?filters=${slug}`} className="btn btn-outline">{t('cta_see_all', { typeName: typeName.toLowerCase() })}</Link>
          </div>
        </div>
      </section>
      )}

      {/* Layouts section */}
      <section style={{ background: '#F6F5F0', padding: 'clamp(64px, 10vw, 120px) 0' }}>
        <div className="container">
          <div style={{ marginBottom: '48px' }}>
            <h2 className="gamme-slug-section-h2">{t('h2_adapt')}</h2>
            <p className="gamme-slug-section-p">{t('p_adapt', { typeName: typeName.toLowerCase() })}</p>
          </div>
          <div className="gamme-slug-grid-5">
            {LAYOUTS.map(l => (
              <div key={l.title} className="gamme-slug-card gamme-slug-card--white">
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                  <Image src={l.img} alt={l.title} width={400} height={300} style={{ objectFit: 'cover', width: '100%', height: 'auto' }} />
                </div>
                <div className="gamme-slug-card-body">
                  <h4>{l.title}</h4>
                  <p>{l.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facade types */}
      <section style={{ background: '#fff', padding: 'clamp(64px, 10vw, 120px) 0' }}>
        <div className="container">
          <div style={{ marginBottom: '48px' }}>
            <h2 className="gamme-slug-section-h2">{t('h2_facade')}</h2>
            <p className="gamme-slug-section-p">{t('p_facade')}</p>
          </div>
          <div className="gamme-slug-grid-3">
            {FACADES.map(f => (
              <div key={f.title} className="gamme-slug-card gamme-slug-card--beige">
                <Image src={f.img} alt={f.title} width={400} height={400} style={{ objectFit: 'cover', width: '100%', height: 'auto' }} />
                <div className="gamme-slug-card-body">
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interior options */}
      <section style={{ background: '#F6F5F0', padding: 'clamp(64px, 10vw, 120px) 0' }}>
        <div className="container">
          <div style={{ marginBottom: '48px' }}>
            <h2 className="gamme-slug-section-h2">{t('h2_interior')}</h2>
            <p className="gamme-slug-section-p">{t('p_interior')}</p>
          </div>
          <div className="gamme-slug-grid-4">
            {INTERIORS.map(i => (
              <div key={i.title} className="gamme-slug-card gamme-slug-card--white">
                <Image src={i.img} alt={i.title} width={400} height={400} style={{ objectFit: 'cover', width: '100%', height: 'auto' }} />
                <div className="gamme-slug-card-body">
                  <h4>{i.title}</h4>
                  <p>{i.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      {linkedCollections.length > 0 && (
      <section style={{ background: '#fff' }}>
        <div className="container">
          <div className="section-header">
            <h2>{t('h2_same', { typeName: typeName.toLowerCase() })}</h2>
          </div>
          <div className="grid-4">
            {linkedCollections.map(c => (
              <Link key={c.slug} href={`/collection/${c.slug}`} className="collection-card">
                <Image src={toImageProxyUrl(c.image_url) || '/images/stock/oaksome-v8-thumb-line.jpg'}
                  alt={`${typeName} ${c.name}`} fill style={{ objectFit: 'cover' }} />
                <div className="card-overlay">
                  <span className="mono" style={{ color: 'var(--light-gray, #C0C0C0)' }}>{t('collection_in', { typeName })}</span>
                  <h3 style={{ fontSize: '1.3rem' }}>{c.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* CTA band */}
      <div className="band">
        <div className="container">
          <h2>{t('h2_fresh')}</h2>
          <p style={{ color: '#000', margin: '1rem 0 1.5rem' }}>
            {t('p_fresh', { typeName: typeName.toLowerCase() })}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/configurer" className="btn btn-light">{t('cta_configure_light', { typeName: typeName.toLowerCase() })}</Link>
            <Link href="/acheter" className="btn btn-outline-white">{t('cta_see_all_white', { typeName: typeName.toLowerCase() })}</Link>
          </div>
        </div>
      </div>

      {/* Reassurance */}
      <div className="reassurance-band">
        <div className="container">
          {[
            { stat: 'AU CM',    label: t('trust_custom') },
            { stat: '10 ANS',   label: t('trust_guarantee') },
            { stat: '0 €',      label: t('trust_delivery') },
            { stat: '6-8 SEM.', label: t('trust_lead_time') },
            { stat: '100%',     label: t('trust_design') },
          ].map((item, i, arr) => (
            <Fragment key={item.stat}>
              <div className="trust-item">
                <span className="trust-stat">{item.stat}</span>
                <span className="trust-label">{item.label}</span>
              </div>
              {i < arr.length - 1 && <div className="trust-sep" />}
            </Fragment>
          ))}
        </div>
      </div>

    </main>
  )
}
