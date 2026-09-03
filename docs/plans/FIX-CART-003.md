---
task_id: FIX-CART-003
title: "Show user feedback on anonymous cart/wishlist 401 — toast + login redirect"
status: done
resolution: "2026-05-17 — Verified complete. src/features/cart/context.tsx:103-107 checks `result.code === 401` and calls `toast.show('Connectez-vous pour ajouter au panier', 'info')`; src/features/wishlist/context.tsx:69-73 same pattern with appropriate copy."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/features/cart/context.tsx
  - oaksome-web/src/features/wishlist/context.tsx
  - oaksome-web/src/components/ui/add-to-cart-button.tsx
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [CartContext, anonymous, 401, toast, login-redirect]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CART-003 — Show user feedback on anonymous cart/wishlist 401

## Objective

When an anonymous user clicks "Ajouter au panier" or "Sauvegarder", the API returns 401. Currently the UI silently resets without any feedback. Add a toast notification and/or a redirect to login with `?next=` so users understand why the action failed.

## Source Evidence

**QA-005 CRITICAL-3 / QA-014 Go-Live Blocker #3** — `reviews/QA-005-report.md`:
> "The `AddToCartButton` component calls `addItem(item)` which calls `addToCart()`. The API returns 401. The context function `addItem` does not check the return value or surface an error to the user. No toast, no redirect to login, no visual feedback. Evidence: Live API probe confirmed `POST /api/oaksome/v1/cart/add` → 401 for anon users."

## Scope

- `oaksome-web/src/features/cart/context.tsx` — `addItem()` method: check return, handle 401
- `oaksome-web/src/features/wishlist/context.tsx` — same pattern for `addToWishlist()`
- `oaksome-web/src/components/ui/add-to-cart-button.tsx` — may be the call site

## Steps

1. In `CartContext.addItem()`: check if `addToCart()` returns a 401/error response.
2. On 401: show a toast notification "Connectez-vous pour ajouter au panier" (or equivalent i18n key) AND/OR call `router.push('/login?next=' + encodeURIComponent(pathname))`.
3. Apply the same pattern to `WishlistContext` for `addToWishlist()` on 401.
4. Decide: toast only, redirect only, or toast then redirect after 2s? (See Open Questions.)
5. If no toast system exists yet, use `window.alert()` as a temporary placeholder (mark TODO for proper toast library).
6. Test by opening the app unauthenticated and clicking "Ajouter au panier".

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Anonymous user clicks "Ajouter au panier" |
| Processing | API returns 401; `addItem()` catches error |
| Output | Toast: "Veuillez vous connecter pour ajouter au panier" |
| Error path | Network error (not 401) → generic error toast |
| Success evidence | Anon click → visible feedback, no silent failure |

## Impact Checklist

- [ ] No silent 401 failures on cart/wishlist mutations
- [ ] User knows they need to login
- [ ] No regression for authenticated users (they see success as before)

## Test Requirements

- Manual (unauthenticated): click "Ajouter au panier" → feedback appears
- Manual (authenticated): same action → still works correctly
- Unit test: `addItem()` with mock 401 response → toast called

## Simplicity Budget

~15 lines across 2 context files. If no toast library exists, `window.alert()` is acceptable as a stopgap.

## Assumptions

- A toast notification system exists or can be improvised; check for `react-hot-toast`, `sonner`, or similar in `package.json`.
- `useRouter()` is available in context files (or the 401 handler is moved to the call-site component).
- The error response from `addToCart()` exposes the HTTP status code.

## Open Questions

1. Is there an existing toast/notification library in the project? (Check `package.json` for `react-hot-toast`, `sonner`, `react-toastify`.)
2. Should the 401 response trigger an immediate redirect to login, or just a toast with a "Se connecter" button?
3. Should anonymous wishlist saves attempt a "save for later" email popup instead of a login redirect? (See FIX-CART-006 for the full anon wishlist flow.)

## Resolved Decisions

- The `addItem()` function must never silently swallow a 401 — always surface user feedback.
- Fix applies to both `CartContext` and `WishlistContext`.

## Design Governance

No design review needed. UX copy to be confirmed by Rachid (French language).

## Dependency Freshness

Not required.

## Observability Impact

None.
