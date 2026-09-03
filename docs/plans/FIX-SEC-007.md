---
task_id: FIX-SEC-007
title: "Add Origin/Referer CSRF check on non-GET proxy mutations"
status: done
resolution: "2026-05-17 — Verified complete. verifyCsrfOrigin + csrfBlocked in src/lib/cors.ts, called from /api/oaksome/[...path]/route.ts on non-GET mutations."
risk_level: medium
edit_mode: surgical_edit
parallelizable: false
conflict_scope:
  - oaksome-web/src/app/api/oaksome/[...path]/route.ts
  - oaksome-web/src/middleware.ts
integration_blockers: [FIX-AUTH-001, FIX-SEC-005]
human_approval_stages:
  - csrf_strategy_review
model_overrides:
  executor: deep
  reviewer: standard
  security: true
domain_terms: [CSRF, origin, referer, proxy, non-GET, mutation]
dependency_freshness: not_required
observability_impact: low
affected_interfaces:
  - oaksome-web/src/app/api/oaksome/[...path]/route.ts (all non-GET methods)
---

# FIX-SEC-007 — Add Origin/Referer CSRF check on proxy mutations

## Objective

The catch-all proxy (`[...path]/route.ts`) forwards all HTTP methods to Odoo without CSRF validation. If the session cookie ends up with `SameSite=None` (possible for the configurator iframe cross-site context), all authenticated mutations become forgeable. Add an `Origin`/`Referer` header check for all non-GET requests.

## Source Evidence

**QA-004 F2 / QA-012 S7 / QA-014 Should-Fix #7** — `reviews/QA-004-report.md`:
> "Location: `oaksome-web/src/app/api/oaksome/[...path]/route.ts`. The catch-all proxy forwards all HTTP methods without any CSRF validation. Risk: if session cookie has `SameSite=None`, cross-site forgery is possible for all authenticated mutations (profile update, appointment booking, cart)."

## Scope

- `oaksome-web/src/app/api/oaksome/[...path]/route.ts` — add CSRF check function
- Must NOT conflict with FIX-AUTH-001 changes to `middleware.ts` — this fix is in the route handler, not middleware

## Steps

1. Create a `verifyCsrfOrigin(request: Request): boolean` helper:
   ```ts
   const ALLOWED_ORIGINS = ['https://oaksome.com', 'https://cdn.oaksome.com'];
   function verifyCsrfOrigin(request: Request): boolean {
     const origin = request.headers.get('origin') ?? request.headers.get('referer');
     if (!origin) return false; // browser always sends Origin on cross-origin requests
     return ALLOWED_ORIGINS.some(o => origin.startsWith(o));
   }
   ```
2. In the proxy route handler: if `request.method !== 'GET'` and `request.method !== 'HEAD'`, call `verifyCsrfOrigin(request)`.
3. If check fails: return `403 Forbidden` with `{ error: 'CSRF check failed' }`.
4. Allow `localhost` in development (`NODE_ENV !== 'production'`).
5. Ensure the check does NOT apply to the OPTIONS preflight (FIX-SEC-005).
6. Test: POST to proxy from a disallowed origin → 403.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Malicious cross-origin `POST /api/oaksome/v1/cart/add` |
| Processing | `verifyCsrfOrigin()` checks `Origin` header → not in allowlist |
| Output | `403 Forbidden` |
| Error path | Legitimate `POST` from `oaksome.com` → `Origin` matches → passes |
| Success evidence | Cross-site form submission to proxy returns 403 |

## Impact Checklist

- [ ] Cross-site POST/PUT/PATCH/DELETE to proxy returns 403
- [ ] Legitimate same-origin requests unaffected
- [ ] Configurator (on `cdn.oaksome.com`) can still make authenticated mutations
- [ ] No regression on cart/wishlist/auth flows

## Test Requirements

- `curl -X POST -H "Origin: https://evil.com" /api/oaksome/v1/cart/add` → 403
- Normal app cart mutation → 200 (Origin: oaksome.com matches)
- OPTIONS preflight → 204 (CSRF check skipped)

## Simplicity Budget

~15 lines. Pure string comparison — no new dependencies.

## Assumptions

- `Origin` header is always sent by browsers on cross-origin requests.
- Same-origin requests from the app itself send `Origin: https://oaksome.com`.
- The configurator iframe on `cdn.oaksome.com` may send mutations with `Origin: https://cdn.oaksome.com` — this must be in the allowlist.

## Open Questions

1. Does the configurator iframe make any direct POST requests to the Next.js API proxy? If so, `cdn.oaksome.com` must be in `ALLOWED_ORIGINS`.
2. Should we use a double-submit cookie token instead of, or in addition to, the Origin check?

## Resolved Decisions

- Origin/Referer check is the minimum viable CSRF protection.
- Applied only to non-GET, non-HEAD, non-OPTIONS methods.
- Must serialize after FIX-AUTH-001 (both involve auth-related middleware/proxy changes).

## Design Governance

Requires CSRF strategy review (`csrf_strategy_review`) before merge.

## Dependency Freshness

Not required.

## Observability Impact

Low — log 403 CSRF failures at WARN level with the rejected origin.
