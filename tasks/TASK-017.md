---
contract_version: v2
artifact_type: task
task_id: TASK-017
risk_level: low
council_required: no
human_approval_stages: []
dependencies: []
parallelizable: true
parallel_group: "wave-0-quick-wins"
conflict_scope:
  - oaksome-web/src/app/[locale]/(marketing)/page.tsx
integration_blockers:
  - TASK-021 (inspirations dedup) touches same file — must run sequentially after this
merge_strategy: parallel_safe
risk_triggers:
  - 404s on every homepage load (broken images)
planner_rationale: "Network capture shows two 404s on every /fr load: /fr/images/reassurance-{samples,agenda}.png. Single-character fix (missing leading slash). Independent of other tasks except TASK-021 which edits the same page."
domain_terms: ["next/image"]
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: none
model_overrides:
  executor: standard
  reviewer: light
scope_paths:
  - oaksome-web/src/app/[locale]/(marketing)/page.tsx
  - tasks/TASK-017.md
---

## Objective

Stop the homepage from issuing two 404 requests on every load for `reassurance-samples.png` and `reassurance-agenda.png`.

## Expected Result

- Homepage `/{locale}` loads with zero 404s in the network panel.
- Both reassurance images render in the "Touchez avant de commander" section.

## Context

Audit (2026-05-16) network capture shows two persistent 404s:
- `http://localhost:3001/fr/images/reassurance-samples.png`
- `http://localhost:3001/fr/images/reassurance-agenda.png`

The `/fr/` prefix is the tell: `src=` lacks a leading slash, so Next.js resolves it relative to the current locale segment.

## Scope

- **Included**: locate the offending `src=` and prefix with `/`; replace `<img>` with `next/image` if not already done.
- **Excluded**: any other image audit.

## Steps

1. `rg -n 'reassurance-samples\|reassurance-agenda' oaksome-web/src`.
2. Prefix both `src=` values with `/`.
3. Verify the assets exist under `oaksome-web/public/images/`. If missing, request from design.
4. Reload `/fr` and `/nl` via kimi-webbridge; confirm 0 404s.

## Acceptance Criteria

- [ ] Zero 404 responses on `/fr` and `/nl` homepage loads.
- [ ] Both reassurance tiles render with their intended images.
- [ ] `npm run type-check` passes.

## Assumptions

- The image assets exist under `public/images/`. If not, this becomes a content task (request from design).

## Open Questions

- None.

## Resolved Decisions

- Always use `next/image` for marketing images (built-in optimization + responsive variants).

## Simplicity Budget
- expected_files_changed: "1"
- new_modules_allowed: no
- new_dependencies_allowed: no
- shared_core_extraction_justification: ""

## Verifiable Flow Goals
- user_action: Visit `/fr`.
- expected_ui_state: Both reassurance tiles render images.
- error_state: If assets are missing, they will continue to 404 even after the fix — flag and request.
- success_evidence: Network panel shows 200 on both image URLs.

## Design Governance

- shared_design_concept: "All public assets referenced with a leading slash."
- module_map: "One file."
- affected_interfaces: "Image network requests."
- ownership_boundaries: "Frontend."
- dependency_impact: "None."
- data_model_impact: "none"
- failure_modes: "If assets missing, fix exposes 404 still (now under /images/ instead of /fr/images/)."
- test_strategy: "Network capture comparison before/after."
- questions_considered: "Whether to switch to next/image (yes)."
- discovered_constraints: "None."
- edge_cases: "Images cached under wrong URL — hard refresh required."
- risk_reasoning: "Minimal — single string fix."
- domain_language_checked: "yes"
- glossary_update_needed: "no"
- ready_to_implement: "yes"

## Impact Checklist
- database: none
- backend: none
- frontend: marketing homepage reassurance images
- api_contracts: none
- infra_ci: none
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: Images render with 200 status.
- expected_regressions_to_prevent: Reassurance section layout unchanged.
- edge_cases_to_cover: Missing assets → graceful fallback (next/image alt text).

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: no
