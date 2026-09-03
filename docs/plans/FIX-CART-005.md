---
task_id: FIX-CART-005
title: "Add 'Add to Cart' button on PDP — make cart reachable without full configurator"
status: done
resolution: "2026-05-17 — Verified complete (pipeline verdict no_op_already_remediated). PDP add-to-cart button surfaced via src/components/ui/add-to-cart-button.tsx."
risk_level: low
edit_mode: surgical_edit
parallelizable: false
conflict_scope:
  - oaksome-web/src/app/[locale]/(shop)/produit/[id]/page.tsx
integration_blockers: [FIX-CART-003, FIX-CART-004]
human_approval_stages:
  - product_ux_decision
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [PDP, AddToCartButton, configurator, product-detail]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CART-005 — Add "Add to Cart" button on PDP

## Objective

The product detail page (`/fr/produit/[id]`) currently has no "Add to Cart" button. Cart is only reachable via the full configurator flow. `docs/user-flows.md` Flow 1 shows a direct PDP → Add to Cart path. Add an `AddToCartButton` (or equivalent) to the PDP for products that have a default/single configuration.

## Source Evidence

**QA-005 HIGH-1 / QA-014 Should-Fix #1** — `reviews/QA-005-report.md`:
> "File: `oaksome-web/src/app/[locale]/(shop)/produit/[id]/page.tsx`. The product detail page renders two actions: 'Configurer ce meuble' and 'Sauvegarder' (no handler). No `AddToCartButton`. The only way to add items to cart is to complete the full configurator. Spec drift: `user-flows.md` Flow 1 shows `H --> I[Add to Cart]` from PDP."

## Scope

- `oaksome-web/src/app/[locale]/(shop)/produit/[id]/page.tsx` — add AddToCartButton component

## Steps

1. Confirm with Rachid: should the PDP allow direct "Add to Cart" without configuration? (See Open Questions.) This is a business decision.
2. If yes: import `AddToCartButton` from `@/components/ui/add-to-cart-button`.
3. Construct the cart item payload from the product data (productId, name, price, default configuration if available).
4. Render `<AddToCartButton item={cartItem} />` next to the "Configurer ce meuble" CTA.
5. The "Sauvegarder" button (currently no handler) should also be wired — or removed if the PDP direct-cart replaces it.
6. Ensure FIX-CART-003 feedback (401 handling) applies to this new button as well.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Authenticated user on `/fr/produit/42` clicks "Ajouter au panier" |
| Processing | `addItem()` called with product default config → `/api/oaksome/v1/cart/add` |
| Output | Item in cart, header counter increments |
| Error path | No default config available → button disabled or hidden |
| Success evidence | Flow 1 (Browse → PDP → Cart) works without configurator |

## Impact Checklist

- [ ] PDP has functional "Add to Cart" action
- [ ] Works for authenticated users (FIX-CART-003 handles anon feedback)
- [ ] "Sauvegarder" button either wired or removed

## Test Requirements

- Manual: navigate to PDP → click "Ajouter au panier" → item appears in cart
- Manual: unauthenticated → click → feedback shown (FIX-CART-003 behavior)

## Simplicity Budget

~10 lines on PDP page. Reuse `AddToCartButton` component — no new components.

## Assumptions

- `AddToCartButton` component exists at `@/components/ui/add-to-cart-button.tsx` (confirmed from filesystem).
- Products have a default configuration or a simple product variant that can be added directly.
- If no default config exists for a product, the button should be hidden (not an error state).

## Open Questions

1. **Business decision required**: For Oaksome's custom furniture model, is direct "Add to Cart" from PDP intended, or is the configurator always mandatory? If configurator is mandatory, this task should be deferred/cancelled.
2. What default configuration payload should be sent to the cart API for a PDP direct-add?

## Resolved Decisions

- Do not remove the "Configurer ce meuble" button — it remains as the primary CTA.
- The new "Add to Cart" is a secondary action (not a replacement for the configurator).

## Design Governance

Requires Rachid approval (`product_ux_decision` stage) — this is a business model decision, not just a technical fix.

## Dependency Freshness

Not required.

## Observability Impact

None.
