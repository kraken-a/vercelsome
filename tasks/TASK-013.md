---
contract_version: v2
artifact_type: task
task_id: TASK-013
risk_level: medium
council_required: no
human_approval_stages: ["before_coding"]
dependencies: []
parallelizable: false
parallel_group: ""
conflict_scope:
  - oaksome-web/src/app/[locale]/**
  - oaksome-web/src/components/layout/**
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
integration_blockers:
  - blocks TASK-014 (per-page metadata needs translated `meta.*` keys)
merge_strategy: sequential_only
risk_triggers:
  - hardcoded French strings shipped to NL locale
  - mistranslated key collisions between fr.json and nl.json
planner_rationale: "Audit (2026-05-16) confirmed `/nl` renders 100% French because page components and chrome bypass `useTranslations()`. Touching every user-facing string is mechanical but high in fan-out; a single missed key visibly regresses NL launch. Before-coding human approval requested so Rachid can sign off on the messages namespace layout."
domain_terms: ["locale", "useTranslations", "next-intl"]
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: none
model_overrides:
  executor: standard
  reviewer: standard
  security: standard
  approval: standard
scope_paths:
  - oaksome-web/src/app/[locale]
  - oaksome-web/src/components/layout
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
  - tasks/TASK-013.md
---

## Objective

Make every `/nl/*` route render in Dutch by routing every user-facing string through `useTranslations()` / `getTranslations()` and completing `messages/nl.json`. Source: production-readiness audit 2026-05-16.

## Expected Result

`GET /nl`, `/nl/collecties`, `/nl/configureren`, `/nl/winkelmandje`, `/nl/login` render Dutch chrome (header nav, promo bar, footer), Dutch hero text, Dutch CTAs. Zero hardcoded French strings remain in `src/app/**` and `src/components/**`. `messages/nl.json` and `messages/fr.json` have identical key sets.

## Context

Audit walked `/nl`, `/nl/collecties`, `/nl/espaces`, `/nl/configureren`, `/nl/login`. Body content is byte-identical to FR; H1 on `/nl` is "Faites de la place pour ce qui compte."; promo bar reads "OFFRE DE LANCEMENT / Conditions privilégiées sur une sélection de meubles." 13 French markers vs 0 Dutch markers in body text. Codebase scan: 0 components currently use `useTranslations()`.

## Scope

- **Included**: every `page.tsx` under `src/app/[locale]/(marketing|shop|auth|account|legal)`, shared chrome (`header-client.tsx`, `footer.tsx`, `promo-bar.tsx`, `layout-chrome.tsx`), `messages/fr.json`, `messages/nl.json`, a new `npm run i18n:check` script that diffs key sets.
- **Excluded**: backend product translations (covered by TASK-018), route slug translations (already wired in `i18n/routing.ts`), English locale (phase 3).

## Steps

1. `rg -n "[À-ÿ]" src/app src/components/layout` to inventory hardcoded strings.
2. For each page/component, lift literals to `t('ns.key')` using namespaces `home`, `nav`, `footer`, `promo`, `legal`, `cart`, `auth`, `account`.
3. Add keys to `fr.json` (source of truth) then translate into `nl.json`.
4. Add `scripts/i18n-check.mjs` that fails on missing keys; wire `npm run i18n:check`.
5. Walk `/nl`, `/nl/collecties`, `/nl/winkelmandje`, `/nl/login` via `/kimi-webbridge`; verify Dutch.

## Acceptance Criteria

- [ ] `npm run type-check` passes.
- [ ] `npm run i18n:check` returns 0 missing keys.
- [ ] `rg "[À-ÿ]{3,}" src/app src/components/layout` finds zero matches inside JSX text nodes.
- [ ] Snapshot of `/nl` shows 0 French strings except the brand name "Oaksome".

## Assumptions

- `i18n/routing.ts` already maps NL slugs (`collecties`, `winkelmandje`, etc.). Confirmed in codebase scan.
- `next-intl` strict-typed keys are enabled; adding a key requires both fr+nl entries (build fails otherwise).

## Open Questions

- Should brand taglines that contain registered marks stay verbatim in NL or be translated literally? Defer to product.

## Resolved Decisions

- Namespace by feature (`home.*`, `nav.*`) not by page (`homePage.*`). Easier reuse for shared chrome.
- French is the source of truth; Dutch is translated from it.

## Simplicity Budget
- expected_files_changed: "35-50"
- new_modules_allowed: yes (i18n-check script)
- new_dependencies_allowed: no
- shared_core_extraction_justification: "No new shared modules expected; one helper script in scripts/."

## Verifiable Flow Goals
- user_action: Visit `/nl` and `/nl/winkelmandje` on `localhost:3001`.
- expected_ui_state: Every visible string except "Oaksome" is Dutch.
- error_state: Missing translation falls back to FR key path (`next-intl` default).
- success_evidence: kimi-webbridge snapshot shows ≥ 10 Dutch strings, 0 French strings.

## Design Governance

- shared_design_concept: "Translation contract: every UI string is a key under fr.json/nl.json; never inline literals in JSX."
- module_map: "Touch surface = all pages + shared chrome; no module boundary changes."
- affected_interfaces: "i18n message schema (fr/nl symmetric)."
- ownership_boundaries: "Frontend only; backend product translations are TASK-018."
- dependency_impact: "next-intl already a dependency. No new deps."
- data_model_impact: "none"
- failure_modes: "Missing key → fr fallback; mistranslation → visible regression."
- test_strategy: "i18n-check script + manual walkthrough of 5 NL routes."
- questions_considered: "Per-page vs feature namespaces; key-naming convention; fallback policy."
- discovered_constraints: "next-intl typed keys require both locales to have every key; this enforces parity."
- edge_cases: "Pluralization (ICU), gendered nouns, currency formatting (handled by `next-intl`'s NumberFormat)."
- risk_reasoning: "Many touch points but each diff is mechanical. Risk is omission, not breakage."
- domain_language_checked: "yes — kept FR domain terms (e.g., gamme, configurateur) translated to NL equivalents."
- glossary_update_needed: "no"
- ready_to_implement: "yes"

## Impact Checklist
- database: none
- backend: none
- frontend: every page + shared chrome; introduces useTranslations() across the app
- api_contracts: none
- infra_ci: adds `npm run i18n:check` step recommended in CI
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: NL pages render Dutch; FR pages unchanged.
- expected_regressions_to_prevent: No empty strings; no key paths leaking into UI; FR copy still matches design.
- edge_cases_to_cover: Missing key fallback, ICU pluralization, currency on cart page.

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: no
