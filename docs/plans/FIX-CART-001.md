---
task_id: FIX-CART-001
title: "Connect header cart button to CartContext — fix hardcoded count=0 and stale href"
status: done
resolution: "2026-05-17 — Verified complete. src/components/layout/header-client.tsx:462 reads `{cart.totalItems}` from `useCart()`; cart icon click opens CartOverlay via `setCartOpen()`."
risk_level: low
edit_mode: surgical_edit
parallelizable: false
conflict_scope:
  - oaksome-web/src/components/header/header.tsx
  - oaksome-web/src/components/layout/header-client.tsx
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [CartContext, header, cart-count, CartOverlay]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CART-001 — Connect header cart button to CartContext

## Objective

The cart icon in the header has a hardcoded `<span class="cart-count">0</span>` and uses a raw `<a href="panier.html">` that triggers a full-page reload. Connect it to `CartContext` so the live item count is displayed, and replace the `<a>` with a button that opens the `CartOverlay`.

## Source Evidence

**QA-005 CRITICAL-1 / QA-014 Go-Live Blocker #1** — `reviews/QA-005-report.md`:
> "File: `oaksome-web/src/components/header/header.tsx` (line 219–224). `cart-count` is hardcoded to `0` in the source. It is never updated from `CartContext`. The `CartOverlay` component exists and is functional, but the header button does not call `setCartOpen(true)`. Evidence: DOM inspection confirmed `href='/fr/panier'`, `cart-count: '0'`."

## Scope

- `oaksome-web/src/components/header/header.tsx` — wire CartContext, replace `<a>` with button
- `oaksome-web/src/components/layout/header-client.tsx` — may also need update if cart UI lives there

Note: FIX-CART-001 and FIX-CART-002 BOTH touch `header.tsx` — they must run sequentially (not in parallel).

## Steps

1. Read `header.tsx` lines 200–240 to understand current structure.
2. Import `useCart` from `@/features/cart/context` (or wherever `CartContext` is exported).
3. Replace the hardcoded `<span class="cart-count">0</span>` with `<span className="cart-count">{cartCount}</span>` where `cartCount = useCart().count` (or `.items.length`).
4. Replace `<a href="panier.html">` with a `<button onClick={() => setCartOpen(true)}>` that opens the `CartOverlay`.
5. If `setCartOpen` is not in scope, check that `CartOverlay` is rendered and the open state is lifted appropriately (may need to move state up or use context).
6. Verify the cart badge shows the correct count after adding an item via the configurator.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | User adds item via configurator → `CartContext` count increments |
| Processing | Header reads `useCart().count` |
| Output | Cart badge shows correct non-zero count |
| Error path | If CartContext not available (SSR edge), show 0 gracefully |
| Success evidence | Add item → header badge updates to 1 without page reload |

## Impact Checklist

- [ ] Cart count live-updates in header
- [ ] Cart overlay opens on click (no full-page reload)
- [ ] No regression on FIX-CART-002 (wishlist counter — same file)

## Test Requirements

- Manual: add item via configurator → header counter increments
- Manual: click cart icon → `CartOverlay` opens (not a page navigation)
- Unit test: `header.tsx` renders with mock CartContext count=3 → badge shows "3"

## Simplicity Budget

~10 lines changed in `header.tsx`. No new files.

## Assumptions

- `CartContext` already provides `count` or `items.length` — no new API call needed.
- `CartOverlay` is already rendered in the layout tree — just need the open state toggle.
- `setCartOpen` is accessible in header scope (may be via a `CartOverlayContext` or prop).

## Open Questions

1. Is `setCartOpen` passed as a prop to the header, or is there a `CartOverlayContext`? (Read `header.tsx` before coding.)
2. Should clicking the cart icon navigate to `/panier` on mobile (where overlay may not exist)?

## Resolved Decisions

- Do NOT remove the `/panier` page route — it remains valid for direct-URL access.
- Replace the `<a>` with a `<button>` for accessibility (keyboard operability).

## Design Governance

No design review needed — purely connecting existing components.

## Dependency Freshness

Not required.

## Observability Impact

None.
