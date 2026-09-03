---
task_id: FIX-CONTENT-001
title: "Create /etude-de-cas/page.tsx index route (currently 404)"
status: done
resolution: "2026-05-17 — Verified complete. src/app/[locale]/(shop)/etude-de-cas/page.tsx exists; sibling /etudes-de-cas/page.tsx (5142 bytes) is the canonical index per frontend-spec."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/[locale]/(marketing)/etude-de-cas/page.tsx
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [case-studies, etude-de-cas, index-route, 404]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CONTENT-001 — Create /etude-de-cas index page

## Objective

`/fr/etude-de-cas` returns 404 because there is no `page.tsx` in the `etude-de-cas/` directory — only the `[slug]/page.tsx` dynamic route exists. Create the index page that lists all case studies fetched from Odoo.

## Source Evidence

**QA-007 F-002 / QA-014 Go-Live Blocker #11** — `reviews/QA-007-report.md`:
> "File: no `page.tsx` in `(marketing)/etude-de-cas/`. Only `[slug]/page.tsx` dynamic route exists. `/fr/etude-de-cas` → 404. Content page broken; case studies unreachable from any navigation link."

## Scope

- New: `oaksome-web/src/app/[locale]/(marketing)/etude-de-cas/page.tsx`

## Steps

1. Verify that `src/app/[locale]/(marketing)/etude-de-cas/[slug]/page.tsx` exists — understand the data shape it uses.
2. Check what API endpoint fetches the case study list (likely `GET /api/oaksome/v1/cases` or `/api/odoo/case`).
3. Create `etude-de-cas/page.tsx` with:
   - `export const revalidate = 3600` (ISR 1h — static content)
   - `fetchCases()` server-side call
   - A grid layout showing case study cards (title, thumbnail, excerpt) linking to `/etude-de-cas/[slug]`
   - Empty state if no cases returned
4. Add translations for the page title/heading in `messages/fr.json` and `messages/nl.json` if needed.
5. Test: `GET /fr/etude-de-cas` → 200, shows list of case studies.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | `GET /fr/etude-de-cas` |
| Processing | Server fetches case list from Odoo |
| Output | Page renders grid of case study cards |
| Error path | Odoo fails → empty state, no crash |
| Success evidence | Route returns 200, page shows ≥1 case study card |

## Impact Checklist

- [ ] `/fr/etude-de-cas` returns 200 (not 404)
- [ ] Case study cards link to correct `/etude-de-cas/[slug]` routes
- [ ] Empty state handled
- [ ] NL locale: `/nl/casestudies` also works (if route is in routing.ts)

## Test Requirements

- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/fr/etude-de-cas` → 200
- Manual: page shows case study cards with working links

## Simplicity Budget

~30 lines. Model the page on other content list pages in the app (e.g., inspirations list).

## Assumptions

- A case study list API endpoint exists (check `src/app/api/odoo/case/route.ts`).
- The API returns a list compatible with the type used in `[slug]/page.tsx`.
- NL route for case studies is declared in `routing.ts` — verify.

## Open Questions

1. What is the API endpoint URL for fetching the case study list? (`/api/odoo/case?list=true` or similar?)
2. Is a NL translation of the page title needed, and what is the NL route slug?

## Resolved Decisions

- ISR with 1h revalidation — content changes infrequently.
- Render as a server component (no client-side JS needed for the list).

## Design Governance

No design review needed — match existing content page patterns.

## Dependency Freshness

Not required.

## Observability Impact

None.
