/**
 * Typed tracking event functions.
 * Tier A = P0 (blocking for paid campaigns)
 * Tier B = P2 (funnel optimization)
 * Tier C = P3 (behavioral analysis)
 */

import { pushEvent } from './gtm'

// --- Tier A (11 events) ---

export function trackPageView(title: string, location: string) {
  pushEvent({ event: 'page_view', page_title: title, page_location: location })
}

export function trackViewItem(item: {
  id: number
  name: string
  category: string
  variant: string
  price: number
  currency?: string
}) {
  // GA4 e-commerce schema: items array with item_id (not id)
  pushEvent({
    event: 'view_item',
    currency: item.currency || 'EUR',
    value: item.price,
    items: [{
      item_id: item.id,
      item_name: item.name,
      item_category: item.category,
      item_variant: item.variant,
      price: item.price,
    }],
  })
}

export function trackViewItemList(listName: string, items: Array<{ id: number; name: string }>) {
  pushEvent({
    event: 'view_item_list',
    item_list_name: listName,
    items: items.map((item, index) => ({ item_id: item.id, item_name: item.name, index })),
  })
}

export function trackSelectItem(item: { id: number; name: string; listName: string; index: number }) {
  pushEvent({
    event: 'select_item',
    item_id: item.id,
    item_name: item.name,
    item_list_name: item.listName,
    index: item.index,
  })
}

function toGa4Items(items: Array<{ id: number; price: number; quantity?: number }>) {
  return items.map(i => ({
    item_id: i.id,
    price: i.price,
    ...(i.quantity !== undefined ? { quantity: i.quantity } : {}),
  }))
}

function sumValue(items: Array<{ price: number; quantity?: number }>) {
  return items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0)
}

export function trackAddToCart(items: Array<{ id: number; price: number; quantity: number }>) {
  pushEvent({ event: 'add_to_cart', currency: 'EUR', value: sumValue(items), items: toGa4Items(items) })
}

export function trackViewCart(items: Array<{ id: number; price: number; quantity: number }>, value: number) {
  pushEvent({ event: 'view_cart', currency: 'EUR', value, items: toGa4Items(items) })
}

export function trackRemoveFromCart(items: Array<{ id: number; price: number; quantity: number }>) {
  pushEvent({ event: 'remove_from_cart', currency: 'EUR', value: sumValue(items), items: toGa4Items(items) })
}

export function trackAddToWishlist(items: Array<{ id: number; price: number }>) {
  pushEvent({ event: 'add_to_wishlist', currency: 'EUR', value: sumValue(items), items: toGa4Items(items) })
}

export function trackBeginCheckout(items: Array<{ id: number; price: number; quantity: number }>, value: number) {
  pushEvent({ event: 'begin_checkout', currency: 'EUR', value, items: toGa4Items(items) })
}

export function trackPurchase(transactionId: string, value: number, items: Array<{ id: number; price: number; quantity: number }>) {
  pushEvent({ event: 'purchase', transaction_id: transactionId, currency: 'EUR', value, items: toGa4Items(items) })
}

export function trackGenerateLead(leadId: number, emailHash: string, productId?: number, estimatedPrice?: number) {
  pushEvent({ event: 'generate_lead', lead_id: leadId, email_hash: emailHash, product_id: productId, estimated_price: estimatedPrice })
}

// --- Tier B (selected) ---

export function trackConfiguratorStart() {
  pushEvent({ event: 'configurator_start', configurator_step: 'type_selection' })
}

export function trackConfiguratorStep(stepName: string, stepNumber: number) {
  pushEvent({ event: 'configurator_step', step_name: stepName, step_number: stepNumber })
}

export function trackConfiguratorComplete(data: { productId: number; collection: string; estimatedPrice: number; dimensions: object }) {
  pushEvent({ event: 'configurator_complete', ...data })
}

export function trackSearch(searchTerm: string, resultsCount: number) {
  pushEvent({ event: 'search', search_term: searchTerm, results_count: resultsCount })
}

export function trackLogin(method: string = 'email') {
  pushEvent({ event: 'login', method })
}

export function trackSignUp(method: string = 'email') {
  pushEvent({ event: 'sign_up', method })
}

export function trackPasswordReset() {
  pushEvent({ event: 'password_reset' })
}

export function trackAppointmentBooked(type: string, date: string, orderId?: number | null) {
  pushEvent({ event: 'appointment_booked', appointment_type: type, date, ...(orderId ? { order_id: orderId } : {}) })
}

export function trackContactForm(contactType: string) {
  pushEvent({ event: 'contact_form', contact_type: contactType })
}

// --- A/B testing ---

export function trackAbVariant(testName: string, variant: string) {
  pushEvent({ event: 'ab_variant_assigned', test_name: testName, variant })
}

export function trackAbFilterUsed(variant: string, filterKey: string) {
  pushEvent({ event: 'ab_filter_used', test_name: 'acheter_filter', variant, filter_key: filterKey })
}
