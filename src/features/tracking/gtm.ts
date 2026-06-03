/**
 * GTM dataLayer push helper.
 * All tracking events go through this function.
 * Pre-consent pushes are dropped (Consent Mode v2 default-denied).
 * Once Axeptio (or any CMP) sets window.__vercelsomeConsent = { analytics: true, ads: true },
 * pushes resume.
 */

type DataLayerEvent = {
  event: string
  [key: string]: unknown
}

type ConsentState = {
  analytics?: boolean
  ads?: boolean
}

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[]
    __vercelsomeConsent?: ConsentState
  }
}

const ALWAYS_ALLOWED_EVENTS = new Set([
  'page_view',
  'consent_default',
  'consent_update',
])

function consentGranted(eventName: string): boolean {
  if (typeof window === 'undefined') return false
  if (ALWAYS_ALLOWED_EVENTS.has(eventName)) return true
  const c = window.__vercelsomeConsent
  return Boolean(c?.analytics || c?.ads)
}

export function pushEvent(event: DataLayerEvent): void {
  if (typeof window === 'undefined') return
  if (!consentGranted(event.event)) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(event)
}
