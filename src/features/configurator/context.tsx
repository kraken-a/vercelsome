'use client'

import { createContext, useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import {
  INITIAL_STATE,
  STEPS,
  type ConfiguratorState,
  type ConfiguratorStep,
  type Dimensions,
} from './types'

type ConfiguratorContextValue = {
  state: ConfiguratorState
  setType: (slug: string) => void
  setCollection: (slug: string) => void
  setFacade: (facade: string) => void
  setColor: (color: string) => void
  setDimensions: (dimensions: Dimensions) => void
  setPrice: (price: number) => void
  goToStep: (step: ConfiguratorStep) => void
  nextStep: () => void
  prevStep: () => void
  reset: () => void
}

export const ConfiguratorContext =
  createContext<ConfiguratorContextValue | null>(null)

export function ConfiguratorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfiguratorState>(INITIAL_STATE)

  const goToStep = useCallback((step: ConfiguratorStep) => {
    const idx = STEPS.indexOf(step)
    setState((prev) => ({ ...prev, currentStep: step, stepNumber: idx + 1 }))
  }, [])

  const nextStep = useCallback(() => {
    setState((prev) => {
      const idx = STEPS.indexOf(prev.currentStep)
      if (idx >= STEPS.length - 1) return prev
      const next = STEPS[idx + 1]
      return { ...prev, currentStep: next, stepNumber: idx + 2 }
    })
  }, [])

  const prevStep = useCallback(() => {
    setState((prev) => {
      const idx = STEPS.indexOf(prev.currentStep)
      if (idx <= 0) return prev
      const next = STEPS[idx - 1]
      return { ...prev, currentStep: next, stepNumber: idx }
    })
  }, [])

  const setType = useCallback(
    (slug: string) => {
      setState((prev) => ({ ...prev, typeSlug: slug }))
      nextStep()
    },
    [nextStep],
  )

  const setCollection = useCallback(
    (slug: string) => {
      setState((prev) => ({ ...prev, collectionSlug: slug }))
      nextStep()
    },
    [nextStep],
  )

  const setFacade = useCallback(
    (facade: string) => {
      setState((prev) => ({ ...prev, facade }))
      nextStep()
    },
    [nextStep],
  )

  const setColor = useCallback(
    (color: string) => {
      setState((prev) => ({ ...prev, color }))
      nextStep()
    },
    [nextStep],
  )

  const setDimensions = useCallback(
    (dimensions: Dimensions) => {
      setState((prev) => ({ ...prev, dimensions }))
      nextStep()
    },
    [nextStep],
  )

  const setPrice = useCallback((price: number) => {
    setState((prev) => ({ ...prev, estimatedPrice: price }))
  }, [])

  const reset = useCallback(() => {
    setState(INITIAL_STATE)
  }, [])

  return (
    <ConfiguratorContext.Provider
      value={{
        state,
        setType,
        setCollection,
        setFacade,
        setColor,
        setDimensions,
        setPrice,
        goToStep,
        nextStep,
        prevStep,
        reset,
      }}
    >
      {children}
    </ConfiguratorContext.Provider>
  )
}
