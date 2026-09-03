'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useCart } from '@/features/cart/hooks'
import { useWishlist } from '@/features/wishlist/hooks'
import { useAuth } from '@/features/auth/hooks'
import { useToast } from '@/features/toast/context'
import { trackConfiguratorComplete, trackConfiguratorStart, trackConfiguratorStep } from '@/features/tracking/events'
import { getSo1Info } from '@/lib/api/orders'
import { createLead } from '@/lib/api/leads'

import Assurance from '@/components/assurance/assurance'
import { isAllowedOrigin, isValidSessionId, showOverlay } from './configurator-message'
import './configure.css'
import { NextRequest, NextResponse } from 'next/server';

const CFG_PER_PAGE = 8

interface OdooCategory {
    id: number
    name: string
}

interface OaksomeWebsite {
    oaksome_product_url_default?: string
}
interface Banner {
    id: number
    name: string
    image_url: string
}

interface OaksomeComboConfig {
    id: number
    name: string
    default_product_link: string
    oaksome_product_url_default: string | null
    banners: Banner[]
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
    webpage_url?: string
}

function imgSrc(b64: string | false): string {
    if (!b64) return '/images/stock/oaksome-v8-featured-vista.jpg'
    if (b64.startsWith('data:') || b64.startsWith('http')) return b64
    return `data:image/jpeg;base64,${b64}`
}

async function captureIframeScreenshot(): Promise<string | null> {
    try {
        if (!(window as Window & { html2canvas?: unknown }).html2canvas) {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script')
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
                script.onload = () => resolve()
                script.onerror = reject
                document.head.appendChild(script)
            })
        }
        const wrapper = document.querySelector('.configurator-card') as HTMLElement | null
        if (!wrapper || !document.body.contains(wrapper)) return null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canvas = await (window as any).html2canvas(wrapper)
        return canvas.toDataURL('image/png')
    } catch {
        return null
    }
}
export default function ConfigurerPage() {
    const t = useTranslations('configurator')

    const iframeRef = useRef<HTMLIFrameElement>(null)
    const searchParams = useSearchParams()
    const params = useParams<{ locale: string }>()
    const locale = params?.locale === 'nl' || params?.locale === 'en' ? params.locale : 'fr'
    const iframeLocale = locale === 'nl' ? 'en' : locale

    const templateId = parseInt(searchParams.get('id') ?? searchParams.get('template_id') ?? '0', 10)
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

    // Anon capture modal state
    const [anonModalOpen, setAnonModalOpen] = useState(false)
    const [anonModalName, setAnonModalName] = useState('')
    const [anonModalEmail, setAnonModalEmail] = useState('')
    const anonResolveRef = useRef<((v: { name: string; email: string } | null) => void) | null>(null)

    // Wishlist share modal state
    const [shareUrl, setShareUrl] = useState<string | null>(null)

    useEffect(() => {
        if (templateId) trackConfiguratorStart()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

    const { setCartOpen, refreshCart } = useCart()
    const { refreshWishlist } = useWishlist()
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const toast = useToast()

    // Stable refs so handleMessage sees current auth state without stale closure
    const isAuthRef = useRef(isAuthenticated)
    const authLoadingRef = useRef(authLoading)
    useEffect(() => {
        isAuthRef.current = isAuthenticated
        authLoadingRef.current = authLoading
    }, [isAuthenticated, authLoading])

    const handleMessage = useCallback(
        async (event: MessageEvent) => {
            // Origin gate first: no postMessage action runs for an unverified
            // sender — including the odooSession cookie handoff (TASK-043, H1).
            if (!isAllowedOrigin(event.origin)) return

            const data: Record<string, unknown> = event.data || {}
            const action = data.action as string | undefined

            const payload = data as {
                shape?: {
                    namespaces?: Record<string, Record<string, string>>;
                };
            };

            const namespaces = payload.shape?.namespaces ?? {};

            const parsedProducts = Object.entries(namespaces).map(([zoneName, values]) => ({
                zone: zoneName,
                reference: values.GECA_ART_MAIN,
                subArticles: [
                    values.WACA_SUB_ART_01,
                    values.WACA_SUB_ART_02,
                ].filter(Boolean),
                raw: values,
            }));

            console.log("Articles:", parsedProducts);
            if (!action) return

            if (action === 'odooSession') {
                // Validate the session id charset/length before the cookie write.
                if (!isValidSessionId(data.session_id)) return
                document.cookie = `odoo_sid=${data.session_id}; path=/; SameSite=Lax`
                // Cookie set — re-fetch so existing Odoo cart items appear immediately.
                setTimeout(() => refreshCart(), 100)
                return
            }

            if (action === 'configuratorStep' && typeof data.step_name === 'string' && typeof data.step_number === 'number') {
                trackConfiguratorStep(data.step_name, data.step_number)
                return
            }

            // iframe sends 'aricles' (typo) — accept both keys
            const legacyArticles =
                Array.isArray(data.articles) ? data.articles
                    : Array.isArray(data.aricles) ? data.aricles
                        : null;

            const articles = legacyArticles ?? parsedProducts;
            if (!articles.length || !data.name) return
            console.log('finished subproducts : ',articles)
            // Anonymous users must identify before add-to-cart / fav.
            // Mirror event_listener.js: show modal → call send_config_email → get user_id/session_id → createLead.
            let capturedEmail: string | null = null
            let capturedUserId: number | null = null

            if (!isAuthRef.current && !authLoadingRef.current) {
                const anonResult = await new Promise<{ name: string; email: string } | null>((resolve) => {
                    anonResolveRef.current = resolve
                    setAnonModalOpen(true)
                })
                setAnonModalOpen(false)
                setAnonModalName('')
                setAnonModalEmail('')
                if (!anonResult) return

                capturedEmail = anonResult.email

                // Create/find portal user, get their user_id and a session_id to set.
                try {
                    const userResult = await fetch('/api/odoo/send-config-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: capturedEmail }),
                    }).then(r => r.json())
                    capturedUserId = (userResult?.user_id as number) || null
                    if (userResult?.session_id && isValidSessionId(userResult.session_id)) {
                        document.cookie = `odoo_sid=${userResult.session_id}; path=/; SameSite=Lax`
                        setTimeout(() => refreshCart(), 100)
                    }
                } catch { /* non-blocking */ }

                // Fire-and-forget CRM lead.
                createLead({
                    name: anonResult.name || capturedEmail.split('@')[0],
                    email: capturedEmail,
                    origin: action === 'addToCart' ? 'cart' : 'wishlist',
                    config_data: data,
                }).catch(() => {})
            }

            if (action === 'addToCart') {
                const response = await fetch(`/api/pricing`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(
                        {body:data.shape,name:data.pricing}
                    ),
                });
                console.log('pricing : ',response)

                if (!response.ok) {
                    const err = await response.json().catch(() => null);
                    console.error('Pricing error:', err);
                    return;
                }

                const pricing = await response.json();
                console.log('Pricing:', pricing.totalPrice);

                const xmlData = data.xmlFile as { content?: string; filename?: string } | undefined
                const xmlDoc = xmlData?.content
                    ? new DOMParser().parseFromString(xmlData.content, 'application/xml')
                    : null

                const removeOverlay = showOverlay("We're crafting your product…")
                try {
                    const screenshotBase64 = data.image as string;
                    // console.log('image :', screenshotBase64)

                    // Strip xmlFile — handled separately by /api/odoo/json-config
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { xmlFile: _xmlFile, ...configForOdoo } = data as Record<string, unknown>

                    const result = await fetch('/api/odoo/configurator', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            config_json: configForOdoo,
                            pricing: pricing.totalPrice,
                            name: data.name,
                            ...(screenshotBase64 ? { image_base64: screenshotBase64 } : {}),
                            ...(capturedUserId ? { user_id: capturedUserId } : {}),
                            ...(templateId ? { product_tmpl_id: templateId } : {}),
                        }),
                    }).then(r => r.json())

                    console.log('result :', result)

                    if (result?.product_id && !result?.already_exists) {
                        if (capturedEmail) {
                            const productUrl = result.shareable_link || `/shop/product/${result.product_id}`
                            fetch('/api/odoo/send-config-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: capturedEmail, product_url: productUrl }),
                            }).catch(() => {})
                        }

                        if (xmlDoc) {
                            const xmlContent = new XMLSerializer().serializeToString(xmlDoc)
                            const xmlBase64 = btoa(unescape(encodeURIComponent(xmlContent)))
                            fetch('/api/odoo/json-config', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    product_id: result.product_id,
                                    add_qty: 1,
                                    custom_config: { ...data, sub_ids: result.sub_ids || [] },
                                    display: true,
                                    xml_file: {
                                        filename: xmlData?.filename || 'config.xml',
                                        content_base64: xmlBase64,
                                    },
                                    ...(capturedUserId ? { user_id: capturedUserId } : {}),
                                }),
                            }).catch(err => console.warn('[configurator] json-config patch failed:', err))
                        }

                        trackConfiguratorComplete({
                            productId: result.product_id as number,
                            collection: (data.style as string) || (data.collection as string) || '',
                            estimatedPrice: (data.price as number) || 0,
                            dimensions: { width: data.width || 0, height: data.height || 0, depth: data.depth || 0 },
                        })
                    }

                    toast.show(
                        result?.already_exists ? 'Configuration déjà dans votre panier' : 'Configuration ajoutée au panier !',
                        'success',
                    )
                    await refreshCart()
                    if (!result?.already_exists) setCartOpen(true)
                } catch (err) {
                    console.error('[configurator] addToCart failed:', err)
                    await refreshCart()
                } finally {
                    removeOverlay()
                }
            } else if (action === 'fav') {

                const response = await fetch('/api/pricing', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(
                        data.shape
                    ),
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => null);
                    console.error('Pricing error:', err);
                    return;
                }

                const pricing = await response.json();
                const removeOverlay = showOverlay("We're crafting your wish…")
                try {
                    const screenshotBase64 = await captureIframeScreenshot()

                    // Strip xmlFile — not needed for wishlist/fav flow
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { xmlFile: _xmlFile, ...configForOdoo } = data as Record<string, unknown>

                    const result = await fetch('/api/odoo/configurator', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            config_json: configForOdoo,
                            pricing: pricing.totalPrice,
                            name: data.name,
                            ...(screenshotBase64 ? { image_base64: screenshotBase64 } : {}),
                            ...(capturedUserId ? { user_id: capturedUserId } : {}),
                        }),
                    }).then(r => r.json())

                    toast.show(
                        result?.already_exists ? 'Configuration déjà dans votre wishlist' : 'Configuration sauvegardée dans votre wishlist !',
                        'success',
                    )
                    await refreshWishlist()

                    if (!result?.already_exists) {
                        if (capturedEmail) {
                            const productUrl = result.shareable_link || result.product_url || `/shop/product/${result.product_id}`
                            fetch('/api/odoo/send-config-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: capturedEmail, product_url: productUrl }),
                            }).catch(() => {})
                        }
                        if (typeof result?.shareable_link === 'string' && result.shareable_link) {
                            setShareUrl(result.shareable_link)
                        }
                    }
                } catch (err) {
                    console.error('[configurator] fav failed:', err)
                } finally {
                    removeOverlay()
                }
            }
        },
        [templateId, setCartOpen, refreshCart, refreshWishlist, toast],
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
        const safeJson = (r: Response) => r.ok ? r.json() : Promise.resolve(null)

        Promise.all([
            fetch('/api/odoo/categories').then(r => r.ok ? r.json() : []),
            fetch('/api/odoo/product').then(r => r.ok ? r.json() : []),
            fetch('/api/oaksome/v1/combo-config').then(safeJson),
        ]).then(([cats, prods, comboConfig]) => {
            setCategories(Array.isArray(cats) ? cats : [])
            setProducts(Array.isArray(prods) ? prods : [])
            setWebsiteConfig(comboConfig)  // Now comboConfig has oaksome_product_url_default
        }).finally(() => setLoadingProducts(false))
    }, [])

    const filtered = activeFilter === 'all'
        ? products
        : products.filter(p => p.public_categ_ids.some(c => c.id === activeFilter))
    const visible = filtered.slice(0, shown)

    const [websiteConfig, setWebsiteConfig] = useState<OaksomeWebsite | null>(null);
    const product = products.find(p => p.id === templateId);

    const baseUrl =
    product?.webpage_url ||
    websiteConfig?.oaksome_product_url_default ||
    "https://oaks-indol.vercel.app/shape/OS_SHAPE_CMB_1111"

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
                        if (templateId) p.set('id', String(templateId))
                        if (width) p.set('width', width)
                        if (height) p.set('height', height)
                        if (depth) p.set('depth', depth)
                        const qs = p.toString()
                        return `${baseUrl}${qs ? `?${qs}` : ''}`
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
                                            <Link href={{ pathname: '/configurer', query: { id: String(p.id) } }} className="btn-configure">
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

            {/* Anonymous email capture — shown before add-to-cart / fav for non-logged-in users */}
            {anonModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="anon-cfg-title"
                    onClick={() => { anonResolveRef.current?.(null); setAnonModalOpen(false) }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <form
                        onClick={e => e.stopPropagation()}
                        onSubmit={e => {
                            e.preventDefault()
                            anonResolveRef.current?.({ name: anonModalName, email: anonModalEmail })
                        }}
                        style={{ background: '#fff', padding: '2rem', width: 440, maxWidth: '90vw', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}
                    >
                        <button
                            type="button"
                            onClick={() => { anonResolveRef.current?.(null); setAnonModalOpen(false) }}
                            aria-label="Fermer"
                            style={{ position: 'absolute', top: '0.75rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#696761', lineHeight: 1 }}
                        >×</button>
                        <h3 id="anon-cfg-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                            Enregistrez votre configuration
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#696761' }}>
                            Laissez-nous votre contact pour sauvegarder et partager votre projet.
                        </p>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
                            Nom
                            <input
                                type="text"
                                value={anonModalName}
                                onChange={e => setAnonModalName(e.target.value)}
                                autoComplete="name"
                                style={{ padding: '0.6rem 0.8rem', border: '1px solid #ccc', fontSize: '0.95rem', fontFamily: 'inherit' }}
                            />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
                            E-mail *
                            <input
                                type="email"
                                required
                                value={anonModalEmail}
                                onChange={e => setAnonModalEmail(e.target.value)}
                                autoComplete="email"
                                style={{ padding: '0.6rem 0.8rem', border: '1px solid #ccc', fontSize: '0.95rem', fontFamily: 'inherit' }}
                            />
                        </label>
                        <button
                            type="submit"
                            style={{ padding: '0.85rem 1.5rem', background: '#0C524E', color: '#fff', border: 'none', fontSize: '1rem', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}
                        >
                            Continuer
                        </button>
                    </form>
                </div>
            )}

            {/* Share modal shown after fav when Odoo returns a shareable link */}
            {shareUrl && (
                <div
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setShareUrl(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ background: '#fff', padding: '2rem', width: 480, maxWidth: '90vw', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}
                    >
                        <button
                            type="button"
                            onClick={() => setShareUrl(null)}
                            aria-label="Fermer"
                            style={{ position: 'absolute', top: '0.75rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#696761', lineHeight: 1 }}
                        >×</button>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Configuration sauvegardée !</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#696761' }}>
                            Partagez votre configuration avec ce lien :
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="url"
                                readOnly
                                value={shareUrl}
                                onFocus={e => e.currentTarget.select()}
                                style={{ flex: 1, padding: '0.6rem 0.8rem', border: '1px solid #ccc', fontSize: '0.85rem', fontFamily: 'monospace', minWidth: 0 }}
                            />
                            <button
                                type="button"
                                onClick={() => { navigator.clipboard?.writeText(shareUrl).catch(() => {}) }}
                                style={{ padding: '0.6rem 1rem', background: '#0C524E', color: '#fff', border: 'none', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                                Copier
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShareUrl(null)}
                            style={{ alignSelf: 'flex-end', padding: '0.6rem 1.5rem', background: 'transparent', color: '#0C524E', border: '1px solid #0C524E', fontSize: '0.9rem', cursor: 'pointer' }}
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}
