---
task_id: MIGRATE-003
title: Refactor 10 admin-RPC catalogue routes to public REST via proxy
status: done
resolution: "2026-05-17 — Pipeline outcome approved 2026-05-15. 5+ legacy /api/odoo/* routes migrated to call /api/oaksome/v1/* internally (styles → collections, spaces → navigation.spaces, categories → navigation.types, inspiration, case-studies)."
risk_level: medium
edit_mode: surgical_edit
parallelizable: false
conflict_scope: [oaksome-web/src/app/api/odoo/, oaksome-web/src/lib/odoo.ts, oaksome-web/src/lib/api/]
integration_blockers: [MIGRATE-001, MIGRATE-002]
human_approval_stages: [before_merge]
model_overrides:
  executor: deep
  reviewer: standard
  security: standard
  approval: light
domain_terms: []
dependency_freshness: not_required
observability_impact: logging_changed
---

# MIGRATE-003 — Refactor 10 admin-RPC catalogue routes to public REST

## Objective

Eliminate every `src/lib/odoo.ts` import. Each Next.js route under `src/app/api/odoo/*` that currently does `odooLogin()` + `odooSearchRead()` is replaced by a call through the existing public REST client (`src/lib/api/client.ts`) hitting the addon endpoints catalogued in MIGRATE-001.

After this task: zero references to `ODOO_USER`/`ODOO_PASSWORD`/`ODOO_DB` from any of the routes listed below; admin JSON-RPC traffic to Odoo drops to zero for these paths.

## Scope

**Included** (10 files):

| Legacy route file | Target REST endpoint(s) |
|---|---|
| `src/app/api/odoo/styles/route.ts` | `/api/oaksome/v1/collections` |
| `src/app/api/odoo/spaces/route.ts` | `/api/oaksome/v1/space/<slug>` (list TBD per MIGRATE-001) |
| `src/app/api/odoo/categories/route.ts` | `/api/oaksome/v1/gamme/<slug>` (list TBD per MIGRATE-001) |
| `src/app/api/odoo/inspiration/route.ts` | `/api/oaksome/v1/inspirations` |
| `src/app/api/odoo/case/route.ts` | `/api/oaksome/v1/case-studies` |
| `src/app/api/odoo/product/route.ts` | `/api/oaksome/v1/products` and `/api/oaksome/v1/products/<id>` |
| `src/app/api/odoo/finitions/route.ts` | per MIGRATE-001 mapping |
| `src/app/api/odoo/how_it_works/route.ts` | per MIGRATE-001 mapping |
| `src/app/api/odoo/oaksome_config/route.ts` | `/api/oaksome/v1/navigation` (or `/home` per mapping) |
| `src/lib/api/home-product-tags.ts` | `/api/oaksome/v1/home` |

**Decision rule** per legacy file:
- **Stable URL preferred** — keep the `/api/odoo/<X>` path as a thin server-side adapter that calls `/api/oaksome/v1/<Y>` and reshapes the response if needed. Frontend pages do not change in this task.
- **Inline elimination** — only if the frontend caller is already using `src/lib/api/client.ts` (e.g., the contact route does); in that case delete the legacy adapter file entirely.

**Excluded:**
- `src/app/api/odoo/configurator/route.ts` — handled by MIGRATE-004.
- `src/app/api/odoo/login/route.js` — handled by MIGRATE-005.
- Frontend page changes — none in this task; URL stability is enforced.
- Removing env vars from `.env.example` — handled by MIGRATE-005 (after every consumer is migrated).
- Deleting `src/lib/odoo.ts` — handled by MIGRATE-005.

## Steps

- [ ] Confirm MIGRATE-001 mapping artifact exists and is signed off.
- [ ] Confirm MIGRATE-002 smoke probes are green on the Odoo target the Next.js dev/prod actually hits.
- [ ] For each file in the table above:
  - [ ] Replace `import { odooLogin, odooSearchRead } from '@/lib/odoo'` with `import { apiGet } from '@/lib/api/client'`.
  - [ ] Replace the admin-RPC body with `apiGet<T>('<rest-path>', params, { revalidate: 300 })`.
  - [ ] Reshape the response only where the legacy contract differs from the REST envelope. Reshape lives at the route boundary, not in `client.ts`.
  - [ ] Preserve `export const revalidate = N` if present.
  - [ ] Keep error response shape stable (`{ error: '...' }` with same HTTP status) so callers don't break.
- [ ] Run `npm run type-check` after each batch of 2–3 files.
- [ ] Confirm no remaining `import.*lib/odoo` outside `src/lib/odoo.ts` itself (grep check).

## Verifiable Flow Goals

| Caller | Expected outcome |
|---|---|
| `/fr/acheter` (catalogue) | Same products render. Network tab shows `/api/odoo/product` call returning 200 with same shape as before. |
| `/fr/collection/[slug]` | Collection page renders. Underlying call now flows through `/api/oaksome/v1/collections/<slug>` server-side, not admin JSON-RPC. |
| `/fr/inspirations` | Inspiration list renders. |
| Server logs | Zero log lines matching `odooLogin failed` or `[odoo] Request failed` from the 10 migrated files. |

## Assumptions

- MIGRATE-001 produced a complete shape mapping with no unresolved gaps.
- MIGRATE-002 is live on whatever Odoo the dev environment hits (`ODOO_URL` for server-side, `NEXT_PUBLIC_ODOO_URL` for browser-side).
- The existing public REST proxy at `src/app/api/oaksome/[...path]/route.ts` correctly forwards traffic — confirmed during investigation.
- `apiGet`/`apiPost` from `src/lib/api/client.ts` already handle the response envelope unwrap; routes only need to reshape when contracted shape diverges.

## Open Questions

None at plan time. Any per-route shape mismatch is recorded in MIGRATE-001 and resolved during execution by the executor.

## Resolved Decisions

- Keep the `/api/odoo/<X>` URLs stable during this migration to minimise blast radius. A later cleanup task (MIGRATE-007, not yet created) can rename callers to use `/api/oaksome/v1/*` directly through `client.ts`.
- Response reshaping lives at the legacy route boundary, not inside the generic client.
- No retry/fallback logic added — the REST endpoints are auth='public' and idempotent; the existing client's error envelope is sufficient.

## Dependency Freshness

not_required.

## Observability Impact

logging_changed — replacing `[odoo] Request failed` log lines with errors surfaced via the REST client's `Result<T>` envelope. Each migrated route MUST still emit `console.error` on failure with the legacy route name as prefix (e.g., `[api/odoo/styles] REST call failed: <error>`) so existing log grepping continues to work.

## Impact Checklist

- UI: none (URL contract preserved).
- API contract: internal — `/api/odoo/<X>` continues to return same JSON shape.
- Database: none (no schema change in Next.js side).
- Build: must pass `npm run type-check` and `npm run build`.
- Tests: any existing Jest tests covering these routes must continue to pass; add no new tests in this task (TDD violation acceptable here because we are preserving an existing contract, not designing a new one — but see MIGRATE-006 which adds end-to-end smoke coverage).
- Docs: none in this task.

## Simplicity Budget

- Files changed: 10 existing files (no new files).
- New modules: no.
- New dependencies: no.

## Test Requirements

- Required behaviour: each route returns the same JSON shape its callers consume today.
- Regressions to prevent: (1) field rename leaking through (e.g., `style.image` → `style.image_url` in REST); (2) silent empty results when the addon endpoint is missing; (3) ISR revalidation interval lost.
- Edge cases: (a) Odoo down → existing 503 response shape preserved; (b) empty result set → empty array returned, not 404; (c) image base64 vs URL — preserve current frontend assumption.
