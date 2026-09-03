---
task_id: MIGRATE-002
title: Deploy oaksome_nextjs_api + oaksome_nextjs_core to cdn.oaksome.com
status: done
resolution: "2026-05-17 — Pipeline outcome approved 2026-05-15. oaksome_nextjs_api v17.0.1.0.1 + oaksome_nextjs_core v17.0.1.0.23 installed on cdn.oaksome.com; smoke probes pass (products_count=40, website_id=10)."
risk_level: high
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [odoo-production]
integration_blockers: [odoo-production]
human_approval_stages: [before_merge]
model_overrides:
  executor: deep
  reviewer: deep
  security: deep
  approval: light
domain_terms: []
dependency_freshness: not_required
observability_impact: logging_changed
---

# MIGRATE-002 — Deploy `oaksome_nextjs_api` + `oaksome_nextjs_core` to cdn.oaksome.com

## Objective

Install and initialize the Odoo addons `oaksome_nextjs_api` (v17.0.1.0.1) and `oaksome_nextjs_core` (v17.0.1.0.23) on the production-grade Odoo at `cdn.oaksome.com`. After this task, `GET https://cdn.oaksome.com/api/oaksome/v1/<any-documented-route>` must return JSON (200 for unauthenticated catalogue paths, 401/403 for auth-required paths), not the HTML 418 fallback.

This task lives outside the Next.js repo (its work happens on Tecnibo infra + the Odoo addon repo at `/home/rachid/01_Workspace/odoo/tecnibo/website`), but it BLOCKS every downstream MIGRATE task because the migration cannot ship without these endpoints being live.

## Scope

**Included:**
- Verify both addons in `/home/rachid/01_Workspace/odoo/tecnibo/website` install cleanly on a staging clone of cdn.oaksome.com.
- Run the `post_init_hook` (`create_b2b_team`) and any data files declared in the manifests (`oaksome_nextjs_core` ships extensive XML seed data — `oaksome_styles.xml`, `oaksome_spaces.xml`, etc.).
- Confirm production DB has the prerequisites declared in `depends`: `mrp`, `mass_mailing`, `appointment`, `crm`, `sale_crm`, `sign`, `website_sale`, `industry_fsm`, `helpdesk`, `purchase`.
- Smoke-test the canonical public endpoints from outside the network (curl-equivalent against `https://cdn.oaksome.com/api/oaksome/v1/{home,navigation,collections,products?limit=1,inspirations}`).

**Excluded:**
- No Next.js code changes.
- Do not modify addon source unless installation surfaces a bug; if it does, raise a separate task in the addon repo.
- Do not enable seed data on prod if it conflicts with existing prod records — coordinate with whoever owns the prod data model.

## Steps

- [ ] Snapshot/backup the production DB before any module install.
- [ ] Verify prerequisites: `industry_fsm`, `sign` (Enterprise modules) — confirm Enterprise license is active on cdn.oaksome.com.
- [ ] Stage the install on a clone DB first; run `--update all` and confirm no traceback in `/var/log/odoo`.
- [ ] If staging passes, install on prod via the Apps UI or `odoo-bin -u oaksome_nextjs_api,oaksome_nextjs_core`.
- [ ] Run the addon's own tests if present (`oaksome_nextjs_api/tests/test_config_params.py` exists).
- [ ] External smoke probe — for each endpoint listed under `## Verifiable Flow Goals` confirm: HTTP 200 + `Content-Type: application/json`, response envelope shape `{ success, data, meta? }`.

## Verifiable Flow Goals

Production architecture (resolved): Next.js Docker container at `www.oaksome.com` ↔ Odoo backend reachable as `cdn.oaksome.com` (external) AND `192.168.30.39:8069` (internal Docker network). Probes must verify BOTH paths because Next.js server-side calls go internal, browser image URLs go external.

| Probe | Expected |
|---|---|
| External `GET https://cdn.oaksome.com/api/oaksome/v1/home` | 200 application/json with `{success:true,data:{...}}` |
| External `GET https://cdn.oaksome.com/api/oaksome/v1/navigation` | 200 application/json |
| External `GET https://cdn.oaksome.com/api/oaksome/v1/collections` | 200 application/json, array of styles |
| External `GET https://cdn.oaksome.com/api/oaksome/v1/products?limit=1` | 200 application/json with pagination meta |
| External `GET https://cdn.oaksome.com/api/oaksome/v1/wishlist` (no cookie) | 401 application/json (auth=user) |
| Internal (from www.oaksome.com container) `GET http://192.168.30.39:8069/api/oaksome/v1/home` | 200 application/json |

Success evidence: a saved log of all six probes returning the expected status + content-type, captured against the host the Next.js container will actually reach (`ODOO_URL=http://192.168.30.39:8069`) and against the browser-facing host (`NEXT_PUBLIC_ODOO_URL=https://cdn.oaksome.com`).

## Assumptions

- Production Odoo has Enterprise modules `industry_fsm` and `sign` available (required by `oaksome_nextjs_core.depends`). If not, the install will fail and the task must be re-scoped to either install Enterprise or drop those deps from `oaksome_nextjs_core`.
- The localhost Odoo where these addons currently work uses the same Odoo version (17) as prod.
- No conflicting routes exist in other addons on prod that would shadow `/api/oaksome/v1/*`.
- Whoever runs prod deploys for Tecnibo has access to cdn.oaksome.com and a maintenance window.

## Open Questions

None remaining — all three plan-time questions were answered on 2026-05-15 and moved to `## Resolved Decisions`.

## Resolved Decisions

- **Deploy owner (Q1, 2026-05-15):** Rachid runs the first install manually. CI/CD automation deferred to a follow-up after the first install proves stable.
- **Seed data load (Q2, 2026-05-15):** YES — load all seed XML in `oaksome_nextjs_core.data` (oaksome_styles, oaksome_spaces, oaksome_categories, oaksome_website, oaksome_cases, oaksome_inspirations, oaksome_homepage_inspirations, oaksome_kits, oaksome_samples, oaksome_showrooms, oaksome_testimonials, oaksome_products, oaksome_notifications, oaksome_combos). Justification: cdn.oaksome.com is a greenfield prod Odoo for this site, not an existing instance with conflicting records. Mitigation: snapshot DB before install (already in Steps).
- **Production architecture (Q3, 2026-05-15):** Next.js Docker container serves `www.oaksome.com`. Inside the Docker network it talks to Odoo at `192.168.30.39:8069` (internal). Browser-facing host for image URLs / direct shop iframe = `cdn.oaksome.com`. Implication: Next.js prod env must set `ODOO_URL=http://192.168.30.39:8069` and `NEXT_PUBLIC_ODOO_URL=https://cdn.oaksome.com`. Both paths must serve the same addon code — install once on the Odoo behind both names.
- Migrate-002 is treated as out-of-Next-repo work; this task is the planning artifact for it, executed against the Odoo addon repo + Tecnibo infra.
- Downstream Next.js tasks (MIGRATE-003+) must NOT be merged until the smoke probes above pass.

## Dependency Freshness

not_required (no new deps; existing addon ships with its own pinned manifest).

## Observability Impact

logging_changed — once installed, Odoo will start emitting access logs for `/api/oaksome/v1/*`. Confirm: (a) existing Odoo loggers handle this volume; (b) no PII (emails, names) in default access logs; (c) errors on `auth='user'` routes return JSON not stack traces.

## Impact Checklist

- UI: none in Next.js. New routes available on Odoo.
- API contract: production starts honoring `/api/oaksome/v1/*` contract.
- Database: schema changes from the addons (new models: `oaksome.style`, `oaksome.space`, `oaksome.case`, etc. — confirm none collide with existing prod models).
- Build: none on Next.js side; Odoo restart required.
- Tests: run addon's own test suite if any.
- Docs: update `docs/System-Design.md` if the production architecture diagram needs to reflect the new modules.

## Simplicity Budget

- Files changed: 0 in Next.js repo; addon source is consumed as-is.
- New modules: addons already exist; this task only installs them.
- New dependencies: addons declare deps that must already be present on prod.

## Test Requirements

- Required behaviour: every documented `/api/oaksome/v1/*` endpoint that returned 418 before must return JSON with the documented envelope after.
- Regressions to prevent: do not break existing Odoo functionality (CRM, sale, website). The addon manifests declare `oaksome_backend` as a dep that's commented out — verify the live install doesn't pull it.
- Edge cases: auth=user routes must return 401 JSON (not redirect to `/web/login`) when called without a session cookie.

## Design Governance

REQUIRED (risk_level: high).

- **shared_design_concept**: Public REST contract owned by `oaksome_nextjs_api`; Next.js proxy at `src/app/api/oaksome/[...path]/route.ts` forwards traffic to it.
- **module_map**: `oaksome_nextjs_api` (controllers) + `oaksome_nextjs_core` (models + data). Both must install together.
- **affected_interfaces**: `/api/oaksome/v1/*` becomes live on prod. Downstream consumer: every `oaksome-web/src/lib/api/*` service via the proxy.
- **ownership_boundaries**: Tecnibo ops owns prod Odoo; Rachid owns the Next.js app. Coordination required.
- **dependency_impact**: prod Odoo gains 50+ new HTTP routes and several new ORM models (oaksome.* tables).
- **data_model_impact**: New tables created. No migration of existing prod data unless seed XML is enabled (see Open Question 2).
- **failure_modes**: (1) install fails mid-way → partial state; recover by uninstall + retry. (2) routes register but return 500 due to missing field → fix in addon repo, redeploy. (3) seed XML conflicts with any pre-existing oaksome.* external IDs on prod → mitigated by greenfield assumption + pre-install DB snapshot; if a conflict surfaces, restore snapshot and re-scope. (4) internal IP `192.168.30.39:8069` not reachable from the Next.js Docker container → fix Docker network bridge before MIGRATE-006 smoke pass.
- **test_strategy**: stage on clone DB first; run external smoke probes; only promote to prod after green.
- **questions_considered**: who deploys, seed data, target host (see Open Questions).
- **discovered_constraints**: Enterprise modules required; XML load order is sensitive (manifest comments call this out).
- **edge_cases**: existing partner/lead records may collide with new auth flows.
- **risk_reasoning**: touches prod Odoo; affects every public site visitor once Next.js cuts over. high.
- **domain_language_checked**: yes (style/space/gamme/collection terms verified against vault `_ai/odoo.md`).
- **glossary_update_needed**: no.
- **ready_to_implement**: YES — all three plan-time decisions resolved (see `## Resolved Decisions`). Owner: Rachid. Next action: snapshot prod DB, then `odoo-bin -u oaksome_nextjs_api,oaksome_nextjs_core` against a staging clone before promoting to prod.
