export type User = {
  id: number
  name: string
  email: string
  isPro: boolean
}

export type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
