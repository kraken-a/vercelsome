'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { useCart } from '@/features/cart/hooks'
import { trackAddToCart } from '@/features/tracking/events'
import { toImageProxyUrl } from '@/lib/image-url'

type Props = {
  id: number
  name: string
  imageUrl: string
  priceTtc: number
  badge?: { key: string; label: string } | null
  dimensions?: string | null
  tags?: string[]
  href: string
  configureHref?: string
  className?: string
}

export function ProductCard({
  id,
  name,
  imageUrl,
  priceTtc,
  badge,
  dimensions,
  tags = [],
  href,
  configureHref,
  className,
}: Props) {
  const locale = useLocale()
  const commonT = useTranslations('common')
  const shopT = useTranslations('shop')
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem({ productId: id, name, price: priceTtc, quantity: 1, imageUrl, config: {} })
    trackAddToCart([{ id, price: priceTtc, quantity: 1 }])
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }
  const badgeClass =
    badge?.key === 'new' ? 'badge-new' :
    badge?.key === 'basic' ? 'badge-basic' :
    badge?.key === 'premium' ? 'badge-premium' : ''

  return (
    <div className={['product-card', className].filter(Boolean).join(' ')} style={{ position: 'relative' }}>
      {/* Stretched link — covers the full card, sits behind interactive elements */}
      <Link href={configureHref ?? href} className="product-card-overlay" tabIndex={-1} aria-hidden="true" />
      <div className="product-img" style={{ position: 'relative', zIndex: 1 }}>
        {badge && (
          <span className={`product-badge ${badgeClass}`}>{badge.label}</span>
        )}
        <button className="wishlist-btn" aria-label={commonT('add_to_wishlist')}>♡</button>
        <Link href={configureHref ?? href} tabIndex={-1}>
          {imageUrl ? (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
              <Image
                src={toImageProxyUrl(imageUrl)}
                alt={name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: '1', background: '#E5E5E0' }} />
          )}
        </Link>
      </div>
      <div className="product-meta" style={{ position: 'relative', zIndex: 1 }}>
        <span className="price">
          {new Intl.NumberFormat(locale === 'nl' ? 'nl-BE' : locale === 'en' ? 'en-BE' : 'fr-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(priceTtc)}
          <span className="badge-ttc">TTC</span>
        </span>
      </div>
      <div className="product-details" style={{ position: 'relative', zIndex: 1 }}>
        <h4>
          <Link href={configureHref ?? href} style={{ textDecoration: 'none', color: 'inherit' }}>
            {name}
          </Link>
        </h4>
        <p className={`product-dims${dimensions ? '' : ' product-dims--hidden'}`}>{dimensions || ' '}</p>
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
      </div>
      <div className="product-cta" style={{ position: 'relative', zIndex: 1 }}>
        <Link
          href={configureHref ?? `/configurer?product=${id}`}
          className="btn-configure"
        >
          {shopT('btn_configure')}
        </Link>
        <span className="action-sep" />
        <button
          className="btn-add-product"
          aria-label={commonT('add_to_cart')}
          onClick={handleAddToCart}
          style={added ? { color: '#0C524E', fontWeight: 700 } : undefined}
        >
          {added ? '✓' : '+'}
        </button>
      </div>
    </div>
  )
}
