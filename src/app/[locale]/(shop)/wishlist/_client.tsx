'use client'

import React, {useState, useCallback} from 'react'
import {useLocale, useTranslations} from 'next-intl'
import {Link} from '@/i18n/navigation'
import {useWishlist} from '@/features/wishlist/hooks'
import {useCart} from '@/features/cart/hooks'
import {useToast} from '@/features/toast/context'
import type {WishlistItem} from '@/features/wishlist/types'
import type {CartItem} from '@/features/cart/types'

function currencyLocale(locale: string) {
    return locale === 'nl' ? 'nl-BE' : locale === 'en' ? 'en-BE' : 'fr-BE'
}

function fmt(price: number, locale: string) {
    return new Intl.NumberFormat(currencyLocale(locale), {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
    }).format(price)
}

/* ── Share modal ────────────────────────────────────────────────── */

type ShareModalProps = {
    productId: number | null
    config?: Record<string, unknown>
    onClose: () => void
}

function ShareModal({productId, config, onClose}: ShareModalProps) {
    const [copied, setCopied] = useState(false)
    const locale = useLocale()
    const t = useTranslations('shop.wishlist')
    if (!productId) return null

    const shareUrl = (() => {
        const path = `/${locale}/configurer`
        const base = typeof window !== 'undefined' ? window.location.origin : ''
        return `${base}${path}?id=${productId}`
    })()

    const encode = (u: string) => encodeURIComponent(u)
    const platforms = [
        {label: 'WhatsApp', href: `https://api.whatsapp.com/send?text=${encode(shareUrl)}`},
        {label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encode(shareUrl)}`},
        {label: 'X / Twitter', href: `https://twitter.com/intent/tweet?url=${encode(shareUrl)}`},
        {label: 'Telegram', href: `https://t.me/share/url?url=${encode(shareUrl)}`},
        {label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encode(shareUrl)}`},
    ]

    function handleCopy() {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    return (
        <>
            <div
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onClick={onClose}
            >
                <div
                    style={{
                        background: '#fff', borderRadius: 4, padding: '2rem',
                        width: 420, maxWidth: '90vw', position: 'relative',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '1rem', right: '1rem',
                            background: 'none', border: 'none', fontSize: '1.5rem',
                            cursor: 'pointer', color: '#696761', lineHeight: 1,
                        }}
                        aria-label={t('close_modal')}
                    >
                        ×
                    </button>

                    <h3 style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.4rem'}}>
                        {t('share_title')}
                    </h3>
                    <p style={{fontSize: '0.9rem', color: '#696761', marginBottom: '1.2rem'}}>
                        {t('share_desc')}
                    </p>

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: '#f7f7f5', padding: '0.6rem 0.8rem',
                        marginBottom: '1.2rem',
                    }}>
            <span style={{
                flex: 1,
                fontSize: '0.85rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
              {shareUrl}
            </span>
                        <button
                            onClick={handleCopy}
                            style={{
                                padding: '0.4rem 0.9rem', border: '1.5px solid #1a1a1a',
                                background: copied ? '#0C524E' : '#fff',
                                color: copied ? '#fff' : '#1a1a1a',
                                fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer',
                                transition: 'all 200ms ease',
                            }}
                        >
                            {copied ? t('share_copied') : t('share_copy')}
                        </button>
                    </div>

                    <div style={{display: 'flex', gap: '0.6rem', flexWrap: 'wrap'}}>
                        {platforms.map(p => (
                            <a
                                key={p.label}
                                href={p.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: '0.5rem 0.9rem', border: '1.5px solid #e0ddd7',
                                    fontSize: '0.8rem', textDecoration: 'none', color: '#1a1a1a',
                                    transition: 'border-color 200ms ease',
                                }}
                            >
                                {p.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

/* ── Wishlist item row ──────────────────────────────────────────── */

type WishlistItemRowProps = {
    item: WishlistItem
    onShare: (productId: number, config: Record<string, unknown>) => void
}

function WishConfigLines({config}: { config: Record<string, unknown> }) {
    const lines: React.ReactNode[] = []
    const form = config['form'] as Record<string, unknown> | undefined

    const toCm = (val: unknown): number | null => {
        const n = Number(val)
        return Number.isFinite(n) ? n / 10 : null
    }

    if (form) {
        const height = form['ZF_HEIGHT'] !== undefined ? toCm(form['ZF_HEIGHT']) : null
        const width = form['ZF_WIDTH'] !== undefined ? toCm(form['ZF_WIDTH']) : null
        const depth = form['ZF_DEPTH'] !== undefined ? toCm(form['ZF_DEPTH']) : null

        const parts: string[] = []
        if (height) parts.push(`H ${height}`)
        if (width) parts.push(`W ${width}`)
        if (depth) parts.push(`D ${depth}`)

        if (parts.length) lines.push(
            <span key="dim" style={{
                fontFamily: "'PP Air Mono', monospace",
                fontSize: '0.8rem',
                color: '#0C524E',
                letterSpacing: '0.03em'
            }}>
        {parts.join(' × ')} cm
      </span>
        )

        const colorLabel = form['ZF_HW_COLOR']
        if (typeof colorLabel === 'string' && colorLabel) {
            lines.push(
                <span key="color" style={{fontSize: '0.88rem', color: '#696761'}}>
          {colorLabel}
        </span>
            )
        }
    }

    if (!lines.length) return null
    return <div style={{display: 'flex', flexDirection: 'column', gap: '0.2rem'}}>{lines}</div>
}

function WishlistItemRow({item, onShare, onRemoved}: WishlistItemRowProps & { onRemoved: (id: number) => void }) {
    const {addItem: addToCartItem} = useCart()
    const {removeItem: removeFromWishlistItem} = useWishlist()
    const toast = useToast()
    const locale = useLocale()
    const t = useTranslations('shop.wishlist')
    const [addingToCart, setAddingToCart] = useState(false)
    const [removing, setRemoving] = useState(false)

    const configurerHref = { pathname: '/configurer' as const, query: { id: String(item.productId) } }
    async function handleAddToCart() {
        setAddingToCart(true)
        try {
            const cartItem: CartItem = {
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: 1,
                imageUrl: item.imageUrl,
                config: item.rawConfig,
            }
            const added = await addToCartItem(cartItem)
            if (!added) return
            await removeFromWishlistItem(item.id)
            onRemoved(item.id)
            toast.show(t('toast_moved_cart'))
        } catch (err) {
            console.error('[wishlist] move-to-cart failed:', err)
            toast.show(t('toast_error_cart'), 'error')
        } finally {
            setAddingToCart(false)
        }
    }

    async function handleRemove() {
        setRemoving(true)
        try {
            await removeFromWishlistItem(item.id)
            onRemoved(item.id)
        } catch (err) {
            console.error('[wishlist] remove failed:', err)
            setRemoving(false)
        }
    }

    return (
        <div className="wish-item">
            <button
                className="wish-delete"
                onClick={handleRemove}
                disabled={removing}
                aria-label={t('aria_delete')}
                title={t('aria_delete')}
            >
                ×
            </button>
            <div style={{
                width: 120, height: 120, background: '#ece9e2',
                position: 'relative', flexShrink: 0, overflow: 'hidden',
            }}>
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name}
                         style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                ) : (
                    <div style={{width: '100%', height: '100%', background: '#ece9e2'}}/>
                )}
            </div>
            <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem'}}>
                <span style={{fontSize: '1.05rem', fontWeight: 500}}>{item.name}</span>
                {item.rawConfig && <WishConfigLines config={item.rawConfig}/>}
                <span style={{fontSize: '1.1rem', fontWeight: 600, marginTop: 'auto'}}>{fmt(item.price, locale)}</span>
            </div>
            <div className="wish-actions">
                <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="btn btn-primary wish-btn-cart"
                >
                    {addingToCart ? t('btn_adding') : t('btn_add_to_cart')}
                </button>
                <button
                    onClick={() => onShare(item.productId, item.rawConfig ?? {})} className="wish-btn-share"
                    aria-label={t('btn_share')}
                >
                    {t('btn_share')}
                </button>
                <Link
                    href={configurerHref}
                    className="wish-btn-edit"
                >
                    {t('btn_edit')}
                </Link>
            </div>
        </div>
    )
}

/* ── Page ───────────────────────────────────────────────────────── */

export default function WishlistPage() {
    const {wishlist, loading} = useWishlist()
    const t = useTranslations('shop.wishlist')
    const shopT = useTranslations('shop')
    const [removedIds, setRemovedIds] = useState<Set<number>>(new Set())
    const [shareTarget, setShareTarget] = useState<{ productId: number; config: Record<string, unknown> } | null>(null)

    function handleShare(productId: number, config: Record<string, unknown>) {
        setShareTarget({productId, config})
    }


    const handleRemoved = useCallback((id: number) => {
        setRemovedIds(prev => new Set(prev).add(id))
    }, [])

    const visibleItems = wishlist.items.filter(i => !removedIds.has(i.id))

    return (
        <>
            <div className="breadcrumb container">
                <Link href="/">{shopT('breadcrumb_home')}</Link> ›{' '}
                <span style={{color: '#696761'}}>{t('breadcrumb_current')}</span>
            </div>

            <section style={{paddingTop: '1rem', paddingBottom: '4rem'}}>
                <div className="container">
                    <h1 style={{fontSize: '2rem', fontWeight: 600, marginBottom: '0.3rem'}}>
                        {t('title')}{' '}
                        {!loading && (
                            <span style={{fontSize: '1rem', color: '#696761', fontWeight: 400}}>
                {t(wishlist.count === 1 ? 'count_one' : 'count_other', {count: wishlist.count})}
              </span>
                        )}
                    </h1>

                    {loading ? (
                        <p style={{color: '#696761', marginTop: '2rem'}}>{t('loading')}</p>
                    ) : visibleItems.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '5rem 2rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                        }}>
                            <div style={{fontSize: '4rem', opacity: 0.25, marginBottom: '1.5rem'}}>♡</div>
                            <h2 style={{fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.8rem'}}>
                                {t('empty_title')}
                            </h2>
                            <p style={{color: '#696761', maxWidth: 380, marginBottom: '2rem'}}>
                                {t('empty_desc')}
                            </p>
                            <Link href="/acheter" className="btn btn-primary">{t('empty_cta')}</Link>
                        </div>
                    ) : (
                        <div style={{marginTop: '1.5rem'}}>
                            {visibleItems.map(item => (
                                <WishlistItemRow key={item.id} item={item} onShare={handleShare}
                                                 onRemoved={handleRemoved}/>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {shareTarget && (
                <ShareModal
                    productId={shareTarget.productId}
                    config={shareTarget.config}
                    onClose={() => setShareTarget(null)}
                />
            )}
            <style>{`
        .wish-item {
          position: relative;
          display: grid;
          grid-template-columns: 120px 1fr auto;
          gap: 1.5rem;
          padding: 1.5rem 0;
          border-top: 1px solid var(--border, #e0ddd7);
          align-items: start;
        }
        .wish-delete {
          position: absolute;
          top: 1.2rem;
          right: 0;
          background: none;
          border: none;
          font-size: 1.3rem;
          color: #aaa;
          cursor: pointer;
          line-height: 1;
          padding: 0.2rem;
          transition: color 200ms ease;
        }
        .wish-delete:hover { color: #1a1a1a; }
        .wish-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: stretch;
          min-width: 160px;
        }
        .wish-btn-cart {
          font-size: 0.85rem;
          padding: 0.6rem 1rem;
          text-align: center;
        }
        .wish-btn-share,
        .wish-btn-edit {
          background: none;
          border: 1.5px solid var(--border, #e0ddd7);
          color: #1a1a1a;
          font-size: 0.85rem;
          font-family: inherit;
          padding: 0.5rem 1rem;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          display: block;
          transition: border-color 200ms ease, background 200ms ease;
        }
        .wish-btn-share:hover,
        .wish-btn-edit:hover {
          border-color: #1a1a1a;
          background: #f7f7f5;
        }
        @media (max-width: 640px) {
          .wish-item {
            grid-template-columns: 90px 1fr;
          }
          .wish-actions {
            grid-column: 1 / -1;
            flex-direction: row;
            min-width: 0;
          }
        }
      `}</style>
        </>
    )
}
