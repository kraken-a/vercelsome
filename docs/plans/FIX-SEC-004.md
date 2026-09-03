---
task_id: FIX-SEC-004
title: "Add rate limiting (upstash/redis or in-memory) to auth, lead, newsletter, configurator routes"
status: done
resolution: "2026-05-17 — Verified complete. src/lib/rate-limit.ts wired into /api/odoo/configurator, /api/odoo/contact, /api/odoo/newsletter, /api/oaksome/[...path] via checkRateLimit/checkSensitiveProxyPath + RL_CONFIG/RL_CONTACT/RL_NEWSLETTER buckets."
risk_level: medium
edit_mode: surgical_edit
parallelizable: false
conflict_scope:
  - oaksome-web/src/app/api/odoo/
  - oaksome-web/src/app/api/oaksome/
  - oaksome-web/src/lib/rate-limit.ts
integration_blockers: [FIX-SEC-001]
human_approval_stages:
  - rate_limit_strategy_decision
model_overrides:
  executor: deep
  reviewer: standard
  security: true
domain_terms: [rate-limiting, upstash, redis, in-memory, brute-force, spam]
dependency_freshness: required
observability_impact: medium
affected_interfaces:
  - all protected API routes (auth, lead, newsletter, configurator)
---

# FIX-SEC-004 — Add rate limiting to API routes

## Objective

Zero rate limiting exists on any API route. Add rate limiting to high-risk routes: auth (`/login`, `/register`), leads (`/api/oaksome/v1/leads`), newsletter (`/api/odoo/newsletter`), and configurator (`/api/odoo/configurator`). Strategy: upstash/redis for production (serverless-compatible), or in-memory `Map` for dev/low-traffic launch.

## Source Evidence

**QA-012 S4 / QA-006 F-3 / QA-014 Should-Fix #4** — `reviews/QA-012-report.md`:
> "Zero rate limiting on auth, lead, newsletter, configurator endpoints. Severity: HIGH. File: entire `/api/` tree. Brute-force / spam risk."

## Scope

- New: `oaksome-web/src/lib/rate-limit.ts` — rate limiter utility
- `oaksome-web/src/app/[locale]/(auth)/login/page.tsx` or its API action — apply rate limit
- `oaksome-web/src/app/api/odoo/configurator/route.ts` — apply rate limit
- Other affected routes: newsletter, leads

## Steps

1. **Strategy decision** (see Open Questions): upstash/redis or in-memory? For a soft launch, in-memory `Map` with sliding window is sufficient.
2. Create `src/lib/rate-limit.ts`:
   ```ts
   // in-memory sliding window: 10 req / 60s per IP
   const store = new Map<string, { count: number; reset: number }>();
   export function checkRateLimit(ip: string, limit = 10, window = 60_000): boolean { ... }
   ```
3. Apply `checkRateLimit` in each protected route handler: if rate exceeded, return `429 Too Many Requests` with `Retry-After` header.
4. If upstash/redis: install `@upstash/ratelimit` + `@upstash/redis`, add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to `.env.example`.
5. Routes to protect: `/api/odoo/configurator`, `/api/odoo/case` (leads), `/api/odoo/newsletter` (if exists), login action handler.
6. Test: send 11 rapid requests to a protected route → 11th returns 429.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | 11 POST requests to `/api/odoo/configurator` from the same IP within 60s |
| Processing | Rate limiter increments counter; at 11th, threshold exceeded |
| Output | HTTP 429 `{ error: "Too many requests" }` with `Retry-After: 60` header |
| Error path | Counter resets after window expires |
| Success evidence | `for i in {1..11}; do curl -X POST /api/odoo/configurator; done` → 11th returns 429 |

## Impact Checklist

- [ ] Brute force on login routes mitigated
- [ ] Spam on lead/newsletter/configurator routes mitigated
- [ ] Legitimate users not affected (limit is generous: 10/60s)
- [ ] 429 response includes `Retry-After` header

## Test Requirements

- Automated: fire >10 requests from same IP within window → 429 returned
- Manual: normal user flow not affected (single requests succeed)
- Build passes with new utility

## Simplicity Budget

~30 lines for in-memory implementation. If upstash: install 2 packages + 4 env vars.

## Assumptions

- For launch, in-memory is acceptable (single-instance Docker or Vercel; will reset on restart).
- If upstash: env vars `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` must be added to production environment.
- IP extraction from `request.headers.get('x-forwarded-for')` (Vercel/Nginx proxy sets this).

## Open Questions

1. **Strategy decision**: should we use in-memory (simpler, resets on deploy) or upstash/redis (persistent, distributed)? Rachid to decide based on infrastructure.
2. What are the upstash credentials for production, if upstash is chosen?
3. Should the configurator have a higher limit (e.g. 30/60s) since it's used in the main funnel?

## Resolved Decisions

- Route targets: auth, leads/configurator, newsletter (minimum set).
- Return 429 with `Retry-After` header (not a redirect).

## Design Governance

Requires strategy decision from Rachid before implementation (`rate_limit_strategy_decision`).

## Dependency Freshness

Required — if upstash chosen, install `@upstash/ratelimit` and `@upstash/redis`.

## Observability Impact

Medium — 429 responses should be logged at WARN level with IP and route. Monitor for false positives.
