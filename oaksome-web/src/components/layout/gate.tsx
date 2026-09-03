'use client'

import { useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks'
import { useRouter, usePathname } from '@/i18n/navigation'

const PUBLIC_PATHS = ['/', '/login', '/register', '/password-recover', '/password-reset']

type Props = {
  children: React.ReactNode
  shell: React.ReactNode
  footer: React.ReactNode
}

export function GateGuard({ children, shell, footer }: Props) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublic) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, isPublic, router])

  if (isLoading) return null
  if (!isAuthenticated && !isPublic) return null

  if (isPublic) return <>{children}</>

  return (
    <>
      {shell}
      {children}
      {footer}
    </>
  )
}
