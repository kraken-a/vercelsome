export type CartItem = {
  id?: number
  productId: number
  name: string
  price: number
  quantity: number
  imageUrl: string
  image?: string

  config?: Record<string, unknown>
}

export type CartState = {
  items: CartItem[]
  totalItems: number
  subtotal: number
  tvaRate: number
  productTvaRate: number
}
