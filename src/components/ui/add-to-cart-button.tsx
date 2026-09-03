'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCart } from '@/features/cart/hooks'
import { trackAddToCart } from '@/features/tracking/events'
import type { CartItem } from '@/features/cart/types'

type Props = {
  item: CartItem
  className?: string
  label?: string
}

export function AddToCartButton({ item, className, label }: Props) {
  const t = useTranslations('common')
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    if (busy) return
    setBusy(true)
    const ok = await addItem(item)
    setBusy(false)
    if (!ok) return
    trackAddToCart([{ id: item.productId, price: item.price, quantity: item.quantity }])
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-busy={busy}
      className={className}
      style={!className ? {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.85rem 2rem',
        background: added ? '#0C524E' : '#0C524E',
        color: '#fff',
        border: 'none',
        borderRadius: 0,
        fontSize: '1rem',
        fontWeight: 500,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'background 500ms ease-out, opacity 500ms ease-out',
        opacity: added ? 0.85 : 1,
        width: '100%',
      } : undefined}
    >
      {added ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {t('added_to_cart')}
        </>
      ) : (label ?? t('add_to_cart'))}
    </button>
  )
}
