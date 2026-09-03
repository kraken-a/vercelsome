export type { NotificationType, Notification as AppNotification } from '@/types/notification'

export type NotificationsState = {
  items: Array<{
    id: number
    type: string
    title: string
    message: string
    read: boolean
    link?: string
    createdAt: string
  }>
  unreadCount: number
}
