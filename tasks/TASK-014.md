---
contract_version: v2
artifact_type: task
task_id: TASK-014
risk_level: low
council_required: no
human_approval_stages: []
dependencies: ["TASK-013"]
parallelizable: false
parallel_group: ""
conflict_scope:
  - oaksome-web/src/app/[locale]/**/page.tsx
  - oaksome-web/src/app/[locale]/layout.tsx
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
integration_blockers: []
merge_strategy: sequential_only
risk_triggers:
  - duplicate `<title>` across routes
  - missing hreflang alternates affecting SEO
planner_rationale: "Audit confirmed every route returns `<title>Oaksome — Mobilier encastre sur mesure</title>` (note: accent missing). Only /fr/tva-6 overrides title. Per-page generateMetadata() is needed everywhere. Depends on TASK-013 because metadata strings must live under translation keys."
domain_terms: ["generateMetadata", "hreflang", "metadataBase"]
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: none
model_overrides:
  executor: standard
  reviewer: light
scope_paths:
  - oaksome-web/src/app/[locale]
  - oaksome-web/src/lib/seo
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
  - tasks/TASK-014.md
---

## Objective

Give every route a localized `<title>` and `<meta name="description">`, add `<link rel="alternate" hreflang>` tags, and fix the typo in the root template where `encastré` lost its accent.

## Expected Result

- Root `<title>` template: `%s | Oaksome — Mobilier encastré sur mesure`.
- Every page exports `generateMetadata` that resolves the title and description from `messages/{fr,nl}.json`.
- `<link rel="alternate" hreflang="fr" href="..." />` and `hreflang="nl"` present on every page.
- Open Graph and Twitter card tags present on home + product + collection + espace + gamme.

## Context

Audit (2026-05-16): `curl <route> | grep title` returns the same string on 30+ routes. Only `/fr/tva-6` overrides metadata. Default template contains `encastre` instead of `encastré`. Per-page metadata is missing across `(shop)`, `(marketing)`, `(auth)`, `(account)`, `(legal)`.

## Scope

- **Included**: root `[locale]/layout.tsx` (fix template + accent); every `page.tsx` (export `generateMetadata`); a helper `lib/seo/page-metadata.ts`; `meta.*` namespace in `messages/{fr,nl}.json`.
- **Excluded**: sitemap, robots.txt, structured data (JSON-LD) — separate SEO tasks.

## Steps

1. In `[locale]/layout.tsx`: set `metadata.title = { default: 'Oaksome — Mobilier encastré sur mesure', template: '%s | Oaksome' }`.
2. Add `src/lib/seo/page-metadata.ts` with a `getPageMetadata(namespace, params)` helper that resolves the active locale, builds title/description, and emits `alternates.languages` for fr+nl.
3. For each page.tsx, export `generateMetadata` using the helper.
4. Add `meta.<page>.{title,description}` keys to fr.json + nl.json.
5. Verify `curl -s http://localhost:3001/<locale>/<route> | grep -oP '<title>\K[^<]+'`: unique per route, no `encastre`.

## Acceptance Criteria

- [ ] 30+ routes return unique titles.
- [ ] Default title contains `encastré`.
- [ ] Every page emits `<link rel="alternate" hreflang>` for fr + nl.
- [ ] `npm run type-check` passes.

## Assumptions

- TASK-013 has landed first, exposing `meta.*` keys.
- `next-intl`'s `getTranslations()` works inside `generateMetadata` (server context).

## Open Questions

- Do we need a fallback English title for `<meta property="og:locale:alternate" content="en_BE">`? Defer to product.

## Resolved Decisions

- Use a single helper instead of inlining metadata per page (DRY + fewer mistakes).
- `metadataBase` is set to `process.env.NEXT_PUBLIC_SITE_URL` so OG image URLs resolve absolute.

## Simplicity Budget
- expected_files_changed: "35-40"
- new_modules_allowed: yes (lib/seo/page-metadata.ts)
- new_dependencies_allowed: no
- shared_core_extraction_justification: "One shared helper avoids per-page boilerplate and centralizes hreflang logic."

## Verifiable Flow Goals
- user_action: View page source on any /{locale}/* route.
- expected_ui_state: `<title>` is route-specific, includes correct accent, and the hreflang alternates are present.
- error_state: Missing meta key → falls back to default template; not blocking.
- success_evidence: `curl` returns unique titles per route.

## Design Governance

- shared_design_concept: "Metadata contract: every page declares its meta via a helper that resolves translations."
- module_map: "New module lib/seo/page-metadata.ts. Every page imports it."
- affected_interfaces: "Browser metadata (HTML head)."
- ownership_boundaries: "Frontend only."
- dependency_impact: "None — uses next-intl."
- data_model_impact: "none"
- failure_modes: "Missing translation → fr fallback; helper bug → typecheck catches it."
- test_strategy: "Curl-based per-route title check + manual."
- questions_considered: "Inline vs helper; whether OG image is required everywhere."
- discovered_constraints: "metadataBase must be absolute URL."
- edge_cases: "Dynamic routes (e.g., /produit/[id]) need access to params inside generateMetadata."
- risk_reasoning: "Additive change; no runtime behavior modified."
- domain_language_checked: "yes"
- glossary_update_needed: "no"
- ready_to_implement: "yes"

## Impact Checklist
- database: none
- backend: none
- frontend: head metadata across every route
- api_contracts: none
- infra_ci: none
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: Per-route titles and descriptions render correctly.
- expected_regressions_to_prevent: hreflang alternates present and correct.
- edge_cases_to_cover: Dynamic routes (produit/[id], collection/[slug]) resolve metadata from API.

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: no
