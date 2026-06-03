'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { getProjects } from '@/lib/api/orders'
import type { Project } from '@/types/order'
import type { OakomeStatus } from '@/types/order'
import '@/css/commandes-page.css'

const STATUS_CLASSES: Record<string, string> = {
  cgv_pending: 'status-pending',
  deposit_pending: 'status-pending',
  measures_pending: 'status-pending',
  measures_scheduled: 'status-scheduled',
  plan_validated: 'status-scheduled',
  manufacturing: 'status-production',
  ready: 'status-production',
  delivering: 'status-production',
  done: 'status-delivered',
  '': 'status-pending',
}

function getStatusKey(p: Project) {
  if (p.state === 'cancel') return 'status_cancelled'
  const key = `status_${p.status || 'default'}`
  return key as 'status_default'
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

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(toDateLocale(locale), { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatPrice(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(toDateLocale(locale), {
    style: 'currency', currency: currency || 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount)
}

function OdooImageOrPlaceholder({ productId, alt }: { productId: number | null; alt: string }) {
  const odooUrl = process.env.NEXT_PUBLIC_ODOO_URL || ''
  if (!productId) {
    return (
      <Image
        src="/images/stock/dressing-satori.jpg"
        alt={alt}
        width={80}
        height={80}
        style={{ objectFit: 'cover' }}
      />
    )
  }
  return (
    <img
      src={`${odooUrl}/web/image/product.template/${productId}/image`}
      alt={alt}
      width={80}
      height={80}
      style={{ objectFit: 'cover', width: 80, height: 80 }}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/images/stock/dressing-satori.jpg'
      }}
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
    <div className="orders-empty">
      <p className="orders-empty-title">{t('loading')}</p>
    </div>
  )

  if (error) return (
    <div className="orders-empty">
      <p className="orders-empty-title">{t('error_title')}</p>
      <p className="orders-empty-sub">{error}</p>
    </div>
  )

  return (
    <div>
      <div className="commandes-header">
        <h1>{t('title')}</h1>
      </div>

      {projects.length === 0 ? (
        <div className="orders-empty">
          <p className="orders-empty-title">{t('empty_title')}</p>
          <p className="orders-empty-sub">{t('empty_sub')}</p>
          <Link href="/acheter" className="btn btn-primary orders-empty-cta">
            {t('empty_cta')}
          </Link>
        </div>
      ) : (
        projects.map((project) => {
          const cls = getStatusClass(project)
          const label = t(getStatusKey(project))
          return (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div className="project-card-header-left">
                  <OdooImageOrPlaceholder
                    productId={project.product_image_id}
                    alt={project.product_summary || project.name}
                  />
                  <div>
                    <div className="project-ref">{project.name}</div>
                    <div className="project-date">{formatDate(project.date, locale)}</div>
                    {project.product_summary && (
                      <div className="project-product-summary">{project.product_summary}</div>
                    )}
                  </div>
                </div>
                <div className="project-card-header-right">
                  <span className={`order-status ${cls}`}>{label}</span>
                  <div className="project-amount">{formatPrice(project.amount_total, project.currency, locale)}</div>
                </div>
              </div>

              <div className="project-card-footer">
                {project.so2_id ? (
                  <span className="project-so2-badge">{t('so2_available')}</span>
                ) : (
                  <span className="project-so2-pending">{t('so2_pending')}</span>
                )}
                <Link href={`/projets/${project.id}`} className="order-detail-link">
                  {t('see_project')}
                </Link>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
