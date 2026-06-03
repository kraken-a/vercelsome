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
