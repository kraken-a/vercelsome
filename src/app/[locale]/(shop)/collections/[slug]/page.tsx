import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCollection } from '@/lib/api/collections'
import { getNavigation } from '@/lib/api/navigation'
import { toImageProxyUrl } from '@/lib/image-url'

type Props = { params: Promise<{ slug: string; locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  return getPageMetadata({
    namespace: 'meta.collection_slug',
    locale,
    pathMap: { fr: '/collection/[slug]', nl: '/collectie/[slug]' },
    params: { slug },
  })
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params

  const t = await getTranslations('shop.collectionsDetail')
  const tShop = await getTranslations('shop')

  const [collResult, navResult] = await Promise.all([
    getCollection(slug),
    getNavigation(),
  ])

  if (!collResult.success) notFound()

  // API returns data.collection + data.products, or data as CollectionDetail directly
  const raw = collResult.data as unknown as Record<string, unknown>
  const coll = (raw.collection as Record<string, unknown>) ?? raw
  const products = (raw.products as { id: number; name: string; price_ttc: number; image_url: string; type_slug?: string; is_new?: boolean; colors?: { name: string; hex: string }[] }[]) ?? []

  const allCollections = navResult.success ? navResult.data.collections : []

  const images = coll.images as { url: string }[] | undefined
  const imageUrl = coll.image_url as string | undefined
  const heroImg = toImageProxyUrl(images?.[0]?.url ?? imageUrl ?? '')
  const name = coll.name as string
  const description = coll.description as string | undefined
  const colorHex = (coll.color_hex as string | undefined) ?? '#ccc'
  const priceRange = coll.price_range as { min: number; max: number } | undefined
  const features = (coll.features as string[] | undefined) ?? []

  return (
    <main id="main-content" tabIndex={-1} className="collection-page">
      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link href="/">{tShop('breadcrumb_home')}</Link> › <Link href="/acheter">{t('breadcrumb_furniture')}</Link> › {t('breadcrumb_collection', { name })}
      </div>

      {/* Collection tabs */}
      {allCollections.length > 0 && (
        <div className="range-tabs-wrap">
          <div className="container">
            <nav className="range-tabs">
              {allCollections.map(c => (
                <Link
                  key={c.slug}
                  href={`/collection/${c.slug}`}
                  className={`range-tab${c.slug === slug ? ' active' : ''}`}
                >
                  <span className="range-tab-swatch" style={{ background: c.color_hex ?? '#ccc' }} />
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="collection-hero">
        <div className="collection-hero-content">
          <span className="section-tag">{t('section_tag')}</span>
          <h1>{name}</h1>
          {description && <p className="collection-hero-desc">{description}</p>}
          <div className="collection-color-bar" style={{ background: colorHex }} />
          {priceRange && (
            <p className="collection-price-range">
              {priceRange.min.toLocaleString('fr-BE')} — {priceRange.max.toLocaleString('fr-BE')} €
            </p>
          )}
          {features.length > 0 && (
            <ul className="collection-features">
              {features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          )}
          <div className="collection-hero-ctas">
            <Link href="/configurer" className="btn btn-primary">{t('btn_configure_collection')}</Link>
            <Link href="/echantillons" className="btn btn-outline">{t('btn_samples')}</Link>
          </div>
        </div>
        {heroImg && (
          <div className="collection-hero-img" style={{ position: 'relative', overflow: 'hidden' }}>
            <Image src={heroImg} alt={`Collection ${name}`} fill priority style={{ objectFit: 'cover' }} />
          </div>
        )}
      </div>

      {/* Products */}
      {products.length > 0 && (
        <section className="collection-products">
          <div className="container">
            <h2 className="range-products-title">
              {products.length > 1
                ? t('products_count_plural', { count: products.length })
                : t('products_count', { count: products.length })
              }
            </h2>
            <div className="collection-grid">
              {products.map(p => {
                const imgUrl = toImageProxyUrl(p.image_url)
                return (
                  <div key={p.id} className="collection-product-card">
                    <div className="collection-product-img" style={{ position: 'relative', overflow: 'hidden' }}>
                      {imgUrl && <Image src={imgUrl} alt={p.name} fill style={{ objectFit: 'cover' }} />}
                      {p.is_new && <span className="badge-new">NEW</span>}
                    </div>
                    <div className="collection-product-info">
                      <p className="collection-product-price">{p.price_ttc.toLocaleString('fr-BE')} €</p>
                      <h4>{p.name}</h4>
                      {p.type_slug && (
                        <p className="collection-product-type">{p.type_slug.replace(/-/g, ' ').toUpperCase()}</p>
                      )}
                    </div>
                    <div className="collection-product-footer">
                      {p.colors && p.colors.length > 0 && (
                        <div className="color-dots">
                          {p.colors.slice(0, 4).map((c, ci) => (
                            <span
                              key={ci}
                              className="color-dot"
                              style={{
                                background: c.hex,
                                ...(c.hex === '#FFFFFF' || c.hex === '#ffffff' ? { borderColor: '#ddd' } : {}),
                              }}
                              title={c.name}
                            />
                          ))}
                          {p.colors.length > 4 && <span className="color-more">+{p.colors.length - 4}</span>}
                        </div>
                      )}
                      <Link href={`/configurer?product=${p.id}`} className="btn-configure">{t('btn_configure')}</Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA bottom */}
      <section className="range-cta-section">
        <div className="container range-cta-inner">
          <div>
            <h2>{t('cta_h2', { name })}</h2>
            <p>{t('cta_p')}</p>
          </div>
          <Link href="/configurer" className="btn btn-primary">{t('cta_btn')}</Link>
        </div>
      </section>
    </main>
  )
}
