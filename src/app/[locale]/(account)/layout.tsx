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
    { href: '/profile' as const,      icon: '◉',  label: tl('nav_profile') },
    { href: '/projets' as const,      icon: '📦', label: tl('nav_projects') },
    { href: '/rendez-vous' as const,  icon: '📅', label: tl('nav_appointments') },
    { href: '/wishlist' as const,     icon: '♡',  label: tl('nav_wishlist') },
    { href: '/echantillons' as const, icon: '🎨', label: tl('nav_samples') },
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
    document.cookie = 'oaksome_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
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
                    <span className="nav-icon">↩</span>
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

      {pathname.includes('/projets') && <Assurance />}
    </main>
  )
}
