---
task_id: FIX-SEC-005
title: "Add CORS allowlist to /api/odoo/* and /api/oaksome/* — allow only oaksome.com + cdn.oaksome.com"
status: done
resolution: "2026-05-17 — Verified complete. src/lib/cors.ts exposes withCors + preflight + verifyCsrfOrigin + csrfBlocked; consumed by /api/oaksome/[...path]/route.ts (allowlist enforced)."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/api/oaksome/[...path]/route.ts
  - oaksome-web/src/middleware.ts
integration_blockers: [FIX-AUTH-001]
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: standard
  security: true
domain_terms: [CORS, allowlist, api-routes, cross-origin]
dependency_freshness: not_required
observability_impact: low
affected_interfaces:
  - all /api/odoo/* routes
  - all /api/oaksome/* routes
---

# FIX-SEC-005 — Add CORS allowlist to API routes

## Objective

No CORS policy exists — any origin can call `/api/odoo/*` and `/api/oaksome/*` with no rejection. Add an allowlist that permits only `oaksome.com` and `cdn.oaksome.com` (the Odoo backend origin, needed for the configurator iframe).

## Source Evidence

**QA-012 S5 / QA-014 Should-Fix #5** — `reviews/QA-012-report.md`:
> "No CORS policy — `/api/odoo/*` accessible cross-origin, no allowlist. File: all `/api/odoo/` routes. Severity: HIGH. API abuse possible from external domains."

## Scope

- `oaksome-web/src/app/api/oaksome/[...path]/route.ts` — add CORS headers to proxy responses
- Optionally via `next.config.mjs` `headers()` with `Access-Control-Allow-Origin` — but per-route is more precise

## Steps

1. Create a `corsHeaders(origin: string | null)` helper that returns the correct `Access-Control-Allow-Origin` header:
   ```ts
   const ALLOWED_ORIGINS = ['https://oaksome.com', 'https://cdn.oaksome.com'];
   function corsHeaders(origin: string | null) {
     const allowed = ALLOWED_ORIGINS.includes(origin ?? '') ? origin! : ALLOWED_ORIGINS[0];
     return { 'Access-Control-Allow-Origin': allowed, 'Access-Control-Allow-Credentials': 'true' };
   }
   ```
2. In the proxy route (`[...path]/route.ts`): read `request.headers.get('origin')`, apply `corsHeaders()` to the response.
3. Handle `OPTIONS` preflight requests with 204 + CORS headers.
4. Add the same headers to any direct `/api/odoo/*` route handlers.
5. Ensure localhost (`http://localhost:3000`) is allowed in development (check `NODE_ENV`).
6. Test: `curl -H "Origin: https://evil.com" /api/oaksome/v1/products` → no `Access-Control-Allow-Origin` header (or header set to `oaksome.com`).

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Cross-origin request from `https://evil.com` to any API route |
| Processing | `corsHeaders()` finds `evil.com` not in allowlist |
| Output | Response `Access-Control-Allow-Origin: https://oaksome.com` (not `evil.com`) |
| Error path | Browser blocks the cross-origin request |
| Success evidence | Normal app usage unaffected; external origin requests rejected |

## Impact Checklist

- [ ] External origins cannot make credentialed API calls
- [ ] `oaksome.com` and `cdn.oaksome.com` still work
- [ ] `localhost:3000` works in development
- [ ] Configurator iframe (on `cdn.oaksome.com`) can call the API

## Test Requirements

- `curl -H "Origin: https://evil.com" /api/oaksome/v1/products` → CORS header NOT set to evil.com
- `curl -H "Origin: https://oaksome.com" /api/oaksome/v1/products` → CORS header = `https://oaksome.com`
- `OPTIONS` preflight returns 204 with correct headers

## Simplicity Budget

~20 lines. One helper function, applied in the catch-all proxy route.

## Assumptions

- `Access-Control-Allow-Credentials: true` is needed because the proxy forwards session cookies.
- `localhost` should be allowed in development — check `process.env.NODE_ENV`.

## Open Questions

1. Does the configurator 3D iframe (hosted on `cdn.oaksome.com`) need to call the Next.js API directly, or only through Odoo?

## Resolved Decisions

- Allowlist is hardcoded to two production origins + localhost for dev. No dynamic origin resolution.
- Must run after FIX-AUTH-001 since both may touch `middleware.ts` — verify conflict scope before parallelizing.

## Design Governance

No design review needed.

## Dependency Freshness

Not required.

## Observability Impact

Low — log blocked origins at WARN level.
