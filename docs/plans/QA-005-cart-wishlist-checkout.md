---
task_id: QA-005
title: Cart, wishlist, and Odoo checkout handoff
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-005-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-005 — Cart, wishlist, and Odoo checkout handoff

## Objective

- User action: build cart + wishlist anon → login → continue to Odoo checkout
- Expected UI state: items persist; merge is lossless; redirect lands on the right Odoo URL with session
- Error state: merge conflict shows a deterministic resolution (e.g., higher qty wins) — verify rule is documented
- Success evidence: Odoo cart row matches Next.js cart at handoff time

## Scope

**In scope**
- Wishlist CRUD anon path (localStorage only)
- Cart CRUD anon path (localStorage only)
- Checkout handoff URL inspection: capture the URL that `/cart` "Passer commande" would redirect to — **do not follow the redirect** into Odoo checkout
- Cross-tab/session persistence (anon)
- Static inspection of the authed/merge code paths (read source, document expected behavior, mark as untested-against-prod)

**Out of scope (deferred — prod-write risk)**
- Authed cart sync to Odoo `website.cart.item` (would write production data)
- Authed wishlist sync to Odoo `website.wishlist.item` (would write production data)
- Anon→authed merge live test (would write production data)
- Following the checkout handoff URL into Odoo (could create a draft SO in production)
- Odoo-side payment, Stripe, signatures (out of family scope)

## Steps

1. Anon: add 3 products to wishlist; refresh; verify persistence in localStorage.
2. Anon: add 3 products to cart, vary quantities; refresh; verify persistence.
3. Anon: remove items, change qty; verify localStorage updates and UI reflects.
4. Open cart in second tab; modify; verify other tab reflects change after refresh (no realtime expected).
5. Click "Passer commande" anon: capture the target URL (DevTools, with redirect blocking enabled). Verify it points at `cdn.oaksome.com` portal checkout and that session/cart payload is structured per `docs/api-contract.md`. **Block the redirect — do not follow.**
6. Edge cases (anon-only): empty-cart checkout attempt, invalid product id in localStorage, malformed cart state on reload, very large cart (50+ items).
7. Authed/merge paths: read source code at `oaksome-web/src/lib/cart/*` and `oaksome-web/src/app/api/oaksome/cart/route.ts` (paths approximate — locate via grep); document expected behavior, conflict-resolution rule, and any code-level gaps. Mark this branch as "static review only — needs sandbox Odoo for live test".

## Verifiable Flow Goals

- User action: anon build cart + wishlist → inspect checkout handoff URL → static review of authed path
- Expected UI state: items persist in localStorage; handoff URL is well-formed
- Error state: empty-cart handoff blocked client-side; invalid product id removed from cart
- Success evidence: handoff URL documented + payload schema captured; authed-path behavior documented from source; zero Odoo writes

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-005-report.md`

## Test Requirements

- Required behavior to verify: cart + wishlist persistence, anon→authed merge, Odoo handoff URL correctness.
- Regressions to prevent: duplicate items on merge, lost qty, broken handoff URL, session not forwarded.
- Edge cases: large cart (50+ items), simultaneous tabs, login mid-checkout, configured-product cart line with custom options.

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-005-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- Target Odoo is **production** (`cdn.oaksome.com`). Authed/merge live tests are deferred to avoid writes.
- Checkout handoff URL is documented in `docs/api-contract.md`.

## Open Questions

- What is the documented merge rule for anon→authed cart conflicts? Recommendation: derive from code under `oaksome-web/src/lib/cart/*`; if undocumented, flag as a doc gap in QA-014.

## Resolved Decisions

- Audit-only AND no-write. Anon localStorage paths are live-tested; authed/merge paths are statically reviewed from source; checkout-handoff URL is inspected without following the redirect.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
