---
task_id: QA-010
title: Accessibility WCAG 2.1 AA audit
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-010-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-010 — Accessibility WCAG 2.1 AA audit

## Objective

- User action: keyboard-only + screen-reader navigation of key flows
- Expected UI state: full reachability, announceable state changes, AA contrast everywhere
- Error state: focus never trapped, esc always dismisses, errors announce via aria-live
- Success evidence: zero AA violations on key flows; remaining violations ranked

## Scope

**In scope**
- axe-core scan via `npx axe-cli` on every route enumerated by QA-001
- Manual keyboard nav (Tab, Shift+Tab, Enter, Esc) on home, configurator, cart, PDP, login
- Screen-reader smoke test on home + configurator + PDP (VoiceOver or NVDA)
- Focus management (modal open/close, route change, configurator step transition)
- Color contrast against design tokens (Vert Persan on Crème, Mint accents, Vert néon CTA accents)
- Heading hierarchy, landmark roles, alt text, form labels
- Existing audit flagged 4 categories failing (color-contrast, heading-order, label-content-name-mismatch, landmark-one-main) — verify each

**Out of scope**
- WCAG AAA (only AA is required for Belgian B2C)

## Steps

1. Run axe-cli per route; collect violations into a per-route table.
2. Keyboard-only walk: home → catalogue → PDP → configurator → cart → checkout handoff. Capture trapped focus or skipped elements.
3. Screen-reader smoke: announce home hero, configurator step transitions, PDP gallery.
4. Audit landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`) per page.
5. Audit color contrast on hover/focus/disabled states (not just default).
6. Cross-check fixes recommended by existing audit and report current state.

## Verifiable Flow Goals

- User action: keyboard-only + screen-reader navigation of key flows
- Expected UI state: full reachability, announceable state changes, AA contrast everywhere
- Error state: focus never trapped, esc always dismisses, errors announce via aria-live
- Success evidence: zero AA violations on key flows; remaining violations ranked

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-010-report.md`

## Test Requirements

- Required behavior to verify: AA compliance on home, catalogue, PDP, configurator, cart, login, checkout handoff.
- Regressions to prevent: missing alt, missing main, skipped headings, low-contrast CTA.
- Edge cases: modal/drawer focus, configurator step focus, RTL (n/a), zoomed viewport 200%.

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-010-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- axe-cli + Chrome DevTools MCP cover automated checks; manual checks fill the rest.
- Belgian accessibility law (WCAG 2.1 AA) is the target.

## Open Questions



## Resolved Decisions

- Audit-only.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
