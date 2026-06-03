export type NotificationType =
  | 'order'
  | 'delivery'
  | 'message'
  | 'promo'
  | 'system'

export type Notification = {
  readonly id: number
  readonly type: NotificationType
  readonly title: string
  readonly message: string
  readonly read: boolean
  readonly link?: string
  readonly created_at: string
}
