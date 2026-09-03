---
task_id: MIGRATE-001
title: Read addon controllers and build legacy → REST mapping table
status: done
resolution: "2026-05-17 — Pipeline outcome approved 2026-05-15 (reviews/MIGRATE-001-pipeline-status.json). Mapping artifact at reviews/MIGRATE-001-mapping.md. Gaps recorded: how-it.works + oaksome.website/category_description have no REST endpoint."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: []
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# MIGRATE-001 — Read addon controllers and build legacy → REST mapping

## Objective

Produce a single research artifact (`tasks/MIGRATE-001-research.md`) that lists, for each existing Next.js admin-RPC route, the equivalent `/api/oaksome/v1/*` controller in the Odoo addon `oaksome_nextjs_api`, plus the response shape diff. This is the input MIGRATE-003 and MIGRATE-004 will refactor against.

## Scope

**Included:**
- Read `/home/rachid/01_Workspace/odoo/tecnibo/website/oaksome_nextjs_api/controllers/api.py` for every route used by the 10 legacy admin paths.
- For each legacy route (finitions, how_it_works, spaces, case, styles, categories, inspiration, product, oaksome_config, home-product-tags, configurator), record: legacy URL, current admin model+fields, target REST path, target response shape, field-name diff (snake_case vs whatever the route currently returns), and any data missing on either side.
- Write the mapping table into `tasks/MIGRATE-001-research.md`.

**Excluded:**
- No code changes in `oaksome-web/`.
- No Odoo changes.
- Do not redefine the public REST contract — capture what already exists.

## Steps

- [ ] Open `oaksome_nextjs_api/controllers/api.py` and list the 50+ `@http.route` declarations with their handler bodies.
- [ ] For each legacy `/api/odoo/<X>` route in `oaksome-web/src/app/api/odoo/`, read the route file and capture: model queried, domain, fields, response shape.
- [ ] Match each legacy route to one or more REST endpoints. Where no 1:1 match exists (e.g., `/api/odoo/styles` returns a list but spec only documents `/api/oaksome/v1/collections/:slug`), flag the gap explicitly.
- [ ] Produce `tasks/MIGRATE-001-research.md` with: mapping table, per-route shape diff, gap list.

## Assumptions

- The addon source on disk matches what is installed on the localhost Odoo (manifest version 17.0.1.0.1 for `oaksome_nextjs_api`).
- Response shapes returned by the controller match what is documented in `docs/api-contract.md` — to be verified by reading handlers, not by trusting docs.
- The legacy `/api/odoo/*` routes are the only consumers of `src/lib/odoo.ts` (verified earlier in the chat).

## Open Questions

None at plan time — all decisions deferred to MIGRATE-003/004 where shape mismatches surface.

## Resolved Decisions

- Mapping artifact lives in `tasks/MIGRATE-001-research.md` (not a separate `research/` folder; this repo doesn't use one).
- Mapping covers only routes currently in production use; orphan addon routes (e.g., `/api/oaksome/v1/payment/*`) are out of scope for this wave.

## Dependency Freshness

not_required.

## Observability Impact

none.

## Impact Checklist

- UI: none
- API contract: none (read-only)
- Database: none
- Build: none
- Tests: none
- Docs: produces a new research artifact in `tasks/`

## Simplicity Budget

- Files changed: 1 new file (`tasks/MIGRATE-001-research.md`).
- New modules: no.
- New dependencies: no.

## Test Requirements

n/a — research artifact only. Acceptance = mapping table is complete and the gaps list is empty or explicitly documented.
