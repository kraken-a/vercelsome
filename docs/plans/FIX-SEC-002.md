---
task_id: FIX-SEC-002
title: "Validate next= param on login page — reject non-relative URLs"
status: done
resolution: "2026-05-17 — Verified complete. src/app/[locale]/(auth)/login/page.tsx routes rawNext through isSafeRedirect() from @/lib/safe-redirect (existing helper, 645B). Helper enforces: non-empty string, starts with /, does not start with //, no `:`, no `\\` — blocks protocol-relative URLs, javascript:, data:, https:, and UNC paths. Fallback target is '/'."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/[locale]/(auth)/login/page.tsx
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: standard
  security: true
domain_terms: [open-redirect, login, next-param, URL-validation]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-SEC-002 — Validate `next=` param on login page

## Objective

The login page reads `?next=<url>` and redirects after auth without validating the URL. An attacker can craft `/fr/login?next=https://evil.com` to phish users. Add a guard that rejects any `next` value that does not start with `/` or that starts with `//`.

## Source Evidence

**QA-012 S2 / QA-014 Go-Live Blocker #8** — `reviews/QA-012-report.md`:
> "Open redirect on `/login?next=` — unvalidated external URL accepted. File: `src/app/[locale]/(auth)/login/page.tsx`. Severity: HIGH. Trivially exploitable phishing vector."

## Scope

- `oaksome-web/src/app/[locale]/(auth)/login/page.tsx` — add URL validation helper, ~5 lines

## Steps

1. Locate where `next` search param is read in `login/page.tsx`.
2. Add a `isSafeRedirect(url: string): boolean` helper:
   ```ts
   function isSafeRedirect(url: string): boolean {
     return url.startsWith('/') && !url.startsWith('//');
   }
   ```
3. When performing the post-login redirect, apply: `router.replace(isSafeRedirect(next) ? next : '/fr')` (or locale-aware default).
4. If `next` is absent or invalid, redirect to the locale home `/${locale}`.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | `GET /fr/login?next=https://evil.com` |
| Processing | `isSafeRedirect('https://evil.com')` → false |
| Output | After login, redirect to `/fr` (default), NOT evil.com |
| Error path | `next=/fr/profile` (valid relative) → redirect correctly |
| Success evidence | Manual test: login with `?next=https://evil.com` → lands on `/fr` |

## Impact Checklist

- [ ] Security: open redirect closed
- [ ] No regression for valid `?next=/fr/profile` flows
- [ ] Works for all locales (`/nl/...` prefix also valid)

## Test Requirements

- Unit test: `isSafeRedirect('https://evil.com')` → false
- Unit test: `isSafeRedirect('//evil.com')` → false
- Unit test: `isSafeRedirect('/fr/profile')` → true
- Unit test: `isSafeRedirect('/nl/projecten/1')` → true
- Manual: login with external `next` → lands on locale home

## Simplicity Budget

~5 lines of code. No new dependencies.

## Assumptions

- The `next` param is read from `useSearchParams()` in the login client component.
- Valid redirects are always relative paths starting with `/` (never protocol-relative `//`).
- Default redirect when `next` is invalid is `/${locale}` (locale home).

## Open Questions

1. Should we also validate that the path exists in the app's known routes, or is the relative-URL check sufficient?

## Resolved Decisions

- Protocol-relative URLs (`//evil.com`) must also be blocked — they resolve to the current protocol.
- No dependency on a URL-parsing library — pure string check is sufficient and tamper-proof.

## Design Governance

No design review needed. Pure security guard, no UI change.

## Dependency Freshness

Not required.

## Observability Impact

None.
