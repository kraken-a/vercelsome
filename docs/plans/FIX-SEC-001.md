---
task_id: FIX-SEC-001
title: "Add security headers to next.config.mjs — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, disable X-Powered-By"
status: done
resolution: "2026-05-17 — Verified complete. next.config.mjs emits all 6 baseline headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP) + poweredByHeader=false. CSP is `Content-Security-Policy` enforced when NODE_ENV=production and `Content-Security-Policy-Report-Only` in dev — verified by NODE_ENV=production import of headers() returning enforced key. TASK-024 F-N3 finding (Report-Only on :3001) was a dev-mode false positive."
risk_level: medium
edit_mode: surgical_edit
parallelizable: false
conflict_scope:
  - oaksome-web/next.config.mjs
integration_blockers: [FIX-SEC-003]
human_approval_stages:
  - csp_policy_review
model_overrides:
  executor: deep
  reviewer: standard
  security: true
domain_terms: [CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy, security-headers]
dependency_freshness: not_required
observability_impact: low
affected_interfaces:
  - all HTTP responses (adds headers)
  - next.config.mjs (singleton — serialize all next.config edits)
---

# FIX-SEC-001 — Add security headers to next.config.mjs

## Objective

Add a `headers()` export to `oaksome-web/next.config.mjs` that emits the baseline security headers on all routes. Currently zero security headers are set — no CSP, no HSTS, no X-Frame-Options, no Referrer-Policy.

## Source Evidence

**QA-012 S1 / QA-014 Go-Live Blocker #7** — `reviews/QA-012-report.md`:
> "Zero security headers are configured in `next.config.js`. No CSP, no HSTS, no X-Frame-Options, no Referrer-Policy, no Permissions-Policy, no X-Content-Type-Options. File: `next.config.js`. Severity: CRITICAL."

## Scope

- `oaksome-web/next.config.mjs` — add `headers()` async function + `poweredByHeader: false`

No application source files change.

## Steps

1. Add `poweredByHeader: false` to the config object root.
2. Add `async headers()` returning an array with source `'/(.*)'` and the following headers:
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - `X-Frame-Options: SAMEORIGIN`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   - `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdn.axeptio.eu; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://cdn.oaksome.com; frame-src https://cdn.oaksome.com https://www.youtube.com;`
3. Verify the Axeptio and GTM domains are in `script-src` (required for FIX-TRACK-001/002 to work).
4. Verify the configurator iframe domain (`cdn.oaksome.com`) is in `frame-src`.
5. Run `npm run build` and `npm run dev` to confirm no build errors.
6. Use browser devtools or `curl -I` to confirm headers appear on responses.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | HTTP request to any page |
| Processing | Next.js adds headers via `headers()` config |
| Output | Response includes HSTS, X-Frame-Options, CSP, etc. |
| Error path | CSP too restrictive → Axeptio/GTM breaks → loosen script-src |
| Success evidence | `curl -I https://localhost:3000` shows all 6 headers |

## Impact Checklist

- [ ] Security: baseline headers established
- [ ] No functional regression on existing pages
- [ ] GTM + Axeptio scripts still load (script-src allows their CDNs)
- [ ] Configurator iframe still loads (frame-src allows cdn.oaksome.com)

## Test Requirements

- `npm run build` passes
- Manual: open browser console — no CSP violations for normal page load
- Manual: configurator iframe loads without CSP block
- `curl -I http://localhost:3000/fr` shows all security headers

## Simplicity Budget

One block in `next.config.mjs`. CSP is the only header requiring careful tuning — all others are 1-liners.

## Assumptions

- The production domain is `oaksome.com` (HSTS applies to this domain).
- Axeptio CDN is `cdn.axeptio.eu` — confirm the exact domain with Rachid.
- GTM is loaded from `www.googletagmanager.com` — standard, no variation expected.
- The 3D configurator iframe origin is `cdn.oaksome.com` — matches ODOO_URL.
- `'unsafe-inline'` is temporarily needed for existing inline styles; can be tightened post-launch with nonces.

## Open Questions

1. Is the Axeptio script served from `cdn.axeptio.eu` or another CDN? (needed for CSP `script-src`)
2. Should `frame-ancestors` be added to prevent embedding Oaksome pages in external iframes?
3. Is Pinterest Tag (pixel.pinimg.com) needed in `img-src` or `connect-src`?

## Resolved Decisions

- Must run after FIX-SEC-003 (dep bump) to avoid surprises in `next.config.mjs` merge.
- `poweredByHeader: false` is safe and included unconditionally.
- HSTS `max-age=31536000` (1 year) is standard; no `preload` yet until domain is stable.

## Design Governance

CSP policy requires human approval before merge — Rachid must confirm GTM/Axeptio/Stripe domains are correct. Flagged in `human_approval_stages`.

## Dependency Freshness

Not required beyond FIX-SEC-003 running first.

## Observability Impact

Low — CSP violation reports are not wired yet (no `report-uri`). Add in a follow-up.
