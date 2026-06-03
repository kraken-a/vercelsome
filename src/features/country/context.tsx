'use client'

import { createContext, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getItem, setItem } from '@/lib/store/storage'

const STORAGE_KEY = 'vercelsome-country'

export type Country = 'BE' | 'LU'

type CountryContextValue = {
  country: Country
  setCountry: (country: Country) => void
}

export const CountryContext = createContext<CountryContextValue | null>(null)

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<Country>('BE')

  useEffect(() => {
    const stored = getItem<Country>(STORAGE_KEY, 'BE')
    setCountryState(stored)
  }, [])

  const setCountry = useCallback((next: Country) => {
    setCountryState(next)
    setItem(STORAGE_KEY, next)
  }, [])

  return (
    <CountryContext.Provider value={{ country, setCountry }}>
      {children}
    </CountryContext.Provider>
  )
}
