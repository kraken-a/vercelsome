---
task_id: QA-002
title: Catalogue & product-detail deep test
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-002-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-002 — Catalogue & product-detail deep test

## Objective

- User action: navigate to each catalogue route, run search, toggle wishlist
- Expected UI state: products render with correct images, prices, taxonomy badges; search returns relevant results via proxy
- Error state: API failures show a graceful empty/skeleton state, no white-screen
- Success evidence: every route 200s, every catalogue page lists ≥1 product or shows an explicit empty state, search proxy is used

## Scope

**In scope**
- `/{locale}/acheter` (catalogue landing)
- `/{locale}/gamme/[slug]` (10 gammes: dressing, bibliothèque, etc.)
- `/{locale}/espace/[slug]` (5 espaces: chambre, salon, bureau, entrée, buanderie)
- `/{locale}/collection/[slug]` (4 collections: Line, Satori, Vista, Lys)
- `/{locale}/produit/[id]` (product detail)
- Search bar end-to-end (proxy correctness — see FIX-001)
- Filters, sort, pagination, breadcrumbs, related products
- Wishlist add/remove on product cards and PDP

**Out of scope**
- Configurator tunnel (QA-003)
- Cart add/checkout (QA-005)

## Steps

1. Visit every catalogue route in FR and NL; verify HTTP 200, no console errors, no failed network requests.
2. On each gamme/espace/collection page: verify category metadata (name, image, description), product grid count > 0, pagination/load-more works, filters apply correctly.
3. On PDP: verify all custom fields render (specs, dimensions, finitions, color swatches, gallery, related products); verify slug is not literal `"undefined"` (FIX-003).
4. Verify image dimensions fallback for products with 0×0 dimensions.
5. Search: type a query, verify request goes through `/api/oaksome/v1/search` (Next.js proxy) not directly to Odoo; verify results render; verify zero-result state.
6. Wishlist: add from card, add from PDP, remove, verify localStorage state, verify counter updates.
7. Compare layout and copy against prototype counterparts identified in QA-001.

## Verifiable Flow Goals

- User action: navigate to each catalogue route, run search, toggle wishlist
- Expected UI state: products render with correct images, prices, taxonomy badges; search returns relevant results via proxy
- Error state: API failures show a graceful empty/skeleton state, no white-screen
- Success evidence: every route 200s, every catalogue page lists ≥1 product or shows an explicit empty state, search proxy is used

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-002-report.md`

## Test Requirements

- Required behavior to verify: catalogue rendering, search proxy usage, wishlist localStorage persistence, PDP completeness.
- Regressions to prevent: cross-origin Odoo calls from the browser, broken slugs, zero-dimension fallbacks.
- Edge cases: products without images, gammes with no products, search with special characters, very long queries, locale switch mid-session.

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-002-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- Target Odoo is **production** (`cdn.oaksome.com`), reached via `NEXT_PUBLIC_ODOO_URL` from the local dev server.
- The production Odoo catalogue is the canonical dataset; if a gamme/collection has zero products in prod, that itself is a finding (not a test-data issue).
- FIX-001 (search proxy) and FIX-003 (product slug/dimensions) are still open — this audit must report current state, not the post-fix state.

## Open Questions

- (None — target environment is resolved.)

## Resolved Decisions

- Audit-only. Read-only against production Odoo (catalogue reads do not mutate state).
- Report goes to `reviews/QA-002-report.md` with screenshots under `reviews/screenshots/QA-002/`.
- Use Chrome DevTools MCP for navigation and network capture; capture HAR per route.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
