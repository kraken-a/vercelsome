export function toImageProxyUrl(odooUrl?: string | null, v?: number): string {
  if (!odooUrl) return ''
  const vSuffix = v ? `&v=${v}` : ''
  try {
    const { pathname } = new URL(odooUrl)
    return `/api/odoo/image?path=${encodeURIComponent(pathname)}${vSuffix}`
  } catch {
    if (odooUrl.startsWith('/web/image/')) {
      return `/api/odoo/image?path=${encodeURIComponent(odooUrl)}${vSuffix}`
    }
    return odooUrl
  }
}
