---
contract_version: v2
artifact_type: task
task_id: TASK-022
risk_level: low
council_required: no
human_approval_stages: []
dependencies: []
parallelizable: true
parallel_group: "wave-0-quick-wins"
conflict_scope:
  - oaksome-web/src/components/layout/promo-bar.tsx
  - oaksome-web/src/components/layout/layout-chrome.tsx
integration_blockers: []
merge_strategy: parallel_safe
risk_triggers:
  - duplicated promo bar content visible on every page
planner_rationale: "Audit snapshot of /fr and /fr/panier shows `OFFRE DE LANCEMENT / Conditions privilégiées sur une sélection de meubles.` rendered twice in the promo bar. Likely either double-mount or a marquee clone that isn't hidden via overflow."
domain_terms: ["promo-bar", "marquee"]
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: none
model_overrides:
  executor: standard
  reviewer: light
scope_paths:
  - oaksome-web/src/components/layout/promo-bar.tsx
  - oaksome-web/src/components/layout/layout-chrome.tsx
  - tasks/TASK-022.md
---

## Objective

Show the promo bar text once. Today every page renders the launch chip + description twice.

## Expected Result

- One promo bar at the top of the viewport, with the chip `OFFRE DE LANCEMENT` and the description once.
- Single close (`×`) button.
- Dismissal persists via cookie or localStorage.

## Context

Audit screenshots of `/fr` and `/fr/panier` show both the chip and description twice. Across every route — suggests chrome bug, not page-level usage.

## Scope

- **Included**: `components/layout/promo-bar.tsx` and any mount site in `layout-chrome.tsx`.
- **Excluded**: CMS-driven promo content source.

## Steps

1. `rg -n 'PromoBar\|OFFRE DE LANCEMENT' src/`.
2. Identify whether the duplication is a CSS marquee artifact or a double-mount.
3. Fix root cause; verify single instance on `/fr`, `/nl`, `/fr/panier`.

## Acceptance Criteria

- [ ] Promo bar text appears exactly once on every page.
- [ ] Close button hides the bar; reload respects the dismissal.
- [ ] `npm run type-check` passes.

## Assumptions

- Promo bar should be visible by default until dismissed.

## Open Questions

- Should dismissal duration be capped (e.g., re-show after 7 days)? Defer.

## Resolved Decisions

- Use `localStorage` flag for dismissal (consistent with existing chrome patterns).

## Simplicity Budget
- expected_files_changed: "1-2"
- new_modules_allowed: no
- new_dependencies_allowed: no
- shared_core_extraction_justification: ""

## Verifiable Flow Goals
- user_action: Visit any route on `/fr` or `/nl`.
- expected_ui_state: Promo bar text appears once.
- error_state: After dismissal, bar is hidden on subsequent loads.
- success_evidence: kimi-webbridge snapshot count of "OFFRE DE LANCEMENT" = 1.

## Design Governance

- shared_design_concept: "Promo bar is mounted once in the chrome."
- module_map: "Chrome layout components only."
- affected_interfaces: "Visual chrome."
- ownership_boundaries: "Frontend."
- dependency_impact: "None."
- data_model_impact: "None."
- failure_modes: "Dismissal flag corrupted → bar reappears (acceptable)."
- test_strategy: "Manual verification on multiple routes."
- questions_considered: "Marquee CSS vs double-mount."
- discovered_constraints: "None."
- edge_cases: "Translation expansion making the text wrap to two lines (visual, not functional)."
- risk_reasoning: "Cosmetic, low risk."
- domain_language_checked: "yes"
- glossary_update_needed: "no"
- ready_to_implement: "yes"

## Impact Checklist
- database: none
- backend: none
- frontend: chrome promo bar
- api_contracts: none
- infra_ci: none
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: Single instance rendered.
- expected_regressions_to_prevent: Close button still works; dismissal persists.
- edge_cases_to_cover: Short viewport, long translation strings.

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: no
