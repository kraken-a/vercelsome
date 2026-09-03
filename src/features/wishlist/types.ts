export type WishlistItem = {
  readonly id: number
  readonly productId: number
  readonly name: string
  readonly price: number
  readonly imageUrl: string
  readonly config?: Record<string, string>
  readonly rawConfig?: Record<string, unknown>
  readonly favDate?: string
}

export type WishlistState = {
  readonly items: ReadonlyArray<WishlistItem>
  readonly count: number
}
