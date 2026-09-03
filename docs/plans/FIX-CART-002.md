---
task_id: FIX-CART-002
title: "Fix header wishlist counter — read from WishlistContext not stale localStorage key"
status: done
resolution: "2026-05-17 — Verified complete (pipeline verdict no_op_already_remediated). src/components/layout/header-client.tsx:446 reads `{wishlist.count}` from WishlistContext."
risk_level: low
edit_mode: surgical_edit
parallelizable: false
conflict_scope:
  - oaksome-web/src/components/header/header.tsx
integration_blockers: [FIX-CART-001]
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [WishlistContext, header, wishlist-count, localStorage, oaksome_wishlist]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CART-002 — Fix header wishlist counter

## Objective

The wishlist counter in the header reads from `localStorage.getItem('oaksome_wishlist')` (a prototype-era key) instead of `WishlistContext`. Replace with a `useWishlist()` hook call so the counter reflects actual server-synced state.

## Source Evidence

**QA-005 CRITICAL-2 / QA-014 Go-Live Blocker #2** — `reviews/QA-005-report.md`:
> "File: `oaksome-web/src/components/header/header.tsx` (line 62–63). Source: `localStorage.getItem('oaksome_wishlist')` — reads from the old prototype localStorage key. The WishlistContext syncs with Odoo via session cookie. The header counter will always show 0 for authenticated users who have Odoo-side wishlist items."

## Scope

- `oaksome-web/src/components/header/header.tsx` lines 62–63

Note: Must run after FIX-CART-001 since both touch the same file.

## Steps

1. Locate lines 62–63 in `header.tsx` (the `localStorage.getItem('oaksome_wishlist')` call).
2. Import `useWishlist` from `@/features/wishlist/context`.
3. Replace `localStorage.getItem('oaksome_wishlist')` with `useWishlist().count` (or `.items.length`).
4. Ensure the component is client-side (add `'use client'` if needed) since `useWishlist` is a context hook.
5. Verify the count updates when items are added/removed from wishlist.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Authenticated user has 3 items in wishlist (Odoo session) |
| Processing | Header reads `useWishlist().count` |
| Output | Wishlist badge shows "3" |
| Error path | Unauthenticated: WishlistContext returns 0 → badge shows 0 (correct) |
| Success evidence | Login → wishlist badge immediately shows correct count |

## Impact Checklist

- [ ] Wishlist counter live-updates in header
- [ ] No more reads from deprecated `oaksome_wishlist` localStorage key
- [ ] Works for both authenticated and anonymous users

## Test Requirements

- Manual: login with wishlist items → counter shows correct non-zero count
- Manual: add item to wishlist → counter increments in real-time
- Unit test: `header.tsx` renders with mock WishlistContext count=2 → badge shows "2"

## Simplicity Budget

2–3 lines changed. No new files.

## Assumptions

- `WishlistContext` exposes a `count` or `items` field.
- The header component can be made a client component if it is not already.

## Open Questions

1. Is `header.tsx` already a client component or does it need `'use client'` added?

## Resolved Decisions

- Remove the `localStorage.getItem('oaksome_wishlist')` call entirely — do not keep it as a fallback.
- Run after FIX-CART-001 (same file conflict).

## Design Governance

No design review needed.

## Dependency Freshness

Not required.

## Observability Impact

None.
