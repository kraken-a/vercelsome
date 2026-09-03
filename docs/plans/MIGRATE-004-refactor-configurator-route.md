---
task_id: MIGRATE-004
title: Migrate /api/odoo/configurator off /web/session/authenticate + /shop/get_or_create_product_by_config
status: done
resolution: "2026-05-17 — Pipeline outcome approved 2026-05-15. /api/odoo/configurator route dropped getOdooSessionCookie() + DB/USER/PASSWORD constants; calls /shop/get_or_create_product_by_config directly under auth='public'."
risk_level: medium
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [oaksome-web/src/app/api/odoo/configurator/route.ts]
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

# MIGRATE-004 — Migrate `/api/odoo/configurator` route off admin auth

## Objective

`src/app/api/odoo/configurator/route.ts` currently does two privileged things:

1. POSTs `/web/session/authenticate` with admin credentials to obtain a session.
2. Calls `/shop/get_or_create_product_by_config` (Odoo internal `website_sale` controller).

Replace both with a single call against the documented REST surface. The addon at `oaksome_nextjs_api/controllers/api.py` line ~670 has a commented-out `/api/oaksome/v1/configurator` route — confirm during MIGRATE-001 whether the equivalent `get-or-create` action is exposed at `/api/oaksome/v1/configurator/*` or whether the addon needs an additional endpoint added.

## Scope

**Included:**
- `oaksome-web/src/app/api/odoo/configurator/route.ts` — single file.
- Updating its error contract to match `Result<T>` envelope.

**Excluded:**
- Adding a new endpoint to the Odoo addon — if the existing addon does not expose a get-or-create-product-by-config action, that is a separate task in the addon repo and this task is blocked until it lands.
- Frontend configurator UI changes — out of scope.

## Steps

- [ ] Confirm from MIGRATE-001: which `/api/oaksome/v1/configurator/*` route equates to `/shop/get_or_create_product_by_config`.
- [ ] If no equivalent exists: STOP, create addon-side task, return here when route exists.
- [ ] If equivalent exists: replace the admin-auth fetch + privileged call with one `apiPost` through `/lib/api/client.ts`.
- [ ] Drop `process.env.ODOO_URL` reference in this file (use `client.ts` which already knows the base URL).
- [ ] Preserve the existing error response shape so the configurator UI does not break.
- [ ] `npm run type-check`; manual smoke of `/fr/configurer` flow end-to-end.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| User action | Completes configurator on `/fr/configurer` and submits "Voir le prix". |
| Processing path | Frontend → `/api/odoo/configurator` → `client.apiPost('/configurator/...')` → addon. |
| Output | JSON `{ success: true, data: { product_id, price, ... } }`. |
| Error path | On addon failure: `{ success: false, error: '...', code: 4xx|5xx }`. |
| Success evidence | Network panel shows no call to `/web/session/authenticate`. Server logs show no `[odoo] Request failed` line. |

## Assumptions

- The addon either already exposes a get-or-create-product action, or a small addon-side task will add it before MIGRATE-004 ships.
- The configurator wishlist favorites controller at `oaksome_nextjs_api/controllers/wishlist.py` (`/shop/favorite_config`, `type='json'`) is fine to keep — it is `auth='public'` and does not require admin creds.

## Open Questions

1. **Does `oaksome_nextjs_api` already expose a `/api/oaksome/v1/configurator/get-or-create` action, or must it be added?**
   - Options: (a) it exists under a different name in the controller (verify in MIGRATE-001); (b) it does not exist and must be added to the addon; (c) we keep using `/shop/get_or_create_product_by_config` but switch to user-session auth instead of admin auth.
   - Recommendation: (a) inspect first; if absent fall to (c) since `/shop/get_or_create_product_by_config` accepts `auth='public'` in `website_sale` and does not require admin — the current admin auth is overkill, not necessary.
   - Decision required before executor starts.

## Resolved Decisions

- The fix is "drop admin auth on this route" regardless of which target endpoint we end up using. Even if we keep `/shop/get_or_create_product_by_config`, we will call it with `credentials: 'include'` (forwarding the visitor's session) instead of authenticating as admin.

## Dependency Freshness

not_required.

## Observability Impact

logging_changed — emit `[api/odoo/configurator] failed: <error>` when the upstream call fails; remove the existing admin-auth error path.

## Impact Checklist

- UI: none (URL stable).
- API contract: internal — same response shape.
- Database: none.
- Build: must pass type-check.
- Tests: existing E2E configurator test (if any) must still pass.
- Docs: none.

## Simplicity Budget

- Files changed: 1.
- New modules: no.
- New dependencies: no.

## Test Requirements

- Required behaviour: configurator flow produces a price quote at the end without admin auth on the wire.
- Regressions to prevent: (1) anonymous users blocked because the route now requires a session it can't obtain; (2) silent failures swallowed.
- Edge cases: anonymous visitor (no session cookie) must still get a result, since the configurator is a pre-account flow.
