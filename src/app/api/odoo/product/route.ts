export const dynamic = 'force-dynamic'

import { apiGet } from '@/lib/api/client'

type RestProduct = {
  id: number
  name: string
  image_url: string
  write_date?: number
  price_ttc: number
  currency: string
  is_new: boolean
  discount: number
  type_slug: string
  collection_slugs: string[]
  space_slugs: string[]
  finition_slugs: string[]
  additional_image_urls?: string[]
}

type ProductsData = { products: RestProduct[] }
type NavItem = { id: number; name: string; slug: string }
type NavData = { collections?: NavItem[]; spaces?: NavItem[]; types?: NavItem[] }

function toImageProxyUrl(odooUrl: string, v?: number): string {
  const vSuffix = v ? `&v=${v}` : ''
  try {
    const { pathname } = new URL(odooUrl)
    return `/api/odoo/image?path=${encodeURIComponent(pathname)}${vSuffix}`
  } catch {
    return odooUrl
  }
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function toIdName(slug: string, map: Map<string, NavItem>) {
  const found = map.get(slug) ?? map.get(toSlug(slug))
  if (found) {
    return { id: found.id, name: found.name, slug: found.slug }
  }
  return { id: -1, name: slug, slug }
}

export async function GET() {
  try {
    // limit=100 fetches all products in one request (MAX_LIMIT on the addon side)
    const result = await apiGet<ProductsData>('/products', { limit: '100' })
    console.log('products :',result);
    if (!result.success) {
      return Response.json({ error: result.error }, { status: result.code })
    }

    const navResult = await apiGet<NavData>('/navigation', undefined, { revalidate: 300 })
    const collections = navResult.success ? asArray<NavItem>(navResult.data.collections) : []
    const spaces = navResult.success ? asArray<NavItem>(navResult.data.spaces) : []
    const types = navResult.success ? asArray<NavItem>(navResult.data.types) : []
    const collectionMap = new Map(collections.map((c) => [c.slug, c]))
    const spaceMap = new Map(spaces.map((s) => [s.slug, s]))
    const typeMap = new Map(types.map((t) => [t.slug, t]))

    const mapped = result.data.products.map((p) => ({
      id: p.id,
      name: p.name,
      list_price: p.price_ttc,
      currency_id: [0, p.currency || 'EUR'] as [number, string],
      description_sale: false,
      is_new: p.is_new,
      is_basic: false,
      is_premium: false,
      discount: p.discount || false,
      image_1920: p.image_url ? toImageProxyUrl(p.image_url, p.write_date) : false,
      image_1024: false,
      additional_image_ids: asArray<string>(p.additional_image_urls).map((url) => ({
        image: url ? toImageProxyUrl(url, p.write_date) : '',
      })),
      config_line_ids: [],
      style_ids: asArray<string>(p.collection_slugs).map((slug) => toIdName(slug, collectionMap)),
      space_ids: asArray<string>(p.space_slugs).map((slug) => toIdName(slug, spaceMap)),
      finition_ids: asArray<string>(p.finition_slugs).map((name) => ({ id: -1, name })),
      public_categ_ids: p.type_slug ? [toIdName(p.type_slug, typeMap)] : [],
    }))

    return Response.json(mapped)
  } catch (err) {
    console.error('[api/odoo/product]', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
