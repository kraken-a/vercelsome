'use client'

import { useContext } from 'react'
import { CountryContext } from './context'

export function useCountry() {
  const ctx = useContext(CountryContext)
  if (!ctx) {
    throw new Error('useCountry must be used within a CountryProvider')
  }
  return ctx
}
