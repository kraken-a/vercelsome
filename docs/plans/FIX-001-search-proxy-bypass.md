---
task_id: FIX-001
title: Fix search direct Odoo call bypassing Next.js proxy
status: done
resolution: "2026-05-17 — Verified complete. src/components/layout/header-client.tsx:67 uses relative URL `/api/oaksome/v1/search?q=${encodeURIComponent(query)}`, no `${ODOO_URL}` prefix. Search now goes through the Next.js proxy."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [header-client.tsx]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# FIX-001 — Fix Search Bypassing Next.js Proxy

## Objective

`header-client.tsx:63` calls the Odoo search API directly from the browser using an absolute URL (`${ODOO_URL}/api/oaksome/v1/search?q=...`). In production, `ODOO_URL = https://cdn.oaksome.com`, making this a cross-origin request from `oaksome.com` which will fail (CORS block or silent error).

Fix: change to a relative URL (`/api/oaksome/v1/search?q=...`) so the request routes through the Next.js proxy already set up at `src/app/api/oaksome/[...path]/route.ts`.

## Scope

**Included:**
- `oaksome-web/src/components/layout/header-client.tsx` — line 63 only

**Excluded:**
- Do NOT refactor `ODOO_URL` declaration or other usages in the file
- Do NOT change any other API call patterns in the file
- Do NOT modify the proxy route or any other file

## Steps

- [ ] Change line 63: `fetch(\`${ODOO_URL}/api/oaksome/v1/search?q=${encodeURIComponent(query)}\`)` → `fetch(\`/api/oaksome/v1/search?q=${encodeURIComponent(query)}\`)`
- [ ] Verify `npm run type-check` passes
- [ ] Verify `npm run lint` passes

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | User types 3+ chars in the search box |
| Processing | Browser fetches `/api/oaksome/v1/search?q=...` → Next.js proxy → Odoo |
| Output | Search results appear in overlay |
| Error path | On Odoo error, `catch` block silently clears results (existing behaviour preserved) |
| Success evidence | Network tab shows request to `localhost:3000/api/oaksome/v1/search`, not `localhost:8069/...` |

## Impact Checklist

- UI: none (behaviour unchanged, only routing fixed)
- API contract: none (same endpoint, same response shape)
- Database: none
- Auth/session: none (proxy forwards cookies as-is)
- i18n: none
- Other components: none

## Test Requirements

**Behaviour to verify:**
- Search input with ≥3 chars triggers request to `/api/oaksome/v1/search` (relative URL)
- Search results render when Odoo returns results
- Search box renders nothing on empty results (existing behaviour)

**Regressions to prevent:**
- Search must not call `localhost:8069` or `cdn.oaksome.com` directly from browser
- Query must remain URL-encoded

**Edge cases:**
- Query with special chars (e.g., `café`, `bibliothèque`) — `encodeURIComponent` already applied, no change needed

## Simplicity Budget

- Files changed: 1 (`header-client.tsx`)
- New modules: no
- New dependencies: no
- Abstraction changes: none — 1 string substitution

## Assumptions

1. The Next.js proxy at `route.ts` already handles `GET /api/oaksome/v1/search?q=...` correctly (confirmed: it proxies all paths under `/api/oaksome/*`).
2. `encodeURIComponent` is kept as-is (no change to query encoding).
3. The `catch` block already handles network errors silently.

## Open Questions

None — change is unambiguous.

## Resolved Decisions

- Use relative URL `/api/oaksome/v1/search` (not `location.origin + ...`) to match the pattern used by `client.ts` for browser-side calls.
- Do not remove `ODOO_URL` constant from the file — it may be used for other purposes elsewhere in the component.

## Design Governance

Not required (low risk, no affected interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
