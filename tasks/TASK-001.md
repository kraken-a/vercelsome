---
contract_version: v2
artifact_type: task
task_id: TASK-001
risk_level: low
council_required: no
human_approval_stages: []
dependencies: []
parallelizable: false
parallel_group: ""
conflict_scope:
  - oaksome-web/src/components/layout/header-client.tsx
integration_blockers: []
merge_strategy: sequential_only
risk_triggers:
  - duplicate React keys in client rendering
planner_rationale: "Surgical one-line-per-occurrence fix in a single file. No logic change, no API change, no impact on any interface or database. React key collisions produce console warnings and may cause duplicate/omitted DOM nodes — fixing prevents rendering artifacts."
domain_terms: []
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: none
model_overrides:
  executor: standard
  reviewer: light
scope_paths:
  - oaksome-web/src/components/layout/header-client.tsx
  - tasks/TASK-001.md
---

## Objective

Fix duplicate React key warnings in the header component by using `item.id` instead of `item.slug` as React key.

## Expected Result

No more `Encountered two children with the same key` console errors. All three `typeItems.map()` calls render with unique keys.

## Context

The API returns `typeItems` where two entries share the same slug (`bibliotheques`). The component uses `item.slug` as the React `key` prop in three `.map()` calls, causing React warnings and potential rendering duplication/skipping.

## Scope

- **Included**: Replace `key={item.slug}` → `key={item.id}` in three locations inside `header-client.tsx`
- **Excluded**: No deduplication on the API side, no changes to `NavItem` type, no refactoring, no styling changes, no test changes

## Steps

1. In `header-client.tsx` line 97: change `key={t.slug}` to `key={t.id}` (search overlay buttons)
2. In `header-client.tsx` line 226: change `key={item.slug}` to `key={item.id}` (mobile menu links)
3. In `header-client.tsx` line 349: change `key={item.slug}` to `key={item.id}` (mega menu links)

## Acceptance Criteria

- [ ] No React duplicate-key warnings in console for `bibliotheques` or any other slug
- [ ] All three mappings still render correctly
- [ ] TypeScript compiles without errors

## Assumptions

- `id` on `NavItem` is guaranteed unique by the backend (standard Odoo id)
- The duplicate-slug scenario is expected to persist on the API side

## Open Questions

- None. Root cause (API duplicates) is understood and out of scope.

## Resolved Decisions

- Use `item.id` over composite key (`item.slug-item.id`) since `id` alone is sufficient and cleaner

## Simplicity Budget
- expected_files_changed: "1"
- new_modules_allowed: no
- new_dependencies_allowed: no
- shared_core_extraction_justification: ""

## Verifiable Flow Goals
- user_action: Navigate to homepage with header rendered
- expected_ui_state: No duplicate-key console errors; all type items render identically to before
- error_state: No change — pre-existing duplicate-slug content still renders
- success_evidence: Console free of duplicate-key warnings

## Design Governance

- shared_design_concept: ""
- module_map: ""
- affected_interfaces: ""
- ownership_boundaries: ""
- dependency_impact: ""
- data_model_impact: ""
- failure_modes: ""
- test_strategy: ""
- questions_considered: ""
- discovered_constraints: ""
- edge_cases: ""
- risk_reasoning: ""
- domain_language_checked: ""
- glossary_update_needed: ""
- ready_to_implement: "yes"

## Impact Checklist
- database: none
- backend: none
- frontend: fixes React key uniqueness in header-client.tsx
- api_contracts: none
- infra_ci: none
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: Header renders without duplicate-key warnings
- expected_regressions_to_prevent: All type items visible across search overlay, mobile menu, and mega menu
- edge_cases_to_cover: Empty typeItems array, single item, items with identical slugs

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: no
