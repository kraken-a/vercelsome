---
task_id: MIGRATE-005
title: Delete src/lib/odoo.ts, /api/odoo/login, and drop ODOO_USER/PASSWORD/DB/WEBSITE_ID env vars
status: done
resolution: "2026-05-17 — Pipeline outcome approved 2026-05-15. Deleted: src/lib/odoo.ts, /api/odoo/login/route.js, /api/odoo/how_it_works/route.ts, /api/odoo/oaksome_config/route.ts. ODOO_USER/PASSWORD/DB/WEBSITE_ID env vars dropped."
risk_level: low
edit_mode: surgical_edit
parallelizable: false
conflict_scope: [oaksome-web/src/lib/odoo.ts, oaksome-web/.env.example, oaksome-web/src/app/api/odoo/login/]
integration_blockers: [MIGRATE-003, MIGRATE-004]
human_approval_stages: [before_merge]
model_overrides:
  executor: standard
  reviewer: light
  approval: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# MIGRATE-005 — Delete admin lib, orphan login route, and drop admin env vars

## Objective

After MIGRATE-003 and MIGRATE-004 land, no Next.js code imports `@/lib/odoo` anymore. This task closes the door:

1. Delete `oaksome-web/src/lib/odoo.ts` (this also fixes the stray `B` character on line 1 noted during investigation).
2. Delete `oaksome-web/src/app/api/odoo/login/route.js` (22-line admin JSON-RPC health-check with no consumers).
3. Remove the four admin env vars from `.env.example`: `ODOO_USER`, `ODOO_PASSWORD`, `ODOO_DB`, `ODOO_WEBSITE_ID`.
4. Update the env documentation in `CLAUDE.md` and any deploy compose files to drop these vars.

## Scope

**Included:**
- Three file deletions: `src/lib/odoo.ts`, `src/app/api/odoo/login/route.js`.
- Edits: `.env.example`, project `CLAUDE.md` env section, any `docker-compose*.yml` / `Dockerfile` that references the four env vars.
- Repo-wide grep guard to confirm zero remaining references.

**Excluded:**
- Rotating the actual ODOO_USER admin password in 1Password / Tecnibo vaults — that's an ops follow-up; recommend it but don't gate this task on it.
- Removing the `/api/odoo/<X>` adapter files left in place by MIGRATE-003 — those stay until a later cleanup wave can update frontend callers to use `/api/oaksome/v1/*` directly.

## Steps

- [ ] `git grep -nE "import.*@/lib/odoo|from '@/lib/odoo'" oaksome-web/` → must be empty.
- [ ] `git grep -nE "process\\.env\\.(ODOO_USER|ODOO_PASSWORD|ODOO_DB|ODOO_WEBSITE_ID)" oaksome-web/` → must be empty.
- [ ] `rm oaksome-web/src/lib/odoo.ts`.
- [ ] `rm oaksome-web/src/app/api/odoo/login/route.js`.
- [ ] Edit `.env.example`: remove the four lines under "Runtime — server-side only" except keep `ODOO_URL` (still used by `next.config.mjs` rewrites + the public REST proxy server-side fallback).
- [ ] Edit project `CLAUDE.md` "Environment Variables" section to mirror the new list.
- [ ] `git grep -nE "ODOO_(USER|PASSWORD|DB|WEBSITE_ID)" .` → expected only in this task file and the migrated env files.
- [ ] `npm run build` — must succeed.
- [ ] Open a follow-up issue: rotate the admin Odoo password and remove it from any production secret stores (the value is no longer used by the app and continuing to hold it is dead-credential risk).

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Boot Next.js with `.env` that has only `NEXT_PUBLIC_ODOO_URL`, `NEXT_PUBLIC_SITE_URL`, `ODOO_URL` set. |
| Processing path | Server renders home, catalogue, configurator, account pages. |
| Output | All pages render data successfully through the public REST proxy. |
| Error path | None expected — admin path is gone. |
| Success evidence | `grep -r 'ODOO_PASSWORD\|ODOO_USER\|ODOO_DB' src/ .env.example` returns nothing. `npm run build` green. |

## Assumptions

- MIGRATE-003 and MIGRATE-004 are merged and their PRs reference this task as the cleanup that closes them.
- No CI/CD secret store outside this repo silently injects the four env vars (if it does, this task's PR description must call out that operators should remove them).

## Open Questions

None at plan time. Resolved by the grep guards in Steps — if either grep returns non-empty, this task is not ready and must wait on its upstream task.

## Resolved Decisions

- Keep `ODOO_URL` in `.env.example`. Per the resolved prod architecture (see MIGRATE-index `## Production Architecture`), `ODOO_URL=http://192.168.30.39:8069` is the internal Docker-network address the Next.js container uses for server-side calls to Odoo. Also used by `next.config.mjs` rewrites (`/shop/*`, `/wishlist/*`, `/cart/*`) and as the public REST proxy's server-side fallback.
- Keep `NEXT_PUBLIC_ODOO_URL` in `.env.example`. Set to `https://cdn.oaksome.com` for browser-side image URLs and direct shop iframe links.
- Drop only the four admin vars: `ODOO_USER`, `ODOO_PASSWORD`, `ODOO_DB`, `ODOO_WEBSITE_ID`.
- Keep the `/api/odoo/<X>` adapter files in place after they've been migrated by MIGRATE-003 — renaming callers is a separate concern, not a blocker for dropping admin creds.

## Dependency Freshness

not_required.

## Observability Impact

none — log lines from `odooLogin()` go away naturally with the file deletion. No new logging introduced.

## Impact Checklist

- UI: none.
- API contract: none.
- Database: none.
- Build: must succeed.
- Tests: existing build/type-check are the gate; no new tests.
- Docs: `.env.example` and project `CLAUDE.md` env section updated.

## Simplicity Budget

- Files changed: 2 deletions + 2 doc edits = 4 files touched.
- New modules: no.
- New dependencies: no.

## Test Requirements

- Required behaviour: app boots and serves all routes with the four admin env vars unset.
- Regressions to prevent: (1) hidden import of `@/lib/odoo` from a file the grep missed (verify via `npm run build` not just grep); (2) Docker/compose file still passing the now-removed env vars and failing health check.
- Edge cases: a developer who pulls main without updating their local `.env` should not see runtime errors — only `console.warn` if the missing var is referenced anywhere.
