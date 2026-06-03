import { Fragment } from 'react'
import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { getNavigation } from '@/lib/api/navigation'
import { getProducts } from '@/lib/api/products'
import { toImageProxyUrl } from '@/lib/image-url'
import '@/css/espace-page.css'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return getPageMetadata({ namespace: 'meta.espaces', locale, pathMap: { fr: '/espaces', nl: '/ruimtes' } })
}

function isLight(hex: string) {
  const h = hex.replace('#', '')
  if (h.length < 6) return false
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 230
}

export default async function EspacesPage() {
  const t = await getTranslations()
  const [navResult, productsResult] = await Promise.all([
    getNavigation(),
    getProducts({ limit: '4', sort: 'popular' }),
  ])
  const spaces = navResult.success ? navResult.data.spaces : []
  const products = productsResult.success ? productsResult.data.products : []
  const row1 = spaces.slice(0, 3)
  const row2 = spaces.slice(3)

  const trustItems = [
    { stat: t('home.trust_band.custom_stat'), label: t('home.trust_band.custom_label') },
    { stat: t('home.trust_band.warranty_stat'), label: t('home.trust_band.warranty_label') },
    { stat: t('home.trust_band.delivery_stat'), label: t('home.trust_band.delivery_label') },
    { stat: t('home.trust_band.leadtime_stat'), label: t('home.trust_band.leadtime_label') },
    { stat: t('home.trust_band.design_stat'), label: t('home.trust_band.design_label') },
  ]

  return (
    <main id="main-content" tabIndex={-1} className="esp-page">

      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link href="/">{t('shop.breadcrumb_home')}</Link> › {t('shop.espaces.breadcrumb_current')}
      </div>

      {/* Hero */}
      <div className="container esp-hero">
        <h1>{t('shop.espaces.h1')}</h1>
        <p>{t('shop.espaces.intro')}</p>
      </div>

      {/* Space cards */}
      <section className="esp-cards-section">
        <div className="container">
          <div className="esp-grid-3">
            {row1.map(s => (
              <Link key={s.slug} href={`/espace/${s.slug}`} className="collection-card">
                <Image src={toImageProxyUrl(s.image_url)} alt={s.name} fill style={{ objectFit: 'cover' }} />
                <div className="card-overlay">
                  <span className="mono" style={{ color: '#FFFFFF' }}>{t('shop.espaces.card_label')}</span>
                  <h3 style={{ fontSize: '1.6rem' }}>{s.name}</h3>
                  {s.description && <p>{s.description}</p>}
                </div>
              </Link>
            ))}
          </div>
          <div className="esp-grid-2">
            {row2.map(s => (
              <Link key={s.slug} href={`/espace/${s.slug}`} className="collection-card">
                <Image src={toImageProxyUrl(s.image_url)} alt={s.name} fill style={{ objectFit: 'cover' }} />
                <div className="card-overlay">
                  <span className="mono" style={{ color: '#FFFFFF' }}>{t('shop.espaces.card_label')}</span>
                  <h3 style={{ fontSize: '1.6rem' }}>{s.name}</h3>
                  {s.description && <p>{s.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Band */}
      <div className="band">
        <div className="container">
          <h2>{t('shop.espaces.band_h2')}</h2>
          <p style={{ color: '#000000', margin: '1rem 0 1.5rem' }}>{t('shop.espaces.band_p')}</p>
          <Link href="/acheter" className="btn btn-light">{t('shop.espaces.band_cta')}</Link>
        </div>
      </div>

      {/* Products */}
      <section className="esp-products">
        <div className="container">
          <div className="section-header">
            <h2>{t('shop.espaces.products_h2')}</h2>
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
                    <Link href="/configurer" className="btn-configure">{t('shop.btn_configure')}</Link>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/acheter" className="btn btn-outline">{t('shop.espaces.products_cta')} →</Link>
          </div>
        </div>
      </section>

      {/* Inspirations */}
      <section className="esp-inspo">
        <div className="container esp-inspo-inner">
          <div>
            <span className="mono" style={{ color: 'var(--teal, #0C524E)' }}>{t('shop.espaces.inspo_label')}</span>
            <h3>{t('shop.espaces.inspo_h3')}</h3>
            <p>{t('shop.espaces.inspo_p')}</p>
          </div>
          <Link href="/inspirations" className="btn btn-primary">{t('shop.espaces.inspo_cta')} →</Link>
        </div>
      </section>

      {/* Reassurance */}
      <div className="reassurance-band">
        <div className="container">
          {trustItems.map((item, i, arr) => (
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
