'use client'

import { useContext } from 'react'
import { ConfiguratorContext } from './context'

export function useConfigurator() {
  const ctx = useContext(ConfiguratorContext)
  if (!ctx) {
    throw new Error('useConfigurator must be used within a ConfiguratorProvider')
  }
  return ctx
}
