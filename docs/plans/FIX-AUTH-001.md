---
contract_version: v2
artifact_type: task
task_id: FIX-AUTH-001
risk_level: medium
council_required: no
human_approval_stages:
  - before_coding
dependencies: []
parallelizable: false
parallel_group: ""
conflict_scope:
  - oaksome-web/src/middleware.ts
integration_blockers: []
merge_strategy: sequential_only
risk_triggers:
  - changes HTTP response status for protected routes (200→307)
  - singleton middleware file — any error breaks all routes
planner_rationale: "QA-004 F1 / QA-014 Go-Live Blocker #12 — protected account routes return 200 to anonymous requests, only client-side redirect after hydration. Add server-side cookie presence check in middleware."
domain_terms:
  - middleware
  - edge
  - session-cookie
  - auth-guard
  - edge-runtime
edit_mode: surgical_edit
dependency_freshness: not_required
observability_impact: logging_changed
stages_required:
  - design_gate
  - executor
  - reviewer
  - security
  - approval
model_overrides:
  executor: deep
  reviewer: standard
  security: standard
  approval: light
scope_paths:
  - oaksome-web/src/middleware.ts
---
# FIX-AUTH-001 — Add server-side/edge auth guard in middleware

## Objective

Protected account routes (`/projets`, `/profile`, `/rendez-vous`, etc.) currently return HTTP 200 to all anonymous requests — auth redirect happens only after React hydration on the client. Add a middleware check that validates the Odoo session cookie server-side and issues a 307 redirect to `/login?next=...` before the page is rendered.

## Expected Result

Unauthenticated `GET /fr/projets` returns HTTP 307 → `/fr/login?next=%2Ffr%2Fprojets`. Authenticated requests (valid `session_id` cookie) pass through to the next-intl middleware and render normally. Bots and scrapers no longer index account route shells.

## Context

**QA-004 F1 / QA-014 Go-Live Blocker #12** — `reviews/QA-004-report.md`:
> "Location: `oaksome-web/src/middleware.ts`. The middleware is exclusively `createMiddleware(routing)` from next-intl. There is no authentication check at the middleware layer. Protected routes return HTTP 200 at the server level to any anonymous request. The auth redirect fires only after React hydration. Risk: bots, scrapers, and search engines may index these pages."

## Scope

- **Included**: `oaksome-web/src/middleware.ts` only — add auth guard before next-intl middleware
- **Excluded**: no changes to API routes, server components, login page, or routing config

## Steps

1. Read `middleware.ts` — understand current next-intl middleware setup.
2. Read `i18n/routing.ts` to confirm locale-first path patterns.
3. Define protected path patterns: `/(fr|nl)/projets`, `/(fr|nl)/projets/*`, `/(fr|nl)/profile`, `/(fr|nl)/projets/*/rendez-vous`.
4. Import `NextResponse` from `next/server`.
5. Before calling `createMiddleware(routing)`, extract locale from URL path first segment.
6. Check if path matches a protected pattern via regex or `startsWith`.
7. If protected: read `session_id` cookie from `request.cookies.get('session_id')`.
8. If `session_id` absent: return `NextResponse.redirect(new URL('/${locale}/login?next=${encodedPath}', request.url))`.
9. If `session_id` present: fall through to `createMiddleware(routing)`.
10. Add INFO-level `console.log('[middleware] Auth redirect:', path)` when redirect fires.
11. Keep Edge compatibility — no Node.js `require()`, no `crypto`, no `fs`.
12. Run `curl -I http://localhost:3000/fr/projets` (no cookie) → 307.

## Acceptance Criteria

- [ ] `curl -I http://localhost:3000/fr/projets` (no cookie) → 307 → `/fr/login?next=...`
- [ ] `curl -I http://localhost:3000/nl/profile` (no cookie) → 307
- [ ] Authenticated request (with `session_id` cookie) → 200
- [ ] next-intl locale routing unaffected for non-protected routes
- [ ] Middleware remains Edge-compatible

## Assumptions

- Odoo session cookie name is `session_id` (confirmed — proxy code `src/app/api/oaksome/[...path]/route.ts` lines 34-44 reads `session_id`).
- Configurator iframe uses `odoo_sid` cookie name which the proxy remaps to `session_id` — at the middleware layer, checking for `session_id` is sufficient.
- Cookie presence check (not cryptographic validation) is sufficient at middleware layer; full session validation happens in the account layout server component.
- Edge runtime does not support `crypto.subtle` or `jose` for JWT verification — cookie presence check is the right call.
- The `next-intl/middleware` `createMiddleware` can be composed by chaining: run auth check first, then `createMiddleware(routing)` on allowed requests.

## Open Questions

1. **Should `/fr/commandes` (orders) also be protected?**
   - Decision-ready: Option A (Recommended) — protect `/(fr|nl)/projets`, `/(fr|nl)/profile`, `/(fr|nl)/projets/*/rendez-vous` only. Orders are not yet implemented and can be added in a follow-up. Option B — add `/(fr|nl)/commandes` now preemptively. No cost either way since the regex is extensible.
   - Recommendation: Option A. Ship the known scope; extend when orders page exists.
2. **How to compose with next-intl middleware?**
   - Decision-ready: Option A (Recommended) — wrap `createMiddleware(routing)` in a custom `export default` function that checks auth first, then delegates. `next-intl/middleware` exports a function compatible with the `NextMiddleware` type. Option B — use `next-intl`'s `chain()` helper if available (not documented for middleware composition). Option C — two separate middleware files with `matcher` partitioning (complex, error-prone).
   - Recommendation: Option A. Simple function composition. No extra dependency.

## Resolved Decisions

- Cookie name: `session_id` (standard Odoo session cookie).
- Cookie type to check: presence only (not value validation).
- Protected paths: `/(fr|nl)/projets`, `/(fr|nl)/projets/*`, `/(fr|nl)/profile`, `/(fr|nl)/projets/*/rendez-vous`.
- `before_coding` approval required — user confirms route list and composition strategy before execution.
- Redirect includes `?next=` param with the original encoded path.
- INFO log on redirect for observability.

## Simplicity Budget

- expected_files_changed: "1 — oaksome-web/src/middleware.ts"
- new_modules_allowed: no
- new_dependencies_allowed: no
- shared_core_extraction_justification: ""  # no extraction needed

## Verifiable Flow Goals

- input: "Unauthenticated GET /fr/projets (no session_id cookie)"
- processing_path: "middleware.ts: auth check → cookie absent → NextResponse.redirect('/fr/login?next=%2Ffr%2Fprojets')"
- output: "HTTP 307 response with Location header"
- error_path: "Cookie present but expired → falls through to next-intl → account layout server component re-validates → redirects if invalid"
- success_evidence: "curl -I http://localhost:3000/fr/projets (no cookie) → 307"

## Design Governance

- shared_design_concept: "Middleware auth guard — cookie presence check before next-intl routing. Singleton middleware file, all routes pass through it."
- module_map: "oaksome-web/src/middleware.ts — single file, ~20 lines added. Imports from next/server only."
- affected_interfaces: "oaksome-web/src/middleware.ts (singleton — all routes pass through). Protected routes HTTP status changes from 200 to 307 for unauthenticated requests."
- ownership_boundaries: "Edge middleware owns auth check (cookie presence). Account layout server components own full session validation. No overlap."
- dependency_impact: "None — no new dependencies. Uses Next.js built-in middleware API + cookies API."
- data_model_impact: "None"
- failure_modes: "1) Middleware throws → whole site down (critical). Mitigation: keep auth check minimal, wrap in try/catch, fall through to next-intl on error. 2) Cookie name wrong → redirect loop. Mitigation: confirm name before coding."
- test_strategy: "curl -I with/without cookie. Manual browser test: login flow works end-to-end."
- questions_considered: "Cookie name, protected route list, composition strategy, Edge compatibility"
- discovered_constraints: "Edge runtime — no crypto.subtle, no jose, no Node modules. Cookie presence check only."
- edge_cases: "1) Cookie present but expired → layout handles it (non-blocking at middleware). 2) NL locale paths. 3) Odoo_sid cookie (configurator iframe) — not checked at middleware level; session_id is always synced by proxy."
- risk_reasoning: "Medium risk because singleton middleware change affects all routes. Mitigated by: minimal code change (20 lines), try/catch wrapper, fallthrough behavior."
- domain_language_checked: "session_id, middleware, edge, auth-guard — all standard terms"
- glossary_update_needed: no
- ready_to_implement: "yes — pending before_coding human approval"

## Impact Checklist

- database: none
- backend: none
- frontend: none
- api_contracts: none
- infra_ci: none
- security: yes
- business_workflow: none

## Test Requirements

- required_behavior_to_test: "Unauthenticated requests to protected routes return 307 redirect to /login"
- expected_regressions_to_prevent: "Authenticated requests must still return 200; non-protected routes unaffected"
- edge_cases_to_cover: "Missing cookie → redirect; present cookie → pass through; NL locale paths; path with query params"

## Dependency Freshness

- required: no
- current_date_checked: ""
- packages_checked: ""
- selected_versions: ""
- deprecated_rejections: ""
- reason_necessary: ""
- why_not_existing: ""

## Observability Impact

- logging_changed: yes
- existing_logger_reused: "console.log (Edge-compatible)"
- non_blocking_hot_path: "yes — single cookie read, single regex/startsWith check"
- sensitive_data_excluded: "yes — only logs the redirect path, not the cookie value"
- failure_behavior: "try/catch around auth check — on error, log warning and fall through to next-intl (safe degraded mode)"
