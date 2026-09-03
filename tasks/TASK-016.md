---
contract_version: v2
artifact_type: task
task_id: TASK-016
risk_level: medium
council_required: no
human_approval_stages: []
dependencies: ["TASK-015"]
parallelizable: false
parallel_group: ""
conflict_scope:
  - oaksome-web/src/app/[locale]/(shop)/configurer/page.tsx
integration_blockers:
  - upstream repo `oaksome-client.vercel.app` (not in this monorepo) may need a fix
merge_strategy: sequential_only
risk_triggers:
  - blank canvas in funnel-critical page
  - WebGL silent failures
planner_rationale: "Audit screenshot shows left half of /fr/configurer empty while the right-side form panel renders correctly. No console errors captured. Likely either parent CSS sizing or upstream Three.js model loader failure. Sequential after TASK-015 because both touch the same file; risks parent-side change may be the entire fix or may escalate to upstream."
domain_terms: ["WebGL", "canvas", "3D preview"]
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: minimal_logs
model_overrides:
  executor: standard
  reviewer: standard
  security: standard
scope_paths:
  - oaksome-web/src/app/[locale]/(shop)/configurer/page.tsx
  - tasks/TASK-016.md
---

## Objective

Fix the blank left half of `/{locale}/configurer`. The 3D model preview should render next to the form panel.

## Expected Result

- 3D preview visible within 3 s after page load.
- Sliders (Height, Width, Depth) update the preview live.
- No console errors related to WebGL or canvas.

## Context

Audit screenshot: right-side form panel renders correctly (Built-in, Height 2000 MM, Width 5000 MM, Depth 600 MM, Drawer type, Fillers, price 2872 €) but the left half is completely blank. No console errors captured. Two suspects: (a) parent CSS gives zero width/height to the iframe column, (b) upstream Three.js silently fails to load the model.

## Scope

- **Included**: DOM/CSS audit of the configurer page; add a parent-side observability probe that logs a warning if no `<canvas>` is found inside the iframe after 5 s (cross-origin try/catch).
- **Excluded**: implementing a 2D fallback preview; rewriting the 3D renderer.

## Steps

1. In DevTools, measure the iframe element's bounding box. If zero → parent CSS bug → fix grid/flex.
2. Open `https://oaksome-client.vercel.app/fr/article` directly in a new tab. If canvas is still missing → upstream bug → open issue in `oaksome-client` repo and link here.
3. Add an observability hook on the parent page:
   ```ts
   useEffect(() => {
     const t = setTimeout(() => {
       try {
         if (!iframeRef.current?.contentDocument?.querySelector('canvas')) {
           console.warn('[configurer] no canvas after 5s')
         }
       } catch { /* cross-origin OK */ }
     }, 5000)
     return () => clearTimeout(t)
   }, [])
   ```
4. Verify on `/fr/configurer` and `/nl/configurer` via kimi-webbridge.

## Acceptance Criteria

- [ ] 3D preview visible on `/{locale}/configurer` within 3 s of load.
- [ ] Slider movement updates the preview.
- [ ] Lighthouse CLS stays ≤ 0.1 on this page.

## Assumptions

- The iframe has a stable `id` or `ref` we can target.
- Parent CSS in the host repo can be fixed without depending on upstream.

## Open Questions

- Is the upstream `oaksome-client` repo accessible to fix in this engagement? If not, this task may end as "observability + issue filed".

## Resolved Decisions

- Add the observability probe regardless of where the root cause lives.

## Simplicity Budget
- expected_files_changed: "1-2"
- new_modules_allowed: no
- new_dependencies_allowed: no
- shared_core_extraction_justification: ""

## Verifiable Flow Goals
- user_action: Visit `/fr/configurer`.
- expected_ui_state: 3D preview occupies left half; sliders update it.
- error_state: Probe logs `[configurer] no canvas after 5s` if upstream fails.
- success_evidence: Visible canvas element + slider interaction works.

## Design Governance

- shared_design_concept: "Configurer page has two columns: left = 3D preview, right = form."
- module_map: "One file in this repo; upstream lives in oaksome-client repo."
- affected_interfaces: "Parent ↔ iframe contract: parent provides sized container, iframe renders canvas."
- ownership_boundaries: "Parent CSS = this task; iframe internals = upstream."
- dependency_impact: "None."
- data_model_impact: "none"
- failure_modes: "Cross-origin policy prevents reading iframe internals; mitigated by try/catch."
- test_strategy: "Manual + observability probe."
- questions_considered: "2D fallback (out of scope); cross-origin probe (in scope)."
- discovered_constraints: "Cross-origin iframe means parent cannot inspect canvas state directly."
- edge_cases: "Slow network → canvas appears late; 5 s probe is tolerant."
- risk_reasoning: "Funnel-critical page. Even if root cause is upstream, observability gives us visibility for fast diagnosis."
- domain_language_checked: "yes"
- glossary_update_needed: "no"
- ready_to_implement: "yes"

## Impact Checklist
- database: none
- backend: none
- frontend: configurer page (CSS + observability probe)
- api_contracts: none
- infra_ci: none
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: 3D preview renders within 3 s.
- expected_regressions_to_prevent: Sliders still update price.
- edge_cases_to_cover: Slow network, cross-origin error swallow, narrow viewport.

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: yes — adds a single warn-level log when canvas missing after 5 s
