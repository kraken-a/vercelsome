'use client'

import { useEffect, useState } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useCart } from '@/features/cart/hooks'
import { useAuth } from '@/features/auth/hooks'
import { getCheckoutUrl, confirmOrder } from '@/lib/api/cart'
import { getPaymentProviders, processPayment, getSo2Balance, processFinalPayment, processShowroomCheckout, getShowroomProduct, getKitProduct, processKitCheckout, getAvailableDeductions } from '@/lib/api/payment'
import type { PaymentProvider, So2Balance, AvailableDeduction } from '@/lib/api/payment'
import { bookAppointment } from '@/lib/api/appointments'
import { getProfile, addAddress } from '@/lib/api/profile'
import type { ProfileAddress } from '@/types/user'
import { getProjectDetail } from '@/lib/api/orders'
import type { ProjectDetail } from '@/types/order'
import { trackBeginCheckout } from '@/features/tracking/events'
import { TvaStep } from '@/components/checkout/tva-step'
import Assurance from '@/components/assurance/assurance'
import Select from "react-select";
import ReactCountryFlag from "react-country-flag";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import './styles.css'

countries.registerLocale(en);
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

interface StreetSuggestion {
  properties: {
    name?: string
    postcode?: string
  }
}

interface CitySuggestion {
  id: number
  name: string
  region?: string
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
  const isFinalPayment = searchParams.get('final') === '1'
  const finalSo2Id = searchParams.get('so2_id') ? Number(searchParams.get('so2_id')) : null
  const slotDateStart = searchParams.get('date_start') ?? null
  const slotDateEnd   = searchParams.get('date_end')   ?? null
  const slotOrderId   = searchParams.get('order_id')   ? Number(searchParams.get('order_id')) : null
  const slotNotes     = (searchParams.get('notes') ?? '').slice(0, 500)
  const isShowroomMobile = searchParams.get('showroom_mobile') === '1'
  const showroomTeamId   = searchParams.get('team_id') ? Number(searchParams.get('team_id')) : null
  const isKit = searchParams.get('kit') === '1'
  const kitColl = searchParams.get('kit_coll')
  const kitDoor = searchParams.get('kit_door')
  const kitExt = searchParams.get('kit_ext')
  const kitInt = searchParams.get('kit_int')
  const kitHandle = searchParams.get('kit_handle')
  const tva6Param = searchParams.get('tva6')


  const [so2Project, setSo2Project] = useState<ProjectDetail | null>(null)
  const [finalBalance, setFinalBalance] = useState<So2Balance | null>(null)
  const [showTvaModal, setShowTvaModal] = useState(false)
  const [tvaChecked, setTvaChecked] = useState(() => tva6Param !== null)
  const [showroomPriceHt, setShowroomPriceHt] = useState<number>(0)
  const [showroomTaxRate, setShowroomTaxRate] = useState<number>(() =>
    tva6Param === '1' ? 0.06 : 0.21
  )
  const [kitPriceHt, setKitPriceHt] = useState<number>(0)
  const [kitTaxRate, setKitTaxRate] = useState<number>(() =>
    tva6Param === '1' ? 0.06 : 0.21
  )
  const [availableDeductions, setAvailableDeductions] = useState<AvailableDeduction[]>([])
  const [showroomDelayDays, setShowroomDelayDays] = useState<number>(30)
  const [kitDelayDays, setKitDelayDays] = useState<number>(30)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [providers, setProviders] = useState<PaymentProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')

  const [form, setForm] = useState({
    email: '', phone: '',
    firstName: '', lastName: '',
  })

  // Address state
  const [profileAddresses, setProfileAddresses] = useState<ProfileAddress[]>([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false)
  const [showInvoicePicker, setShowInvoicePicker] = useState(false)
  const [addingDelivery, setAddingDelivery] = useState(false)
  const [addingInvoice, setAddingInvoice] = useState(false)
  const [newDeliveryForm, setNewDeliveryForm] = useState({ street: '', zip: '', city: '', country: 'BE' })
  const [newInvoiceForm, setNewInvoiceForm] = useState({ street: '', zip: '', city: '', country: 'BE' })
  const [savingNewAddr, setSavingNewAddr] = useState(false)

  const countryOptions = countries.getNames("en", {
    select: "official",
  });

  const countriesData = [
    {
      value: "BE",
      label: "Belgium",
    },
    {
      value: "NL",
      label: "Netherlands",
    },
    {
      value: "LU",
      label: "Luxembourg",
    },
  ];
  const [selectedCountry, setSelectedCountry] = useState(countriesData[0]);

  const [street, setStreet] = useState("");
  const [suggestions, setSuggestions] = useState<StreetSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [city, setCity] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [cityFocused, setCityFocused] = useState(false);


  const activeAddressForm = addingDelivery
      ? newDeliveryForm
      : newInvoiceForm;

  const setActiveAddressForm = (
      updater: (prev: typeof newDeliveryForm) => typeof newDeliveryForm
  ) => {
    if (addingDelivery) {
      setNewDeliveryForm(updater);
    } else {
      setNewInvoiceForm(updater);
    }
  };
  const [cgvAccepted, setCgvAccepted] = useState(false)

  // Fetch deductions (SO1 recap) + delay_days config (showroom/kit success page)
  useEffect(() => {
    if (!isAuthenticated || isSo2Checkout || isFinalPayment) return
    getAvailableDeductions().then(r => {
      if (!r.success) return
      if (!isShowroomMobile && !isKit) setAvailableDeductions(r.data.deductions)
      setShowroomDelayDays(r.data.showroom_mobile_delay_days ?? 30)
      setKitDelayDays(r.data.kit_delay_days ?? 30)
    })
  }, [isAuthenticated, isShowroomMobile, isKit, isSo2Checkout, isFinalPayment])

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
      }))
      const addrs = p.addresses ?? []
      setProfileAddresses(addrs)
      const defDel = addrs.find(a => a.type === 'delivery' && a.is_default) ?? addrs.find(a => a.type === 'delivery')
      const defInv = addrs.find(a => a.type === 'invoice' && a.is_default) ?? addrs.find(a => a.type === 'invoice')
      if (defDel) setSelectedDeliveryId(defDel.id)
      if (defInv) setSelectedInvoiceId(defInv.id)
    })
  }, [isAuthenticated, user])

  // Load payment providers
  useEffect(() => {
    if (!isAuthenticated) return
    getPaymentProviders().then(res => {
      if (!res.success) return
      const seen = new Set<string>()
      const list = res.data.providers.filter((p: PaymentProvider) => seen.has(p.code) ? false : seen.add(p.code))
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
      } else if (res.data.amount_untaxed > 0) {
        // SO2 not yet created — inherit TVA rate from SO1
        const rate = res.data.amount_tax / res.data.amount_untaxed
        setTvaRate(rate < 0.1 ? 0.06 : 0.21)
      }
    })
  }, [isSo2Checkout, projectParam, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Final 10% payment: fetch balance
  useEffect(() => {
    if (!isFinalPayment || !finalSo2Id || !isAuthenticated) return
    getSo2Balance(finalSo2Id).then(res => {
      if (res.success) setFinalBalance(res.data)
    })
  }, [isFinalPayment, finalSo2Id, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch showroom product price — only use product tax_rate if user hasn't chosen yet
  useEffect(() => {
    if (!isShowroomMobile || !isAuthenticated) return
    getShowroomProduct().then(res => {
      if (res.success) {
        setShowroomPriceHt(res.data.list_price)
        if (tva6Param === null) {
          setShowroomTaxRate(res.data.tax_rate)
        }
      }
    })
  }, [isShowroomMobile, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch kit product price
  useEffect(() => {
    if (!isKit || !isAuthenticated) return
    getKitProduct().then(res => {
      if (res.success) {
        setKitPriceHt(res.data.list_price)
        if (tva6Param === null) {
          setKitTaxRate(res.data.tax_rate)
        }
      }
    })
  }, [isKit, isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show TVA modal on mount — only for SO1 cart, not for showroom mobile or kit
  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    const needsTvaCheck = cart.items.length > 0 && !isShowroomMobile && !isKit
    if (needsTvaCheck && !tvaChecked) {
      setShowTvaModal(true)
    }
  }, [authLoading, isAuthenticated, cart.items.length, isShowroomMobile, isKit, tvaChecked])
  useEffect(() => {
    if (!city.trim()) {
      setSuggestions([]);
      return;
    }

    if (street.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const query = `${street}, ${city}, ${selectedCountry.label}`;
        const res = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`
        );
        const json = await res.json();
        setSuggestions(json.features ?? []);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [street, city, selectedCountry]);

  useEffect(() => {
    if (!selectedCountry) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
            `/api/geodb/cities?country=${selectedCountry.value}&city=${encodeURIComponent(city)}`
        );

        const json = await res.json();
        setCitySuggestions(json);

      } catch (err) {
        console.error(err);
        setCitySuggestions([]);
      }

    }, 700);
    return () => clearTimeout(timer);
  }, [city, selectedCountry]);


  function handleTvaDone(buildingYear?: number) {
    const rate = buildingYear ? 0.06 : 0.21
    if (isShowroomMobile) {
      setShowroomTaxRate(rate)
      const qs = new URLSearchParams(searchParams.toString())
      qs.set('tva6', rate === 0.06 ? '1' : '0')
      router.replace({ pathname: '/checkout', query: Object.fromEntries(qs.entries()) })
    } else if (isKit) {
      setKitTaxRate(rate)
      const qs = new URLSearchParams(searchParams.toString())
      qs.set('tva6', rate === 0.06 ? '1' : '0')
      router.replace({ pathname: '/checkout', query: Object.fromEntries(qs.entries()) })
    } else {
      setTvaRate(rate)
    }
    setShowTvaModal(false)
    setTvaChecked(true)
  }

  const deliveryAddresses = profileAddresses.filter(a => a.type === 'delivery')
  const invoiceAddresses  = profileAddresses.filter(a => a.type === 'invoice')
  const selectedDelivery  = deliveryAddresses.find(a => a.id === selectedDeliveryId) ?? deliveryAddresses[0] ?? null
  const selectedInvoice   = invoiceAddresses.find(a => a.id === selectedInvoiceId) ?? invoiceAddresses[0] ?? null

  function countryLabel(code: string): string {
    const map: Record<string, string> = {
      BE: t('country_be'), LU: t('country_lu'), FR: t('country_fr'), NL: t('country_nl'), MA: t('country_ma'),
    }
    return map[code] ?? code
  }

  async function handleAddAddr(type: 'delivery' | 'invoice') {
    setSavingNewAddr(true)
    const data = type === 'delivery' ? newDeliveryForm : newInvoiceForm
    const result = await addAddress({ ...data, type })
    if (result.success && result.data) {
      const addrs = result.data.addresses ?? []
      setProfileAddresses(addrs)
      const newDef = addrs.find(a => a.type === type && a.is_default) ?? addrs.find(a => a.type === type)
      if (newDef) {
        if (type === 'delivery') {
          setSelectedDeliveryId(newDef.id)
          setAddingDelivery(false)
          setNewDeliveryForm({ street: '', zip: '', city: '', country: 'BE' })
        } else {
          setSelectedInvoiceId(newDef.id)
          setAddingInvoice(false)
          setNewInvoiceForm({ street: '', zip: '', city: '', country: 'BE' })
        }
      }
    }
    setSavingNewAddr(false)
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
    const deliveryId = selectedDelivery?.id ?? null
    const invoiceId  = selectedInvoice?.id ?? null
    try {
      // ── Showroom mobile payment mode ────────────────────────────────────────
      if (isShowroomMobile && slotDateStart && slotDateEnd) {
        const showroomTtc = showroomPriceHt * (1 + showroomTaxRate)
        trackBeginCheckout([{ id: 0, price: showroomTtc, quantity: 1 }], showroomTtc)
        const payRes = await processShowroomCheckout(selectedProvider, slotDateStart, slotDateEnd, showroomTaxRate === 0.06, showroomTeamId, deliveryId, invoiceId)
        if (!payRes.success) throw new Error(payRes.error)
        const qs = new URLSearchParams()
        qs.set('showroom_mobile', '1')
        qs.set('ref', payRes.data.order_name)
        qs.set('amount', String(Math.round(showroomPriceHt * (1 + showroomTaxRate))))
        qs.set('delay', String(showroomDelayDays))
        setConfirming(false)
        router.push({ pathname: '/checkout/success', query: Object.fromEntries(qs.entries()) })
        return
      }

      // ── Kit découverte payment mode ─────────────────────────────────────────
      if (isKit) {
        const kitTtc = kitPriceHt * (1 + kitTaxRate)
        trackBeginCheckout([{ id: 0, price: kitTtc, quantity: 1 }], kitTtc)
        const config: Record<string, string | undefined> = {
          collection: kitColl ?? undefined,
          door: kitDoor ?? undefined,
          ext_color: kitExt ?? undefined,
          int_color: kitInt ?? undefined,
          handle: kitHandle ?? undefined,
        }
        const payRes = await processKitCheckout(selectedProvider, config, kitTaxRate === 0.06, deliveryId, invoiceId)
        if (!payRes.success) throw new Error(payRes.error)
        const qs = new URLSearchParams()
        qs.set('kit', '1')
        qs.set('ref', payRes.data.order_name)
        qs.set('amount', String(Math.round(kitPriceHt * (1 + kitTaxRate))))
        qs.set('delay', String(kitDelayDays))
        setConfirming(false)
        router.push({ pathname: '/checkout/success', query: Object.fromEntries(qs.entries()) })
        return
      }

      // ── Final 10% payment mode ──────────────────────────────────────────────
      if (isFinalPayment && finalSo2Id) {
        const finalAmount = finalBalance?.remaining ?? 0
        trackBeginCheckout([{ id: 0, price: finalAmount, quantity: 1 }], finalAmount)
        const payRes = await processFinalPayment(finalSo2Id, selectedProvider, slotDateStart, slotDateEnd, deliveryId, invoiceId)
        if (!payRes.success) throw new Error(payRes.error)

        // Auto-book the installation slot if the user had selected one
        if (slotDateStart && slotDateEnd && slotOrderId) {
          await bookAppointment({
            type:       'installation',
            date_start: slotDateStart,
            date_end:   slotDateEnd,
            order_id:   slotOrderId,
            notes:      slotNotes || undefined,
          })
          // Booking errors are silently ignored — user can re-book from their project page
        }

        const qs = new URLSearchParams()
        qs.set('final', '1')
        qs.set('so2_id', String(finalSo2Id))
        if (finalBalance?.so2_name) qs.set('ref', finalBalance.so2_name)
        if (projectParam) qs.set('project', String(projectParam))
        if (slotDateStart) qs.set('booked', '1')
        setConfirming(false)
        router.push({ pathname: '/checkout/success', query: Object.fromEntries(qs.entries()) })
        return
      }

      // ── Normal / SO2 checkout ───────────────────────────────────────────────
      trackBeginCheckout(
        cart.items.map(i => ({ id: i.productId, price: i.price, quantity: i.quantity })),
        cart.subtotal,
      )

      let orderId: number | null = prebuiltOrderId
      let orderName: string | null = prebuiltOrderName

      if (orderId) {
        const confirmRes = await confirmOrder(orderId, deliveryId, invoiceId)
        if (!confirmRes.success) throw new Error(confirmRes.error)
        orderName = confirmRes.data.order_name
      } else {
        // Items are already in oaksome.cart.item (added by cart context via /cart/add).
        // Call checkout-url directly — no need to re-sync.
        const urlRes = await getCheckoutUrl(cart.tvaRate === 0.06, undefined, deliveryId, invoiceId)
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
        sessionStorage.setItem('oaksome_purchase_cart', JSON.stringify({ items: cart.items, subtotal: cart.subtotal }))
      } catch {}
      const qs = new URLSearchParams()
      if (orderId) qs.set('order', String(orderId))
      if (orderName) qs.set('ref', orderName)
      if (prebuiltNotifId) qs.set('notif', prebuiltNotifId)
      if (isSo2Checkout) qs.set('so2', '1')
      if (isSo2Checkout && projectParam) qs.set('project', String(projectParam))
      setConfirming(false)
      router.push({ pathname: '/checkout/success', query: Object.fromEntries(qs.entries()) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setConfirming(false)
    }
  }

  useEffect(() => {
    if (authLoading || cartLoading) return
    if (cart.items.length === 0 && !prebuiltOrderId && !isFinalPayment && !isShowroomMobile && !isKit) {
      router.replace('/panier')
    }
  }, [authLoading, cartLoading, cart.items.length, prebuiltOrderId, isFinalPayment, isShowroomMobile, isKit, router])

  if (authLoading || !isAuthenticated) return null
  if (cartLoading) return null
  if (cart.items.length === 0 && !prebuiltOrderId && !isFinalPayment && !isShowroomMobile && !isKit) return null
  if (isFinalPayment && finalSo2Id && finalBalance === null) return null

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

                {!addingDelivery && (
                  <>
                    <div className="co-group">
                      <label>{t('label_street')}</label>
                      <input type="text" readOnly className="co-input-readonly"
                        value={selectedDelivery?.street ?? ''} placeholder={t('ph_street')} />
                    </div>
                    <div className="co-row">
                      <div className="co-group">
                        <label>{t('label_zip')}</label>
                        <input type="text" readOnly className="co-input-readonly"
                          value={selectedDelivery?.zip ?? ''} placeholder={t('ph_zip')} />
                      </div>
                      <div className="co-group">
                        <label>{t('label_city')}</label>
                        <input type="text" readOnly className="co-input-readonly"
                          value={selectedDelivery?.city ?? ''} placeholder={t('ph_city')} />
                      </div>
                    </div>
                    <div className="co-group">
                      <label>{t('label_country')}</label>
                      <input type="text" readOnly className="co-input-readonly"
                        value={countryLabel(selectedDelivery?.country ?? '')} />
                    </div>
                  </>
                )}

                <div className="co-addr-btns">
                  {deliveryAddresses.length > 1 && !addingDelivery && (
                    <button type="button" className="co-addr-btn"
                      onClick={() => { setShowDeliveryPicker(v => !v); setAddingDelivery(false) }}>
                      {t('choose_address')}
                    </button>
                  )}
                  {!addingDelivery && (
                    <button type="button" className="co-addr-btn"
                      onClick={() => { setAddingDelivery(true); setShowDeliveryPicker(false) }}>
                      {t('add_new_address')}
                    </button>
                  )}
                </div>

                {showDeliveryPicker && (
                  <div className="co-addr-picker">
                    {deliveryAddresses.map(addr => (
                      <button key={addr.id} type="button"
                        className={`co-addr-picker-item${selectedDeliveryId === addr.id ? ' active' : ''}`}
                        onClick={() => { setSelectedDeliveryId(addr.id); setShowDeliveryPicker(false) }}>
                        {addr.street}, {addr.zip} {addr.city} — {countryLabel(addr.country)}
                      </button>
                    ))}
                  </div>
                )}

                {addingDelivery && (
                  <div className="co-addr-new-form">
                    <div className="co-group">
                      <label>{t('label_street')}</label>
                      <input type="text" placeholder={t('ph_street')} value={newDeliveryForm.street}
                        onChange={e => setNewDeliveryForm(f => ({ ...f, street: e.target.value }))} />
                    </div>
                    <div className="co-row">
                      <div className="co-group">
                        <label>{t('label_zip')}</label>
                        <input type="text" placeholder={t('ph_zip')} value={newDeliveryForm.zip}
                          onChange={e => setNewDeliveryForm(f => ({ ...f, zip: e.target.value }))} />
                      </div>
                      <div className="co-group">
                        <label>{t('label_city')}</label>
                        <input type="text" placeholder={t('ph_city')} value={newDeliveryForm.city}
                          onChange={e => setNewDeliveryForm(f => ({ ...f, city: e.target.value }))} />
                      </div>
                    </div>
                    <div className="co-group">
                      <label>{t('label_country')}</label>
                      <select value={newDeliveryForm.country}
                        onChange={e => setNewDeliveryForm(f => ({ ...f, country: e.target.value }))}>
                        <option value="BE">{t('country_be')}</option>
                        <option value="LU">{t('country_lu')}</option>
                        <option value="FR">{t('country_fr')}</option>
                        <option value="NL">{t('country_nl')}</option>
                        <option value="MA">{t('country_ma')}</option>
                      </select>
                    </div>
                    <div className="co-addr-form-actions">
                      <button type="button" className="co-addr-btn"
                        onClick={() => { setAddingDelivery(false); setNewDeliveryForm({ street: '', zip: '', city: '', country: 'BE' }) }}>
                        {t('addr_cancel')}
                      </button>
                      <button type="button" className="btn btn-primary co-addr-save-btn"
                        onClick={() => handleAddAddr('delivery')} disabled={savingNewAddr}>
                        {savingNewAddr ? '…' : t('addr_save')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Facturation */}
                <h4 className="co-section-title">{t('section_billing')}</h4>

                {!addingInvoice && (
                  <>
                    <div className="co-group">
                      <label>{t('label_street')}</label>
                      <input type="text" readOnly className="co-input-readonly"
                        value={selectedInvoice?.street ?? ''} placeholder={t('ph_street')} />
                    </div>
                    <div className="co-row">
                      <div className="co-group">
                        <label>{t('label_zip')}</label>
                        <input type="text" readOnly className="co-input-readonly"
                          value={selectedInvoice?.zip ?? ''} placeholder={t('ph_zip')} />
                      </div>
                      <div className="co-group">
                        <label>{t('label_city')}</label>
                        <input type="text" readOnly className="co-input-readonly"
                          value={selectedInvoice?.city ?? ''} placeholder={t('ph_city')} />
                      </div>
                    </div>
                    <div className="co-group">
                      <label>{t('label_country')}</label>
                      <input type="text" readOnly className="co-input-readonly"
                        value={countryLabel(selectedInvoice?.country ?? '')} />
                    </div>
                  </>
                )}

                <div className="co-addr-btns">
                  {invoiceAddresses.length > 1 && !addingInvoice && (
                    <button type="button" className="co-addr-btn"
                      onClick={() => { setShowInvoicePicker(v => !v); setAddingInvoice(false) }}>
                      {t('choose_address')}
                    </button>
                  )}
                  {!addingInvoice && (
                    <button type="button" className="co-addr-btn"
                      onClick={() => { setAddingInvoice(true); setShowInvoicePicker(false) }}>
                      {t('add_new_address')}
                    </button>
                  )}
                </div>

                {showInvoicePicker && (
                  <div className="co-addr-picker">
                    {invoiceAddresses.map(addr => (
                      <button key={addr.id} type="button"
                        className={`co-addr-picker-item${selectedInvoiceId === addr.id ? ' active' : ''}`}
                        onClick={() => { setSelectedInvoiceId(addr.id); setShowInvoicePicker(false) }}>
                        {addr.street}, {addr.zip} {addr.city} — {countryLabel(addr.country)}
                      </button>
                    ))}
                  </div>
                )}

                {addingInvoice && (
                  <div className="co-addr-new-form">
                    <div className="co-group">
                      <label>{t('label_street')}</label>
                      <input type="text" placeholder={t('ph_street')} value={newInvoiceForm.street}
                        onChange={e => setNewInvoiceForm(f => ({ ...f, street: e.target.value }))} />
                    </div>
                    <div className="co-row">
                      <div className="co-group">
                        <label>{t('label_zip')}</label>
                        <input type="text" placeholder={t('ph_zip')} value={newInvoiceForm.zip}
                          onChange={e => setNewInvoiceForm(f => ({ ...f, zip: e.target.value }))} />
                      </div>
                      <div className="co-group">
                        <label>{t('label_city')}</label>
                        <input type="text" placeholder={t('ph_city')} value={newInvoiceForm.city}
                          onChange={e => setNewInvoiceForm(f => ({ ...f, city: e.target.value }))} />
                      </div>
                    </div>
                    <div className="co-group">
                      <label>{t('label_country')}</label>
                      <select value={newInvoiceForm.country}
                        onChange={e => setNewInvoiceForm(f => ({ ...f, country: e.target.value }))}>
                        <option value="BE">{t('country_be')}</option>
                        <option value="LU">{t('country_lu')}</option>
                        <option value="FR">{t('country_fr')}</option>
                        <option value="NL">{t('country_nl')}</option>
                        <option value="MA">{t('country_ma')}</option>
                      </select>
                    </div>
                    <div className="co-addr-form-actions">
                      <button type="button" className="co-addr-btn"
                        onClick={() => { setAddingInvoice(false); setNewInvoiceForm({ street: '', zip: '', city: '', country: 'BE' }) }}>
                        {t('addr_cancel')}
                      </button>
                      <button type="button" className="btn btn-primary co-addr-save-btn"
                        onClick={() => handleAddAddr('invoice')} disabled={savingNewAddr}>
                        {savingNewAddr ? '…' : t('addr_save')}
                      </button>
                    </div>
                  </div>
                )}

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

                <label className="cgv_read" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <span style={{ position: 'relative', flexShrink: 0, width: 18, height: 18 }}>
                    <input
                      type="checkbox"
                      name="oaksome_cgv_signed"
                      checked={cgvAccepted}
                      onChange={(e) => setCgvAccepted(e.target.checked)}
                      style={{ position: 'absolute', opacity: 0, width: 18, height: 18, margin: 0, cursor: 'pointer' }}
                    />
                    <span style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 18, height: 18,
                      border: `1.5px solid ${cgvAccepted ? '#0C524E' : '#b0aba3'}`,
                      background: cgvAccepted ? '#0C524E' : '#fff',
                      transition: 'all 150ms ease',
                    }}>
                      {cgvAccepted && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                  </span>
                  <span style={{ fontSize: '0.9rem', color: '#1a1a1a', fontFamily: 'inherit', lineHeight: 1.4 }}>
                    {t.rich('cgv_accpeted', {
                      link: (chunks) => (
                        <Link href="/cgv" target="_blank" style={{ textDecoration: 'underline', color: '#0C524E' }}>
                          {chunks}
                        </Link>
                      ),
                    })}
                  </span>
                </label>

                <button
                    type="submit"
                    disabled={confirming || !cgvAccepted}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      display: 'block',
                      marginTop: '1rem',
                      opacity: (confirming || !cgvAccepted) ? 0.7 : 1,
                      cursor: (confirming || !cgvAccepted) ? 'not-allowed' : 'pointer',
                    }}
                >
                  {confirming ? t('btn_confirm_loading') : isFinalPayment ? t('final_btn_pay') : isShowroomMobile ? t('showroom_btn_pay') : isKit ? t('kit_btn_pay') : t('btn_confirm')}
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
                  {isShowroomMobile ? (
                    /* ── Récap showroom mobile ── */
                    (() => {
                      const tvaRate = showroomTaxRate
                      const priceHt = showroomPriceHt
                      const priceTtc = priceHt * (1 + tvaRate)
                      const tvaLabel = tvaRate === 0.06 ? '6 %' : '21 %'
                      return (
                        <>
                          <h3>{t('showroom_title')}</h3>
                          <p style={{ fontSize: '0.82rem', color: '#696761', marginTop: '-1rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            {t('showroom_desc')}
                          </p>
                          <div style={{ background: '#F6F5F0', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                              <span style={{ color: '#696761' }}>{t('showroom_line_ht')}</span>
                              <span style={{ fontWeight: 600 }}>{fmtAmount(priceHt, locale)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                              <span style={{ color: '#696761' }}>{t('summary_tva')} {tvaRate === 0.06 ? <span style={{ color: '#0C524E', fontWeight: 600 }}>6 %</span> : tvaLabel}</span>
                              <span>{fmtAmount(priceHt * tvaRate, locale)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                              <span style={{ color: '#696761' }}>{t('showroom_refund_note')}</span>
                              <span style={{ color: '#0C524E', fontWeight: 600 }}>−{fmtAmount(priceTtc, locale)} {t('showroom_refundable_suffix')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, borderTop: '1px solid #e8e5df', paddingTop: '0.55rem', marginTop: '0.1rem' }}>
                              <span>{t('showroom_total')}</span>
                              <span style={{ color: '#0C524E' }}>{fmtAmount(priceTtc, locale)}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: '#696761', lineHeight: 1.5 }}>
                            {t('showroom_legal_note')}
                          </p>
                        </>
                      )
                    })()
                  ) : isKit ? (
                    /* ── Récap kit découverte ── */
                    (() => {
                      const tvaRate = kitTaxRate
                      const priceHt = kitPriceHt
                      const priceTtc = priceHt * (1 + tvaRate)
                      const tvaLabel = tvaRate === 0.06 ? '6 %' : '21 %'
                      return (
                        <>
                          <h3>{t('kit_title')}</h3>
                          <p style={{ fontSize: '0.82rem', color: '#696761', marginTop: '-1rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                            {t('kit_desc')}
                          </p>
                          <div style={{ background: '#F6F5F0', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                              <span style={{ color: '#696761' }}>{t('kit_line_ht')}</span>
                              <span style={{ fontWeight: 600 }}>{fmtAmount(priceHt, locale)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                              <span style={{ color: '#696761' }}>{t('summary_tva')} {tvaRate === 0.06 ? <span style={{ color: '#0C524E', fontWeight: 600 }}>6 %</span> : tvaLabel}</span>
                              <span>{fmtAmount(priceHt * tvaRate, locale)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                              <span style={{ color: '#696761' }}>{t('kit_refund_note')}</span>
                              <span style={{ color: '#0C524E', fontWeight: 600 }}>−{fmtAmount(priceTtc, locale)} {t('kit_refundable_suffix')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, borderTop: '1px solid #e8e5df', paddingTop: '0.55rem', marginTop: '0.1rem' }}>
                              <span>{t('kit_total')}</span>
                              <span style={{ color: '#0C524E' }}>{fmtAmount(priceTtc, locale)}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: '#696761', lineHeight: 1.5 }}>
                            {t('kit_legal_note')}
                          </p>
                        </>
                      )
                    })()
                  ) : isFinalPayment && finalBalance ? (
                    /* ── Récap solde final 10% ── */
                    (() => {
                      const b = finalBalance
                      return (
                        <>
                          <h3>{t('final_title')}</h3>
                          <p style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono,monospace)', color: '#696761', marginTop: '-1rem', marginBottom: '1.5rem', letterSpacing: '0.03em' }}>
                            {b.so2_name}
                          </p>

                          <div style={{ background: '#F6F5F0', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {/* Total */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                              <span style={{ color: '#696761' }}>{t('final_total_order')}</span>
                              <span style={{ fontWeight: 600 }}>{fmtAmount(b.total, locale)}</span>
                            </div>
                            {/* 1er acompte SO1 */}
                            {b.so1_paid > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                <span style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                                  <span style={{ color: '#696761' }}>{t('final_deposit_1')}</span>
                                </span>
                                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.05rem' }}>
                                  <span>−{fmtAmount(b.so1_paid, locale)}</span>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0C524E' }}>{t('final_paid_badge')}</span>
                                </span>
                              </div>
                            )}
                            {/* 2ème acompte SO2 */}
                            {b.so2_paid > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                <span style={{ color: '#696761' }}>{t('final_deposit_2')}</span>
                                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.05rem' }}>
                                  <span>−{fmtAmount(b.so2_paid, locale)}</span>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0C524E' }}>{t('final_paid_badge')}</span>
                                </span>
                              </div>
                            )}
                            {/* Solde restant */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, borderTop: '1px solid #e8e5df', paddingTop: '0.55rem', marginTop: '0.1rem' }}>
                              <span>{t('final_remaining')}</span>
                              <span style={{ color: '#0C524E' }}>{fmtAmount(b.remaining, locale)}</span>
                            </div>
                          </div>

                          <p style={{ fontSize: '0.78rem', color: '#696761', lineHeight: 1.5 }}>
                            {t('final_note')}
                          </p>
                        </>
                      )
                    })()
                  ) : isSo2Checkout && so2Project?.so2 ? (
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
                              ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

                      {/* HT derived from product's original rate; new TTC applies user-selected rate */}
                      {(() => {
                        const subtotalHt = cart.subtotal / (1 + cart.productTvaRate)
                        const displayTtc = subtotalHt * (1 + cart.tvaRate)
                        const tvaLabel = cart.tvaRate === 0.06 ? '6 %' : '21 %'
                        return (
                          <>
                            <hr style={{ border: 'none', borderTop: '1px solid #e8e5df', margin: '1rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.95rem' }}>
                              <span style={{ color: '#696761' }}>{t('summary_subtotal')}</span>
                              <span style={{ fontWeight: 500 }}>{fmtAmount(subtotalHt, locale)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.95rem' }}>
                              <span style={{ color: '#696761' }}>
                                {t('summary_tva')} {cart.tvaRate === 0.06
                                  ? <span style={{ color: '#0C524E', fontWeight: 600 }}>6 %</span>
                                  : '21 %'}
                              </span>
                              <span style={{ fontWeight: 500 }}>{fmtAmount(displayTtc - subtotalHt, locale)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.95rem' }}>
                              <span style={{ color: '#696761' }}>{t('summary_delivery')}</span>
                              <span style={{ fontWeight: 500, color: '#0C524E' }}>{t('summary_delivery_value')}</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #e8e5df', margin: '1rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', fontWeight: 600 }}>
                              <span>{t('summary_total')}</span>
                              <span>{fmtAmount(displayTtc, locale)}</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#696761', textAlign: 'right', marginTop: '0.2rem' }}>{t('summary_tva_incl', { rate: tvaLabel })}</p>

                            {/* Déductions showroom/kit + acompte 50% */}
                            {(() => {
                              const totalTtc = displayTtc
                        const deductionTotal = availableDeductions.reduce((s, d) => s + d.amount, 0)
                        const netTtc = totalTtc - deductionTotal
                        const acompte = netTtc * 0.5
                        if (availableDeductions.length === 0 && totalTtc === 0) return null
                        return (
                          <div style={{ marginTop: '1rem', padding: '1rem', background: '#F0F8F6', border: '1px solid #0C524E', borderRadius: 2 }}>
                            {availableDeductions.map((d, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#696761' }}>
                                  {d.type === 'showroom_mobile' ? t('deduction_showroom') : t('deduction_kit')}
                                </span>
                                <span style={{ color: '#0C524E', fontWeight: 500 }}>− {fmtAmount(d.amount, locale)}</span>
                              </div>
                            ))}
                            {availableDeductions.length > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid #c8e6e0' }}>
                                <span style={{ color: '#696761' }}>{t('after_deduction_total')}</span>
                                <span style={{ fontWeight: 500 }}>{fmtAmount(netTtc, locale)}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                              <span style={{ color: '#696761' }}>{t('deposit_50_label')}</span>
                              <span style={{ fontWeight: 500 }}>50 %</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #c8e6e0', margin: '0.5rem 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, color: '#0C524E' }}>
                              <span>{t('due_today')}</span>
                              <span>{fmtAmount(acompte, locale)}</span>
                            </div>
                          </div>
                            )
                          })()}
                        </>
                      )
                    })()}
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
        .co-input-readonly { background: #f6f5f0 !important; color: #696761; cursor: default; }
        .co-addr-btns { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .co-addr-btn { background: none; border: none; padding: 0; font-size: 0.875rem; color: #0C524E; font-weight: 500; cursor: pointer; font-family: inherit; text-decoration: underline; }
        .co-addr-picker { border: 1.5px solid #e8e5df; margin-bottom: 1rem; }
        .co-addr-picker-item { width: 100%; text-align: left; padding: 0.8rem 1rem; background: #fff; border: none; border-bottom: 1px solid #e8e5df; cursor: pointer; font-family: inherit; font-size: 0.9rem; color: #1a1a1a; }
        .co-addr-picker-item:last-child { border-bottom: none; }
        .co-addr-picker-item:hover { background: #f6f5f0; }
        .co-addr-picker-item.active { background: #f0faf5; color: #0C524E; font-weight: 500; }
        .co-addr-new-form { border: 1.5px solid #e8e5df; padding: 1.2rem; margin-bottom: 1rem; background: #fafaf8; }
        .co-addr-form-actions { display: flex; gap: 0.75rem; align-items: center; margin-top: 0.5rem; }
        .co-addr-save-btn { padding: 0.55rem 1.4rem; font-size: 0.9rem; }
        .co-no-address { font-size: 0.9rem; color: #696761; margin-bottom: 0.5rem; }
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
