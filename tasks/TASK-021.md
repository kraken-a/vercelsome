---
contract_version: v2
artifact_type: task
task_id: TASK-021
risk_level: low
council_required: no
human_approval_stages: []
dependencies: ["TASK-017"]
parallelizable: false
parallel_group: ""
conflict_scope:
  - oaksome-web/src/app/[locale]/(marketing)/page.tsx
integration_blockers: []
merge_strategy: sequential_only
risk_triggers:
  - duplicate UI tiles surface backend data quality issue
planner_rationale: "Audit homepage inspirations strip lists `SALON · LYS` twice in 9 tiles. Either API returns duplicates or render lacks a dedupe step. Sequential after TASK-017 because both edit the same file."
domain_terms: ["inspirations", "dedupe"]
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: none
model_overrides:
  executor: standard
  reviewer: light
scope_paths:
  - oaksome-web/src/app/[locale]/(marketing)/page.tsx
  - tasks/TASK-021.md
---

## Objective

Stop the homepage inspirations strip from showing `SALON · LYS` twice.

## Expected Result

- 9 inspirations tiles, all unique on `/fr` and `/nl`.
- Stable dedupe key based on `inspiration.id` (or `${space}/${collection}` fallback).

## Context

Audit (2026-05-16) homepage `/fr` shows tiles in order: SALON·LINE, CHAMBRE·LINE, SALON·LYS, SALON·SATORI, CHAMBRE·SATORI, BUREAU·SATORI, **SALON·LYS** (duplicate), SALON·VISTA, ENTRÉE·VISTA.

## Scope

- **Included**: `(marketing)/page.tsx` inspirations render section — add dedupe by id (or composite key).
- **Excluded**: a server-side fix in Odoo if it returns duplicates (track as follow-up if confirmed).

## Steps

1. Curl `/api/oaksome/v1/homepage-inspirations` to see if duplicates are in the payload or only in render.
2. If payload contains duplicates → add client-side dedupe `Array.from(new Map(items.map(i => [i.id, i])).values())` and file an Odoo data task.
3. If render duplicates → audit `.map(...)` `key` prop.
4. Verify on `/fr` and `/nl` via kimi-webbridge.

## Acceptance Criteria

- [ ] Tiles in the inspirations strip are unique.
- [ ] `npm run type-check` passes.

## Assumptions

- `inspiration.id` is stable and unique (standard Odoo id).

## Open Questions

- If duplicates are in the API payload, should we report to backend or silently dedupe? Doing both is safe.

## Resolved Decisions

- Always dedupe client-side as a safety net even if the API is fixed.

## Simplicity Budget
- expected_files_changed: "1"
- new_modules_allowed: no
- new_dependencies_allowed: no
- shared_core_extraction_justification: ""

## Verifiable Flow Goals
- user_action: Visit `/fr` and scroll to inspirations strip.
- expected_ui_state: All visible tiles are unique.
- error_state: Empty/short list if dedupe leaves <9 items — acceptable, design tolerates 4-9.
- success_evidence: kimi-webbridge snapshot shows no duplicates.

## Design Governance

- shared_design_concept: "Lists deriving from API responses should never trust uniqueness; always dedupe at render."
- module_map: "Single section in (marketing)/page.tsx."
- affected_interfaces: "None."
- ownership_boundaries: "Frontend."
- dependency_impact: "None."
- data_model_impact: "None."
- failure_modes: "If API returns fewer than expected after dedupe, layout has gaps — acceptable."
- test_strategy: "Manual + light unit test on dedupe helper."
- questions_considered: "Where to put the helper (inline vs lib)."
- discovered_constraints: "None."
- edge_cases: "Empty list, single item, all duplicates."
- risk_reasoning: "Tiny, safe change."
- domain_language_checked: "yes"
- glossary_update_needed: "no"
- ready_to_implement: "yes"

## Impact Checklist
- database: none
- backend: none in this task; raise follow-up if API duplicates
- frontend: homepage inspirations section
- api_contracts: none
- infra_ci: none
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: Tiles unique after render.
- expected_regressions_to_prevent: Tile order preserved (just dedup'd).
- edge_cases_to_cover: Empty payload, single-item payload.

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: no
