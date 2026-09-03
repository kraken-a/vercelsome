---
task_id: QA-007
title: Content & static pages
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-007-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-007 — Content & static pages

## Objective

- User action: browse content pages in FR + NL
- Expected UI state: full content, no Lorem, no test data, correct meta tags
- Error state: missing slug → 404 page (not white screen)
- Success evidence: every page renders with locale-correct, production-ready copy

## Scope

**In scope**
- `/{locale}/inspirations`, `/{locale}/etude-de-cas/[slug]`
- `/{locale}/comment-ca-marche`, `/{locale}/a-propos`, `/{locale}/faq`
- `/{locale}/echantillons` (page-level, lead form covered in QA-006)
- `/{locale}/contact` (page-level, form covered in QA-006)
- Landing page `/{locale}` (home)
- Promo bar copy (currently 'TEST'/'testing' per existing audit)

**Out of scope**
- Form behavior (QA-006)

## Steps

1. Render every content/static page in FR and NL; verify content loads (CMS-driven from Odoo for inspirations/case-studies; static text for the rest).
2. Verify all CTAs route to the correct internal destinations (no 404, no dead links, no test-only URLs).
3. Verify external links (legal mentions, social) open with `rel='noopener'` and target the right URL.
4. Capture the promo bar payload and flag as a launch blocker if it still says TEST/testing.
5. Check Open Graph + Twitter Card metadata on home, PDP, and case-study pages.
6. Spot-check copy against prototype copy (no leftover Lorem, no untranslated NL fragments on FR or vice versa).

## Verifiable Flow Goals

- User action: browse content pages in FR + NL
- Expected UI state: full content, no Lorem, no test data, correct meta tags
- Error state: missing slug → 404 page (not white screen)
- Success evidence: every page renders with locale-correct, production-ready copy

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-007-report.md`

## Test Requirements

- Required behavior to verify: content completeness, link correctness, meta tags.
- Regressions to prevent: test/placeholder content shipping live.
- Edge cases: case-study with no hero image, FAQ with collapsed-by-default behavior, deep-link to FAQ anchor.

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-007-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- Odoo `oaksome.inspiration`, `oaksome.case`, `oaksome.testimonial` have production-ready records in the test env.

## Open Questions

- Are testimonials displayed on home/about? If yes, are they sourced from `oaksome.testimonial` or hardcoded? Recommendation: trace and verify.

## Resolved Decisions

- Audit-only.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
