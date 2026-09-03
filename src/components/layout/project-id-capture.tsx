'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function ProjectIdCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const so1Id = searchParams.get('so1_id')
    if (so1Id && /^\d+$/.test(so1Id)) {
      localStorage.setItem('oaksome_so1_id', so1Id)
    }
  }, [searchParams])

  return null
}
