---
task_id: QA-008
title: i18n FR/NL coverage & translated routes
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-008-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-008 — i18n FR/NL coverage & translated routes

## Objective

- User action: browse FR, switch to NL on every route
- Expected UI state: 100% translated UI, correct URL transformation, correct formats
- Error state: missing translation falls back gracefully with a logged warning, not raw key
- Success evidence: zero hardcoded strings, zero raw-key fallbacks, all hreflang in place

## Scope

**In scope**
- `fr.json` and `nl.json` key coverage (missing-key audit)
- Translated route segments (e.g., `produit`↔`meubel`, `gamme`↔?, `espace`↔?, `collection`↔`collectie`)
- Hardcoded strings outside `t()` (per existing audit: home `<h1>` hardcoded in FR)
- Locale switcher correctness on every route (URL preserves equivalent segment)
- Pluralisation, currency formatting (€, EU number format), date formatting
- Hreflang tags on every route

**Out of scope**
- Domain translations correctness (linguistic review — out of family)

## Steps

1. Diff `fr.json` and `nl.json`: list keys present in one but not the other.
2. Grep `oaksome-web/src` for string literals in JSX outside `t()` / `useTranslations` / `getTranslations` — flag every hardcoded user-visible string.
3. Walk every route in FR, switch locale, verify URL transforms to NL equivalent and content updates (no flicker, no fallback to FR).
4. Verify hreflang `link rel='alternate'` tags on the home, PDP, gamme, espace, collection routes.
5. Verify currency, decimal separators, and units render per locale.

## Verifiable Flow Goals

- User action: browse FR, switch to NL on every route
- Expected UI state: 100% translated UI, correct URL transformation, correct formats
- Error state: missing translation falls back gracefully with a logged warning, not raw key
- Success evidence: zero hardcoded strings, zero raw-key fallbacks, all hreflang in place

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-008-report.md`

## Test Requirements

- Required behavior to verify: key parity, translated routes, no hardcoded strings, hreflang.
- Regressions to prevent: keys missing in nl.json, FR strings on NL pages, broken locale switcher.
- Edge cases: deep-link directly to /nl/produit/42, switch locale mid-configurator, RTL leakage (none expected).

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-008-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- `next-intl` is the i18n library and is the only translation surface.
- `fr.json` is the source-of-truth locale; `nl.json` follows.

## Open Questions

- Are case-study slugs translated (FR slug vs NL slug)? Recommendation: verify in QA-001 parity matrix, link finding here.

## Resolved Decisions

- Audit-only.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
