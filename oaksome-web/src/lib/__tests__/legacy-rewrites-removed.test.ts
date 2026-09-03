/** @jest-environment node */
/**
 * TASK-054 (audit M6): the legacy `/shop`, `/wishlist`, `/cart` rewrites to
 * Odoo's web controllers were removed because they bypassed the proxy's CSRF
 * origin check, cookie allowlist, and rate limiting. These tests lock that in:
 *   1. next.config rewrites emit no shop/wishlist/cart passthrough.
 *   2. the middleware matcher no longer excludes those prefixes.
 *   3. cart/wishlist API calls still resolve via the guarded /api/oaksome proxy.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')

describe('TASK-054 — legacy Odoo rewrites removed (Option A)', () => {
  it('next.config.mjs declares no /shop, /wishlist, or /cart rewrites', () => {
    const config = readFileSync(resolve(ROOT, 'next.config.mjs'), 'utf8')
    // The rewrites() destination template strings are the bypass; they must be gone.
    expect(config).not.toMatch(/destination:\s*`\$\{odooUrl\}\/shop\//)
    expect(config).not.toMatch(/destination:\s*`\$\{odooUrl\}\/wishlist\//)
    expect(config).not.toMatch(/destination:\s*`\$\{odooUrl\}\/cart\//)
    expect(config).not.toMatch(/source:\s*'\/shop\/:path\*'/)
    expect(config).not.toMatch(/source:\s*'\/wishlist\/:path\*'/)
    expect(config).not.toMatch(/source:\s*'\/cart\/:path\*'/)
  })

  it('middleware matcher no longer excludes shop/wishlist/cart prefixes', () => {
    const mw = readFileSync(resolve(ROOT, 'src/middleware.ts'), 'utf8')
    const matcherLine = mw
      .split('\n')
      .find((l) => l.includes('matcher:'))
    expect(matcherLine).toBeDefined()
    expect(matcherLine).not.toMatch(/\|shop\|/)
    expect(matcherLine).not.toMatch(/\|wishlist\|/)
    expect(matcherLine).not.toMatch(/\|cart\|/)
    // Core exclusions must remain intact (do not regress TASK-050 behaviour).
    expect(matcherLine).toMatch(/api/)
    expect(matcherLine).toMatch(/_next/)
    expect(matcherLine).toMatch(/_vercel/)
  })

  it('cart/wishlist API calls resolve through the guarded /api/oaksome proxy', () => {
    const client = readFileSync(resolve(ROOT, 'src/lib/api/client.ts'), 'utf8')
    expect(client).toMatch(/API_PREFIX\s*=\s*'\/api\/oaksome\/v1'/)
    // cart.ts / wishlist.ts pass bare '/cart/...' & '/wishlist/...' paths to the
    // client helpers, which prepend API_PREFIX — i.e. they hit the guarded
    // proxy, never the removed top-level rewrite.
    const cart = readFileSync(resolve(ROOT, 'src/lib/api/cart.ts'), 'utf8')
    const wishlist = readFileSync(resolve(ROOT, 'src/lib/api/wishlist.ts'), 'utf8')
    expect(cart).toMatch(/apiPost.*'\/cart\/add'/)
    expect(wishlist).toMatch(/apiPost.*'\/wishlist\/add'/)
  })
})
