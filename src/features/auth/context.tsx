'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthState, User } from './types'
import { getProfile } from '@/lib/api/profile'

const INITIAL: AuthState = { user: null, isAuthenticated: false, isLoading: true }

type AuthContextValue = AuthState & {
  setUser: (user: User | null) => void
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL)

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    const result = await getProfile()
    if (result.success) {
      setState({
        user: {
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          isPro: result.data.is_pro,
          isInternal: result.data.is_internal ?? false,
        },
        isAuthenticated: true,
        isLoading: false,
      })
    } else {
      setState({ user: null, isAuthenticated: false, isLoading: false })
    }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('odoo-auth-updated', refresh)
    return () => window.removeEventListener('odoo-auth-updated', refresh)
  }, [refresh])

  const setUser = useCallback((user: User | null) => {
    setState({
      user,
      isAuthenticated: user !== null,
      isLoading: false,
    })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, setUser, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
