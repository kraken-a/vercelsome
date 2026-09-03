---
task_id: QA-011
title: Tracking & analytics (GTM, GA4, Meta Pixel, Pinterest, CAPI)
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-011-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-011 — Tracking & analytics (GTM, GA4, Meta Pixel, Pinterest, CAPI)

## Objective

- User action: grant consent, trigger every tracked event
- Expected UI state: every event lands in GA4/Pixel/Pinterest with correct payload
- Error state: pre-consent state fires zero tracking calls; CAPI failure does not break UX
- Success evidence: full event matrix verified end-to-end + server-side CAPI hits

## Scope

**In scope**
- GTM container loads after CMP consent (Axeptio)
- GA4 events: page_view, view_item, add_to_wishlist, add_to_cart, begin_checkout, generate_lead, purchase
- Meta Pixel events: PageView, ViewContent, AddToWishlist, AddToCart, InitiateCheckout, Lead
- Pinterest Tag: pagevisit, addtocart, lead, checkout
- Google Ads conversion tags
- DataLayer pushes match `frontend-spec.md` Tier A/B/C event spec
- Server-side CAPI: `purchase`, `generate_lead`, `begin_checkout` (Meta)
- Consent gating: no tracking pixels fire before consent grant

**Out of scope**
- Live ad delivery / attribution validation (post-launch in production)

## Steps

**Pollution constraint**: dev server runs against production Odoo, and the configured pixel/GA IDs are likely **production** IDs. To avoid polluting prod analytics, do NOT let pixels fire. Strategy: block the three tracker hostnames in DevTools and inspect the *would-be* payloads via DataLayer + console + Meta Pixel Helper.

1. Open DevTools → Network → "block request URL" for: `google-analytics.com`, `facebook.com/tr`, `ct.pinterest.com`, `analytics.google.com`, `googletagmanager.com/gtag`. (Keep `googletagmanager.com/gtm.js` allowed so GTM still loads and runs.)
2. Visit every route and trigger every tracked action; for each, read `window.dataLayer` in the console and capture the most recent push. Cross-reference against the Tier A/B/C spec in `frontend-spec.md`.
3. Use Meta Pixel Helper extension (or equivalent) to inspect *would-be* Pixel events without them being delivered.
4. Pre-consent: refuse Axeptio, navigate site, confirm zero `dataLayer.push` calls for tracking events; confirm no tracker network calls attempt to fire.
5. Server-side CAPI: do **not** trigger the live submit flow (would write to Odoo and call Meta CAPI in prod). Inspect server code path (`oaksome-web/src/app/api/.../route.ts`) statically; verify event_id is generated for dedup; verify hashing applied to PII; verify token loaded from `META_CAPI_ACCESS_TOKEN` env (not hardcoded).
6. Verify GTM container ID, GA4 measurement ID, Pixel ID, Pinterest tag ID match the production `.env.production.example` plan and are loaded only after consent.

## Verifiable Flow Goals

- User action: grant consent, trigger every tracked action with tracker hostnames blocked
- Expected UI state: every event pushes to `window.dataLayer` with correct payload; GTM tags evaluate but network is blocked
- Error state: pre-consent state pushes zero tracking events and attempts zero tracker network calls
- Success evidence: full event matrix verified from `dataLayer` + Pixel Helper without any tracker delivery; CAPI code path reviewed statically without a single live trigger

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-011-report.md`

## Test Requirements

- Required behavior to verify: every Tier A event in spec, CAPI for purchase/lead/checkout, pre-consent silence.
- Regressions to prevent: events firing before consent, double-counting, missing event_id for dedup.
- Edge cases: opt-out mid-session, locale switch, configurator multi-step, anonymous → authed identity merge.

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-011-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- Axeptio CMP is active and configurable.
- The configured GTM/GA4/Pixel/Pinterest IDs are likely **production** IDs (no separate test container exists). Therefore tracker delivery must be blocked at the DevTools layer for the duration of the audit.
- Meta Pixel Helper (or equivalent) can observe `fbq` calls before they hit the network.

## Open Questions

- Is there any chance the dev `.env.local` points at non-prod tracker IDs? Recommendation: grep `.env.local` for `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID` before starting; if production IDs, enforce blocking; if test IDs, allow delivery.

## Resolved Decisions

- Audit-only AND no-delivery. Tracker hostnames are blocked in DevTools throughout the audit. Server-side CAPI is reviewed statically; no live triggers.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
