---
contract_version: v2
artifact_type: task
task_id: FIX-SEO-METADATA-001
title: No canonical or hreflang tags emitted on any page — TASK-014 partial; finish the helper wiring
status: open
risk_level: low
edit_mode: surgical_edit
parallelizable: true
parallel_group: "wave-prod-cutover-fixups"
conflict_scope:
  - oaksome-web/src/app/[locale]/layout.tsx
  - oaksome-web/src/lib/page-metadata.ts
  - oaksome-web/src/i18n/routing.ts
integration_blockers: []
human_approval_stages: []
risk_triggers:
  - launching to public DNS without canonical + hreflang means Google indexes both /fr and /nl as competing canonicals and treats locale variants as duplicate content, which suppresses both
  - missing hreflang means non-French Belgian visitors get the French page in search results and bounce, hurting Quality Score for Google Ads
merge_strategy: sequential_only
domain_terms:
  - Canonical
  - Hreflang
  - Locale
  - Routing
model_overrides:
  executor: standard
  reviewer: standard
  security: standard
  approval: standard
dependency_freshness: not_required
observability_impact: none
affected_interfaces:
  - every page's <head>
scope_paths:
  - oaksome-web/src/app/[locale]/layout.tsx
  - oaksome-web/src/lib/page-metadata.ts
  - oaksome-web/src/i18n/routing.ts
generated_at: 2026-05-17
upstream_task: TASK-029
upstream_finding: reviews/TASK-029-smoke-report.md F-029-5 (canonical/hreflang half)

---

# FIX-SEO-METADATA-001 — Finish wiring canonical + hreflang on every page

## Why this task exists

TASK-014 introduced `src/lib/page-metadata.ts` and per-page `generateMetadata()` overrides. The TASK-029 WebBridge re-walk confirms `<title>` is now locale-aware (S-2, S-3 flipped to PASS), but two other deliverables of TASK-014 did not land:

- No `<link rel="canonical">` is emitted on `/fr`, `/nl`, `/fr/acheter`, `/nl/winkelmand`, or any other tested route.
- No `<link rel="alternate" hreflang="...">` pair is emitted on any tested route.

This task finishes the TASK-014 wiring by making the root layout emit `alternates.canonical` and `alternates.languages` via the Next.js Metadata API, sourced from the existing `routing.ts` pathname map. Smoke rows `SEO-1`, `SEO-2`, `N-7` flip from FAIL to PASS as a result.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | `GET /fr/produit/1263202` or any route. |
| Processing | Root `[locale]/layout.tsx` calls `generateMetadata({ params })` which returns an `alternates` block. Next.js emits the `<link>` tags in `<head>`. |
| Output | Page `<head>` contains exactly one `<link rel="canonical" href="https://oaksome.com/fr/produit/1263202">` and two `<link rel="alternate" hreflang="fr-BE" href=".../fr/produit/1263202">`, `<link rel="alternate" hreflang="nl-BE" href=".../nl/produit/1263202">` plus `hreflang="x-default"` → FR. |
| Error path | If the page has no NL counterpart (e.g. legal pages that exist only in FR), emit only the FR `hreflang` plus `x-default`, never a broken NL link. |
| Success evidence | `curl https://oaksome.com/fr \| xmllint --html --xpath '//link[@rel="canonical"]/@href' -` returns `https://oaksome.com/fr`. Same probe on `/nl` returns `https://oaksome.com/nl`. The hreflang pair is symmetric (FR's NL alternate points back at FR via NL's FR alternate). |

## Scope

**Included**
- Resolve the canonical base URL from `NEXT_PUBLIC_SITE_URL` (already in env — `.env.production.example` has it).
- For each page, compute the canonical pathname from the current `pathname` + `locale`. Use the existing `routing.ts` `pathnames` map to look up the localized counterpart.
- Emit `alternates: { canonical, languages: { 'fr-BE': ..., 'nl-BE': ..., 'x-default': ... } }` in the root `[locale]/layout.tsx`'s `generateMetadata`.
- When a sub-route has no localized counterpart, emit FR + x-default only — never a 404-target alternate.
- Add a Playwright test that asserts canonical + hreflang on `/fr`, `/nl`, `/fr/produit/<id>`, `/nl/produit/<id>`, `/fr/inspirations`, `/nl/inspiraties`.
- Re-run TASK-029 smoke rows `SEO-1`, `SEO-2`, `N-7`; flip to PASS.

**Excluded**
- No new helper module — extend `src/lib/page-metadata.ts` rather than add a sibling.
- No change to per-page `generateMetadata()` overrides (they should already merge cleanly with the root-emitted `alternates`).
- No sitemap.xml emission — that is a separate follow-up if needed.

## Steps

1. Read `src/lib/page-metadata.ts` to understand the existing helper contract.
2. Add a `resolveLocaleAlternates(pathname, locale, routing)` helper that returns `{ canonical: string, languages: Record<string, string> }`. Inputs: the active locale's pathname (e.g. `/fr/produit/42`), the active locale (`fr`), and the routing config. Output: the canonical (current URL with `NEXT_PUBLIC_SITE_URL`) plus the localized alternates derived from the pathnames map.
3. Wire `generateMetadata` in `src/app/[locale]/layout.tsx` to spread `resolveLocaleAlternates(...)` into the returned `alternates` field.
4. Verify the per-page `generateMetadata` overrides (TASK-014 work) still take precedence on title/description but inherit the alternates from the root.
5. Build and walk three routes manually (browser source view) before writing the test: `/fr`, `/nl/winkelmand`, `/fr/produit/<id>`. Confirm a single canonical and two hreflang pairs each.
6. Add a Playwright assertion module that hits the routes listed under Verifiable Flow Goals and parses `<head>`.
7. Flip the SEO smoke rows; record evidence.

## Impact Checklist

- UI: no visible change. Only `<head>` adds 3-4 `<link>` tags per page.
- API contracts: none.
- Database / Odoo: none.
- Auth/session: none.
- i18n: read-only — consumes `routing.ts`.
- SEO: material — first time the site emits canonical + hreflang. Expected positive impact on Belgian Google indexing within 2-4 crawl cycles.
- Tracking: none.
- Operations: prod `NEXT_PUBLIC_SITE_URL` must be set correctly (it is — `https://oaksome.com`).

## Test Requirements

**Required behavior to verify**
- Every route in both locales emits exactly one `<link rel="canonical">`.
- Every route with a localized counterpart emits `hreflang="fr-BE"`, `hreflang="nl-BE"`, and `hreflang="x-default"` (pointing at FR).
- Canonical and hreflang URLs use `https://oaksome.com` (not `localhost` or the Tecnibo test host).
- Pages without an NL counterpart (legal pages, if any) emit FR + x-default only, no broken NL link.

**Regressions to prevent**
- Per-page `generateMetadata` overrides (TASK-014) still set the right title and description.
- The Axeptio bridge, GTM, and CSP allowlist are not affected by new `<link>` tags.

**Edge cases**
- Trailing-slash variants: canonical must always be the no-trailing-slash form for parity with how Next.js renders the URL.
- Path with query string: canonical strips query (e.g. `/fr/acheter?gamme=dressing` → canonical `https://oaksome.com/fr/acheter`).
- Nested dynamic segments (`/fr/etude-de-cas/<slug>`): the slug must survive the lookup; locale-counterpart computation must use the same slug.

## Simplicity Budget

- Files changed: 2 (`page-metadata.ts`, `[locale]/layout.tsx`). Optionally 1 new test module.
- New modules: 0.
- New dependencies: 0.

## Assumptions

1. `routing.ts` declares the pathname map for every translatable route. If a new route is added later without registering a pathname, the helper falls back to "no localized alternate" rather than erroring.
2. The canonical hostname is always `https://oaksome.com` for prod; the test Tecnibo host renders with its own canonical only when `NEXT_PUBLIC_SITE_URL` is set to the test value (operator already handles this in the staging env file).

## Open Questions

None — the approach is bounded by the existing TASK-014 helper and the existing `routing.ts` map. No decision-required forks remain.

## Resolved Decisions

- This is a follow-up to TASK-014, not a reopen. TASK-014 closed with title + meta description wired; the alternates wiring was missed during the closure and is now its own surgical task.
- `human_approval_stages: []` — low-risk, single-file fix with a unit-testable contract and a clear smoke verification path.
- Canonical hostname comes from `NEXT_PUBLIC_SITE_URL` exclusively. No fallback to `headers().get('host')`; the env var is the single source of truth.

## Dependency Freshness

not_required — no package or framework change.

## Observability Impact

none — pure HTML head additions, no logging.
