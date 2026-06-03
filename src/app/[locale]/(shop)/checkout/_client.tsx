'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Link, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCart } from '@/features/cart/hooks'
import { useAuth } from '@/features/auth/hooks'
import { getCheckoutUrl, confirmOrder } from '@/lib/api/cart'
import { getPaymentProviders, processPayment } from '@/lib/api/payment'
import type { PaymentProvider } from '@/lib/api/payment'
import { getProfile } from '@/lib/api/profile'
import { getProjectDetail } from '@/lib/api/orders'
import type { ProjectDetail } from '@/types/order'
import { trackBeginCheckout } from '@/features/tracking/events'
import { TvaStep } from '@/components/checkout/tva-step'
import Assurance from '@/components/assurance/assurance'

function toCurrencyLocale(locale: string) {
  if (locale === 'nl') return 'nl-BE'
  if (locale === 'en') return 'en-BE'
  return 'fr-BE'
}

function fmt(price: number, locale: string) {
  return new Intl.NumberFormat(toCurrencyLocale(locale), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
}

function fmtAmount(price: number, locale: string) {
  return new Intl.NumberFormat(toCurrencyLocale(locale), { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)
}

function providerLabel(code: string, name: string, t: ReturnType<typeof useTranslations<'shop.checkout'>>): string {
  if (code === 'demo') return t('provider_demo')
  if (code === 'custom') return t('provider_wire')
  return name
}

export default function CheckoutPage() {
  const t = useTranslations('shop.checkout')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { cart, setTvaRate, loading: cartLoading } = useCart()

  const prebuiltOrderId = searchParams.get('order') ? Number(searchParams.get('order')) : null
  const prebuiltOrderName = searchParams.get('ref') ?? null
  const prebuiltNotifId = searchParams.get('notif') ?? null
  const isSo2Checkout = searchParams.get('so2') === '1'
  const projectParam = searchParams.get('project') ? Number(searchParams.get('project')) : null


  const [so2Project, setSo2Project] = useState<ProjectDetail | null>(null)
  const [showTvaModal, setShowTvaModal] = useState(false)
  const [tvaChecked, setTvaChecked] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [providers, setProviders] = useState<PaymentProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')

  const [form, setForm] = useState({
    email: '', phone: '',
    firstName: '', lastName: '',
    street: '', zip: '', city: '', country: 'Belgique',
  })

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace({ pathname: '/login', query: { next: '/checkout' } })
    }
  }, [authLoading, isAuthenticated, router])

  // Pre-fill form from profile
  useEffect(() => {
    if (!isAuthenticated) return
    if (user?.email) setForm(f => ({ ...f, email: user.email }))
    getProfile().then(res => {
      if (!res.success) return
      const p = res.data
      const nameParts = (p.name ?? '').split(' ')
      setForm(f => ({
        ...f,
        email: p.email ?? f.email,
        phone: p.phone ?? '',
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' '),
        street: p.address?.street ?? '',
        zip: p.address?.zip ?? '',
        city: p.address?.city ?? '',
        country: p.address?.country ?? 'Belgique',
      }))
    })
  }, [isAuthenticated, user])

  // Load payment providers
  useEffect(() => {
    if (!isAuthenticated) return
    getPaymentProviders().then(res => {
      if (!res.success) return
      const list = res.data.providers
      setProviders(list)
      if (list.length > 0 && !selectedProvider) {
        setSelectedProvider(list[0].code)
      }
    })
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // SO2 checkout: fetch project details for the order summary
  useEffect(() => {
    if (!isSo2Checkout || !projectParam || !isAuthenticated) return
    getProjectDetail(projectParam).then(res => {
      if (!res.success) return
      setSo2Project(res.data)
      const so2 = res.data.so2
      if (so2 && so2.amount_untaxed > 0) {
        const rate = so2.amount_tax / so2.amount_untaxed
        setTvaRate(rate < 0.1 ? 0.06 : 0.21)
      }
    })
  }, [isSo2Checkout, projectParam, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show TVA modal on mount (Phase 1 = Belgique)
  useEffect(() => {
    if (!authLoading && isAuthenticated && cart.items.length > 0 && !tvaChecked) {
      setShowTvaModal(true)
    }
  }, [authLoading, isAuthenticated, cart.items.length, tvaChecked])

  function handleTvaDone(buildingYear?: number) {
    if (!buildingYear) setTvaRate(0.21)
    setShowTvaModal(false)
    setTvaChecked(true)
  }

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [key]: e.target.value })),
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProvider) { setError(t('error_no_provider')); return }
    setConfirming(true)
    setError('')
    try {
      trackBeginCheckout(
        cart.items.map(i => ({ id: i.productId, price: i.price, quantity: i.quantity })),
        cart.subtotal,
      )

      let orderId: number | null = prebuiltOrderId
      let orderName: string | null = prebuiltOrderName

      if (orderId) {
        const confirmRes = await confirmOrder(orderId)
        if (!confirmRes.success) throw new Error(confirmRes.error)
        orderName = confirmRes.data.order_name
      } else {
        // Items are already in vercelsome.cart.item (added by cart context via /cart/add).
        // Call checkout-url directly — no need to re-sync.
        const urlRes = await getCheckoutUrl(cart.tvaRate === 0.06)
        if (!urlRes.success) throw new Error(urlRes.error)
        orderId = urlRes.data.order_id
        orderName = urlRes.data.order_name
      }
      if (orderId) {
        const payRes = await processPayment(orderId, selectedProvider)
        if (!payRes.success) throw new Error(payRes.error)
      }
      // Snapshot cart before Odoo clears it — success page reads this for purchase tracking.
      try {
        sessionStorage.setItem('vercelsome_purchase_cart', JSON.stringify({ items: cart.items, subtotal: cart.subtotal }))
      } catch {}
      const qs = new URLSearchParams()
      if (orderId) qs.set('order', String(orderId))
      if (orderName) qs.set('ref', orderName)
      if (prebuiltNotifId) qs.set('notif', prebuiltNotifId)
      if (isSo2Checkout) qs.set('so2', '1')
      if (isSo2Checkout && projectParam) qs.set('project', String(projectParam))
      router.push({ pathname: '/checkout/success', query: Object.fromEntries(qs.entries()) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setConfirming(false)
    }
  }

  if (authLoading || !isAuthenticated) return null
  if (cartLoading) return null
  if (cart.items.length === 0 && !prebuiltOrderId) { router.replace('/panier'); return null }

  return (
    <>
      {showTvaModal && (
        <TvaStep
          subtotal={cart.subtotal}
          onConfirmAction={handleTvaDone}
          onCloseAction={handleTvaDone}
        />
      )}

      {/* Breadcrumb */}
      <div className="breadcrumb container">
        <Link href="/">{t('breadcrumb_home')}</Link> › <Link href="/panier">{t('breadcrumb_cart')}</Link> ›{' '}
        <span style={{ color: '#696761' }}>{t('breadcrumb_current')}</span>
      </div>

      <section style={{ paddingBottom: '3rem' }}>
        <div className="container">

          {/* Step indicator */}
          <div className="co-steps">
            <div className="co-step done"><span className="co-num">✓</span><span>{t('step_info')}</span></div>
            <div className="co-line" />
            <div className="co-step done"><span className="co-num">✓</span><span>{t('step_delivery')}</span></div>
            <div className="co-line" />
            <div className="co-step active"><span className="co-num">3</span><span>{t('step_payment')}</span></div>
          </div>

          <form onSubmit={handleConfirm}>
            <div className="co-layout">

              {/* ── Gauche : formulaire ── */}
              <div>
                {/* Contact */}
                <h4 className="co-section-title">{t('section_contact')}</h4>
                <div className="co-group">
                  <label>{t('label_email')}</label>
                  <input type="email" required {...field('email')} />
                </div>
                <div className="co-group">
                  <label>{t('label_phone')}</label>
                  <input type="tel" placeholder={t('ph_phone')} {...field('phone')} />
                </div>

                {/* Livraison */}
                <h4 className="co-section-title">{t('section_delivery')}</h4>
                <div className="co-row">
                  <div className="co-group">
                    <label>{t('label_first_name')}</label>
                    <input type="text" placeholder={t('ph_first_name')} required {...field('firstName')} />
                  </div>
                  <div className="co-group">
                    <label>{t('label_last_name')}</label>
                    <input type="text" placeholder={t('ph_last_name')} required {...field('lastName')} />
                  </div>
                </div>
                <div className="co-group">
                  <label>{t('label_street')}</label>
                  <input type="text" placeholder={t('ph_street')} required {...field('street')} />
                </div>
                <div className="co-row">
                  <div className="co-group">
                    <label>{t('label_zip')}</label>
                    <input type="text" placeholder={t('ph_zip')} required {...field('zip')} />
                  </div>
                  <div className="co-group">
                    <label>{t('label_city')}</label>
                    <input type="text" placeholder={t('ph_city')} required {...field('city')} />
                  </div>
                </div>
                <div className="co-group">
                  <label>{t('label_country')}</label>
                  <select {...field('country')}>
                    <option value="Belgique">{t('country_be')}</option>
                    <option value="Luxembourg">{t('country_lu')}</option>
                    <option value="France">{t('country_fr')}</option>
                    <option value="Pays-Bas">{t('country_nl')}</option>
                  </select>
                </div>

                {/* Paiement */}
                <h4 className="co-section-title">{t('section_payment')}</h4>
                {providers.length === 0 ? (
                  <p style={{ fontSize: '0.9rem', color: '#696761' }}>{t('loading_providers')}</p>
                ) : (
                  <>
                    <div className="co-payment-pills">
                      {providers.map(p => (
                        <button
                          key={p.code}
                          type="button"
                          className={`co-pill${selectedProvider === p.code ? ' active' : ''}`}
                          onClick={() => setSelectedProvider(p.code)}
                        >
                          {providerLabel(p.code, p.name, t)}
                        </button>
                      ))}
                    </div>

                    {selectedProvider === 'demo' && (
                      <>
                        <div className="co-group">
                          <label>{t('label_card_number')}</label>
                          <input type="text" placeholder={t('ph_card_number')} />
                        </div>
                        <div className="co-row">
                          <div className="co-group">
                            <label>{t('label_expiry')}</label>
                            <input type="text" placeholder={t('ph_expiry')} />
                          </div>
                          <div className="co-group">
                            <label>{t('label_cvv')}</label>
                            <input type="text" placeholder={t('ph_cvv')} />
                          </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#696761', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                          {t('test_mode_note')}
                        </p>
                      </>
                    )}

                    {selectedProvider === 'custom' && (
                      <div className="co-group">
                        <div style={{ fontSize: '0.9rem', color: '#696761', padding: '1rem', background: '#fff', border: '1px solid #e8e5df', lineHeight: 1.6 }}>
                          {t('wire_note')}
                        </div>
                      </div>
                    )}

                    {selectedProvider && selectedProvider !== 'demo' && selectedProvider !== 'custom' && (
                      <div className="co-group">
                        <div style={{ fontSize: '0.9rem', color: '#696761', padding: '1rem', background: '#fff', border: '1px solid #e8e5df' }}>
                          {t('generic_provider_note')}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div style={{ background: '#fff0f0', border: '1px solid #e53e3e', padding: '0.9rem 1.2rem', marginBottom: '1rem', fontSize: '0.9rem', color: '#e53e3e' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={confirming}
                  className="btn btn-primary"
                  style={{ width: '100%', textAlign: 'center', display: 'block', marginTop: '1rem', opacity: confirming ? 0.7 : 1, cursor: confirming ? 'wait' : 'pointer' }}
                >
                  {confirming ? t('btn_confirm_loading') : t('btn_confirm')}
                </button>
                {confirming && (
                  <p style={{ fontSize: '0.8rem', color: '#696761', textAlign: 'center', marginTop: '0.5rem' }}>
                    {t('confirm_wait_note')}
                  </p>
                )}
                <p style={{ fontSize: '0.8rem', color: '#696761', textAlign: 'center', marginTop: '0.8rem' }}>
                  {t('secure_note')}
                </p>
                <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                  <Link href="/panier" style={{ fontSize: '0.85rem', color: '#696761', textDecoration: 'none' }}>{t('back_to_cart')}</Link>
                </div>
              </div>

              {/* ── Droite : résumé ── */}
              <div>
                <div className="co-summary">
                  {isSo2Checkout && so2Project?.so2 ? (
                    /* ── Récap SO2 ── */
                    (() => {
                      const so2 = so2Project.so2!
                      const currency = so2Project.currency
                      const so1Paid = so2Project.payment_schedule?.so1_deposit?.amount ?? 0
                      const amountDue = Math.max(0, so2.amount_total * 0.9 - so1Paid)
                      const tvaLabel = cart.tvaRate === 0.06 ? '6 %' : '21 %'
                      const so2Products = so2Project.products.filter(p => p.so2 && p.so2.qty > 0)
                      return (
                        <>
                          <h3>{t('summary_final_title')}</h3>
                          <p style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono,monospace)', color: '#696761', marginTop: '-1rem', marginBottom: '1rem', letterSpacing: '0.03em' }}>
                            {so2.name}
                          </p>

                          {/* Produits SO2 */}
                          {so2Products.map(p => (
                            <div key={p.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid #e8e5df', fontSize: '0.95rem' }}>
                              <span style={{ fontWeight: 500 }}>
                                {p.product_name}
                                {p.so2!.qty > 1 && <span style={{ color: '#696761', marginLeft: '0.3rem' }}>×{p.so2!.qty}</span>}
                              </span>
                              <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtAmount(p.so2!.price_subtotal, locale)}</span>
                            </div>
                          ))}

                          <hr style={{ border: 'none', borderTop: '1px solid #e8e5df', margin: '1rem 0' }} />

                          {/* Détail paiement */}
                          <div style={{ background: '#F6F5F0', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                              <span style={{ color: '#696761' }}>{t('so2_total_order')}</span>
                              <span style={{ fontWeight: 600 }}>{fmtAmount(so2.amount_total, locale)}</span>
                            </div>
                            {so1Paid > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span style={{ color: '#696761' }}>{t('so2_deposit_paid')}</span>
                                <span style={{ color: '#0C524E' }}>−{fmtAmount(so1Paid, locale)}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700, borderTop: '1px solid #e8e5df', paddingTop: '0.45rem', marginTop: '0.1rem' }}>
                              <span>{t('so2_second_deposit')}</span>
                              <span style={{ color: '#0C524E' }}>{fmtAmount(amountDue, locale)}</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#696761', margin: 0 }}>
                              {t('so2_final_balance')}
                            </p>
                          </div>

                          <hr style={{ border: 'none', borderTop: '1px solid #e8e5df', margin: '1rem 0' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', fontWeight: 600 }}>
                            <span>{t('summary_total')}</span>
                            <span>{fmtAmount(amountDue, locale)}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#696761', textAlign: 'right', marginTop: '0.2rem' }}>{t('summary_tva_incl', { rate: tvaLabel })}</p>
                        </>
                      )
                    })()
                  ) : (
                    /* ── Récap panier normal ── */
                    <>
                      <h3>{t('summary_title')}</h3>
                      {cart.items.map(item => (
                        <div key={item.productId} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.7rem 0', borderBottom: '1px solid #e8e5df' }}>
                          <div style={{ width: 56, height: 56, background: '#ece9e2', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                            {item.imageUrl
                              ? <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="56px" />
                              : <div style={{ width: '100%', height: '100%', background: '#ece9e2' }} />
                            }
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{item.name}</div>
                            {item.config && (() => {
                              const cfg = item.config!
                              const dim = cfg['dimension'] as Record<string, unknown> | undefined
                              const dimParts = dim ? [
                                dim['height'] && `H ${dim['height']}`,
                                dim['width']  && `W ${dim['width']}`,
                                dim['depth']  && `D ${dim['depth']}`,
                              ].filter(Boolean).join(' × ') : null
                              const arts = (cfg['aricles'] ?? cfg['articles']) as unknown[] | undefined
                              return (
                                <>
                                  {dimParts && <div style={{ fontFamily: "'PP Air Mono', monospace", fontSize: '0.72rem', color: '#0C524E', letterSpacing: '0.03em' }}>{dimParts} cm</div>}
                                  {Array.isArray(arts) && arts.map((art, i) => {
                                    if (!art || typeof art !== 'object') return null
                                    const a = art as Record<string, unknown>
                                    const label = String(a['name'] ?? a['label'] ?? '')
                                    if (!label) return null
                                    return <div key={i} style={{ fontSize: '0.72rem', color: '#696761' }}>{label}</div>
                                  })}
                                </>
                              )
                            })()}
                            {item.quantity > 1 && <div style={{ fontSize: '0.75rem', color: '#696761' }}>×{item.quantity}</div>}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{fmt(item.price * item.quantity, locale)}</span>
                        </div>
                      ))}

                      <hr style={{ border: 'none', borderTop: '1px solid #e8e5df', margin: '1rem 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.95rem' }}>
                        <span style={{ color: '#696761' }}>{t('summary_subtotal')}</span>
                        <span style={{ fontWeight: 500 }}>{fmtAmount(cart.subtotal, locale)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.95rem' }}>
                        <span style={{ color: '#696761' }}>
                          {t('summary_tva')} {cart.tvaRate === 0.06
                            ? <span style={{ color: '#0C524E', fontWeight: 600 }}>6 %</span>
                            : '21 %'}
                        </span>
                        <span style={{ fontWeight: 500 }}>{fmtAmount(cart.subtotal * cart.tvaRate, locale)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.95rem' }}>
                        <span style={{ color: '#696761' }}>{t('summary_delivery')}</span>
                        <span style={{ fontWeight: 500, color: '#0C524E' }}>{t('summary_delivery_value')}</span>
                      </div>
                      <hr style={{ border: 'none', borderTop: '1px solid #e8e5df', margin: '1rem 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', fontWeight: 600 }}>
                        <span>{t('summary_total')}</span>
                        <span>{fmtAmount(cart.subtotal * (1 + cart.tvaRate), locale)}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#696761', textAlign: 'right', marginTop: '0.2rem' }}>{t('summary_tva_incl', { rate: cart.tvaRate === 0.06 ? '6 %' : '21 %' })}</p>
                    </>
                  )}
                </div>
              </div>

            </div>
          </form>
        </div>
      </section>

      <Assurance />

      <style>{`
        .co-layout { display: grid; grid-template-columns: 1.4fr 1fr; gap: 3rem; padding-top: 0.5rem; align-items: start; }
        .co-steps { display: flex; align-items: center; padding: 1.2rem 0 2rem; }
        .co-step { display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; color: #696761; }
        .co-num { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; background: #e8e5df; color: #696761; }
        .co-step.done .co-num { background: #1a1a1a; color: #fff; }
        .co-step.done { color: #0C524E; }
        .co-step.active .co-num { background: #1a1a1a; color: #fff; }
        .co-step.active { color: #1a1a1a; font-weight: 500; }
        .co-line { flex: 1; height: 1px; background: #e8e5df; margin: 0 0.8rem; }
        .co-section-title { font-size: 1.1rem; font-weight: 600; color: #1a1a1a; margin-bottom: 1.2rem; margin-top: 1.8rem; }
        .co-section-title:first-of-type { margin-top: 0; }
        .co-group { margin-bottom: 1.3rem; }
        .co-group label { display: block; font-size: 0.95rem; font-weight: 400; margin-bottom: 0.4rem; color: #696761; }
        .co-group input, .co-group select { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #e8e5df; border-radius: 0; font-size: 1rem; font-family: inherit; background: #fff; transition: border-color 500ms ease-out; box-sizing: border-box; }
        .co-group input:focus, .co-group select:focus { outline: none; border-color: #0C524E; }
        .co-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .co-payment-pills { display: flex; gap: 0.6rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .co-pill { padding: 0.6rem 1.4rem; border: 1.5px solid #e8e5df; border-radius: 0; font-size: 0.95rem; cursor: pointer; background: #fff; color: #696761; font-family: inherit; transition: all 500ms ease-out; }
        .co-pill:hover { border-color: #0C524E; }
        .co-pill.active { border-color: #1a1a1a; background: #1a1a1a; color: #fff; font-weight: 500; }
        .co-summary { position: sticky; top: 110px; background: #fff; padding: 2rem; border: 1px solid #e8e5df; }
        .co-summary h3 { font-size: 1.2rem; margin-bottom: 1.5rem; }
        @media (max-width: 768px) {
          .co-layout { grid-template-columns: 1fr; }
          .co-row { grid-template-columns: 1fr; }
          .co-steps { flex-wrap: wrap; gap: 0.5rem; }
          .co-line { display: none; }
        }
      `}</style>
    </>
  )
}
