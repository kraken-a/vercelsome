---
contract_version: v2
artifact_type: task
task_id: TASK-023
risk_level: low
council_required: no
human_approval_stages: []
dependencies: []
parallelizable: true
parallel_group: "wave-0-quick-wins"
conflict_scope:
  - oaksome-web/src/components/layout/footer.tsx
integration_blockers: []
merge_strategy: parallel_safe
risk_triggers:
  - dead footer link that produces 404 in prod
planner_rationale: "Footer EXPLORER column has a `Matériaux` link with no corresponding route in src/app/[locale]. Codebase scan confirms no /materiaux page. Either remove the link or implement the page; remove is the surgical option."
domain_terms: ["footer", "navigation"]
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: none
model_overrides:
  executor: standard
  reviewer: light
scope_paths:
  - oaksome-web/src/components/layout/footer.tsx
  - tasks/TASK-023.md
---

## Objective

Either remove the dead `Matériaux` link from the footer, or implement the destination page.

## Expected Result

- Footer EXPLORER column contains zero dead links on FR and NL.
- If removed: layout still balanced.
- If implemented: route returns 200 with minimal page + metadata.

## Context

Audit /fr snapshot: footer link `{role: 'link', name: 'Matériaux', ref: '@e81'}` under EXPLORER. No matching route exists in `src/app/[locale]/(*)`.

## Scope

- **Included**: `components/layout/footer.tsx` — remove link or implement target.
- **Excluded**: full materials page design (product work).

## Steps

1. Decision with product: remove or implement.
2. If remove: delete the `<li>` and any translation key for it.
3. If implement: stub `(shop)/materiaux/page.tsx` with placeholder + `generateMetadata`.

## Acceptance Criteria

- [ ] Every footer link returns 200.
- [ ] `npm run type-check` passes.

## Assumptions

- Removing is preferred for launch (faster, lower risk). Implementing can come post-launch.

## Open Questions

- Product decision: remove or implement?

## Resolved Decisions

- Default to remove; flag implement as a follow-up.

## Simplicity Budget
- expected_files_changed: "1"
- new_modules_allowed: no (or yes if implementing)
- new_dependencies_allowed: no
- shared_core_extraction_justification: ""

## Verifiable Flow Goals
- user_action: Click each footer link.
- expected_ui_state: All links return 200 with rendered content.
- error_state: N/A after removal.
- success_evidence: curl on every footer link returns 200.

## Design Governance

- shared_design_concept: "Footer links must point at shipping routes."
- module_map: "footer.tsx only."
- affected_interfaces: "Navigation."
- ownership_boundaries: "Frontend."
- dependency_impact: "None."
- data_model_impact: "None."
- failure_modes: "Visually balanced column after removal."
- test_strategy: "Smoke check on every footer link."
- questions_considered: "Remove vs implement."
- discovered_constraints: "None."
- edge_cases: "Translation keys for the removed link must also be deleted."
- risk_reasoning: "Trivial change."
- domain_language_checked: "yes"
- glossary_update_needed: "no"
- ready_to_implement: "yes"

## Impact Checklist
- database: none
- backend: none
- frontend: footer
- api_contracts: none
- infra_ci: none
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: All footer links 200.
- expected_regressions_to_prevent: Footer layout balanced.
- edge_cases_to_cover: Mobile breakpoint after removal.

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: no
