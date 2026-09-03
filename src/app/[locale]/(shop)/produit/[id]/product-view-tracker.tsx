'use client'

import { useEffect } from 'react'
import { trackViewItem } from '@/features/tracking/events'

type Props = {
  id: number
  name: string
  category: string
  collection: string
  price: number
}

export function ProductViewTracker({ id, name, category, collection, price }: Props) {
  useEffect(() => {
    trackViewItem({ id, name, category, variant: collection, price })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
