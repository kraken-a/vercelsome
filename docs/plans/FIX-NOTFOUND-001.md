---
contract_version: v2
artifact_type: task
task_id: FIX-NOTFOUND-001
title: Root not-found.tsx is missing AuthProvider — every unmatched URL returns 500 in prod
status: open
risk_level: medium
edit_mode: surgical_edit
parallelizable: false
parallel_group: "wave-prod-cutover"
conflict_scope:
  - oaksome-web/src/app/not-found.tsx
integration_blockers:
  - blocks TASK-029 deploy (BLOCKER finding F-029-NEW-1 in reviews/TASK-029-smoke-report.md)
human_approval_stages: []
risk_triggers:
  - production users hitting any typo'd or stale URL get a generic "Application error" instead of a branded 404 — material UX and SEO regression
  - search engines crawling deleted slugs receive 500 status codes, which they treat very differently from 404 (no de-indexing, possible crawl budget penalty)
merge_strategy: sequential_only
domain_terms:
  - AuthProvider
  - not-found
  - SSR
  - hydration
model_overrides:
  executor: standard
  reviewer: standard
  security: standard
  approval: standard
dependency_freshness: not_required
observability_impact: low
affected_interfaces:
  - all GET routes where the path does not match a route segment
scope_paths:
  - oaksome-web/src/app/not-found.tsx
generated_at: 2026-05-17
upstream_task: TASK-029
upstream_finding: reviews/TASK-029-smoke-report.md F-029-NEW-1
---

# FIX-NOTFOUND-001 — Root not-found.tsx missing AuthProvider → 500 on unmatched URLs

## Why this task exists

Discovered during the TASK-029 WebBridge smoke walk on 2026-05-17. Any path that does not match a route segment returns HTTP 500 instead of the branded 404 page.

Reproduction (against the local prod-built image, `oaksome-web:latest` rebuilt 2026-05-17 21:00 CEST):

| URL | Observed | Expected |
|---|---|---|
| `GET /fr/no-such-page` | 500 | 404 with FR copy |
| `GET /nl/no-such-page` | 500 | 404 with NL copy |
| `GET /nl/__unknown_slug__` | 500 | 404 with NL copy |

In a real browser, the page renders `Application error: a client-side exception has occurred while loading localhost (see the browser console for more information).` — screenshot evidence at `reviews/screenshots/F-029-NEW-1-notfound-500.png`.

Container log (`docker logs oaksome-web-oaksome-web-1`) shows:

```
⨯ Error: useAuth must be used within an AuthProvider
    at f (.next/server/chunks/9546.js:1:43749)
```

## Root cause

`src/app/not-found.tsx:5` imports `<Header />` and renders it wrapped in `<NextIntlClientProvider>` only. The locale layout (`src/app/[locale]/layout.tsx`) wraps its children in `<AuthProvider>`, but Next.js App Router renders the **root** `not-found.tsx` outside `[locale]/layout.tsx` — so Header (which calls `useAuth()` transitively) has no provider, throws during SSR, and the error boundary degrades to "Application error".

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Any GET request to a path that does not match a route segment in either locale. |
| Processing | App Router falls back to root `not-found.tsx`. |
| Output | A branded 404 page rendered with header/footer, status 404 (not 500). |
| Error path | None — this *is* the error path. |
| Success evidence | `curl -i http://localhost:3000/fr/no-such-page` returns `HTTP/1.1 404`; the same URL in a browser renders the branded 404 with `<h1>` from `notFound.h1` translation key; container log shows no `useAuth must be used within an AuthProvider` line. |

## Scope

**Included**
- Wrap the children of `<NextIntlClientProvider>` in `<AuthProvider>` (and any other client provider Header transitively depends on — check the locale layout tree as a reference).
- Add an SSR `notFound()` test or rendering test that exercises a missing path and asserts 404, not 500.

**Excluded**
- Redesign of the 404 page (copy, layout, cards) — out of scope.
- Locale-aware 404 logic beyond what already exists via `getLocale()` in the root not-found.

## Steps

1. Read `src/app/[locale]/layout.tsx` to enumerate the provider stack that wraps its children. Replicate the relevant providers around `<Header />…<Footer />` in `src/app/not-found.tsx`.
2. Verify locally: `docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache oaksome-web && up -d`, then `curl -I http://localhost:3000/fr/no-such-page` — expect `HTTP/1.1 404`.
3. Walk the page in Chrome: confirm Header/Footer render, search input shows the NL/FR translated placeholder, "Retour à l'accueil" / "Terug naar de home" link points to `/`.
4. Re-run the TASK-029 smoke row N-6 against this build; flip from FAIL (BLOCKER) → PASS in `reviews/TASK-029-smoke-report.md`.
5. Add a Playwright e2e or Jest SSR test that hits an unmatched path and asserts the 404 status + presence of the branded H1.

## Impact Checklist

- UI: 404 page now renders with full Header/Footer instead of an unstyled error message.
- API contracts: none.
- Database / Odoo: none.
- Auth/session: read-only (the AuthProvider wrap means useAuth no longer throws; behavior identical to any other unauthenticated page).
- i18n: none.
- SEO: 404 status instead of 500 — significant positive change for crawl signals.
- Tracking: none.
- Operations: prod cutover gated on this fix.

## Test Requirements

**Required behavior to verify**
- `GET /fr/no-such-page` returns 404 with branded H1 and Header.
- `GET /nl/no-such-page` returns 404 with branded H1 and Header.
- No `useAuth must be used within an AuthProvider` lines in the container log after smoke.

**Regressions to prevent**
- The matched 404 routes (`/fr` valid product 404 etc.) still render correctly.
- Header still hydrates correctly on matched pages (no double-mount of AuthProvider).

**Edge cases**
- Locale negotiation when no path matches: `Accept-Language: nl-BE` on `/no-such-page` should land on the NL-localized 404, not FR.

## Simplicity Budget

- Files changed: 1 (`src/app/not-found.tsx`).
- New modules: 0.
- New dependencies: 0.

## Assumptions

1. The fix is a provider wrap, not a routing rewrite. The current "Application error" output is the React error boundary swallowing the SSR throw — the underlying 404 routing logic is correct.
2. `AuthProvider` is safe to mount on the not-found page (it does not make a network call at mount time).

## Open Questions

None — root cause and fix shape are both clear from the SSR throw trace.

## Resolved Decisions

- This fix lands as a follow-up to TASK-029, not inline, because TASK-029 explicitly excludes `oaksome-web/src/**` edits.
- The TASK-029 deploy is gated on this fix going green (or on a documented decision to ship-with-known-500-on-not-found, which is not recommended given the SEO implications).

## Design Governance

- shared_design_concept: The root not-found.tsx is the global error boundary for unmatched URLs. It must mount the same provider stack as the locale layout because it renders the same Header/Footer components.
- module_map: src/app/not-found.tsx (target), src/app/[locale]/layout.tsx (reference for the provider stack), src/components/layout/header.tsx (consumer of useAuth — should not be touched here), reviews/TASK-029-smoke-report.md (re-flip row N-6 after fix lands).
- affected_interfaces: All unmatched GET routes in both locales.
- ownership_boundaries: Frontend owns the not-found.tsx edit. Auditor re-runs row N-6 in the TASK-029 smoke report after the fix.
- failure_modes: A regression where AuthProvider mounts twice (once here, once in the locale layout) and double-fetches the user session — mitigated by the fact that root not-found.tsx is rendered outside the locale layout, not nested inside it.
- test_strategy: SSR test plus a re-run of TASK-029 row N-6.
- risk_reasoning: Medium because a 500 on every typo'd URL is a material UX and SEO regression in prod, and the fix is single-file and well-scoped.
- ready_to_implement: yes.
