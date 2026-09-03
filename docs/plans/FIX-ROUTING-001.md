---
task_id: FIX-ROUTING-001
title: "Fix Drift A — align routing.ts espace/[slug] key to filesystem espaces/[slug] (also fixes NL /ruimtes/[slug] 404)"
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: false
conflict_scope:
  - oaksome-web/src/i18n/routing.ts
  - oaksome-web/src/app/[locale]/(shop)/espaces/[slug]/page.tsx
  - oaksome-web/src/app/[locale]/(shop)/espaces/
integration_blockers: []
human_approval_stages:
  - routing_decision
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [routing.ts, espace, espaces, drift, slug, NL-locale]
dependency_freshness: not_required
observability_impact: low
affected_interfaces:
  - /fr/espace/[slug] URL (currently 404)
  - /nl/ruimte/[slug] URL (currently 404)
---

# FIX-ROUTING-001 — Fix Drift A: espace vs espaces slug mismatch

## Objective

The filesystem route is `(shop)/espaces/[slug]/page.tsx` (plural) but `i18n/routing.ts` declares `/espace/[slug]` (singular with `nl: '/ruimte/[slug]'`). Result: `GET /fr/espace/chambre` → 404. Align the routing key with the filesystem (or vice versa) per `frontend-spec.md` recommendation (singular `/espace/[slug]`).

## Source Evidence

**QA-001 Drift A / QA-008 F-001 / QA-014 Go-Live Blocker** — `reviews/QA-001-report.md`:
> "File is `/espaces/[slug]` (plural) but `i18n/routing.ts` declares `/espace/[slug]` (singular). Test `GET /fr/espace/chambre` → 404. `frontend-spec.md` uses singular `/espace/[slug]`; recommendation: align files to singular."

## Scope

**Option A (recommended)**: Rename filesystem folder to singular
- Rename `oaksome-web/src/app/[locale]/(shop)/espaces/` → `espace/`
- No change to `routing.ts` (it already uses singular)

**Option B**: Update `routing.ts` to plural
- `oaksome-web/src/i18n/routing.ts` — change `/espace/[slug]` to `/espaces/[slug]`
- Update NL path: `/ruimte/[slug]` → `/ruimtes/[slug]`

Choose based on `frontend-spec.md` canonical URL. Rachid to confirm.

## Steps (Option A — rename filesystem):

1. `git mv oaksome-web/src/app/[locale]/(shop)/espaces oaksome-web/src/app/[locale]/(shop)/espace`
2. Verify all imports referencing `espaces/` path are updated (check `grep -r 'espaces' src/`).
3. Verify `routing.ts` already has `'/espace/[slug]'` for FR and `'/ruimte/[slug]'` for NL — no change needed.
4. Test: `GET /fr/espace/chambre` → 200.
5. Test: `GET /nl/ruimte/bureau` → 200.
6. Test: `GET /fr/espaces/chambre` → 404 (old plural URL no longer valid — add a redirect if needed for SEO).

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | `GET /fr/espace/chambre` |
| Processing | Next.js matches `/(shop)/espace/[slug]/page.tsx` |
| Output | Espace page renders for `chambre` |
| Error path | Invalid slug → Next.js notFound() |
| Success evidence | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/fr/espace/chambre` → 200 |

## Impact Checklist

- [ ] `/fr/espace/[slug]` returns 200 (not 404)
- [ ] `/nl/ruimte/[slug]` returns 200 (not 404)
- [ ] Navigation links in header/footer updated to use singular URL
- [ ] Old `/fr/espaces/[slug]` URLs redirected (optional: add rewrite in next.config.mjs)

## Test Requirements

- `curl /fr/espace/chambre` → 200
- `curl /nl/ruimte/salon` → 200
- `curl /fr/espaces/chambre` → 404 or 301 redirect

## Simplicity Budget

1 `git mv` command + verify imports. ~5 min.

## Assumptions

- `frontend-spec.md` uses singular `/espace/[slug]` — this is the canonical URL (Option A).
- No other files import from `espaces/` directory directly.
- NL slug is `/ruimte/[slug]` (already in routing.ts — no change needed).

## Open Questions

1. **Decision required**: Rename filesystem (Option A) or update routing.ts (Option B)? Rachid to confirm which URL is canonical per business requirement.
2. Should old `/espaces/[slug]` URLs (plural) be redirected with a 301 for SEO continuity?

## Resolved Decisions

- This is the same fix that resolves both the FR singular 404 AND the NL `/ruimtes/[slug]` 404 (QA-008 F-001).

## Design Governance

Requires routing decision from Rachid (`routing_decision`) — URL structure affects SEO and any existing links.

## Dependency Freshness

Not required.

## Observability Impact

Low — route 404 errors for `/espace/*` and `/nl/ruimte/*` will disappear from access logs.
