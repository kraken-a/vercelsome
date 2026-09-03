/**
 * Axeptio CMP helpers — pure functions that produce inline <script> bodies
 * consumed by `next/script` in `app/[locale]/layout.tsx`.
 *
 * The bridge listens for Axeptio's `axeptio_authorized_vendors` event and
 * flips `window.__oaksomeConsent`, which `features/tracking/gtm.ts`
 * already consults before pushing dataLayer events.
 */

export const COOKIES_VERSION_FR = 'oaksome-fr'
export const COOKIES_VERSION_NL = 'oaksome-nl'

const CLIENT_ID_PATTERN = /^[a-zA-Z0-9-]+$/

export function isValidAxeptioClientId(value: string): boolean {
  return CLIENT_ID_PATTERN.test(value)
}

export function cookiesVersionForLocale(locale: string): string {
  return locale === 'nl' ? COOKIES_VERSION_NL : COOKIES_VERSION_FR
}

export function axeptioInitSnippet(
  clientId: string,
  cookiesVersion: string,
): string {
  if (!isValidAxeptioClientId(clientId)) return ''
  return [
    `window.axeptioSettings = { clientId: "${clientId}", cookiesVersion: "${cookiesVersion}" };`,
    `(function(d,s){var t=d.getElementsByTagName(s)[0],e=d.createElement(s);`,
    `e.async=true;e.src="//static.axept.io/sdk.js";`,
    `t.parentNode.insertBefore(e,t);})(document,"script");`,
  ].join('')
}

export function axeptioBridgeSnippet(): string {
  return [
    `window._axcb = window._axcb || [];`,
    `window._axcb.push(function(sdk){`,
    `sdk.on("cookies:complete", function(choices){`,
    `var analytics = choices && choices.google_analytics === true;`,
    `var ads = !!(choices && (choices.google_ads === true || choices.facebook_pixel === true));`,
    `window.__oaksomeConsent = { analytics: analytics, ads: ads };`,
    `window.dataLayer = window.dataLayer || [];`,
    `window.dataLayer.push({event:"axeptio_authorized_vendors",analytics:analytics,ads:ads});`,
    `});`,
    `});`,
  ].join('')
}
