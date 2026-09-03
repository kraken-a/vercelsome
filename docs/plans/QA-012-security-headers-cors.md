---
task_id: QA-012
title: Security headers, CORS, cookies, rate limits
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-012-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-012 — Security headers, CORS, cookies, rate limits

## Objective

- Input: real requests + adversarial requests
- Processing path: header inspection → CORS preflight → cookie audit → rate-limit trigger → IDOR + XSS probes
- Output: per-control table (pass/fail/missing) + severity-ranked findings
- Success evidence: every required header present; no IDOR/XSS; rate limits enforced

## Scope

**In scope**
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS (prod only — verify config)
- CORS on `/api/oaksome/*` (verify origin allowlist matches deploy plan)
- Cookie hardening: HttpOnly, Secure, SameSite for session and auth cookies
- Rate limiting on auth, lead, search, configurator endpoints (per TASK-001)
- API key middleware (`X-Oaksome-Api-Key`) if present (per MIGRATE-001 findings, it does NOT exist in current addon source — verify)
- Zod input validation on every `/api/*` route (per TASK-003)
- Mixed content, third-party script integrity (SRI), inline script policy
- OWASP Top 10 spot-check: auth, IDOR on `/commandes/[id]`, SSRF on image proxy, XSS on user-rendered fields

**Out of scope**
- Full pentest (separate engagement)
- Odoo-side security beyond the public REST surface

## Steps

1. Inspect response headers on a sample of HTML and `/api/*` routes; compare against a reference policy.
2. Test CORS preflight from disallowed origin; verify rejection.
3. Inspect cookies via DevTools; flag any missing flags.
4. Trigger rate limits on login (10 fails), lead (rapid submit), search (rapid query); verify throttling.
5. Verify `mcp__odoo-localhost__` to check addon source for API key middleware presence; cross-reference MIGRATE-001 finding.
6. Try IDOR: with account A's session, fetch `/commandes/B-order-id`; verify 403/404.
7. Spot-check XSS: submit lead with payload `<script>alert(1)</script>`; verify it's escaped on display.

## Verifiable Flow Goals

- Input: real requests + adversarial requests
- Processing path: header inspection → CORS preflight → cookie audit → rate-limit trigger → IDOR + XSS probes
- Output: per-control table (pass/fail/missing) + severity-ranked findings
- Success evidence: every required header present; no IDOR/XSS; rate limits enforced

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-012-report.md`

## Test Requirements

- Required behavior to verify: full security header set, CORS allowlist, hardened cookies, working rate limits, no IDOR/XSS in spot-checks.
- Regressions to prevent: missing CSP after Next.js 15 upgrade, loose CORS, missing rate limits, stale API key middleware claims in docs.
- Edge cases: cross-origin preflight from oaksome.com vs cdn.oaksome.com, SameSite=None in iframed contexts, HSTS preload check (prod-only).

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-012-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- TASK-001/002/003 (security hardening, headers, Zod) are shipped per `tasks/index.md`.
- API key middleware is NOT present (per MIGRATE-001 finding) — this is a known gap to document, not a blocker if endpoints are public-only.

## Open Questions

- Should `oaksome.com` and `cdn.oaksome.com` share cookies? Recommendation: if checkout requires shared session, document the SameSite/cross-domain strategy; otherwise keep cookies isolated per host.

## Resolved Decisions

- Audit-only. Use only adversarial requests we are authorised to send (own accounts, own browser, no automated scanning of third-party hosts).

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
