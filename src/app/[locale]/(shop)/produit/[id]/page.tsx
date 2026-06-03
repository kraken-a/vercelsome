import type { Metadata } from 'next'
import { getPageMetadata } from '@/lib/seo/page-metadata'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getProduct } from '@/lib/api/products'
import { ProductCard } from '@/components/cards/product-card'
import { ProductActions } from './product-actions'

type Props = {
  params: Promise<{ id: string; locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params
  return getPageMetadata({
    namespace: 'meta.produit',
    locale,
    pathMap: { fr: '/produit/[id]', nl: '/meubel/[id]' },
    params: { id },
  })
}

export default async function ProduitPage({ params, searchParams }: Props) {
  const { id: rawId } = await params
  const resolvedSearch = await searchParams
  const id = parseInt(rawId, 10)
  if (isNaN(id)) notFound()

  const result = await getProduct(id, resolvedSearch.country)
  if (!result.success) notFound()

  const t = await getTranslations('shop.product')
  const p = result.data

  const mainImage = p.images?.[0]?.url ?? (p as unknown as { image_url?: string }).image_url ?? null
  const thumbs = p.images?.slice(1, 5) ?? []

  const hasDimensions = p.dimensions &&
    (p.dimensions.width > 0 || p.dimensions.height > 0 || p.dimensions.depth > 0)
  const dims = hasDimensions
    ? `L${p.dimensions!.width} × H${p.dimensions!.height} × P${p.dimensions!.depth} cm`
    : null

  const badge = p.is_new
    ? { key: 'new', label: 'NEW' }
    : p.is_basic
    ? { key: 'basic', label: 'BASIC' }
    : p.is_premium
    ? { key: 'premium', label: 'PREMIUM' }
    : null

  const tags = [
    p.type?.name?.toUpperCase(),
    p.spaces?.[0]?.name?.toUpperCase(),
    p.collection?.name?.toUpperCase(),
  ].filter(Boolean) as string[]

  const badgeClass = badge?.key === 'new' ? 'badge-new' : badge?.key === 'basic' ? 'badge-basic' : badge?.key === 'premium' ? 'badge-premium' : ''

  return (
    <main id="main-content" tabIndex={-1}>
      {/* Product hero */}
      <div className="container" style={{ paddingTop: '48px', paddingBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '64px', alignItems: 'start' }}>

          {/* Gallery */}
          <div>
            <div style={{ background: '#E5E5E0', overflow: 'hidden', aspectRatio: '1' }}>
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%' }} />
              )}
            </div>
            {thumbs.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {thumbs.map((img, i) => (
                  <div
                    key={i}
                    style={{ flex: '0 0 80px', height: '80px', background: '#E5E5E0', overflow: 'hidden' }}
                  >
                    <img
                      src={img.url}
                      alt={img.name || p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {tags.length > 0 && (
              <div className="product-tags">
                {tags.map((t, i) => (
                  <span
                    key={i}
                    className={`product-tag${i === tags.length - 1 ? ' tag-collection' : ''}`}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div>
              {badge && (
                <span
                  className={`product-badge ${badgeClass}`}
                  style={{ position: 'static', display: 'inline-block', marginBottom: '12px' }}
                >
                  {badge.label}
                </span>
              )}
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2, margin: 0 }}>
                {p.name}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span className="price" style={{ fontSize: '28px', fontWeight: 700 }}>
                {p.price_ttc.toLocaleString('fr-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
              </span>
              <span style={{ fontSize: '13px', color: '#696761' }}>{t('ttc_note')}</span>
            </div>

            {dims && (
              <p className="product-dims" style={{ fontSize: '13px', margin: 0 }}>{dims}</p>
            )}

            {p.description && (
              <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#333', margin: 0 }}>{p.description}</p>
            )}

            <ProductActions
              productId={p.id}
              name={p.name}
              price={p.price_ttc}
              imageUrl={mainImage ?? ''}
              configHref={`/configurer?product=${p.id}`}
            />

            {p.collection && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '20px' }}>
                <p style={{ fontSize: '11px', color: '#696761', margin: '0 0 4px', fontFamily: '"PP Air Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {t('collection_label')}
                </p>
                <Link
                  href={`/collection/${p.collection.slug}`}
                  style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-vert-persan)', textDecoration: 'none' }}
                >
                  {p.collection.name} →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related products */}
      {p.related_products.length > 0 && (
        <section className="products-section">
          <div className="container">
            <h2 className="products-title" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>
              {t('related_title')}
            </h2>
          </div>
          <div className="products-scroll">
            {p.related_products.slice(0, 4).map(rp => (
              <ProductCard
                key={rp.id}
                id={rp.id}
                name={rp.name}
                imageUrl={rp.image_url}
                priceTtc={rp.price_ttc}
                badge={rp.is_new ? { key: 'new', label: 'NEW' } : rp.is_premium ? { key: 'premium', label: 'PREMIUM' } : null}
                tags={[
                  rp.type_slug ? rp.type_slug.replace(/-/g, ' ').toUpperCase() : '',
                  rp.collection_slug ? rp.collection_slug.toUpperCase() : '',
                ].filter(Boolean)}
                href={`/produit/${rp.id}`}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
