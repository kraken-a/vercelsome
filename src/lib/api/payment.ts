import { apiGet, apiPost, CHECKOUT_TIMEOUT_MS } from './client'
import type { Result } from './client'

export type PaymentProvider = {
  readonly id: number
  readonly code: string
  readonly name: string
  readonly state: string
}

export type PaymentProvidersResponse = {
  readonly providers: PaymentProvider[]
}

export type ProcessPaymentResponse = {
  readonly tx_state: string
  readonly order_id: number
  readonly order_name: string
}

export type So2Balance = {
  readonly so2_id: number
  readonly so2_name: string
  readonly so1_id: number | null
  readonly project_id: number | null
  readonly total: number
  readonly amount_paid: number
  readonly so1_paid: number
  readonly so2_paid: number
  readonly remaining: number
  readonly is_final_paid: boolean
  readonly currency: string
  readonly pose_delay_days?: number
  readonly date_order?: string | null
}

export type FinalPaymentResponse = {
  readonly tx_state: string
  readonly so2_id: number
  readonly so2_name: string
}

export function getPaymentProviders(): Promise<Result<PaymentProvidersResponse>> {
  return apiGet<PaymentProvidersResponse>('/payment/providers')
}

export function processPayment(
  orderId: number,
  providerCode: string,
): Promise<Result<ProcessPaymentResponse>> {
  return apiPost<ProcessPaymentResponse>('/payment/process', {
    order_id: orderId,
    provider_code: providerCode,
  }, { timeout: CHECKOUT_TIMEOUT_MS })
}

export function getSo2Balance(so2Id: number): Promise<Result<So2Balance>> {
  return apiGet<So2Balance>(`/so2/${so2Id}/balance`)
}

export type ShowroomCheckoutResponse = {
  readonly tx_state: string
  readonly order_id: number
  readonly order_name: string
}

export type AvailableDeduction = {
  readonly type: 'showroom_mobile' | 'kit'
  readonly name: string
  readonly amount: number
  readonly appointment_date: string | null
  readonly expiry_date: string
}

export function getAvailableDeductions(): Promise<Result<{
  deductions: AvailableDeduction[]
  showroom_mobile_delay_days: number
  kit_delay_days: number
}>> {
  return apiGet('/deductions/available')
}

export function getShowroomProduct(): Promise<Result<{ id: number; list_price: number; tax_rate: number }>> {
  return apiGet('/showroom/product')
}

export function getKitProduct(): Promise<Result<{ id: number; list_price: number; tax_rate: number }>> {
  return apiGet('/kit/product')
}

export type KitCheckoutResponse = {
  readonly tx_state: string
  readonly order_id: number
  readonly order_name: string
}

export function processKitCheckout(
  providerCode: string,
  config: Record<string, string | undefined>,
  tva6: boolean,
  deliveryPartnerId?: number | null,
  invoicePartnerId?: number | null,
): Promise<Result<KitCheckoutResponse>> {
  return apiPost<KitCheckoutResponse>('/kit/checkout', {
    provider_code: providerCode,
    config,
    tva6,
    ...(deliveryPartnerId ? { delivery_partner_id: deliveryPartnerId } : {}),
    ...(invoicePartnerId ? { invoice_partner_id: invoicePartnerId } : {}),
  }, { timeout: CHECKOUT_TIMEOUT_MS })
}

export function processShowroomCheckout(
  providerCode: string,
  dateStart: string,
  dateEnd: string,
  tva6: boolean,
  teamId?: number | null,
  deliveryPartnerId?: number | null,
  invoicePartnerId?: number | null,
): Promise<Result<ShowroomCheckoutResponse>> {
  return apiPost<ShowroomCheckoutResponse>('/showroom/checkout', {
    provider_code: providerCode,
    date_start: dateStart,
    date_end: dateEnd,
    tva6,
    ...(teamId ? { team_id: teamId } : {}),
    ...(deliveryPartnerId ? { delivery_partner_id: deliveryPartnerId } : {}),
    ...(invoicePartnerId ? { invoice_partner_id: invoicePartnerId } : {}),
  }, { timeout: CHECKOUT_TIMEOUT_MS })
}

export function processFinalPayment(
  so2Id: number,
  providerCode: string,
  slotDateStart?: string | null,
  slotDateEnd?: string | null,
  deliveryPartnerId?: number | null,
  invoicePartnerId?: number | null,
): Promise<Result<FinalPaymentResponse>> {
  return apiPost<FinalPaymentResponse>(`/so2/${so2Id}/final-payment`, {
    provider_code: providerCode,
    ...(slotDateStart ? { date_start: slotDateStart } : {}),
    ...(slotDateEnd ? { date_end: slotDateEnd } : {}),
    ...(deliveryPartnerId ? { delivery_partner_id: deliveryPartnerId } : {}),
    ...(invoicePartnerId ? { invoice_partner_id: invoicePartnerId } : {}),
  }, { timeout: CHECKOUT_TIMEOUT_MS })
}
