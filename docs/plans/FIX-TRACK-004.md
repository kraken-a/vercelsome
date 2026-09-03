---
task_id: FIX-TRACK-004
title: "Wire Tier A event call-sites — trackPageView, trackViewItem, trackAddToWishlist, trackGenerateLead, trackSelectItem"
status: done
resolution: "2026-05-17 — Verified complete (pipeline verdict mostly_already_wired). events.ts exports trackPageView, trackViewItem, trackViewItemList, trackAddToCart, trackBeginCheckout, trackPurchase, trackGenerateLead, trackLogin."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/[locale]/layout.tsx
  - oaksome-web/src/app/[locale]/(shop)/produit/[id]/page.tsx
  - oaksome-web/src/features/wishlist/context.tsx
  - oaksome-web/src/app/api/odoo/configurator/route.ts
  - oaksome-web/src/app/[locale]/(shop)/acheter/page.tsx
integration_blockers: [FIX-TRACK-003]
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [trackPageView, trackViewItem, trackAddToWishlist, trackGenerateLead, trackSelectItem, GA4, dataLayer]
dependency_freshness: not_required
observability_impact: high
affected_interfaces: []
---

# FIX-TRACK-004 — Wire Tier A tracking event call-sites

## Objective

The five critical Tier A tracking events are never called. Wire them at the correct call-sites so GA4 and Meta Pixel receive the expected e-commerce events.

## Source Evidence

**QA-011 F-005 to F-009 / QA-014 Should-Fix #10** — `reviews/QA-011-report.md`:
> "All Tier A event call-sites missing: `trackPageView`, `trackViewItem`, `trackAddToWishlist`, `trackGenerateLead`, `trackSelectItem`. E-commerce enhanced analytics broken."

## Scope

| Event | Call-site |
|---|---|
| `trackPageView` | `[locale]/layout.tsx` (on route change) or per-page |
| `trackViewItem` | `produit/[id]/page.tsx` (on page mount) |
| `trackAddToWishlist` | `WishlistContext.addToWishlist()` on success |
| `trackGenerateLead` | Configurator lead submit / contact form submit |
| `trackSelectItem` | Product card click on acheter/category pages |

## Steps

1. Read `src/lib/tracking/gtm.ts` to understand available `track*` functions and their expected payloads.
2. In `produit/[id]/page.tsx`: call `trackViewItem({ item_id, item_name, price, ... })` on component mount (client-side useEffect or in server component).
3. In `WishlistContext.addToWishlist()`: after successful API response, call `trackAddToWishlist({ item_id, item_name, price })`.
4. In the configurator lead submit handler: call `trackGenerateLead({ lead_type: 'configurator', value: estimatedPrice })`.
5. In the product card component: add `onClick` handler that calls `trackSelectItem({ item_id, item_name, index })`.
6. For `trackPageView`: determine if it should be in layout (fires on every route change) or per-page. Add accordingly.
7. Ensure all payloads use `item_id` (not `id`) — see FIX-TRACK-006.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | User navigates to product detail page |
| Processing | Component mounts → `trackViewItem()` called → `pushEvent()` → dataLayer push |
| Output | GA4 receives `view_item` event with correct item payload |
| Success evidence | GTM preview mode shows `view_item` event firing on PDP load |

## Impact Checklist

- [ ] `page_view` fires on every route navigation
- [ ] `view_item` fires on PDP load
- [ ] `add_to_wishlist` fires on successful wishlist add
- [ ] `generate_lead` fires on configurator/contact form submit
- [ ] `select_item` fires on product card click

## Test Requirements

- GTM preview mode: navigate through key pages → verify each Tier A event fires at the correct moment
- Console: `window.dataLayer` contains expected events after each action
- No duplicate events (especially `page_view`)

## Simplicity Budget

~5 call-sites, each ~3 lines. Reuse existing `track*` functions from the tracking lib.

## Assumptions

- `track*` functions already exist in `src/lib/tracking/gtm.ts` with correct signatures.
- Event payloads match the GA4 e-commerce spec (see `frontend-spec.md` DataLayer section).
- FIX-TRACK-006 (schema fix) should ideally run before or alongside this task.

## Open Questions

1. Should `trackPageView` use Next.js `usePathname()` in a client component in layout, or use GTM's built-in page_view via a trigger?
2. What is the `item_list_id` value for the acheter page grid (needed for `trackSelectItem`)?

## Resolved Decisions

- Tier A events only in this task — Tier B/C events deferred.
- Use `item_id` (not `id`) in all payloads — aligned with FIX-TRACK-006 fix.

## Design Governance

No design review needed.

## Dependency Freshness

Not required.

## Observability Impact

High — enables e-commerce analytics. All GA4 funnel data starts from this point.
