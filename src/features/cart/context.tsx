'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import type { CartItem, CartState } from './types'
import { getItem, setItem } from '@/lib/store/storage'
import { getCart, addToCart, updateCart, removeFromCart } from '@/lib/api/cart'
import type { CartItem as ApiCartItem } from '@/lib/api/cart'
import { useAuth } from '@/features/auth/hooks'
import { useToast } from '@/features/toast/context'

// Map the next-intl UI locale (fr | nl) to the Odoo translation locale.
// Odoo expects `lang=fr_BE` / `lang=nl_BE` to return translated product names.
function odooLocale(uiLocale: string): string {
  return uiLocale === 'nl' ? 'nl_BE' : 'fr_BE'
}

const TVA_KEY = 'oaksome-tva-rate'
const DEFAULT_TVA = 0.21
const EMPTY_CART: CartState = { items: [], totalItems: 0, subtotal: 0, tvaRate: DEFAULT_TVA }

function apiItemToCartItem(item: ApiCartItem): CartItem {
  return {
    id: item.id,
    productId: item.product_id,
    name: item.product_name,
    price: item.price_ttc,
    quantity: item.quantity,
    imageUrl: item.product_image_url,
    config: item.json_config && Object.keys(item.json_config).length > 0
      ? (item.json_config as Record<string, unknown>)
      : undefined,
  }
}

function computeState(items: CartItem[], tvaRate: number): CartState {
  return {
    items,
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    tvaRate,
  }
}

type CartContextValue = {
  cart: CartState
  cartOpen: boolean
  loading: boolean
  setCartOpen: (open: boolean) => void
  addItem: (item: CartItem) => Promise<boolean>
  removeItem: (productId: number) => Promise<void>
  updateQuantity: (productId: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  setTvaRate: (rate: number) => void
  refreshCart: () => Promise<void>
}

export const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()
  const uiLocale = useLocale()
  const lang = odooLocale(uiLocale)
  const [cart, setCart] = useState<CartState>(EMPTY_CART)
  const [cartOpen, setCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchCart = useCallback(async () => {
    const result = await getCart(undefined, lang)
    if (result.success) {
      const tvaRate = getItem<number>(TVA_KEY, DEFAULT_TVA)
      setCart(computeState(result.data.items.map(apiItemToCartItem), tvaRate))
    }
    setLoading(false)
  }, [lang])

  // Always fetch cart from Odoo — session cookie handles auth for both portal users and technicians.
  // If no session, getCart returns empty and loading is set to false.
  useEffect(() => {
    if (authLoading) return
    // fetchCart always tries Odoo — the session cookie handles auth.
    // For portal users: their session. For technicians: odoo_sid. For guests: empty cart.
    fetchCart()
  }, [user?.id, authLoading, fetchCart])

  const setTvaRate = useCallback((rate: number) => {
    setItem(TVA_KEY, rate)
    setCart(prev => computeState(prev.items, rate))
  }, [])

  const addItem = useCallback(async (item: CartItem): Promise<boolean> => {
    const result = await addToCart({
      product_id: item.productId,
      quantity: item.quantity,
      json_config: item.config as Record<string, unknown> | undefined,
    })
    if (!result.success) {
      if (result.code === 401) {
        toast.show('Connectez-vous pour ajouter au panier', 'info')
        router.push(`/login?next=${encodeURIComponent(pathname || '/')}`)
      } else {
        toast.show("Erreur lors de l'ajout au panier", 'error')
      }
      return false
    }
    await fetchCart()
    return true
  }, [fetchCart, pathname, router, toast])

  const removeItem = useCallback(async (productId: number) => {
    const found = cart.items.find(i => i.productId === productId)
    if (!found?.id) return
    await removeFromCart(found.id)
    setCart(prev => computeState(prev.items.filter(i => i.productId !== productId), prev.tvaRate))
  }, [cart.items])

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    const found = cart.items.find(i => i.productId === productId)
    if (!found?.id) return
    if (quantity <= 0) {
      await removeItem(productId)
      return
    }
    await updateCart({ item_id: found.id, quantity })
    setCart(prev => computeState(
      prev.items.map(i => i.productId === productId ? { ...i, quantity } : i),
      prev.tvaRate,
    ))
  }, [cart.items, removeItem])

  const clearCart = useCallback(async () => {
    await Promise.all(cart.items.filter(i => i.id).map(i => removeFromCart(i.id!)))
    setItem(TVA_KEY, DEFAULT_TVA)
    setCart(computeState([], DEFAULT_TVA))
  }, [cart.items])

  return (
    <CartContext.Provider
      value={{ cart, cartOpen, loading, setCartOpen, addItem, removeItem, updateQuantity, clearCart, setTvaRate, refreshCart: fetchCart }}
    >
      {children}
    </CartContext.Provider>
  )
}
