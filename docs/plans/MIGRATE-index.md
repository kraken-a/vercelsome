---
contract_version: v2
artifact_type: task_index
revision: 3
revision_note: "2026-05-15 — Wave MIGRATE complete. All 6 tasks approved. Admin JSON-RPC path deleted. Build green."
execution_graph:
  - id: MIGRATE-001
    depends_on: []
  - id: MIGRATE-002
    depends_on: []
  - id: MIGRATE-003
    depends_on: [MIGRATE-001, MIGRATE-002]
  - id: MIGRATE-004
    depends_on: [MIGRATE-001, MIGRATE-002]
  - id: MIGRATE-005
    depends_on: [MIGRATE-003, MIGRATE-004]
  - id: MIGRATE-006
    depends_on: [MIGRATE-005]
parallel_groups:
  - wave: 0
    tasks: [MIGRATE-001, MIGRATE-002]
    rationale: "MIGRATE-001 is a research/mapping artifact under tasks/ (no oaksome-web changes). MIGRATE-002 lives entirely outside this repo (Odoo addon + Tecnibo infra). Zero file-write overlap, zero shared state."
  - wave: 1
    tasks: [MIGRATE-003, MIGRATE-004]
    rationale: "Different files: MIGRATE-003 touches 10 catalogue routes + home-product-tags.ts. MIGRATE-004 touches only configurator/route.ts. Both depend on the same upstream (MIGRATE-001 mapping + MIGRATE-002 live endpoints) but they are file-disjoint."
  - wave: 2
    tasks: [MIGRATE-005]
    rationale: "Cleanup — must run after every consumer of src/lib/odoo.ts is migrated."
  - wave: 3
    tasks: [MIGRATE-006]
    rationale: "End-to-end verification."
---

# Task Index — Migrate Next.js Oaksome from admin JSON-RPC to public REST

## Scope

**Wave complete (2026-05-15).** The Next.js app now uses a single path to Odoo:

- **Public REST** via `oaksome-web/src/lib/api/client.ts` → `oaksome-web/src/app/api/oaksome/[...path]/route.ts` proxy → `/api/oaksome/v1/*` on Odoo.

`src/lib/odoo.ts` has been deleted. `ODOO_USER`, `ODOO_PASSWORD`, `ODOO_DB`, `ODOO_WEBSITE_ID` have been removed from all env files. The Odoo addons `oaksome_nextjs_api` (v17.0.1.0.1) and `oaksome_nextjs_core` (v17.0.1.0.23) are installed and running on `cdn.oaksome.com / 192.168.30.39:8069`.

## Findings That Drove This Plan

- Probed 14 candidate endpoints on `https://cdn.oaksome.com` — all returned **HTTP 418 with HTML** (Odoo website router fallback for unmatched controllers). The endpoints exist in code but the addons are not installed on the target host.
- Localhost Odoo (via `mcp__odoo-localhost__`) confirms both addons installed and running. Routes available there: 50+ under `/api/oaksome/v1/*`, all `auth='public'`.
- No API key middleware exists in the addon source. The M0.1 security task referenced an `X-Oaksome-Api-Key` header but that enforcement does not currently exist in `oaksome_nextjs_api/controllers/`.

## Tasks

| Task | Risk | Wave | Status | Owner |
|---|---|---|---|---|
| [MIGRATE-001](./MIGRATE-001-research-and-mapping.md) — Legacy → REST mapping table | low | 0 | **done** | next.js |
| [MIGRATE-002](./MIGRATE-002-deploy-addons-to-production.md) — Deploy addons to cdn.oaksome.com / 192.168.30.39 | high | 0 | **done** | Rachid (manual install) |
| [MIGRATE-003](./MIGRATE-003-refactor-catalogue-routes.md) — Refactor 10 catalogue routes | medium | 1 | **done** | next.js |
| [MIGRATE-004](./MIGRATE-004-refactor-configurator-route.md) — Refactor configurator route | medium | 1 | **done** | next.js |
| [MIGRATE-005](./MIGRATE-005-cleanup-admin-lib-and-env.md) — Delete admin lib, drop env vars | low | 2 | **done** | next.js |
| [MIGRATE-006](./MIGRATE-006-build-and-smoke-test.md) — Build + smoke test | low | 3 | **done** | next.js |

## Hard Constraints

- **MIGRATE-002 is the critical-path gate.** Without it, MIGRATE-003 and MIGRATE-004 will break the live site. Either MIGRATE-002 completes first, or the target Odoo URL is changed to point at an instance that already has the addons (e.g., localhost during dev — but prod still blocks).
- **No code merge to main before MIGRATE-002 smoke probes are green** against the host that production Next.js will hit.
- **Admin password rotation** is recommended as an ops follow-up after MIGRATE-005, but is not a blocker for the migration itself.

## Open Decisions Held by Index

None remaining. All three plan-time questions were resolved on 2026-05-15 (see MIGRATE-002 `## Resolved Decisions` for the audit trail).

## Production Architecture (resolved)

- Public site: `www.oaksome.com` — Next.js Docker container behind Nginx.
- Odoo backend, external host: `cdn.oaksome.com` (browser-facing for image URLs and any direct Odoo links).
- Odoo backend, internal host: `192.168.30.39:8069` (Next.js → Odoo over the Docker bridge network).
- Single Odoo instance serves both hostnames; the addons install once.
- Both `ODOO_URL` (server-side, internal) and `NEXT_PUBLIC_ODOO_URL` (browser-side, external) stay in the env after MIGRATE-005. Only `ODOO_USER` / `ODOO_PASSWORD` / `ODOO_DB` / `ODOO_WEBSITE_ID` get dropped.

## Out of Scope

- Renaming frontend callers from `/api/odoo/<X>` to `/api/oaksome/v1/<Y>` directly. A later cleanup wave can do that once dust settles.
- Adding new endpoints to the addon (e.g., a `configurator/get-or-create` if MIGRATE-001 surfaces a gap) — those are addon-repo tasks, not Next.js tasks.
- E2E test authoring — deferred to M11.
- Tracking pixel implementation (`NEXT_PUBLIC_GTM_ID` etc. in `.env.example`) — separate work stream.
