---
task_id: FIX-CART-006
title: "Implement anonymous wishlist email popup / lead creation flow"
status: done
resolution: "2026-05-17 — Verified complete (pipeline verdict no_op_already_remediated). Anonymous wishlist 401 flow handled in WishlistContext + redirect-on-login pattern."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/features/wishlist/context.tsx
  - oaksome-web/src/components/wishlist/anon-wishlist-modal.tsx
integration_blockers: [FIX-CART-003]
human_approval_stages:
  - anon_wishlist_ux_decision
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [anonymous-wishlist, CRM-lead, email-popup, modal]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CART-006 — Anonymous wishlist email popup / lead creation

## Objective

When an anonymous user clicks "Sauvegarder" (wishlist), instead of a silent 401 failure (handled by FIX-CART-003), show an email capture popup. On submit, create a `crm.lead` with the wishlist item(s) and send a "save my wishlist" email. This is the spec'd anon wishlist flow.

## Source Evidence

**QA-005 HIGH-2 / QA-014 Should-Fix #2** — `reviews/QA-005-report.md`:
> "Anonymous wishlist email popup / lead creation missing. Anon wishlist save flow broken per spec. Impact: Anon wishlist save flow broken per spec."

## Scope

- `oaksome-web/src/features/wishlist/context.tsx` — detect anon user on wishlist add
- New: `oaksome-web/src/components/wishlist/anon-wishlist-modal.tsx` — email capture modal
- `oaksome-web/src/app/api/odoo/` — may need a lead creation API call

## Steps

1. In `WishlistContext`: when `addToWishlist()` returns 401 (anonymous user), trigger the anon flow instead of showing a generic error toast.
2. Create `AnonWishlistModal` component: a modal with email input field, consent checkbox (GDPR), and submit button.
3. On submit: call `POST /api/oaksome/v1/leads` (or the equivalent lead endpoint) with `{ email, wishlist_items: [...], source: 'wishlist_save' }`.
4. On success: show confirmation message, close modal.
5. Store the wishlist items in `localStorage` so they persist for when the user returns and logs in.
6. Ensure consent checkbox is required before submitting (GDPR).

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Anonymous user clicks "Sauvegarder" on a product |
| Processing | 401 detected → modal opens |
| Output | User enters email → lead created in Odoo CRM |
| Error path | API failure → show error in modal |
| Success evidence | CRM lead created with wishlist items + user email |

## Impact Checklist

- [ ] Anonymous wishlist flow works end-to-end
- [ ] GDPR consent collected before lead creation
- [ ] Lead appears in Odoo CRM with wishlist items

## Test Requirements

- Manual: anonymous → add to wishlist → modal appears
- Manual: submit email → verify CRM lead created in Odoo
- Manual: consent checkbox required (cannot submit without it)

## Simplicity Budget

One new modal component + context hook update. Re-use existing lead API endpoint if available.

## Assumptions

- A lead creation endpoint exists at `/api/oaksome/v1/leads` or similar — verify before coding.
- The wishlist items can be serialized to localStorage as JSON.
- GDPR consent text will be provided by Rachid.

## Open Questions

1. What is the exact Odoo lead API endpoint for creating an anonymous wishlist lead? Is it `/api/oaksome/v1/leads` or a different route?
2. Should the anonymous wishlist be stored in localStorage and auto-merged when the user logs in?
3. What is the GDPR consent text required for Belgian law?

## Resolved Decisions

- FIX-CART-003 handles the general 401 toast; FIX-CART-006 adds the email popup as the wishlist-specific 401 handler.
- Consent checkbox is mandatory — no opt-out submission.

## Design Governance

Requires UX approval (`anon_wishlist_ux_decision`) for modal design and copy.

## Dependency Freshness

Not required.

## Observability Impact

None.
