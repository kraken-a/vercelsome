---
task_id: QA-009
title: Performance & Lighthouse audit (mobile + desktop)
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-009-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-009 — Performance & Lighthouse audit (mobile + desktop)

## Objective

- Input: every key route loaded under throttled conditions
- Processing path: Lighthouse → CWV → bundle → headers → image audit
- Output: per-route table + global perf budget gap analysis
- Success evidence: targets met or budget-deviation list ranked by impact

## Scope

**In scope**
- Lighthouse on: home, /acheter, /gamme/[slug], /espace/[slug], /collection/[slug], /produit/[id], /configurer, /inspirations, /etude-de-cas/[slug], /contact, /pro
- Mobile (Moto G Power throttling) + Desktop runs
- Web Vitals (LCP, INP, CLS, TBT) per page
- Bundle size analysis (per-route JS, shared chunks)
- Image optimisation (Next.js Image usage, format, sizing, lazy-loading)
- Caching/ISR behavior (Cache-Control, stale-while-revalidate, revalidate intervals)

**Out of scope**
- Synthetic load testing (separate engagement)
- CDN-edge perf (production-only, post-deploy)

## Steps

1. Run Lighthouse on each route via Chrome DevTools MCP (`lighthouse_audit`) — mobile + desktop, 3 runs each, median.
2. Record Performance, Accessibility (cross-reference QA-010), Best Practices, SEO scores.
3. Capture per-page Core Web Vitals (LCP, INP, CLS) and TBT.
4. Inspect `.next/analyze` if available, otherwise diff bundle from `npm run build` output.
5. List all `<img>` vs `next/image` uses; flag missing dimensions, missing `sizes`, missing `priority` on LCP image.
6. Inspect Cache-Control headers on API responses and HTML; verify ISR revalidate values match `frontend-spec.md`.
7. Compare top-3 worst pages against prototype to confirm parity (prototype should be slower or similar).

## Verifiable Flow Goals

- Input: every key route loaded under throttled conditions
- Processing path: Lighthouse → CWV → bundle → headers → image audit
- Output: per-route table + global perf budget gap analysis
- Success evidence: targets met or budget-deviation list ranked by impact

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-009-report.md`

## Test Requirements

- Required behavior to verify: targets (LCP < 2.5s mobile, CLS < 0.1, INP < 200ms, Perf score ≥ 85 mobile).
- Regressions to prevent: oversized hero images, unbatched API calls on PDP, blocking GTM script.
- Edge cases: cold cache vs warm cache, slow 3G simulation, route with many product images, configurator step transitions.

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-009-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- `npm run build` succeeds locally (per MIGRATE-006 smoke report).
- ISR is configured per `frontend-spec.md`; production-only CDN behavior is acknowledged as a gap.

## Open Questions

- Is `next/image` configured with the Odoo remote pattern? Recommendation: verify `next.config.js` `images.remotePatterns` includes Odoo host.

## Resolved Decisions

- Audit-only. Median of 3 Lighthouse runs to reduce noise.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
