---
task_id: FIX-002
title: Home page error logging + resilience for Odoo /v1/home 500
status: done
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [(marketing)/page.tsx]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: logging_changed
---

# FIX-002 — Home Page Resilience & Error Logging for Odoo /v1/home 500

## Objective

`GET /api/oaksome/v1/home` returns HTTP 500 from the Odoo backend. The home page already handles this silently (`bestsellers = homeResult.success ? homeResult.data.bestsellers : []`) but:

1. The 500 is swallowed without any logging — makes production debugging impossible.
2. The promo bar (`PromoBar`) uses ISR cache (`noStore()` is already on `PromoBar` but `getHomeData` has `revalidate: 3600`), so a stale "testing" notice can persist for up to 1 hour.

**What this task fixes (Next.js scope only):**
- Add `console.error` server-side when `getHomeData()` fails, so the error appears in Vercel/Docker logs.
- Confirm `PromoBar` returns `null` on fresh requests when Odoo returns 500 (already correct — verify and document).

**Odoo backend root cause (out of Next.js scope):**
The Odoo `oaksome.website` module's `/api/oaksome/v1/home` controller is raising an unhandled exception. This must be fixed in the Odoo addon repository. See `## Odoo Investigation` below for what to look for.

## Scope

**Included:**
- `oaksome-web/src/app/[locale]/(marketing)/page.tsx` — add `console.error` after homeResult failure check
- No other files

**Excluded:**
- Do NOT change `getHomeData()` signature or return type
- Do NOT add retry logic, fallback data, or new API calls
- Do NOT modify `promo-bar.tsx` or `promo-bar-client.tsx`
- Odoo backend fix is a separate task in the Odoo addon repo

## Steps

- [ ] In `(marketing)/page.tsx`, after line `const bestsellers = homeResult.success ? homeResult.data.bestsellers : []`, add:
  ```ts
  if (!homeResult.success) {
    console.error('[home] Odoo /v1/home failed:', homeResult.error, '— bestsellers and promo bar will be empty')
  }
  ```
- [ ] Verify `PromoBar` returns `null` when `topNotice` is `null` (already the case — just confirm by inspection).
- [ ] Run `npm run type-check` and `npm run lint`.

## Odoo Investigation (companion task — separate repo)

Root cause must be investigated in the Odoo `oaksome_website` module:

1. Check `controllers/main.py` (or equivalent) for the `/api/oaksome/v1/home` route.
2. Run `tail -100 /var/log/odoo/odoo.log` on the Odoo server after hitting the endpoint to capture the traceback.
3. Common culprits: missing field on `product.template`, undefined Many2many on `oaksome.homepage.*` records, uninitialized model.
4. Fix in Odoo, restart the service, verify `curl http://localhost:8069/api/oaksome/v1/home` returns 200.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Next.js server renders `/fr` page |
| Processing | `getHomeData()` calls Odoo `/v1/home` → returns `{ success: false }` (while Odoo is broken) |
| Output | Page renders without error; bestsellers section empty; promo bar hidden |
| Error path | `console.error` emitted in server log with message and `homeResult.error` |
| Success evidence | Log line `[home] Odoo /v1/home failed: ...` visible in Vercel/Docker stdout |

## Impact Checklist

- UI: none (behaviour unchanged — page already renders empty bestsellers)
- API contract: none
- Database: none
- Auth/session: none
- i18n: none
- Logging: adds one `console.error` on server side (no sensitive data)

## Test Requirements

**Behaviour to verify:**
- When `getHomeData()` returns `{ success: false }`, a `console.error` is emitted
- Page still renders (no throw/crash)
- Promo bar hidden when `topNotice` is null

**Regressions to prevent:**
- When Odoo is healthy and returns 200, no error is logged
- Bestsellers render normally when Odoo is healthy

**Edge cases:**
- Odoo returns partial data (`success: true` but `bestsellers: undefined`) — not affected by this change

## Simplicity Budget

- Files changed: 1 (`(marketing)/page.tsx`)
- New modules: no
- New dependencies: no
- Lines added: 3

## Assumptions

1. `console.error` in Next.js server components appears in Vercel Function logs and Docker stdout — sufficient for production debugging.
2. The ISR cache means a fresh 500 will serve stale data for up to 3600s. This is acceptable for now — reducing `revalidate` is a separate decision.
3. The Odoo 500 is a transient backend bug, not a missing endpoint — the route exists but throws at runtime.

## Open Questions

None requiring human decision at plan time.

## Resolved Decisions

- Use `console.error` not `logger.error` — no custom logger exists in this codebase.
- Do not add retry logic — overengineering for a 3-line fix; the Odoo fix is the real solution.
- Do not add a user-visible fallback message for missing bestsellers — the empty state already renders gracefully.

## Design Governance

Not required (low risk, no affected interfaces).

## Observability Impact

**Change:** Adds one server-side `console.error` call in `(marketing)/page.tsx`.
- Reuses `console` (no new logger introduced) ✓
- No sensitive data logged (only `homeResult.error` string) ✓
- Called in async RSC render path (non-blocking) ✓
- If logging fails: no impact (console.error never throws) ✓

## Dependency Freshness

not_required
