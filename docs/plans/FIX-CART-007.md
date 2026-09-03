---
task_id: FIX-CART-007
title: "Unify wishlist state — sync localStorage (acheter grid) with server WishlistContext"
status: done
resolution: "2026-05-17 — Verified complete (pipeline verdict no_op_already_remediated). Wishlist state unified through WishlistContext; acheter page reads server count."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/[locale]/(shop)/acheter/page.tsx
  - oaksome-web/src/features/wishlist/context.tsx
  - oaksome-web/src/features/wishlist/hooks.ts
integration_blockers: [FIX-CART-004]
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [wishlist, localStorage, WishlistContext, state-split, acheter]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CART-007 — Unify wishlist state (localStorage + server)

## Objective

The catalogue/acheter page stores wishlist state in `localStorage` independently of `WishlistContext` (which syncs with Odoo). Items added from the product grid never appear in the wishlist page (which reads only from server state). Unify: have the acheter grid use `WishlistContext.addToWishlist()` so both surfaces are in sync.

## Source Evidence

**QA-002 F-002 / QA-014 Should-Fix #17** — `reviews/QA-002-report.md`:
> "Wishlist state split — localStorage (acheter page) vs server state (wishlist page). Items added from grid never appear in wishlist page."

## Scope

- `oaksome-web/src/app/[locale]/(shop)/acheter/page.tsx` — replace localStorage wishlist writes with `WishlistContext`
- `oaksome-web/src/features/wishlist/context.tsx` — may need to expose optimistic local state for the grid
- `oaksome-web/src/features/wishlist/hooks.ts` — may need a `isInWishlist(productId)` helper

## Steps

1. Read `acheter/page.tsx` to find the wishlist toggle logic (localStorage read/write).
2. Import `useWishlist` and replace `localStorage.setItem(...)` calls with `addToWishlist(item)` and `removeFromWishlist(id)`.
3. Replace `localStorage.getItem(...)` wishlist checks with `useWishlist().isInWishlist(productId)` or equivalent.
4. Ensure the WishlistContext optimistically updates the UI (no loading flash on each toggle).
5. Test: add item from acheter grid → navigate to wishlist page → item appears.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Authenticated user clicks wishlist heart on product card in /acheter |
| Processing | `WishlistContext.addToWishlist()` called → API + optimistic state |
| Output | Item immediately highlighted in grid; appears on `/wishlist` page |
| Error path | API fails → optimistic state rolled back, error toast |
| Success evidence | Add from grid → wishlist page shows same item |

## Impact Checklist

- [ ] Wishlist additions from product grid reflected on wishlist page
- [ ] No more direct localStorage writes for wishlist in acheter page
- [ ] Heart/saved state in grid stays in sync with context

## Test Requirements

- Manual: add from acheter grid → navigate to wishlist → item present
- Manual: remove from wishlist page → return to acheter → heart unchecked

## Simplicity Budget

Replace ~10 localStorage calls in acheter page with context calls. No new API routes.

## Assumptions

- `WishlistContext` has or can expose `isInWishlist(productId): boolean`.
- Optimistic updates in `WishlistContext` are already implemented or can be added with ~5 lines.

## Open Questions

1. Does `WishlistContext` currently support optimistic state for the grid UI (instant heart toggle), or does it wait for the API response?

## Resolved Decisions

- Remove localStorage wishlist logic from acheter page entirely — single source of truth is WishlistContext.

## Design Governance

No design review needed.

## Dependency Freshness

Not required.

## Observability Impact

None.
