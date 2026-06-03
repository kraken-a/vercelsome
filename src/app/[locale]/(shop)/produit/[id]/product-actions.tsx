'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCart } from '@/features/cart/hooks'
import { useWishlist } from '@/features/wishlist/hooks'
import { useToast } from '@/features/toast/context'
import { trackAddToCart } from '@/features/tracking/events'
import type { CartItem } from '@/features/cart/types'

type Props = {
  readonly productId: number
  readonly name: string
  readonly price: number
  readonly imageUrl: string
  readonly configHref: string
}

export function ProductActions({ productId, name, price, imageUrl, configHref }: Props) {
  const t = useTranslations('shop.product')
  const { addItem: addToCartItem } = useCart()
  const { addItem: addToWishlistItem, isInWishlist } = useWishlist()
  const toast = useToast()
  const [addingToCart, setAddingToCart] = useState(false)
  const [savingWish, setSavingWish] = useState(false)
  const alreadySaved = isInWishlist(productId)

  const cartItem: CartItem = { productId, name, price, quantity: 1, imageUrl, config: {} }

  async function handleAddToCart() {
    setAddingToCart(true)
    try {
      const added = await addToCartItem(cartItem)
      if (added) {
        trackAddToCart([{ id: productId, price, quantity: 1 }])
      }
    } finally {
      setAddingToCart(false)
    }
  }

  async function handleSaveToWishlist() {
    if (alreadySaved) {
      toast.show(t('wishlist_already'), 'info')
      return
    }
    setSavingWish(true)
    try {
      const added = await addToWishlistItem(productId)
      if (added) toast.show(t('wishlist_added'))
    } finally {
      setSavingWish(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Link
        href={configHref}
        className="btn btn-primary"
        style={{ flex: 1, textAlign: 'center', padding: '16px 24px', minWidth: '160px' }}
      >
        {t('configure_cta')}
      </Link>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={addingToCart}
        className="btn btn-outline"
        style={{ padding: '16px 24px' }}
        aria-label={t('aria_add_cart')}
      >
        {addingToCart ? '...' : t('add_to_cart')}
      </button>
      <button
        type="button"
        onClick={handleSaveToWishlist}
        disabled={savingWish}
        className="btn btn-outline"
        style={{ padding: '16px 24px' }}
        aria-label={t('aria_save_wishlist')}
        aria-pressed={alreadySaved}
      >
        {alreadySaved ? t('wishlist_saved') : t('wishlist_save')}
      </button>
    </div>
  )
}
