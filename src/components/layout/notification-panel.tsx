'use client'

import { useState } from 'react'
import { useTranslations, useFormatter } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useNotifications } from '@/features/notifications/hooks'
import { useAuth } from '@/features/auth/hooks'
import { So2ConfirmModal } from '@/components/notifications/so2-confirm-modal'
import { deleteNotification } from '@/lib/api/notifications'

type TFn = (key: string, values?: Record<string, string | number>) => string

function relativeTime(iso: string, t: TFn, format: ReturnType<typeof useFormatter>): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) {
    const n = Math.max(1, mins)
    return t(n === 1 ? 'time_min_one' : 'time_min_other', { count: n })
  }
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) {
    return t(hrs === 1 ? 'time_hour_one' : 'time_hour_other', { count: hrs })
  }
  return format.dateTime(new Date(iso), { day: 'numeric', month: 'short' })
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  order: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M16 3H8L6 7h12z" />
    </svg>
  ),
  delivery: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  message: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  promo: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  system: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  ),
}

type So2ModalState = { projectId: number; so2Id: number; notificationId: number } | null

export function NotificationBell() {
  const t = useTranslations('nav.notifications')
  const format = useFormatter()
  const [open, setOpen] = useState(false)
  const [so2Modal, setSo2Modal] = useState<So2ModalState>(null)
  const { isAuthenticated } = useAuth()
  const { items, unreadCount, markRead, refresh } = useNotifications()
  const [dismissing, setDismissing] = useState<Set<number>>(new Set())

  function open_panel() {
    const unreadIds = items.filter((i) => !i.read).map((i) => i.id)
    if (unreadIds.length > 0) markRead(unreadIds)
    setOpen(true)
  }

  function close() {
    setOpen(false)
  }

  async function handleDismiss(notifId: number, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDismissing(prev => new Set(prev).add(notifId))
    try {
      await deleteNotification(notifId)
      await refresh()
    } finally {
      setDismissing(prev => { const s = new Set(prev); s.delete(notifId); return s })
    }
  }

  function handleNotifClick(link: string, notifId: number, e: React.MouseEvent) {
    if (link.includes('so2_confirm=')) {
      e.preventDefault()
      const url = new URL(link, location.origin)
      const parts = url.pathname.replace(/\/$/, '').split('/')
      const projectId = parseInt(parts[parts.length - 1] || '0')
      const so2Id = parseInt(url.searchParams.get('so2_confirm') || '0')
      if (projectId && so2Id) {
        close()
        setSo2Modal({ projectId, so2Id, notificationId: notifId })
      }
    } else {
      close()
      deleteNotification(notifId).then(() => refresh()).catch(() => {})
    }
  }

  return (
    <>
      <div className={`notif-overlay${open ? ' open' : ''}`} id="notifOverlay" onClick={close} />

      <button
        className="nav-bell nav-icon"
        onClick={() => (open ? close() : open_panel())}
        aria-label={t('aria_bell')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          position: 'relative',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && !open && (
          <span className="bell-badge" data-count={unreadCount}>
            {unreadCount}
          </span>
        )}
      </button>

      <div className={`notif-panel${open ? ' open' : ''}`} id="notifPanel">
        <div className="notif-header">
          <h3>{t('title')}</h3>
          <button className="notif-close" onClick={close} aria-label={t('aria_close')}>
            ×
          </button>
        </div>

        <ul className="notif-list">
          {!isAuthenticated ? (
            <li
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: '#696761',
                fontSize: '14px',
              }}
            >
              <Link href="/login" style={{ color: '#0C524E', textDecoration: 'underline' }}>
                {t('login_cta')}
              </Link>
              {t('login_suffix')}
            </li>
          ) : items.length === 0 ? (
            <li
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: '#696761',
                fontSize: '14px',
              }}
            >
              {t('empty_authed')}
            </li>
          ) : (
            items.map((item) => {
              const dismissBtn = (
                <button
                  className="notif-dismiss"
                  onClick={(e) => handleDismiss(item.id, e)}
                  aria-label="Supprimer la notification"
                  disabled={dismissing.has(item.id)}
                >
                  ×
                </button>
              )

              const inner = (
                <>
                  <div className="notif-thumb-wrap">
                    <div
                      className="notif-thumb"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#F6F5F0',
                        color: '#0C524E',
                      }}
                    >
                      {TYPE_ICONS[item.type] ?? TYPE_ICONS.system}
                    </div>
                    {!item.read && <span className="notif-dot" />}
                  </div>
                  <div className="notif-content">
                    <p className="notif-title">{item.title}</p>
                    <p className="notif-desc">{item.message}</p>
                    <span className="notif-time">{relativeTime(item.createdAt, t, format)}</span>
                  </div>
                  <div className="notif-right">
                    {dismissBtn}
                    {item.link && <span className="notif-arrow">→</span>}
                  </div>
                </>
              )

              const cls = `notif-item${!item.read ? ' unread' : ''}`

              return item.link ? (
                <li key={item.id}>
                  <a href={item.link} className={cls} onClick={(e) => handleNotifClick(item.link!, item.id, e)}>
                    {inner}
                  </a>
                </li>
              ) : (
                <li key={item.id} className={cls}>
                  {inner}
                </li>
              )
            })
          )}
        </ul>
      </div>

      {so2Modal && (
        <So2ConfirmModal
          projectId={so2Modal.projectId}
          so2Id={so2Modal.so2Id}
          notificationId={so2Modal.notificationId}
          onCloseAction={() => { setSo2Modal(null); refresh() }}
        />
      )}
    </>
  )
}
