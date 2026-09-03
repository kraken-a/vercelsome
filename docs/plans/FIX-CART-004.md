---
task_id: FIX-CART-004
title: "Fix wishlist/cart cross-stream buttons — replace legacy Odoo JSON-RPC calls with /api/oaksome/v1/* proxy"
status: done
resolution: "2026-05-17 — Verified complete (pipeline verdict no_op_already_remediated)."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/[locale]/(shop)/panier/page.tsx
  - oaksome-web/src/app/[locale]/(shop)/wishlist/page.tsx
integration_blockers: [FIX-CART-003]
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [JSON-RPC, legacy-endpoint, wishlist, cart, cross-stream]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CART-004 — Fix wishlist/cart cross-stream buttons

## Objective

The "Move to wishlist" button on the cart page and the "Add to cart" + "Remove" buttons on the wishlist page call legacy Odoo JSON-RPC endpoints (`/wishlist/add`, `/cart/add`, `/wishlist/remove`) that do not exist in the new architecture. Replace them with calls to `/api/oaksome/v1/...` via the existing `cart.ts` and `wishlist.ts` API client functions.

## Source Evidence

**QA-005 CRITICAL-4 / QA-014 Go-Live Blocker #4** — `reviews/QA-005-report.md`:
> "Files: `panier/page.tsx` — `handleSaveToWishlist()` calls `fetch('/wishlist/add', { body: jsonrpc... })`. `wishlist/page.tsx` — `handleAddToCart()` calls `fetch('/cart/add', { body: jsonrpc... })`, `handleRemove()` calls `fetch('/wishlist/remove', { body: jsonrpc... })`. These cross-stream actions are completely broken."

## Scope

- `oaksome-web/src/app/[locale]/(shop)/panier/page.tsx` — replace `handleSaveToWishlist()`
- `oaksome-web/src/app/[locale]/(shop)/wishlist/page.tsx` — replace `handleAddToCart()` and `handleRemove()`
- `oaksome-web/src/lib/api/cart.ts` — use existing functions (read first)
- `oaksome-web/src/lib/api/wishlist.ts` — use existing functions (read first)

## Steps

1. Read `src/lib/api/cart.ts` and `src/lib/api/wishlist.ts` to understand available functions and their signatures.
2. In `panier/page.tsx`, replace `handleSaveToWishlist()`:
   - Remove: `fetch('/wishlist/add', { body: jsonrpc... })`
   - Add: call the appropriate wishlist API function (e.g., `addToWishlist(productId)`)
3. In `wishlist/page.tsx`, replace `handleAddToCart()`:
   - Remove: `fetch('/cart/add', { body: jsonrpc... })`
   - Add: call `addToCart(item)` from `@/lib/api/cart`
4. In `wishlist/page.tsx`, replace `handleRemove()`:
   - Remove: `fetch('/wishlist/remove', { body: jsonrpc... })`
   - Add: call the remove function from `@/lib/api/wishlist`
5. Ensure the context state is refreshed after each mutation (call `fetchCart()` / `fetchWishlist()` as appropriate).
6. Test: move item from wishlist → cart; move item from cart → wishlist; remove from wishlist.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Authenticated user clicks "Déplacer vers la liste de souhaits" on cart page |
| Processing | `addToWishlist(productId)` called → `/api/oaksome/v1/wishlist/add` → Odoo |
| Output | Item removed from cart, appears in wishlist |
| Error path | API failure → toast error, no state change |
| Success evidence | Cross-stream moves work without 404 network errors |

## Impact Checklist

- [ ] Move-to-wishlist from cart: functional
- [ ] Add-to-cart from wishlist: functional
- [ ] Remove from wishlist: functional
- [ ] No more direct `fetch('/wishlist/...')` or `fetch('/cart/...')` without proxy

## Test Requirements

- Manual (authenticated): move item from cart → wishlist → appears in wishlist
- Manual (authenticated): move item from wishlist → cart → appears in cart
- Manual: remove item from wishlist → item gone
- Network tab: no requests to `/wishlist/add` (legacy) — all via `/api/oaksome/v1/...`

## Simplicity Budget

Replace 3 handler functions. Use existing API client functions — no new routes.

## Assumptions

- `src/lib/api/cart.ts` and `src/lib/api/wishlist.ts` already have the correct functions for add/remove operations.
- The existing functions handle authentication (session cookie forwarded via Next.js proxy).
- Context state refresh is done by calling `fetchCart()` and `fetchWishlist()` after mutation.

## Open Questions

1. Do the cart and wishlist API client functions in `lib/api/` handle the `credentials: 'include'` header automatically, or does each call site need to add it?

## Resolved Decisions

- No new API routes needed — use the existing `/api/oaksome/v1/...` proxy.
- Remove all `jsonrpc: '2.0'` body format from these handlers.

## Design Governance

No design review needed.

## Dependency Freshness

Not required.

## Observability Impact

None.
