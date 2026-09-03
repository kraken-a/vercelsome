---
contract_version: v2
artifact_type: task
task_id: TASK-019
risk_level: low
council_required: no
human_approval_stages: []
dependencies: []
parallelizable: true
parallel_group: "wave-0-quick-wins"
conflict_scope:
  - oaksome-web/src/features/cart/storage.ts
  - oaksome-web/src/features/cart/__tests__
integration_blockers: []
merge_strategy: parallel_safe
risk_triggers:
  - stale dev/staging cart items shipping to real users
  - accidentally wiping real user carts
planner_rationale: "Audit reproduces a cart badge of `1` on a fresh tab because the persistence layer reads dev/staging items from localStorage. Pre-launch we need a deterministic flush + a TTL so leftover items don't surface to real users."
domain_terms: ["localStorage", "TTL"]
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: none
model_overrides:
  executor: standard
  reviewer: light
scope_paths:
  - oaksome-web/src/features/cart/storage.ts
  - oaksome-web/src/features/cart/__tests__
  - tasks/TASK-019.md
---

## Objective

Add a TTL + version check on the cart's `localStorage` persistence so first-time visitors see an empty cart and returning users keep recent items, but stale staging data is discarded.

## Expected Result

- New visitor sees badge `0` and empty `/{locale}/panier`.
- Returning visitor keeps items added within the last 30 days.
- Items older than 30 days, or with mismatched schema version, are dropped at hydrate.

## Context

Audit (2026-05-16): opening a new Chrome tab and visiting `/fr` shows cart badge `1` from the previous testing session (SKU `WACA_DD_4DR1_2IDR_2IAS`). Persistence reads from `localStorage('oaksome-cart')` without expiry.

## Scope

- **Included**: `features/cart/storage.ts` — add `version: 1` and `createdAt: ISO8601` per item; filter at hydrate.
- **Excluded**: migration to server-side cart (separate larger task).

## Steps

1. Read current storage shape.
2. Add `version: 1` and `createdAt: ISO8601` to each persisted item.
3. On hydrate, filter out items older than 30 days, missing version, or version mismatched.
4. Add unit tests in `features/cart/__tests__/storage.test.ts` covering each filter case.
5. Optionally: a one-shot migration flag (`oaksome-cart-migrated=<ISO>` in localStorage) to clear pre-versioned items once.

## Acceptance Criteria

- [ ] New tab on `/fr` shows cart badge `0`.
- [ ] Add item → badge `1`; reload 1 min later → still `1`.
- [ ] Manually set `createdAt` 31 d ago in localStorage → reload drops the item, badge `0`.
- [ ] `npm test -- cart/storage` passes.

## Assumptions

- 30 days is acceptable as the TTL. Confirm with product.
- Storage key `oaksome-cart` is current; verify in code.

## Open Questions

- Should we surface a "Your cart was reset" toast when items expire? Defer to UX.

## Resolved Decisions

- 30-day TTL chosen as a balance between returning-user UX and staleness.
- Wipe-once migration approach (flag-gated) rather than blanket localStorage clear, so we never touch unrelated keys.

## Simplicity Budget
- expected_files_changed: "2"
- new_modules_allowed: no
- new_dependencies_allowed: no
- shared_core_extraction_justification: ""

## Verifiable Flow Goals
- user_action: Open new browser tab, visit `/fr`.
- expected_ui_state: Cart badge shows `0`.
- error_state: Reading malformed JSON → reset to empty.
- success_evidence: kimi-webbridge snapshot shows badge `0` on fresh session.

## Design Governance

- shared_design_concept: "Persistent client state has versioning + TTL."
- module_map: "features/cart/storage.ts only."
- affected_interfaces: "localStorage schema (versioned)."
- ownership_boundaries: "Frontend persistence."
- dependency_impact: "None."
- data_model_impact: "None backend."
- failure_modes: "Malformed JSON in storage; mitigated by try/catch + reset."
- test_strategy: "Unit tests for filter cases."
- questions_considered: "TTL length, wipe strategy, toast UX."
- discovered_constraints: "SSR cannot access localStorage; hydrate must be client-only."
- edge_cases: "Items with no createdAt (legacy); items with future createdAt (clock skew)."
- risk_reasoning: "Wrong filter could wipe valid items; tests guard against this."
- domain_language_checked: "yes"
- glossary_update_needed: "no"
- ready_to_implement: "yes"

## Impact Checklist
- database: none
- backend: none
- frontend: cart persistence layer
- api_contracts: none
- infra_ci: none
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: TTL drops old items; valid items survive; version mismatch resets.
- expected_regressions_to_prevent: Recent items still visible.
- edge_cases_to_cover: Malformed JSON, missing createdAt, future createdAt.

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: no
