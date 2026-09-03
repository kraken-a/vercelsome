---
contract_version: v2
artifact_type: task
task_id: TASK-020
risk_level: low
council_required: no
human_approval_stages: []
dependencies: []
parallelizable: true
parallel_group: "wave-0-quick-wins"
conflict_scope:
  - oaksome-web/src/app/[locale]/(legal)/accessibilite/page.tsx
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
integration_blockers:
  - touches messages/*.json — coordinate with TASK-013 (i18n sweep); recommend running before TASK-013 so the keys flow naturally
merge_strategy: parallel_safe
risk_triggers:
  - missing WCAG-required statement on a legal/EU-facing site
planner_rationale: "Audit shows /fr/accessibilite is a stub (h1 'Accessibilite' — no accent — bodyLen ~1 KB) while every other legal page has 3-5 KB of real content. Belgian/EU public-facing sites require an accessibility statement to meet WCAG 2.1 AA expectations."
domain_terms: ["WCAG", "accessibility statement"]
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: none
model_overrides:
  executor: standard
  reviewer: standard
scope_paths:
  - oaksome-web/src/app/[locale]/(legal)/accessibilite/page.tsx
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
  - tasks/TASK-020.md
---

## Objective

Write a real accessibility statement at `/{locale}/accessibilite` and fix the missing accent in the H1.

## Expected Result

- `/fr/accessibilite` renders a full statement: WCAG 2.1 AA conformance target, scope, known limitations, contact route, date of last assessment.
- `/nl/accessibilite` renders the Dutch translation.
- H1 reads `Accessibilité` (accent present).

## Context

Audit (2026-05-16): all other legal pages have real content (CGV 5.3 KB, Mentions 3.1 KB, Cookies 4.5 KB, Livraison 3.4 KB, Garantie 3.6 KB, TVA-6 3.9 KB, Prise-mesures 3.3 KB, Return 3 KB). Only `/fr/accessibilite` is 1.0 KB and the H1 is `Accessibilite` (no accent).

## Scope

- **Included**: `(legal)/accessibilite/page.tsx` rewrite using translations; add `legal.accessibility.*` keys to fr.json + nl.json.
- **Excluded**: running a full a11y audit on the rest of the site (separate FIX-A11Y task).

## Steps

1. Author the statement in FR. Cover required sections (WCAG 2.1 AA target, scope, limitations, contact, last-assessment date).
2. Translate to NL.
3. Replace `<h1>Accessibilite</h1>` with `<h1>{t('title')}</h1>` and the rest of the body with translated blocks.
4. Add a contact email or link to `/contact`.

## Acceptance Criteria

- [ ] `bodyLen` > 3000 chars on both `/fr/accessibilite` and `/nl/accessibilite`.
- [ ] H1 contains the accent.
- [ ] Statement covers WCAG 2.1 AA target, scope, limitations, contact, date.
- [ ] `npm run type-check` passes.

## Assumptions

- We can author the statement based on current site capabilities (no full audit needed yet).
- Date of last assessment = the date this task lands.

## Open Questions

- Email/contact route for accessibility reports — same as `/contact` or a dedicated `accessibility@oaksome.com`?

## Resolved Decisions

- Use `/contact` form as the reporting channel for now; can split later if volume warrants.

## Simplicity Budget
- expected_files_changed: "3"
- new_modules_allowed: no
- new_dependencies_allowed: no
- shared_core_extraction_justification: ""

## Verifiable Flow Goals
- user_action: Visit `/fr/accessibilite` and `/nl/accessibilite`.
- expected_ui_state: Full statement with sections, accented H1.
- error_state: Translation key missing → falls back to FR.
- success_evidence: bodyLen > 3000; H1 with accent.

## Design Governance

- shared_design_concept: "Every legal page follows the same structure (intro, sections, contact, date)."
- module_map: "Single page + messages."
- affected_interfaces: "User-visible legal page."
- ownership_boundaries: "Frontend + content."
- dependency_impact: "None."
- data_model_impact: "none"
- failure_modes: "Missing translation key → FR fallback."
- test_strategy: "Manual content review + bodyLen sanity check."
- questions_considered: "Whether to use MDX vs JSX (stick with JSX + translations like other legal pages)."
- discovered_constraints: "Must align tone with other legal pages."
- edge_cases: "Date must be ISO-formatted in both locales."
- risk_reasoning: "Content-only change; very low technical risk."
- domain_language_checked: "yes"
- glossary_update_needed: "no"
- ready_to_implement: "yes"

## Impact Checklist
- database: none
- backend: none
- frontend: accessibility page + translation keys
- api_contracts: none
- infra_ci: none
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: Both locales render a full statement.
- expected_regressions_to_prevent: Other legal pages unchanged.
- edge_cases_to_cover: Locale fallback when key missing.

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: no
