export type User = {
  readonly id: number
  readonly name: string
  readonly email: string
  readonly phone?: string
  readonly avatar_url?: string
  readonly country_code?: string
}

export type ProfileAddress = {
  readonly street: string
  readonly city: string
  readonly zip: string
  readonly country: string
}

export type Profile = {
  readonly id: number
  readonly name: string
  readonly email: string
  readonly phone?: string
  readonly is_pro: boolean
  readonly collection_pref?: string
  readonly address?: ProfileAddress
  readonly project_count: number
  readonly wishlist_count: number
  readonly tz?: string
}

export type LoginRequest = {
  readonly email: string
  readonly password: string
}

export type RegisterRequest = {
  readonly name: string
  readonly email: string
  readonly password: string
  readonly phone?: string
  readonly country_code?: string
}
