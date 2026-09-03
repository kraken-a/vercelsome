import { apiGet, apiPost, apiDelete } from './client'
import type { Result } from './client'
import type { Notification } from '@/types/notification'

export type NotificationParams = {
  readonly unread_only?: string
  readonly limit?: string
  readonly lang?: string
}

export type NotificationsResponse = {
  readonly notifications: readonly Notification[]
  readonly unread_count: number
}

export type MarkReadResponse = {
  readonly marked_count: number
  readonly unread_count: number
}

export async function getNotifications(
  params?: NotificationParams,
): Promise<Result<NotificationsResponse>> {
  const queryParams: Record<string, string> = {}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams[key] = value
    })
  }
  return apiGet<NotificationsResponse>(
    '/notifications',
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
  )
}

export async function markAsRead(
  ids: number[],
): Promise<Result<MarkReadResponse>> {
  return apiPost<MarkReadResponse>('/notifications/mark-read', {
    notification_ids: ids,
  })
}

export async function deleteNotification(id: number): Promise<Result<{ deleted: boolean }>> {
  return apiDelete<{ deleted: boolean }>(`/notifications/${id}`)
}
