'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/features/auth/hooks'
import { logout } from '@/lib/api/auth'
import Assurance from '@/components/assurance/assurance'
import '@/css/account-layout.css'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('account')
  const tl = useTranslations('account.layout')
  const { isAuthenticated, isLoading, user, setUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const NAV_LINKS = [
    {
      href: '/profile' as const,
      label: tl('nav_profile'),
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
    {
      href: '/commandes' as const,
      label: tl('nav_projects'),
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    },
    {
      href: '/rendez-vous' as const,
      label: tl('nav_appointments'),
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="1"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    },
    {
      href: '/wishlist' as const,
      label: tl('nav_wishlist'),
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    },
    {
      href: '/echantillons' as const,
      label: tl('nav_samples'),
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    },
  ]

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthenticated, isLoading, pathname, router])

  if (isLoading) {
    return <div className="account-loading">{t('loading')}</div>
  }

  if (!isAuthenticated) {
    return null
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?'

  async function handleLogout() {
    await logout()
    setUser(null)
    router.push('/login')
  }

  return (
    <main id="main-content" tabIndex={-1} className="account-page">
      <div className="breadcrumb container">
        <Link href="/">{tl('breadcrumb_home')}</Link> › {tl('breadcrumb_current')}
      </div>

      <section style={{ paddingTop: '1rem' }}>
        <div className="container">
          <div className="account-layout">

            {/* Sidebar */}
            <aside className="account-sidebar">
              <div className="account-avatar">{initial}</div>
              <h3>{user?.name}</h3>
              <p className="account-email">{user?.email}</p>

              <ul className="sidebar-nav">
                {NAV_LINKS.map(({ href, icon, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={pathname.startsWith(href) ? 'active' : ''}
                    >
                      <span className="nav-icon">{icon}</span>
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <button className="sidebar-logout-btn" onClick={handleLogout}>
                    <span className="nav-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </span>
                    {t('logout')}
                  </button>
                </li>
              </ul>
            </aside>

            {/* Page content */}
            <div className="account-content">
              {children}
            </div>

          </div>
        </div>
      </section>

      {pathname.includes('/commandes') && <Assurance />}
    </main>
  )
}
