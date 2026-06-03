'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { useCart } from '@/features/cart/hooks'
import { useWishlist } from '@/features/wishlist/hooks'
import type { CartItem } from '@/features/cart/types'
import { getSo1Info } from '@/lib/api/orders'

import Assurance from '@/components/assurance/assurance'
import './configure.css'

const ALLOWED_ORIGINS = [
    'https://oaksome.vercel.app',
    'https://oaksome-client.vercel.app',
]

const LOADER_HTML = (label: string) => `
  <div style="display:flex;flex-direction:column;align-items:center;gap:14px;font-family:sans-serif">
    <p style="margin:0;color:#333;font-size:1rem">${label}</p>
  </div>
`

function showOverlay(label: string): () => void {
    const overlay = document.createElement('div')
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '9998',
    })
    const notice = document.createElement('div')
    Object.assign(notice.style, {
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        padding: '20px 30px', background: '#fff',
        borderRadius: '4px', zIndex: '9999',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    })
    notice.innerHTML = LOADER_HTML(label)
    document.body.appendChild(overlay)
    document.body.appendChild(notice)
    return () => { overlay.remove(); notice.remove() }
}

const CFG_PER_PAGE = 8

interface OdooCategory {
    id: number
    name: string
}

interface OdooProduct {
    id: number
    name: string
    list_price: number
    is_premium: boolean
    image_1920: string | false
    image_1024: string | false
    public_categ_ids: OdooCategory[]
    style_ids: { id: number; name: string }[]
}

function imgSrc(b64: string | false): string {
    if (!b64) return '/images/stock/oaksome-v8-featured-vista.jpg'
    if (b64.startsWith('data:') || b64.startsWith('http')) return b64
    return `data:image/jpeg;base64,${b64}`
}

export default function ConfigurerPage() {
    const t = useTranslations('configurator')

    const iframeRef = useRef<HTMLIFrameElement>(null)
    const searchParams = useSearchParams()
    const params = useParams<{ locale: string }>()
    const locale = params?.locale === 'nl' || params?.locale === 'en' ? params.locale : 'fr'
    const iframeLocale = locale === 'nl' ? 'en' : locale

    const templateId = parseInt(searchParams.get('template_id') ?? '0', 10)
    const so1Id      = parseInt(searchParams.get('so1_id') ?? '0', 10) || null
    const width      = searchParams.get('width')
    const height     = searchParams.get('height')
    const depth      = searchParams.get('depth')
    const sid        = searchParams.get('_sid')

    const [activeFilter, setActiveFilter] = useState<'all' | number>('all')
    const [shown, setShown] = useState(CFG_PER_PAGE)
    const [categories, setCategories] = useState<OdooCategory[]>([])
    const [products, setProducts] = useState<OdooProduct[]>([])
    const [loadingProducts, setLoadingProducts] = useState(true)
    const [so1Name, setSo1Name] = useState<string | null>(null)
    const [partnerName, setPartnerName] = useState<string | null>(null)

    // Store so1_id silently for cart overlay SO2 flow + fetch SO1 info for technician mode
    useEffect(() => {
        if (!so1Id) return
        localStorage.setItem('oaksome_so1_id', String(so1Id))
        getSo1Info(so1Id).then(r => {
            if (!r.success) return
            setSo1Name(r.data.name)
            setPartnerName(r.data.partner_name)
        }).catch(() => {})
    }, [so1Id])

    const { addItem: addToCart, setCartOpen, refreshCart } = useCart()
    const { addItem: addToWishlist } = useWishlist()

    const handleMessage = useCallback(
        async (event: MessageEvent) => {
            const data: Record<string, unknown> = event.data || {}
            const action = data.action as string | undefined
            if (!action) return

            if (action === 'odooSession' && typeof data.session_id === 'string' && data.session_id) {
                document.cookie = `odoo_sid=${data.session_id}; path=/; SameSite=Lax`
                // Cookie set — re-fetch so existing Odoo cart items appear immediately.
                setTimeout(() => refreshCart(), 100)
                return
            }

            const isAllowed =
                ALLOWED_ORIGINS.includes(event.origin) ||
                event.origin === window.location.origin
            if (!isAllowed) return

            // iframe sends 'aricles' (typo) — accept both keys
            const articles = Array.isArray(data.articles) ? data.articles
                : Array.isArray(data.aricles) ? data.aricles
                : []
            if (!articles.length || !data.name) return

            if (action === 'addToCart') {
                const removeOverlay = showOverlay("We're crafting your product…")
                try {
                    const res = await fetch('/api/odoo/configurator', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ template_id: templateId, config_json: data, name: data.name }),
                    })
                    const result = await res.json()
                    const tmplId = (result?.product_tmpl_id as number) || (result?.product_id as number)
                    if (tmplId) {
                        const item: CartItem = {
                            productId: tmplId,
                            name: (result.product_name as string) || (data.name as string),
                            price: 0,
                            quantity: 1,
                            imageUrl: (result.image_base64 as string) || '',
                            config: data as Record<string, string>,
                        }
                        await addToCart(item)
                        setCartOpen(true)
                    } else {
                        // Product not resolved via configurator API — item may have been
                        // added directly in Odoo by the iframe; refresh to sync the count.
                        await refreshCart()
                        setCartOpen(true)
                    }
                } catch (err) {
                    console.error('[configurator] addToCart failed:', err)
                    await refreshCart()
                } finally {
                    removeOverlay()
                }
            } else if (action === 'fav') {
                const removeOverlay = showOverlay("We're crafting your wish…")
                try {
                    const res = await fetch('/api/odoo/configurator', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ template_id: templateId, config_json: data, name: data.name }),
                    })
                    const result = await res.json()
                    if (result?.product_id) {
                        addToWishlist(result.product_id as number, data as Record<string, unknown>)
                    }
                } catch (err) {
                    console.error('[configurator] fav failed:', err)
                } finally {
                    removeOverlay()
                }
            }
        },
        [templateId, addToCart, addToWishlist, setCartOpen, refreshCart],
    )

    useEffect(() => {
        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [handleMessage])

    // TASK-016: observability probe for the upstream 3D preview.
    // If the iframe finishes loading but no <canvas> exists after 5s, log a warning.
    // The contentDocument read is wrapped in try/catch to swallow cross-origin errors
    // (production upstream may serve from a different origin).
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const doc = iframeRef.current?.contentDocument
                if (doc && !doc.querySelector('canvas')) {
                    console.warn('[configurer] no canvas after 5s — upstream 3D preview not rendering')
                }
            } catch {
                // Cross-origin contentDocument — cannot inspect; assume upstream is responsible.
            }
        }, 5000)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        const safeJson = (r: Response) => r.ok ? r.json() : Promise.resolve([])
        Promise.all([
            fetch('/api/odoo/categories').then(safeJson).catch(() => []),
            fetch('/api/odoo/product').then(safeJson).catch(() => []),
        ]).then(([cats, prods]) => {
            setCategories(Array.isArray(cats) ? cats : [])
            setProducts(Array.isArray(prods) ? prods : [])
        }).finally(() => setLoadingProducts(false))
    }, [])

    const filtered = activeFilter === 'all'
        ? products
        : products.filter(p => p.public_categ_ids.some(c => c.id === activeFilter))
    const visible = filtered.slice(0, shown)

    return (
        <main id="main-content" tabIndex={-1}>
            <div className="breadcrumb container">
                <Link href="/">{t('breadcrumb_home')}</Link> &rsaquo; {t('breadcrumb_current')}
            </div>

            {so1Id && (
                <div style={{ background: '#0C524E', color: '#fff', padding: '0.85rem 1.5rem', fontSize: '0.85rem', lineHeight: 1.5, marginTop: '0.75rem' }}>
                    <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{t('tech_banner_mode')}</span>
                        <span>{t('tech_banner_so1')} <strong>{so1Name ?? `#${so1Id}`}</strong></span>
                        {partnerName && <span>{t('tech_banner_client')} <strong>{partnerName}</strong></span>}
                    </div>
                </div>
            )}

            <section style={{ padding: '24px 0 0' }}>
                <div className="container">
                    <div className="section-header" style={{ marginBottom: 0 }}>
                        <h1 style={{ fontSize: 'clamp(20px, 3vw, 31px)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                            {t('page_title')}
                        </h1>
                        <p style={{ maxWidth: 560, fontSize: 14, marginBottom: 0 }}>
                            {t('page_subtitle')}
                        </p>
                    </div>
                </div>
            </section>


            <div className="configurator-card" style={{width: '100%', height: '100vh'}}>
                <iframe
                    ref={iframeRef}
                    id="product-iframe"
                    data-template-id={templateId || undefined}
                    src={(() => {
                        const p = new URLSearchParams()
                        if (templateId) p.set('template', String(templateId))
                        if (width) p.set('width', width)
                        if (height) p.set('height', height)
                        if (depth) p.set('depth', depth)
                        const qs = p.toString()
                        return `https://oaksome-client.vercel.app/${iframeLocale}/article${qs ? `?${qs}` : ''}`
                    })()}
                    style={{width: '100%', height: '100%', border: 'none'}}
                    allow="fullscreen"
                    title="Configurateur 3D"
                />
            </div>

            <section style={{ padding: '48px 0' }}>
                <div className="container">
                    <div className="section-header" style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: 'clamp(20px, 3vw, 31px)' }}>
                            {t('grid_title')}
                        </h2>
                        <p style={{ fontSize: 14 }}>
                            {t('grid_subtitle')}
                        </p>
                    </div>

                    <div className="cfg-filters" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                        <button
                            className={`mc-chip${activeFilter === 'all' ? ' active' : ''}`}
                            onClick={() => { setActiveFilter('all'); setShown(CFG_PER_PAGE) }}
                        >
                            {t('filter_all')}
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`mc-chip${activeFilter === cat.id ? ' active' : ''}`}
                                onClick={() => { setActiveFilter(cat.id); setShown(CFG_PER_PAGE) }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div style={{ fontFamily: "'PP Air Mono', monospace", fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#000000', marginBottom: 16 }}>
                        {loadingProducts ? t('status_loading') : t('status_count', { visible: visible.length, total: filtered.length })}
                    </div>

                    <div id="configGrid" className="grid-4">
                        {loadingProducts
                            ? Array.from({ length: CFG_PER_PAGE }).map((_, i) => (
                                <div key={i} className="product-card product-card--skeleton" />
                            ))
                            : visible.map(p => {
                                const isAtelier = p.is_premium
                                const catName = p.public_categ_ids[0]?.name ?? ''
                                const collection = p.style_ids[0]?.name ?? ''
                                return (
                                    <div key={p.id} className="product-card">
                                        <div className="product-img">
                                            {isAtelier && <span className="tag-atelier">{t('tag_atelier')}</span>}
                                            <img
                                                src={imgSrc(p.image_1024 || p.image_1920)}
                                                alt={p.name}
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="product-info">
                                            <p className="price">{t('price_from', { price: p.list_price.toLocaleString('fr-BE') })}</p>
                                            <h4>{p.name}</h4>
                                            <div className="product-tags">
                                                {catName && <span className="product-tag">{catName}</span>}
                                                {collection && <span className="product-tag tag-collection">{collection}</span>}
                                            </div>
                                        </div>
                                        <div className="product-footer">
                                            <Link href={{ pathname: '/configurer', query: { template_id: String(p.id) } }} className="btn-configure">
                                                {t('btn_configure')}
                                            </Link>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>

                    {shown < filtered.length && (
                        <div style={{ textAlign: 'center', marginTop: 32 }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => setShown(prev => prev + CFG_PER_PAGE)}
                            >
                                {t('load_more')}
                            </button>
                        </div>
                    )}
                </div>
            </section>
            <Assurance/>
            <Script src="/oaksome-web/src/js/event_listener.js" strategy="afterInteractive" />
        </main>
    )
}
