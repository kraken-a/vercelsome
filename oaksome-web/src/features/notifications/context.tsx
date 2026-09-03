'use client'

import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { NotificationsState } from './types'
import { getNotifications, markAsRead } from '@/lib/api/notifications'
import { useAuth } from '@/features/auth/hooks'
import { useLocale } from 'next-intl'

const POLL_INTERVAL = 30_000
const EMPTY: NotificationsState = { items: [], unreadCount: 0 }

type NotificationsContextValue = NotificationsState & {
  markRead: (ids: number[]) => Promise<void>
  refresh: () => Promise<void>
}

export const NotificationsContext =
  createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const locale = useLocale()
  const [state, setState] = useState<NotificationsState>(EMPTY)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    const result = await getNotifications({ unread_only: 'true', limit: '20', lang: locale })
    if (result.success) {
      const items = result.data.notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        link: n.link,
        createdAt: n.created_at,
      }))
      setState({ items, unreadCount: result.data.unread_count })
    }
  }, [isAuthenticated, locale])

  useEffect(() => {
    if (!isAuthenticated) {
      setState(EMPTY)
      return
    }
    refresh()
    intervalRef.current = setInterval(refresh, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isAuthenticated, refresh])

  const markRead = useCallback(async (ids: number[]) => {
    const result = await markAsRead(ids)
    if (result.success) {
      setState((prev) => ({
        items: prev.items.map((item) =>
          ids.includes(item.id) ? { ...item, read: true } : item,
        ),
        unreadCount: result.data.unread_count,
      }))
    }
  }, [])

  return (
    <NotificationsContext.Provider value={{ ...state, markRead, refresh }}>
      {children}
    </NotificationsContext.Provider>
  )
}
