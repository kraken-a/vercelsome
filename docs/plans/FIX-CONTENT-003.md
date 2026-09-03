---
task_id: FIX-CONTENT-003
title: "Complete /fr/tva-6 legal page content"
status: done
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/[locale]/(marketing)/tva-6/page.tsx
integration_blockers: []
human_approval_stages:
  - legal_content_review
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [tva-6, legal-page, TVA, renovation, Belgium]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CONTENT-003 — Complete /fr/tva-6 legal page content

## Objective

The `tva-6/page.tsx` is a stub containing only `<h1>TVA6</h1>`. This page explains the Belgian 6% renovation VAT rate that affects pricing. It is linked from the legal footer. Add real content.

## Source Evidence

**QA-007 F-005 / QA-014 Should-Fix #14** — `reviews/QA-007-report.md`:
> "The `tva-6/page.tsx` contains only a bare `<h1>TVA6</h1>` stub. Full source: `export default function TVA6Page() { return (<main><h1>TVA6</h1></main>) }`. Screenshot: `reviews/screenshots/QA-007/12-tva6-fr.png`."

## Scope

- `oaksome-web/src/app/[locale]/(marketing)/tva-6/page.tsx` — replace stub with content

## Steps

1. Obtain legal copy from Rachid (TVA 6% eligibility conditions, eligible work types, how to claim).
2. Structure the page:
   - `<h1>` — "TVA 6% pour la rénovation" (or exact title from Rachid)
   - `<section>` — What is TVA 6% and who qualifies
   - `<section>` — Eligible work types
   - `<section>` — How Oaksome applies it (customer declaration)
   - CTA: link to `/contact` for questions
3. Apply existing page styles (match the layout of other legal pages like `mentions-legales`).
4. Test: `/fr/tva-6` renders with complete content.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | `GET /fr/tva-6` |
| Processing | Static page renders |
| Output | Page shows TVA 6% content (not just `<h1>TVA6</h1>`) |
| Success evidence | Page has ≥3 sections of real content |

## Impact Checklist

- [ ] Legal page has real content
- [ ] Linked correctly from footer
- [ ] Consistent visual style with other legal pages

## Test Requirements

- Manual: `/fr/tva-6` shows substantive legal content
- Manual: page looks visually consistent with other marketing pages

## Simplicity Budget

~40 lines of JSX content. No API calls — fully static.

## Assumptions

- Legal copy will be provided by Rachid before implementation.
- The page is FR-only in Phase 1 (NL version deferred).

## Open Questions

1. Can Rachid provide the legal copy for TVA 6%? (Blocking question — implementation cannot start without content.)
2. Should this page be translated to NL in Phase 1 or deferred?

## Resolved Decisions

- Static page — no API call needed.
- SSG (no revalidation) — legal content changes rarely.

## Design Governance

Requires legal content review from Rachid (`legal_content_review`) before publication.

## Dependency Freshness

Not required.

## Observability Impact

None.
