---
task_id: QA-004
title: Auth + account portal deep test
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-004-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-004 — Auth + account portal deep test

## Objective

- User action: register → login → manage profile → view orders → book appointment → logout
- Expected UI state: auth-gated pages render only for authed users; profile changes persist to Odoo
- Error state: bad credentials show locale-correct error; session timeout redirects with `?next=`
- Success evidence: full register→login→edit→logout round-trip with Odoo state mirrored

## Scope

**In scope**
- `/{locale}/login`, `/{locale}/register`, `/{locale}/password-reset`
- `/{locale}/profile`, `/{locale}/commandes`, `/{locale}/commandes/[id]`, `/{locale}/commandes/[id]/rendez-vous`
- Odoo session cookie handling (httpOnly, Secure flags, SameSite)
- Logout flow + session expiry
- Notifications (`oaksome.notification`)

**Out of scope**
- Lead-only flows without account (QA-006)
- Payment / SO confirmation (out of scope for this family entirely)

## Steps

**No-write mode (target is production Odoo).** Auditor must NOT register, edit profile, change passwords, or confirm appointments. All write-path checks are payload-capture only.

1. `/{locale}/register`: render the form in FR + NL; walk validation (empty, malformed email, weak password) — verify locale-correct inline errors render. Capture the would-be POST payload via DevTools, then cancel the request (block via DevTools). Verify field shape against `mcp__odoo-tecnibo-com__odoo_get_model_fields` on `res.partner` / `res.users`. **Do not submit.**
2. `/{locale}/login`: login as the QA account `qa@oaksome.com` (password held by operator, out of band — do not commit). Inspect cookies (HttpOnly, Secure, SameSite=?). Verify session works across reload.
3. `/{locale}/password-reset`: render the form, walk validation, capture payload, **do not submit** (would email a real user or pollute reset tokens in prod).
4. `/profile` (only if logged in via QA account): verify fields populate from Odoo (read-only). Walk the edit form, capture would-be PATCH payload, **do not submit**.
5. `/commandes` + `/commandes/[id]`: read-only render checks against the QA account's own orders (if any). Do not browse other users' orders.
6. `/commandes/[id]/rendez-vous`: render the form only; **do not confirm** an appointment in prod calendar.
7. Logout (only if logged in): verify cookie cleared and protected routes redirect to `/login`.
8. Session expiry: manually clear the cookie in DevTools; verify graceful redirect.
9. Repeat render-only paths in NL.

## Verifiable Flow Goals

- User action: walk register/login/profile/orders/appointment up to but not including write boundaries
- Expected UI state: forms render in both locales, validation is correct, cookies hardened, order portal renders own data
- Error state: bad credentials show locale-correct error; session timeout redirects with `?next=`
- Success evidence: every form's payload captured + schema-verified against prod Odoo with zero writes; cookie flags documented

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-004-report.md`

## Test Requirements

- Required behavior to verify: auth round-trip, session cookie hardening, account CRUD, order portal.
- Regressions to prevent: insecure cookie flags, missing CSRF, account enumeration in error messages.
- Edge cases: duplicate registration, weak password, expired reset token, concurrent sessions, locale switch while authed.

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-004-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- Target Odoo is **production** (`cdn.oaksome.com`). No writes allowed.
- QA account `qa@oaksome.com` exists on production Odoo and is used for login-only paths. Password is held out-of-band by the operator; never written to repo, env files, or report markdown.

## Open Questions

- Is the Odoo session cookie set by Next.js or by Odoo directly? Affects SameSite=None requirements. Recommendation: verify in QA-012 and cross-reference.

## Resolved Decisions

- Audit-only AND no-write. Production Odoo is the target; never register, edit, reset, or confirm appointments.
- Test login is `qa@oaksome.com`. If the account state is "dirty" (has unexpected orders, profile data, sessions) at audit start, capture that as a finding but do not clean it up — operator decides cleanup.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
