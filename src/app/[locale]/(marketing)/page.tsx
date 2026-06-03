import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import { Fragment } from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { InspoSection } from './_components/inspo-section'
import { TestimonialsSlider } from './_components/testimonials-slider'
import { ProductCard } from '@/components/cards/product-card'
import { getNavigation } from '@/lib/api/navigation'
import { dedupeInspirations, getHomepageInspirations } from '@/lib/api/homepage-inspirations'
import { getHomeData } from '@/lib/api/home'
import type { HomepageBestseller } from '@/lib/api/home'
import { getHomepageProductTagMap, type HomepageProductTags } from '@/lib/api/home-product-tags'
import { toImageProxyUrl } from '@/lib/image-url'

function getHomepageProductTags(
  product: HomepageBestseller,
  currentTags?: HomepageProductTags,
): string[] {
  const category = currentTags?.category?.name ?? product.public_categ_ids?.[0]?.name ?? product.category
  const space = currentTags?.space?.name ?? product.oaksome_space_ids?.[0]?.name
  const style = currentTags?.style?.name ?? product.oaksome_style_ids?.[0]?.name

  return [category, space, style]
    .filter((tag): tag is string => Boolean(tag))
    .map(tag => tag.toUpperCase())
}

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.home', locale, pathMap: '/' })
}

export default async function HomePage() {
  const t = await getTranslations()
  const [navResult, inspoResult, homeResult] = await Promise.all([
    getNavigation(),
    getHomepageInspirations(),
    getHomeData(),
  ])
  const collections = navResult.success ? navResult.data.collections : []
  const inspoCombos = dedupeInspirations(inspoResult.success ? inspoResult.data.combos : [])
  const inspoSpaces = inspoResult.success ? inspoResult.data.spaces : []
  const bestsellers = homeResult.success ? homeResult.data.bestsellers : []
  if (!homeResult.success) {
    console.error('[home] Odoo /v1/home failed:', homeResult.error, '— bestsellers and promo bar will be empty')
  }
  const bestsellerTagMap = await getHomepageProductTagMap(bestsellers.map(product => product.id))

  return (
    <main id="main-content" tabIndex={-1}>
      {/* 3. Hero */}
      <div className="hero-full">
        <img src="/images/oaksome-v8-hero-home.jpg" alt={t('home.hero_alt')} />
        <div className="overlay" />
        <div className="hero-content">
          <h1 style={{ fontSize: '3rem' }}>{t('home.hero.title')}</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>{t('home.hero.subtitle')}</p>
          <div className="hero-chips" style={{ gap: '1rem' }}>
            <Link href="/configurer" className="hero-chip chip-cta" style={{ padding: '0.7rem 2rem', fontSize: '0.95rem' }}>
              {t('home.hero.cta')} →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. OAK Typography */}
      <section className="oak-typography">
        <img src="/images/OAK.svg" alt="OAK" />
      </section>

      {/* 5. Collections */}
      <section className="collections-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.collections.title', { count: collections.length })}</h2>
            <p>{t('home.collections.intro')}</p>
          </div>
        </div>
        <div className="collections-scroll">
          {collections.slice(0, 4).map(c => (
            <Link key={c.slug} href={`/collection/${c.slug}`} className="collection-card-v9">
              <img src={toImageProxyUrl(c.image_url)} alt={t('home.collections.card_alt', { name: c.name })} />
              <div className="collection-card-gradient" />
              <span className="collection-card-name">{c.name}</span>
            </Link>
          ))}
        </div>
        <div className="collections-footer">
          <Link href="/acheter" className="mega-cta-discover">
            <span className="cta-label">{t('cta.discover')}</span>
            <span className="cta-action">{t('home.collections.discover_all')} <span className="cta-arrow">→</span></span>
          </Link>
          <div className="collections-lines">
            <span className="cline cline-short" />
            <span className="cline cline-short" />
            <span className="cline cline-long" />
            <span className="cline cline-short" />
            <span className="cline cline-short" />
          </div>
        </div>
      </section>

      {/* 6. À propos / Atelier */}
      <section className="about-section">
        <div className="container">
          <div className="spaces-block">
            <h2 className="spaces-title">{t('home.about.title')}</h2>
            <div className="spaces-pills">
              <div className="spaces-pills-row">
                <span className="spaces-pill">{t('home.about.pill_made_to_measure')}</span>
                <span className="spaces-pill">{t('home.about.pill_collections_design')}</span>
                <span className="spaces-pill">{t('home.about.pill_fair_price')}</span>
              </div>
              <div className="spaces-pills-row">
                <span className="spaces-pill">{t('home.about.pill_verified')}</span>
                <span className="spaces-pill">{t('home.about.pill_single_contact')}</span>
              </div>
            </div>
          </div>
          <div className="about-atelier">
            <div className="about-atelier-img">
              <img src="/images/stock/oaksome-v8-cnc-woodcam.jpg" alt={t('home.about.img_alt_cnc')} loading="eager" />
            </div>
            <div className="about-atelier-img">
              <img src="/images/stock/oaksome-v8-artisan-laque.jpg" alt={t('home.about.img_alt_artisan')} loading="eager" />
            </div>
          </div>
          <div className="spaces-block" style={{ marginTop: '64px' }}>
            <div className="spaces-pills">
              <div className="spaces-pills-row">
                <span className="spaces-pill"><strong>{t('home.about.stat_collections_value')}</strong>&nbsp;{t('home.about.stat_collections')}</span>
                <span className="spaces-pill"><strong>{t('home.about.stat_configurations_value')}</strong>&nbsp;{t('home.about.stat_configurations')}</span>
                <span className="spaces-pill"><strong>{t('home.about.stat_warranty_value')}</strong>&nbsp;{t('home.about.stat_warranty')}</span>
              </div>
            </div>
            <p className="spaces-description">{t('home.about.description')}</p>
          </div>
        </div>
      </section>

      {/* 7. Produits */}
      <section className="products-section products-section--home">
        <div className="container">
          <h2 className="products-title">
            {t('home.products.title_line_1')}<br />
            {t('home.products.title_line_2')}<br />
            {t('home.products.title_line_3')}
          </h2>
        </div>
        <div className="products-scroll">
          {bestsellers.map(p => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              imageUrl={p.image_url}
              priceTtc={p.price_ttc}
              badge={p.badge ?? null}
              dimensions={p.dimensions ?? null}
              tags={getHomepageProductTags(p, bestsellerTagMap.get(p.id))}
              href={`/produit/${p.id}`}
              className="product-card--home"
            />
          ))}
        </div>
        <div className="container">
          <div className="products-footer">
            <Link href="/acheter" className="mega-cta-discover">
              <span className="cta-label">{t('cta.discover')}</span>
              <span className="cta-action">{t('home.products.discover_all')} <span className="cta-arrow">→</span></span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Inspirations */}
      <InspoSection combos={inspoCombos} spaces={inspoSpaces} />

      {/* 9. SOME Typography */}
      <section style={{ background: 'var(--beige, #F6F5F0)', padding: '16px 8px', overflow: 'hidden' }}>
        <img src="/images/SOME.svg" alt="SOME" style={{ width: '100%', display: 'block' }} />
      </section>

      {/* 10. Réassurance */}
      <section className="reassurance-editorial">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.reassurance.title')}</h2>
            <p>{t('home.reassurance.intro')}</p>
          </div>
          <div className="re-grid">
            {[
              { href: '/echantillons', img: '/images/reassurance-online.png', alt: t('home.reassurance.online_alt'), tag: t('home.reassurance.online_tag'), title: t('home.reassurance.online_title'), desc: t('home.reassurance.online_desc') },
              { href: '/echantillons', img: '/images/reassurance-samples.png', alt: t('home.reassurance.samples_alt'), tag: t('home.reassurance.samples_tag'), tagAccent: true, title: t('home.reassurance.samples_title'), desc: t('home.reassurance.samples_desc'), highlight: true },
              { href: '/echantillons', img: '/images/reassurance-kit.png', alt: t('home.reassurance.kit_alt'), tag: t('home.reassurance.kit_tag'), title: t('home.reassurance.kit_title'), desc: t('home.reassurance.kit_desc') },
              { href: '/echantillons', img: '/images/reassurance-showroom.png', alt: t('home.reassurance.showroom_alt'), tag: t('home.reassurance.showroom_tag'), title: t('home.reassurance.showroom_title'), desc: t('home.reassurance.showroom_desc') },
            ].map((card, i) => (
              <Link key={i} href={card.href} className={`re-card${card.highlight ? ' re-card--highlight' : ''}`}>
                <div className="re-card-photo">
                  <img src={card.img} alt={card.alt} loading="eager" />
                </div>
                <div className="re-card-body">
                  <span className={`re-tag${card.tagAccent ? ' re-tag--accent' : ''}`}>{card.tag}</span>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Comment ça marche */}
      <section className="howworks-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.how_works.title')}</h2>
          </div>
          <div className="re-grid">
            {[
              { num: '01', img: '/images/howworks-configure.png', title: t('home.how_works.s1_title'), desc: t('home.how_works.s1_desc'), extra: true },
              { num: '02', img: '/images/howworks-order.png', title: t('home.how_works.s2_title'), desc: t('home.how_works.s2_desc') },
              { num: '03', img: '/images/howworks-measure.png', title: t('home.how_works.s3_title'), desc: t('home.how_works.s3_desc') },
              { num: '04', img: '/images/howworks-install.png', title: t('home.how_works.s4_title'), desc: t('home.how_works.s4_desc') },
            ].map((step, i) => (
              <div key={i} className="hw-card">
                <div className="re-card-photo">
                  <img src={step.img} alt={step.title} loading="eager" />
                </div>
                <div className="re-card-body">
                  <span className="re-tag">{step.num}</span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                  {step.extra && (
                    <>
                      <p style={{ fontSize: '13px', color: '#000', marginTop: '8px' }}>
                        {t('home.how_works.s1_extra')}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <Link href="/configurer" className="btn btn-primary" style={{ fontSize: '11px', padding: '10px 20px' }}>{t('home.how_works.s1_cta_configure')}</Link>
                        <Link href="/echantillons" className="btn btn-outline" style={{ fontSize: '11px', padding: '10px 20px' }}>{t('home.how_works.s1_cta_samples')}</Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi ce prix */}
      <section className="whyprice-section">
        <div className="container">
          <div className="whyprice-header">
            <h2>{t('home.why_price.title')}</h2>
          </div>
          <div className="whyprice-grid">
            <div className="whyprice-item">
              <h4>{t('home.why_price.item_1_title')}</h4>
              <p>{t('home.why_price.item_1_desc')}</p>
            </div>
            <div className="whyprice-item">
              <h4>{t('home.why_price.item_2_title')}</h4>
              <p>{t('home.why_price.item_2_desc')}</p>
            </div>
            <div className="whyprice-item">
              <h4>{t('home.why_price.item_3_title')}</h4>
              <p>{t('home.why_price.item_3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Testimonials */}
      <TestimonialsSlider />

      {/* 13. Trust band */}
      <div className="reassurance-band">
        <div className="container">
          {[
            { stat: t('home.trust_band.custom_stat'), label: t('home.trust_band.custom_label') },
            { stat: t('home.trust_band.warranty_stat'), label: t('home.trust_band.warranty_label') },
            { stat: t('home.trust_band.delivery_stat'), label: t('home.trust_band.delivery_label') },
            { stat: t('home.trust_band.leadtime_stat'), label: t('home.trust_band.leadtime_label') },
            { stat: t('home.trust_band.design_stat'), label: t('home.trust_band.design_label') },
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

      {/* 14. Newsletter */}
      <section className="newsletter-stoemp" aria-labelledby="ns-title">
        <div className="ns-inner">
          <h2 id="ns-title" className="ns-title">
            {t('home.newsletter.title_line_1')}<br />{t('home.newsletter.title_line_2')}
          </h2>
          <form className="ns-form" action="#" method="post" noValidate>
            <label className="ns-input-wrap" htmlFor="ns-email">
              <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>{t('home.newsletter.email_label')}</span>
              <input id="ns-email" className="ns-input" type="email" name="email" placeholder={t('home.newsletter.email_placeholder')} autoComplete="email" required />
            </label>
            <button className="ns-submit" type="submit" aria-label={t('home.newsletter.submit_label')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>
          <div className="ns-legend">
            <p className="ns-consent">
              {t('home.newsletter.consent')}
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
