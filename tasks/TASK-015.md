---
contract_version: v2
artifact_type: task
task_id: TASK-015
risk_level: low
council_required: no
human_approval_stages: []
dependencies: []
parallelizable: true
parallel_group: "wave-0-quick-wins"
conflict_scope:
  - oaksome-web/src/app/[locale]/(shop)/configurer/page.tsx
integration_blockers: []
merge_strategy: parallel_safe
risk_triggers:
  - English UI on French/Dutch funnel page
  - malformed iframe URL `?=` query
planner_rationale: "Two-line surgical fix in a single page. Reads locale from params, drops the empty query-param append. Independent of i18n sweep because the change is in the iframe URL construction, not visible JSX strings."
domain_terms: ["configurator", "iframe", "locale"]
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: none
model_overrides:
  executor: standard
  reviewer: light
scope_paths:
  - oaksome-web/src/app/[locale]/(shop)/configurer/page.tsx
  - tasks/TASK-015.md
---

## Objective

Make the configurer iframe on `/{locale}/configurer` inherit the active locale and stop appending an empty `?=` query string.

## Expected Result

- `/fr/configurer` mounts `<iframe src="https://oaksome-client.vercel.app/fr/article">`.
- `/nl/configurer` mounts `.../nl/article`.
- No trailing `?=`. Any future query params use proper `URLSearchParams`.

## Context

Audit screenshot: `<iframe src="https://oaksome-client.vercel.app/en/article?=">`. The `/en/` is hardcoded and the trailing `?=` is an empty `?${k}=${v}` append. All configurer labels render English: Installation type, Built-in, Height, Width, Depth, Drawer type, Fillers.

## Scope

- **Included**: `src/app/[locale]/(shop)/configurer/page.tsx` — derive locale, fix URL build.
- **Excluded**: translating the iframe app itself (upstream `oaksome-client.vercel.app`); the blank 3D preview (TASK-016).

## Steps

1. Read `params.locale` (server component) or `useLocale()` if client.
2. Build URL: `const src = \`https://oaksome-client.vercel.app/${locale}/article\``.
3. Only append query params if there are values: `if (params) src += '?' + new URLSearchParams(params).toString()`.
4. Verify via kimi-webbridge that `iframe.src` matches active locale and has no `?=`.

## Acceptance Criteria

- [ ] `document.querySelector('iframe').src` on `/fr/configurer` ends with `/fr/article`.
- [ ] Same check on `/nl/configurer` ends with `/nl/article`.
- [ ] No `?=` tail anywhere.
- [ ] `npm run type-check` passes.

## Assumptions

- Upstream `oaksome-client.vercel.app` serves `/fr/article` and `/nl/article` paths.
- No other consumer of this page hardcodes `/en/`.

## Open Questions

- Does the upstream iframe app currently have FR/NL translations live? If not, the iframe will still show English even after this fix — flag as upstream follow-up.

## Resolved Decisions

- Use server-side `params.locale`, not `useLocale()`, since the page is server-rendered.

## Simplicity Budget
- expected_files_changed: "1"
- new_modules_allowed: no
- new_dependencies_allowed: no
- shared_core_extraction_justification: ""

## Verifiable Flow Goals
- user_action: Visit `/fr/configurer` and `/nl/configurer`.
- expected_ui_state: Iframe loads with the correct locale path.
- error_state: Upstream 404 if locale unsupported — log and continue.
- success_evidence: Network panel shows GET on `/{locale}/article`, no `?=`.

## Design Governance

- shared_design_concept: "Iframe URL is built from the active locale, never hardcoded."
- module_map: "Single file."
- affected_interfaces: "Browser iframe URL."
- ownership_boundaries: "Frontend; upstream iframe app is separate."
- dependency_impact: "None."
- data_model_impact: "none"
- failure_modes: "Upstream returns 404 if /nl/article missing — visible only on NL configurer."
- test_strategy: "Manual via kimi-webbridge; assert iframe src."
- questions_considered: "Server vs client locale read; URLSearchParams vs template string."
- discovered_constraints: "No constraints."
- edge_cases: "Unknown locale (e.g., `/de/configurer`) — should never reach this route; middleware blocks."
- risk_reasoning: "Two-line change, easy revert."
- domain_language_checked: "yes"
- glossary_update_needed: "no"
- ready_to_implement: "yes"

## Impact Checklist
- database: none
- backend: none
- frontend: configurer page iframe URL
- api_contracts: none
- infra_ci: none
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: Iframe src matches active locale.
- expected_regressions_to_prevent: Sliders + price still render in the iframe.
- edge_cases_to_cover: Query params (if any) are properly URL-encoded.

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: no
