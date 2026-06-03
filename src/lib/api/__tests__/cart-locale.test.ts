/** @jest-environment node */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const CART_API = readFileSync(join(__dirname, '..', 'cart.ts'), 'utf8')
const CART_CONTEXT = readFileSync(
  join(__dirname, '..', '..', '..', 'features', 'cart', 'context.tsx'),
  'utf8',
)

describe('Cart fetch carries active locale (TASK-018)', () => {
  it('getCart accepts a `lang` parameter', () => {
    expect(CART_API).toMatch(/lang\s*\?\s*:\s*string/)
  })

  it('getCart forwards `lang` into the API query params', () => {
    expect(CART_API).toMatch(/params\.lang\s*=\s*lang/)
  })

  it('CartProvider reads the active locale via next-intl useLocale', () => {
    expect(CART_CONTEXT).toMatch(/useLocale/)
  })

  it('CartProvider maps the UI locale to an Odoo locale (fr_BE / nl_BE)', () => {
    expect(CART_CONTEXT).toMatch(/fr_BE/)
    expect(CART_CONTEXT).toMatch(/nl_BE/)
  })

  it('CartProvider passes the mapped locale to getCart', () => {
    expect(CART_CONTEXT).toMatch(/getCart\([^)]*,\s*[a-zA-Z_]+\s*\)/)
  })
})
