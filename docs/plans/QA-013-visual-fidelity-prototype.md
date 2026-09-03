---
task_id: QA-013
title: Visual fidelity vs prototype (tokens, fonts, motion)
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-013-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-013 — Visual fidelity vs prototype (tokens, fonts, motion)

## Objective

- User action: visual inspection of every page in 3 breakpoints
- Expected UI state: tokens match spec, fonts load cleanly, motion matches prototype timing
- Error state: token drift (e.g., shadow leak) is logged with element + page
- Success evidence: per-page delta report with severity (intentional/regression/blocker)

## Scope

**In scope**
- Design tokens applied: colors (Vert Persan, Mint, Crème, Beige foncé, Bleu promo, Vert néon, collection swatches), border-radius (0/4px), no shadows, 500ms ease-out transitions
- Fonts loaded: Yet Grotesk (400/700), PP Air Mono (400) — verify FOUT/FOIT behavior
- Hover states: image scale(1.03) over 700ms, link underline, CTA color shift
- Side-by-side visual diff vs prototype on the index of pages from QA-001
- Responsive breakpoints: mobile (390px), tablet (768px), desktop (1440px), wide (1920px)
- Promo bar visual conformance to prototype

**Out of scope**
- A11y contrast (QA-010) — referenced here, not re-audited

## Steps

1. Inspect computed styles on key elements (CTA, link, nav, card, badge) against design-token spec.
2. Verify font assets load from `/fonts/` and no fallback flash beyond a brief moment.
3. Trigger hover on cards, CTAs, links; capture timing via Performance panel.
4. Use Chrome DevTools MCP to screenshot each prototype/production page pair at 3 breakpoints; document visual deltas (intentional or regression).
5. Verify no rounded corners > 4px and no box-shadows leak in (Tailwind defaults often introduce these).

## Verifiable Flow Goals

- User action: visual inspection of every page in 3 breakpoints
- Expected UI state: tokens match spec, fonts load cleanly, motion matches prototype timing
- Error state: token drift (e.g., shadow leak) is logged with element + page
- Success evidence: per-page delta report with severity (intentional/regression/blocker)

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-013-report.md`

## Test Requirements

- Required behavior to verify: design-token conformance, motion timing, responsive behavior.
- Regressions to prevent: Tailwind default shadow/radius leaks, missing font fallbacks, broken hover.
- Edge cases: prefers-reduced-motion (should disable scale animations), high-DPI image rendering, very narrow viewport (<360px).

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-013-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- Prototype is the visual source of truth; spec deviations flagged in QA-001 take precedence over prototype.
- Chrome DevTools MCP supports viewport emulation for the chosen breakpoints.

## Open Questions

- Is `prefers-reduced-motion` honored? Recommendation: verify and flag as a11y finding if not.

## Resolved Decisions

- Audit-only. Screenshot pairs stored under `reviews/screenshots/QA-013/`.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
