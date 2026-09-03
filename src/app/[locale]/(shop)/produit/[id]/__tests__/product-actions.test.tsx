/** @jest-environment jsdom */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductActions } from '../product-actions'

// --- mocks -------------------------------------------------------------
const addToCartItem = jest.fn()
const setCartOpen = jest.fn()
const addToWishlistItem = jest.fn()
const isInWishlist = jest.fn(() => false)
const toastShow = jest.fn()
const trackAddToCart = jest.fn()

jest.mock('@/features/cart/hooks', () => ({
  useCart: () => ({ addItem: addToCartItem, setCartOpen }),
}))
jest.mock('@/features/wishlist/hooks', () => ({
  useWishlist: () => ({ addItem: addToWishlistItem, isInWishlist }),
}))
jest.mock('@/features/toast/context', () => ({
  useToast: () => ({ show: toastShow }),
}))
jest.mock('@/features/tracking/events', () => ({
  trackAddToCart: (...a: unknown[]) => trackAddToCart(...a),
}))
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))

const PROPS = {
  productId: 1263846,
  name: 'Showroom mobile',
  price: 250,
  imageUrl: 'https://cdn.oaksome.com/img.png',
  configHref: '/fr/configurer?product=1263846',
}

beforeEach(() => jest.clearAllMocks())

describe('ProductActions — add-to-cart feedback', () => {
  it('on a SUCCESSFUL add: opens the cart overlay and shows a success toast', async () => {
    addToCartItem.mockResolvedValue(true)
    render(<ProductActions {...PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: 'aria_add_cart' }))

    await waitFor(() => expect(addToCartItem).toHaveBeenCalledTimes(1))
    expect(setCartOpen).toHaveBeenCalledWith(true)
    expect(toastShow).toHaveBeenCalledWith('added_to_cart', 'success')
    expect(trackAddToCart).toHaveBeenCalledTimes(1)
  })

  it('on a FAILED add: does NOT open the overlay and does NOT show a success toast', async () => {
    addToCartItem.mockResolvedValue(false)
    render(<ProductActions {...PROPS} />)

    fireEvent.click(screen.getByRole('button', { name: 'aria_add_cart' }))

    await waitFor(() => expect(addToCartItem).toHaveBeenCalledTimes(1))
    expect(setCartOpen).not.toHaveBeenCalled()
    expect(toastShow).not.toHaveBeenCalledWith('added_to_cart', 'success')
    expect(trackAddToCart).not.toHaveBeenCalled()
  })
})
