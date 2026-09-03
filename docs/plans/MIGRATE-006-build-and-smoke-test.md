---
task_id: MIGRATE-006
title: Build + smoke test the migrated public REST flows
status: done
resolution: "2026-05-17 — Pipeline outcome approved 2026-05-15. type_check + lint + build all PASS. All migrated routes appear in build output. Browser smoke walk noted as pending manual step for Rachid (reviews/MIGRATE-006-smoke-report.md)."
risk_level: low
edit_mode: surgical_edit
parallelizable: false
conflict_scope: []
integration_blockers: [MIGRATE-005]
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# MIGRATE-006 — Build + smoke test the migrated flows

## Objective

Verify the migration end-to-end. Catch any silent breakage that the per-task type-checks missed.

## Scope

**Included:**
- `npm run type-check`, `npm run lint`, `npm run build` from clean.
- Manual browser walk of: `/fr`, `/fr/acheter`, `/fr/collection/[slug]` (one slug), `/fr/inspirations`, `/fr/etudes-de-cas`, `/fr/configurer` (full flow to price quote).
- Confirm DevTools Network tab shows zero `/web/session/authenticate` or `/jsonrpc` calls.
- Confirm server logs show zero `[odoo] Request failed` / `odooLogin failed` lines.

**Excluded:**
- E2E test authoring — deferred to a future M11 testing wave.

## Steps

- [ ] Clean install: `rm -rf .next node_modules && npm ci`.
- [ ] `npm run type-check` — must pass.
- [ ] `npm run lint` — must pass (existing baseline).
- [ ] `npm run build` — must succeed with no warnings about missing env vars (except the deliberately empty NEXT_PUBLIC_* tracking IDs).
- [ ] `npm run dev` and walk the routes listed under Scope.
- [ ] Record findings in `reviews/MIGRATE-006-smoke-report.md`: per-route status (pass/fail), any console errors, network calls observed.
- [ ] If a critical regression surfaces: open a follow-up task with the specific failure and roll back to the pre-MIGRATE-005 state via revert.

## Verifiable Flow Goals

| Probe | Expected |
|---|---|
| `npm run build` | Exit 0, no missing-env warnings. |
| Browser: load `/fr` | Home renders with home data from `/api/oaksome/v1/home` (visible in Network). |
| Browser: load `/fr/acheter` | Products visible, sourced from `/api/oaksome/v1/products`. |
| Browser: load `/fr/collection/<one>` | Collection page renders. |
| Browser: configurator flow | Reaches price quote without a `/web/session/authenticate` call. |
| Server log grep | `grep -E "(odooLogin|\\[odoo\\]|jsonrpc)" server.log` returns no lines. |

## Assumptions

- MIGRATE-005 is merged. `src/lib/odoo.ts` no longer exists.
- The Odoo target (per `ODOO_URL` / `NEXT_PUBLIC_ODOO_URL`) has the addons installed (MIGRATE-002 complete).

## Open Questions

None.

## Resolved Decisions

- A failing smoke test does not require code changes here — it triggers a new task. This task is verification only.

## Dependency Freshness

not_required.

## Observability Impact

none.

## Impact Checklist

- UI: none.
- API contract: none.
- Database: none.
- Build: validates the full chain.
- Tests: produces a manual smoke report; no automated test added.
- Docs: produces `reviews/MIGRATE-006-smoke-report.md`.

## Simplicity Budget

- Files changed: 0 in `src/`. 1 report file in `reviews/`.
- New modules: no.
- New dependencies: no.

## Test Requirements

- Required behaviour: all 6 listed flows complete without admin auth on the wire.
- Regressions to prevent: any silent fallback masking a 500/404 from Odoo.
- Edge cases: configurator with edge-case inputs (zero dimensions, missing facade) — at least 1 negative test in the manual pass.
