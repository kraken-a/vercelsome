'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { getProjects } from '@/lib/api/orders'
import type { Project } from '@/types/order'
import type { OakomeStatus } from '@/types/order'
import '@/css/commandes-page.css'

const STATUS_CLASSES: Record<string, string> = {
  cgv_pending: 'status-pending', deposit_pending: 'status-pending',
  measures_pending: 'status-pending', measures_scheduled: 'status-scheduled',
  plan_validated: 'status-scheduled', manufacturing: 'status-production',
  ready: 'status-production', delivering: 'status-production',
  done: 'status-delivered', '': 'status-pending',
}

function getStatusClass(p: Project) {
  if (p.state === 'cancel') return 'status-cancelled'
  return STATUS_CLASSES[p.status as OakomeStatus] ?? 'status-pending'
}

function toDateLocale(locale: string) {
  if (locale === 'nl') return 'nl-BE'
  if (locale === 'en') return 'en-GB'
  return 'fr-BE'
}

function formatShortDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}.${mm}.${yy}`
}

function formatLongDate(iso: string | null, locale: string): string {
  if (!iso) return '—'
  return new Date(iso)
    .toLocaleDateString(toDateLocale(locale), { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase()
}

function formatMonthLabel(iso: string | null, locale: string): string {
  if (!iso) return ''
  return new Date(iso)
    .toLocaleDateString(toDateLocale(locale), { month: 'long', year: 'numeric' })
    .toUpperCase()
}

function formatPrice(amount: number, _currency: string): string {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

function getMonthKey(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}`
}

type Group = { monthKey: string; monthLabel: string; projects: Project[] }

function groupByMonth(projects: Project[], locale: string): Group[] {
  const groups: Group[] = []
  for (const p of projects) {
    const key = getMonthKey(p.date)
    const last = groups[groups.length - 1]
    if (last && last.monthKey === key) {
      last.projects.push(p)
    } else {
      groups.push({ monthKey: key, monthLabel: formatMonthLabel(p.date, locale), projects: [p] })
    }
  }
  return groups
}

function OdooImg({ productId, alt }: { productId: number | null; alt: string }) {
  const odooUrl = process.env.NEXT_PUBLIC_ODOO_URL || ''
  return (
    <img
      src={productId ? `${odooUrl}/web/image/product.template/${productId}/image` : '/images/stock/dressing-satori.jpg'}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={(e) => { (e.target as HTMLImageElement).src = '/images/stock/dressing-satori.jpg' }}
    />
  )
}

export default function ProjetPage() {
  const t = useTranslations('account.projects')
  const locale = useLocale()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    getProjects().then(result => {
      if (result.success) {
        const d = result.data as { projects?: Project[] }
        setProjects(d.projects ?? [])
      } else {
        setError(result.error)
      }
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="orders-empty"><p className="orders-empty-title">{t('loading')}</p></div>
  )
  if (error) return (
    <div className="orders-empty">
      <p className="orders-empty-title">{t('error_title')}</p>
      <p className="orders-empty-sub">{error}</p>
    </div>
  )

  const groups = groupByMonth(projects, locale)

  return (
    <div className="oh-content">
      <div className="oh-tabs">
        <button className="oh-tab oh-tab--active">{t('tab_orders')}</button>
        <button className="oh-tab" disabled>{t('tab_returns')}</button>
      </div>

      {projects.length === 0 ? (
        <div className="orders-empty">
          <p className="orders-empty-title">{t('empty_title')}</p>
          <p className="orders-empty-sub">{t('empty_sub')}</p>
          <Link href="/acheter" className="btn btn-primary orders-empty-cta">{t('empty_cta')}</Link>
        </div>
      ) : (
        <div className="oh-orders">
          {groups.map((group, gi) => (
            <div key={group.monthKey} className="oh-group">
              {gi > 0 && <span className="oh-date-group">{group.monthLabel}</span>}
              <div className="oh-group-cards">
                {group.projects.map(project => {
                  const statusClass = getStatusClass(project)
                  return (
                    <article key={project.id} className="past-order">
                      <div className="past-order-image">
                        <OdooImg productId={project.product_image_id} alt={project.name} />
                      </div>
                      <div className="past-order-infos">
                        <div className="past-order-top">
                          <div className="past-order-left">
                            <span className="past-order-ref">{project.name}</span>
                            <div className="past-order-status">
                              <span className={`past-order-status-label ${statusClass}`}>
                                {t(`status_${project.status || 'default'}` as 'status_default')}
                              </span>
                              {project.date && (
                                <span className="past-order-status-date">&nbsp;· {formatShortDate(project.date)}</span>
                              )}
                            </div>
                          </div>
                          <div className="past-order-meta">
                            <span className="past-order-price">{formatPrice(project.amount_total, project.currency)}</span>
                            <span className="past-order-meta-sub">{project.product_count} {t('articles')}</span>
                            <span className="past-order-meta-sub">{formatLongDate(project.date, locale)}</span>
                          </div>
                        </div>
                        <div className="past-order-bottom">
                          <Link href={`/commandes/${project.so1_id}`} className="past-order-action">
                            {t('order_detail')}
                          </Link>
                          <span className="past-order-sep" />
                          <button className="past-order-action past-order-action--inert">{t('make_return')}</button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
