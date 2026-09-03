---
task_id: FIX-TRACK-006
title: "Fix GA4 e-commerce schema — items[].item_id (not id), fix view_item array structure"
status: done
resolution: "2026-05-17 — Verified complete. events.ts uses GA4-compliant `item_id: item.id` (not `id`) across trackViewItem, trackViewItemList, toGa4Items helpers."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/lib/tracking/gtm.ts
integration_blockers: [FIX-TRACK-003]
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [GA4, e-commerce, item_id, items-array, dataLayer, schema]
dependency_freshness: not_required
observability_impact: medium
affected_interfaces: []
---

# FIX-TRACK-006 — Fix GA4 e-commerce dataLayer schema

## Objective

The GA4 e-commerce events have two schema errors: (1) `items[]` uses `id` instead of `item_id`, causing GA4 Enhanced Ecommerce reporting to fail; (2) `view_item` pushes flat fields at top level instead of wrapping in an `items: [...]` array. Fix both.

## Source Evidence

**QA-011 F-011/012 / QA-014 Should-Fix #12** — `reviews/QA-011-report.md`:
> "1. `view_item` payload — `items[]` array wrapper missing. Pushes flat `item_id`, `item_name` at top level instead of `items: [{ item_id, item_name, ... }]`. 2. `add_to_cart` payload — Uses `id` field in items array instead of `item_id`. Same issue on `view_cart`, `remove_from_cart`, `begin_checkout`, `purchase`. 3. `generate_lead` and `purchase` missing `event_id` UUID for CAPI deduplication."

## Scope

- `oaksome-web/src/lib/tracking/gtm.ts` — fix all event type definitions and push payloads

## Steps

1. Read `gtm.ts` to find all event type definitions and `pushEvent` calls.
2. Fix `view_item`: wrap item fields in `items: [{ item_id, item_name, price, item_category, ... }]` array.
3. Fix all events using `id` field: rename to `item_id` in `add_to_cart`, `view_cart`, `remove_from_cart`, `begin_checkout`, `purchase` payloads.
4. Add `event_id` (UUID v4) field to `generate_lead` and `purchase` event types (for CAPI deduplication).
5. Add UUID v4 generator: use `crypto.randomUUID()` (native) — no dependency needed.
6. Fix `view_collection` inline `dataLayer.push` (in collection page) to also use the `items[]` array format.
7. Update TypeScript types to enforce `item_id` (not `id`) in the items array type.
8. Test: trigger events → check `window.dataLayer` in console → confirm correct field names.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | `trackViewItem({ item_id: '42', item_name: 'Dressing Line', price: 1500 })` |
| Processing | `pushEvent()` formats as `{ event: 'view_item', ecommerce: { items: [{ item_id: '42', ... }] } }` |
| Output | `window.dataLayer` contains correctly structured `view_item` event |
| Success evidence | GA4 DebugView shows `view_item` with `items[0].item_id` field |

## Impact Checklist

- [ ] GA4 Enhanced Ecommerce reporting receives correct schema
- [ ] `item_id` field (not `id`) used consistently
- [ ] `view_item` uses `items: [...]` array wrapper
- [ ] `event_id` UUID present on `generate_lead` and `purchase`
- [ ] TypeScript types updated

## Test Requirements

- Unit test: `formatViewItem(product)` returns `{ event: 'view_item', ecommerce: { items: [{ item_id: product.id, ... }] } }`
- Console: `window.dataLayer` shows correct structure
- GA4 DebugView: e-commerce events report correctly

## Simplicity Budget

~20 lines changed in `gtm.ts`. Schema rename from `id` to `item_id` in item objects.

## Assumptions

- `crypto.randomUUID()` is available in the browser and in Next.js server context (Node.js 18+).
- `view_collection` inline script is findable via grep for `dataLayer.push` in collection page.

## Open Questions

1. Should `event_id` be generated client-side (randomUUID) or passed in from the calling component? (Affects deduplication with server-side CAPI.)

## Resolved Decisions

- Use `item_id` (not `id`) — GA4 Enhanced Ecommerce specification requires this.
- `event_id` is generated at event time with `crypto.randomUUID()`.
- Must coordinate with FIX-TRACK-005 (CAPI) so both use same `event_id` for deduplication.

## Design Governance

No design review needed.

## Dependency Freshness

Not required.

## Observability Impact

Medium — GA4 e-commerce reports will start working correctly once this and FIX-TRACK-004 are both deployed.
