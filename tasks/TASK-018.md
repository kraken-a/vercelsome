---
contract_version: v2
artifact_type: task
task_id: TASK-018
risk_level: medium
council_required: no
human_approval_stages: []
dependencies: []
parallelizable: true
parallel_group: "wave-0-quick-wins"
conflict_scope:
  - oaksome-web/src/features/cart/client.ts
  - oaksome-web/src/features/cart/context.tsx
  - oaksome-web/src/app/[locale]/(shop)/panier/page.tsx
integration_blockers:
  - depends on Odoo `product.template` translations existing for fr_BE / nl_BE
  - excludes `features/cart/storage.ts` to avoid collision with TASK-019
merge_strategy: parallel_safe
risk_triggers:
  - English product names shown on French/Dutch cart
planner_rationale: "Audit /fr/panier shows a cart line item named `Wardrobe` (English) while the surrounding UI is fully French. Either the cart fetch doesn't pass a locale parameter, or Odoo lacks translations. Two-prong fix: pass locale on the API call, verify Odoo translations exist."
domain_terms: ["product.template", "name translation", "Accept-Language"]
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: none
model_overrides:
  executor: standard
  reviewer: standard
  security: standard
scope_paths:
  - oaksome-web/src/features/cart/client.ts
  - oaksome-web/src/features/cart/context.tsx
  - oaksome-web/src/app/[locale]/(shop)/panier/page.tsx
  - tasks/TASK-018.md
---

## Objective

Show product names in the active locale on `/{locale}/panier`. Today the cart for a French session renders `Wardrobe` (English template name) instead of `Garde-robe` / `Armoire`.

## Expected Result

- `/fr/panier` line items show French names; `/nl/panier` shows Dutch names.
- Fallback is a sensible French label if the Odoo translation is empty — never the raw English template name.

## Context

Audit screenshot of `/fr/panier`: one product `Wardrobe` (SKU `WACA_DD_4DR1_2IDR_2IAS`), priced 1 €. UI chrome (Récapitulatif, Sous-total HT, TVA 21 %, Livraison Incluse, Total TTC, PASSER LA COMMANDE) is French. Mismatch is product name only.

## Scope

- **Included**: cart fetch in `features/cart/client.ts` / `features/cart/context.tsx` — pass `?lang=fr_BE` or `?lang=nl_BE`; verify Odoo `product.template.name` translations exist for relevant SKUs.
- **Excluded**: descriptions, attribute labels, dimensions — track separately if not already handled.

## Steps

1. Inspect cart fetch in `features/cart/*`.
2. Pass locale query param when calling `/api/oaksome/v1/cart`.
3. Verify Odoo translations exist on `oaksome.tecnibo.com` (`product.template.name` for `fr_BE`, `nl_BE`). If missing, raise a data task.
4. Verify on `/fr/panier` and `/nl/panier` via kimi-webbridge.

## Acceptance Criteria

- [ ] `/fr/panier` line items show French names (no `Wardrobe`).
- [ ] `/nl/panier` line items show Dutch names.
- [ ] `npm run type-check` passes.

## Assumptions

- Odoo `product.template.name` has translations for the relevant products in fr_BE / nl_BE; if not, a data backfill task is needed.

## Open Questions

- Should the locale be passed in the URL query, headers (Accept-Language), or both? Pick the convention used elsewhere in the API client.

## Resolved Decisions

- Use the same locale-passing convention as other API calls in `lib/api/client.ts` for consistency.

## Simplicity Budget
- expected_files_changed: "2-3"
- new_modules_allowed: no
- new_dependencies_allowed: no
- shared_core_extraction_justification: ""

## Verifiable Flow Goals
- user_action: Add a product to cart in `/fr`; visit `/fr/panier`.
- expected_ui_state: Product name appears in French.
- error_state: If Odoo translation missing, fallback label (`item.display_name || item.name`) renders.
- success_evidence: kimi-webbridge snapshot shows French product name.

## Design Governance

- shared_design_concept: "Every backend-sourced UI string is locale-aware via the same API client convention."
- module_map: "Cart features module + cart page."
- affected_interfaces: "Cart API contract (`/api/oaksome/v1/cart` accepts locale)."
- ownership_boundaries: "Frontend changes the request; Odoo data must support fr_BE / nl_BE translations."
- dependency_impact: "None."
- data_model_impact: "None — uses existing `name` translations."
- failure_modes: "Missing translation → fallback label."
- test_strategy: "Manual cart walkthrough on both locales."
- questions_considered: "URL query vs header for locale."
- discovered_constraints: "Odoo translation coverage may be incomplete."
- edge_cases: "Mixed cart with one translated + one untranslated product."
- risk_reasoning: "Medium because depends on backend data."
- domain_language_checked: "yes"
- glossary_update_needed: "no"
- ready_to_implement: "yes"

## Impact Checklist
- database: none (Odoo translations expected to exist)
- backend: none in this repo; verify Odoo data
- frontend: cart fetch + line render
- api_contracts: extends cart endpoint with locale param (already supported by other endpoints)
- infra_ci: none
- security: none
- business_workflow: none

## Test Requirements
- required_behavior_to_test: Product name renders in active locale.
- expected_regressions_to_prevent: Cart totals + count unchanged.
- edge_cases_to_cover: Missing translation, empty cart, multi-item cart.

## Dependency Freshness
- required: no

## Observability Impact
- logging_changed: no
