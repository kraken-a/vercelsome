export type ConfiguratorStep =
  | 'type'
  | 'collection'
  | 'facade'
  | 'color'
  | 'dimensions'
  | 'price'

export type Dimensions = {
  width: number
  depth: number
  height: number
}

export type ConfiguratorState = {
  currentStep: ConfiguratorStep
  stepNumber: number
  totalSteps: number
  typeSlug: string | null
  collectionSlug: string | null
  facade: string | null
  color: string | null
  dimensions: Dimensions | null
  estimatedPrice: number | null
}

export const STEPS: ConfiguratorStep[] = [
  'type',
  'collection',
  'facade',
  'color',
  'dimensions',
  'price',
]

export const INITIAL_STATE: ConfiguratorState = {
  currentStep: 'type',
  stepNumber: 1,
  totalSteps: STEPS.length,
  typeSlug: null,
  collectionSlug: null,
  facade: null,
  color: null,
  dimensions: null,
  estimatedPrice: null,
}
