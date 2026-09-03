'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
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
// Canonical Belgian VAT rates for built-in furniture: 6% (residential, dwelling
// > 10 years) and 21% (standard). See docs/System-Design.md country/TVA logic.
export const VALID_TVA_RATES = [0.06, 0.21] as const
export const DEFAULT_TVA = 0.21
const EMPTY_CART: CartState = { items: [], totalItems: 0, subtotal: 0, tvaRate: DEFAULT_TVA, productTvaRate: DEFAULT_TVA }

// localStorage is user-writable, so a tampered `oaksome-tva-rate` could skew the
// displayed total (Odoo still charges the correct server-derived rate). Clamp any
// stored value to the known set; fall back to DEFAULT_TVA otherwise.
export function readTvaRate(): number {
  const stored = getItem<number>(TVA_KEY, DEFAULT_TVA)
  return (VALID_TVA_RATES as readonly number[]).includes(stored) ? stored : DEFAULT_TVA
}

function apiItemToCartItem(item: ApiCartItem): CartItem {
    const config = item.json_config && Object.keys(item.json_config).length > 0
        ? (item.json_config as Record<string, unknown>)
        : undefined
  return {
    id: item.id,
    productId: item.product_id,
    name: item.product_name,
    price: item.price_ttc,
    quantity: item.quantity,
    imageUrl: item.product_image_url,
    image: typeof config?.image === 'string' ? config.image : undefined,

    config: item.json_config && Object.keys(item.json_config).length > 0
      ? (item.json_config as Record<string, unknown>)
      : undefined,
  }
}

function computeState(items: CartItem[], tvaRate: number, productTvaRate?: number): CartState {
  return {
    items,
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    tvaRate,
    productTvaRate: productTvaRate ?? tvaRate,
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
  const t = useTranslations('cart')
  const lang = odooLocale(uiLocale)
  const [cart, setCart] = useState<CartState>(EMPTY_CART)
  const [cartOpen, setCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchCart = useCallback(async () => {
    const result = await getCart(undefined, lang)
    if (result.success) {
      const items = result.data.items
      const firstRate = items[0]?.tva_rate
      const tvaRate = firstRate != null && (VALID_TVA_RATES as readonly number[]).includes(firstRate)
        ? firstRate
        : readTvaRate()
      setCart(computeState(items.map(apiItemToCartItem), tvaRate))
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
    setCart(prev => computeState(prev.items, rate, prev.productTvaRate))
  }, [])

  const addItem = useCallback(async (item: CartItem): Promise<boolean> => {
    const result = await addToCart({
      product_id: item.productId,
      quantity: item.quantity,
      json_config: item.config as Record<string, unknown> | undefined,
    })
    if (!result.success) {
      if (result.code === 401) {
        // A guest cart works without login (Odoo mints a session), so a 401 here
        // means an existing session expired — tell the user that, not "log in".
        toast.show(t('error_session_expired'), 'info')
        router.push(`/login?next=${encodeURIComponent(pathname || '/')}`)
      } else if (result.code === 503 || result.code === 504) {
        // Odoo unreachable / timeout (e.g. during a backend deploy) — transient.
        toast.show(t('error_unavailable'), 'error')
      } else {
        toast.show(t('error_add_generic'), 'error')
      }
      return false
    }
    await fetchCart()
    return true
  }, [fetchCart, pathname, router, toast, t])

  const removeItem = useCallback(async (productId: number) => {
    const found = cart.items.find(i => i.productId === productId)
    if (!found?.id) return
    await removeFromCart(found.id)
    setCart(prev => computeState(prev.items.filter(i => i.productId !== productId), prev.tvaRate, prev.productTvaRate))
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
      prev.productTvaRate,
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
