'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { WishlistItem, WishlistState } from './types'
import type { WishlistApiItem } from '@/lib/api/wishlist'
import { getWishlist, addToWishlist, removeFromWishlist } from '@/lib/api/wishlist'
import { useToast } from '@/features/toast/context'
import { trackAddToWishlist } from '@/features/tracking/events'
import { AnonWishlistModal } from '@/components/wishlist/anon-wishlist-modal'

const EMPTY: WishlistState = { items: [], count: 0 }

function apiItemToWishlistItem(item: WishlistApiItem): WishlistItem {
   const config = item.json_config && Object.keys(item.json_config).length > 0
        ? (item.json_config as Record<string, unknown>)
        : undefined
  return {
    id: item.id,
    productId: item.product_id,
    name: item.product_name,
    price: item.price_ttc,
    config: item.json_config
        ? Object.fromEntries(Object.entries(item.json_config).map(([k, v]) => [k, String(v)]))
        : undefined,
    imageUrl: typeof config?.image === 'string' ? config.image : '',
    rawConfig: item.json_config ?? undefined,
    favDate: item.fav_date,
  }
}

type WishlistContextValue = {
  wishlist: WishlistState
  loading: boolean
  addItem: (productId: number, config?: Record<string, unknown>) => Promise<boolean>
  removeItem: (itemId: number) => Promise<void>
  isInWishlist: (productId: number) => boolean
  refreshWishlist: () => Promise<void>
}

export const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [wishlist, setWishlist] = useState<WishlistState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [anonPendingProductId, setAnonPendingProductId] = useState<number | null>(null)

  const fetchWishlist = useCallback(async () => {
    const result = await getWishlist()
    if (result.success) {
      const items = result.data.items.map(apiItemToWishlistItem)
      setWishlist({ items, count: items.length })
    } else {
      setWishlist(EMPTY)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchWishlist() }, [fetchWishlist])

  const addItem = useCallback(async (
    productId: number,
    config?: Record<string, unknown>,
  ): Promise<boolean> => {
    const result = await addToWishlist(productId, config)
    if (result.success) {
      if (!result.data.already_exists) {
        trackAddToWishlist([{ id: productId, price: result.data.item.price_ttc }])
        await fetchWishlist()
        return true
      }
      return false
    }
    if (result.code === 401) {
      setAnonPendingProductId(productId)
    } else {
      console.error('[wishlist] add failed', { code: result.code, error: result.error })
      toast.show("Erreur lors de l'ajout à la wishlist", 'error')
    }
    return false
  }, [fetchWishlist, toast])

  const removeItem = useCallback(async (itemId: number) => {
    await removeFromWishlist(itemId)
    setWishlist(prev => {
      const items = prev.items.filter(i => i.id !== itemId)
      return { items, count: items.length }
    })
  }, [])

  const isInWishlist = useCallback(
    (productId: number) => wishlist.items.some(i => i.productId === productId),
    [wishlist.items],
  )

  return (
    <WishlistContext.Provider
      value={{ wishlist, loading, addItem, removeItem, isInWishlist, refreshWishlist: fetchWishlist }}
    >
      {children}
      <AnonWishlistModal
        productId={anonPendingProductId}
        onCloseAction={() => setAnonPendingProductId(null)}
      />
    </WishlistContext.Provider>
  )
}
