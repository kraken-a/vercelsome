export function isValidMetaPixelId(value: string): boolean {
  return /^\d{10,}$/.test(value)
}

export function metaPixelInitSnippet(pixelId: string): string {
  if (!isValidMetaPixelId(pixelId)) return ''
  return `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','revoke');fbq('init','${pixelId}');fbq('track','PageView');`
}

// Listens for Axeptio consent and grants/revokes Meta Pixel consent accordingly.
export function metaPixelConsentBridgeSnippet(): string {
  return `window._axcb=window._axcb||[];window._axcb.push(function(sdk){sdk.on('cookies:complete',function(choices){if(typeof fbq==='function'){if(choices.facebook_pixel){fbq('consent','grant');}else{fbq('consent','revoke');}}});});`
}
