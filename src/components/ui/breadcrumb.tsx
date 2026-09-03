'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function Breadcrumb() {
  const pathname = usePathname()
  const tLabels = useTranslations('breadcrumb.labels')
  const tBc = useTranslations('breadcrumb')
  const segments = pathname.split('/').filter(Boolean)

  const parts = segments.length > 0 && segments[0].length === 2 ? segments.slice(1) : segments

  if (parts.length === 0) return null

  const crumbs = parts.map((seg, i) => {
    const href = '/' + segments.slice(0, i + (segments.length > parts.length ? 2 : 1)).join('/')
    const fallback = decodeURIComponent(seg).replace(/-/g, ' ')
    let label = fallback
    try {
      label = tLabels(seg)
    } catch {
      // unknown segment slug — fall back to humanized path segment
    }
    return { href, label }
  })

  return (
    <nav className="breadcrumb" aria-label={tBc('aria_label')}>
      <Link href="/">{tBc('home')}</Link>
      {crumbs.map((c, i) => (
        <span key={c.href}>
          {' / '}
          {i === crumbs.length - 1 ? (
            <span style={{ color: '#696761' }}>{c.label}</span>
          ) : (
            <Link href={c.href}>{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  )
}
