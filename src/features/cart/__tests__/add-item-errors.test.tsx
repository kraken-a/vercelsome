/** @jest-environment jsdom */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CartProvider } from '../context'
import { useCart } from '../hooks'

// --- mocks -------------------------------------------------------------
const push = jest.fn()
const toastShow = jest.fn()
const addToCart = jest.fn()
const getCart = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/fr/produit/1',
}))
jest.mock('next-intl', () => ({
  useLocale: () => 'fr',
  useTranslations: () => (key: string) => key,
}))
jest.mock('@/features/auth/hooks', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}))
jest.mock('@/features/toast/context', () => ({
  useToast: () => ({ show: toastShow }),
}))
jest.mock('@/lib/store/storage', () => ({
  getItem: (_k: string, d: unknown) => d,
  setItem: jest.fn(),
}))
jest.mock('@/lib/api/cart', () => ({
  getCart: (...a: unknown[]) => getCart(...a),
  addToCart: (...a: unknown[]) => addToCart(...a),
  updateCart: jest.fn(),
  removeFromCart: jest.fn(),
}))

function AddButton() {
  const { addItem } = useCart()
  return (
    <button onClick={() => addItem({ productId: 1, name: 'X', price: 10, quantity: 1, imageUrl: '', config: {} })}>
      add
    </button>
  )
}

function renderProvider() {
  return render(
    <CartProvider>
      <AddButton />
    </CartProvider>,
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  getCart.mockResolvedValue({ success: true, data: { items: [] } })
})

describe('CartProvider.addItem — error messaging by status code', () => {
  it('401 → shows a session-expired message and redirects to login', async () => {
    addToCart.mockResolvedValue({ success: false, code: 401, error: 'expired' })
    renderProvider()
    fireEvent.click(screen.getByText('add'))
    await waitFor(() => expect(toastShow).toHaveBeenCalledWith('error_session_expired', 'info'))
    expect(push).toHaveBeenCalledWith(expect.stringContaining('/login'))
  })

  it('503 (backend unreachable) → shows a transient "try again" message, no redirect', async () => {
    addToCart.mockResolvedValue({ success: false, code: 503, error: 'Odoo unreachable' })
    renderProvider()
    fireEvent.click(screen.getByText('add'))
    await waitFor(() => expect(toastShow).toHaveBeenCalledWith('error_unavailable', 'error'))
    expect(push).not.toHaveBeenCalled()
  })

  it('504 (timeout) → shows the transient "try again" message', async () => {
    addToCart.mockResolvedValue({ success: false, code: 504, error: 'timeout' })
    renderProvider()
    fireEvent.click(screen.getByText('add'))
    await waitFor(() => expect(toastShow).toHaveBeenCalledWith('error_unavailable', 'error'))
  })

  it('500 (other) → shows the generic add error', async () => {
    addToCart.mockResolvedValue({ success: false, code: 500, error: 'boom' })
    renderProvider()
    fireEvent.click(screen.getByText('add'))
    await waitFor(() => expect(toastShow).toHaveBeenCalledWith('error_add_generic', 'error'))
  })
})
