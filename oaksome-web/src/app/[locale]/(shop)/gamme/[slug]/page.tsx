import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getNavigation } from '@/lib/api/navigation'
import { getProducts } from '@/lib/api/products'
import { getComboConfig } from '@/lib/api/combo-config'
import { getTranslations } from 'next-intl/server'
import { Fragment } from 'react'
import { toImageProxyUrl } from '@/lib/image-url'
import { ProductCard } from '@/components/cards/product-card'
import { HeroComboCategory } from './_components/hero-combo-category'
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

type Props = { params: Promise<{ slug: string; locale: string }> }

export default async function GammePage({ params }: Props) {
  const { slug, locale } = await params
  const t = await getTranslations({ locale, namespace: 'shop.gammeSlug' })
  const tShop = await getTranslations({ locale, namespace: 'shop' })
  const tNl = await getTranslations({ locale, namespace: 'home.newsletter' })

  const [navResult, productsResult, comboConfig] = await Promise.all([
    getNavigation(locale),
    getProducts({ type: slug, limit: '8', lang: locale }),
    getComboConfig(locale),
  ])

  const allTypes = navResult.success ? navResult.data.types : []
  const collections = navResult.success ? navResult.data.collections : []

  const type = allTypes.find(t => t.slug === slug)
  if (!type) notFound()

  const linkedCollections = collections.filter(c =>
    ((c as { category_slugs?: string[] }).category_slugs ?? []).includes(slug)
  )

  const comboData = comboConfig.success && comboConfig.data ? comboConfig.data : null
  const categoryBanners = comboData ? comboData.banners.filter(b => b.category?.slug === slug) : []
  const categoryComboConfig = comboData && categoryBanners.length > 0 ? { ...comboData, banners: categoryBanners } : null
  const allCategories = comboData?.banners
    ? Array.from(new Map(comboData.banners.filter(b => b.category).map(b => [b.category!.slug, b.category!])).values())
    : []

  const products = productsResult.success ? productsResult.data.products : []
  const heroImg = toImageProxyUrl(type.image_url) || '/images/stock/oaksome-v8-hero-biblio.jpg'

  const allSpaces = navResult.success ? navResult.data.spaces : []
  const typeNameBySlug = Object.fromEntries(allTypes.map(t => [t.slug, t.name]))
  const spaceNameBySlug = Object.fromEntries(allSpaces.map(s => [s.slug, s.name]))
  const collectionNameBySlug = Object.fromEntries(collections.map(c => [c.slug, c.name]))
  const typeName = type.name

  return (
    <main className={`gamme-slug-page${categoryComboConfig ? ' gamme-slug-page--combo' : ''}`}>

      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link href="/">{tShop('breadcrumb_home')}</Link> › <Link href="/acheter">{t('breadcrumb_par_type')}</Link> › <span className="breadcrumb-current">{typeName}</span>
      </div>

      {/* Hero */}
      {categoryComboConfig ? (
        <HeroComboCategory config={categoryComboConfig} category={{ name: typeName, slug }} allCategories={allCategories} />
      ) : (
        <>
          {/* Comparez nos meubles — masqué temporairement */}
          {/* <section className="gamme-slug-tabs">
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
          </section> */}
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
        </>
      )}

      {/* Range tabs — masqué temporairement */}
      {/* {categoryComboConfig && (
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
      )} */}

      {/* USPs */}
      <section className="gamme-usp-section">
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

      {/* Layouts — Adaptez la forme à votre espace */}
      <section style={{ padding: '320px 0 clamp(48px, 8vw, 96px)' }}>
        <div className="container">
          <div className="spec-intro">
            <h2>{t('h2_adapt')}</h2>
            <p>{t('p_adapt', { typeName: typeName.toLowerCase() })}</p>
          </div>
          <div className="spec-grid spec-grid--5">
            {([
              { img: '/images/dressing/layout-lineaire.jpg',   alt: 'Configuration linéaire',   title: 'Linéaire',   desc: 'Un seul mur. Simple et efficace.' },
              { img: '/images/dressing/layout-en-l.jpg',       alt: 'Configuration en L',       title: 'En L',       desc: 'Deux murs adjacents. Plus de rangement.' },
              { img: '/images/dressing/layout-en-u.jpg',       alt: 'Configuration en U',       title: 'En U',       desc: 'Trois murs. Capacité maximale.' },
              { img: '/images/dressing/layout-sous-pente.jpg', alt: 'Configuration sous pente', title: 'Sous pente', desc: 'Sous les combles. Chaque cm compte.' },
              { img: '/images/dressing/layout-walk-in.jpg',    alt: 'Configuration walk-in',    title: 'Walk-in',    desc: 'Pièce dédiée. Le rêve du dressing.' },
            ] as const).map(item => (
              <div key={item.title} className="spec-card spec-card--layout">
                <Image src={item.img} alt={item.alt} width={480} height={360} style={{ objectFit: 'cover' }} loading="lazy" />
                <div className="spec-card-body">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facades — Choisissez votre type de façade */}
      <section style={{ padding: 'clamp(48px, 8vw, 96px) 0' }}>
        <div className="container">
          <div className="spec-intro">
            <h2>Choisissez votre type de façade.</h2>
            <p>La façade définit l&apos;apparence de votre meuble. Portes, tiroirs ou ouvert — à vous de décider.</p>
          </div>
          <div className="spec-grid spec-grid--4">
            {([
              { img: '/images/dressing/facade-battante.jpg',   alt: 'Porte battante',    title: 'Porte battante',    desc: "Classique, s'ouvre vers vous. Accès complet." },
              { img: '/images/dressing/facade-coulissante.jpg', alt: 'Porte coulissante', title: 'Porte coulissante', desc: 'Gain de place. Idéale pour les espaces étroits.' },
              { img: '/images/dressing/facade-ouvert.jpg',     alt: 'Ouvert sans porte', title: 'Ouvert',            desc: 'Accès immédiat. Style walk-in ou loft.' },
              { img: '/images/dressing/facade-push.jpg',       alt: 'Push-to-open',      title: 'Push-to-open',      desc: 'Sans poignée. Surface lisse, ouverture par pression.' },
            ] as const).map(item => (
              <div key={item.title} className="spec-card spec-card--square">
                <Image src={item.img} alt={item.alt} width={480} height={480} style={{ objectFit: 'cover' }} loading="lazy" />
                <div className="spec-card-body">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intérieurs — L'intérieur, c'est vous qui décidez */}
      <section style={{ padding: 'clamp(48px, 8vw, 96px) 0' }}>
        <div className="container">
          <div className="spec-intro">
            <h2>L&apos;intérieur, c&apos;est vous qui décidez.</h2>
            <p>Combinez les aménagements intérieurs selon vos besoins.</p>
          </div>
          <div className="spec-grid spec-grid--4">
            {([
              { img: '/images/dressing/int-etageres.jpg',  alt: 'Étagères',        title: 'Étagères',        desc: 'Hauteur réglable. 18 ou 25 mm.' },
              { img: '/images/dressing/int-tringle.jpg',   alt: 'Tringle',         title: 'Tringle',         desc: 'Métallique ou noire. 1000 mm.' },
              { img: '/images/dressing/int-tiroirs.jpg',   alt: 'Tiroirs',         title: 'Tiroirs',         desc: 'Fermeture douce Blum. 40 kg.' },
              { img: '/images/dressing/int-chaussures.jpg', alt: 'Range-chaussures', title: 'Range-chaussures', desc: 'Étagères inclinées.' },
              { img: '/images/dressing/int-bijoux.jpg',    alt: 'Tiroir bijoux',   title: 'Tiroir bijoux',   desc: 'Doublure velours. Compartiments.' },
              { img: '/images/dressing/int-pantalon.jpg',  alt: 'Porte-pantalon',  title: 'Porte-pantalon',  desc: 'Coulissant. Cadre métal.' },
              { img: '/images/dressing/int-miroir.jpg',    alt: 'Miroir intégré',  title: 'Miroir intégré',  desc: 'Pleine hauteur. Intérieur de porte.' },
            ] as const).map(item => (
              <div key={item.title} className="spec-card spec-card--square">
                <Image src={item.img} alt={item.alt} width={480} height={480} style={{ objectFit: 'cover' }} loading="lazy" />
                <div className="spec-card-body">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections liées — Même gamme, caractère différent */}
      {linkedCollections.length > 0 && (
      <section style={{ padding: 'clamp(48px, 8vw, 96px) 0' }}>
        <div className="container">
          <div className="section-header gamme-coll-header">
            <h2>{t('h2_same', { typeName })}</h2>
            <p>{t('p_same', { typeName: typeName.toLowerCase() })}</p>
          </div>
          <div className="cat-grid">
            {linkedCollections.map(c => {
              const facadeNames = c.facades && c.facades.length > 0
                ? c.facades.map(f => f.name).join(' · ')
                : null
              return (
                <Link key={c.slug} href={`/collection/${c.slug}`} className="cat-card">
                  <Image
                    src={toImageProxyUrl(c.image_url) || '/images/stock/oaksome-v8-thumb-line.jpg'}
                    alt={`${typeName} en ${c.name}`}
                    width={600}
                    height={750}
                    style={{ objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div className="cat-card-cap">
                    <span className="cap-eyebrow">{typeName} en</span>
                    <h3>{c.name}</h3>
                    {facadeNames && <p>Façades {facadeNames}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
      )}

      {/* CTA band — Fraîchement adapté */}
      <div className="band">
        <div className="container">
          <h2>{t('h2_fresh')}</h2>
          <p>{t('p_fresh')}</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
            <div className="cta-discover-double">
              <Link href={`/acheter?type=${slug}`} className="cta-label">{t('cta_see_all_white', { typeName: typeName.toLowerCase() })}</Link>
              <Link href="/configurer" className="cta-action">{t('cta_configure_light', { typeName: typeName.toLowerCase() })} <span className="cta-arrow">→</span></Link>
            </div>
          </div>
        </div>
      </div>

      {/* Product grid */}
      {products.length > 0 && (
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div className="section-header">
            <h2>{t('h2_popular', { typeName: typeName.toLowerCase() })}</h2>
            <p className="gamme-popular-sub">{t('p_popular', { typeName: typeName.toLowerCase() })}</p>
          </div>
          <div className="grid-4">
            {products.slice(0, 4).map(p => {
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
              const pTypeName = p.type_slug ? typeNameBySlug[p.type_slug] : null
              const pSpaceName = p.space_slugs?.[0] ? spaceNameBySlug[p.space_slugs[0]] : p.space_slug ? spaceNameBySlug[p.space_slug] : null
              const pCollName = p.collection_slugs?.[0] ? collectionNameBySlug[p.collection_slugs[0]] : p.collection_slug ? collectionNameBySlug[p.collection_slug] : null
              const tags = [pTypeName, pSpaceName, pCollName].filter(Boolean).map(s => s!.toUpperCase())
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
            <Link href={`/acheter?type=${slug}`} className="mega-cta-discover">
              <span className="cta-label">{t('cta_see_voir')}</span>
              <span className="cta-action">{t('cta_see_tous', { typeName: typeName.toLowerCase() })} <span className="cta-arrow">→</span></span>
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* Newsletter */}
      <section className="newsletter-stoemp" aria-labelledby="gamme-ns-title">
        <div className="ns-inner">
          <h2 id="gamme-ns-title" className="ns-title">
            {tNl('title_line_1')}<br />{tNl('title_line_2')}
          </h2>
          <form className="ns-form" action="#" method="post" noValidate>
            <label className="ns-input-wrap" htmlFor="gamme-ns-email">
              <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>{tNl('email_label')}</span>
              <input id="gamme-ns-email" className="ns-input" type="email" name="email" placeholder={tNl('email_placeholder')} autoComplete="email" required />
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
