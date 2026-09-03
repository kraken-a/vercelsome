---
task_id: FIX-SEC-006
title: "Unconditionally enforce httpOnly: true, secure: true when re-emitting Odoo cookies in proxy"
status: done
resolution: "2026-05-17 — Verified complete. /api/oaksome/[...path]/route.ts:85-108 forwards Set-Cookie headers with forced httpOnly: true and sameSite: 'lax'; secure attribute parsed from upstream Odoo response."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/api/oaksome/[...path]/route.ts
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: standard
  security: true
domain_terms: [session-cookie, httpOnly, secure, proxy, Set-Cookie]
dependency_freshness: not_required
observability_impact: none
affected_interfaces:
  - oaksome-web/src/app/api/oaksome/[...path]/route.ts (cookie re-emission logic)
---

# FIX-SEC-006 — Enforce httpOnly and Secure cookie flags in proxy

## Objective

The proxy at `src/app/api/oaksome/[...path]/route.ts` re-emits Odoo's `Set-Cookie` header but does not override the flags — if Odoo omits `httpOnly` or `Secure`, the forwarded cookie lacks these protections. Enforce `httpOnly: true` and `secure: true` unconditionally in production, and iterate over all `Set-Cookie` headers (currently only the first is forwarded).

## Source Evidence

**QA-004 F3 / QA-012 S6 / QA-014 Should-Fix #6** — `reviews/QA-004-report.md`:
> "Location: `oaksome-web/src/app/api/oaksome/[...path]/route.ts` (lines `setCookieHeader` block). If Odoo does not set `httpOnly` or `Secure`, the proxy does not add them. The proxy only handles a single `Set-Cookie` header — if Odoo returns multiple, only the first is forwarded."

## Scope

- `oaksome-web/src/app/api/oaksome/[...path]/route.ts` — lines in the `setCookieHeader` block

## Steps

1. Read `[...path]/route.ts` to find the `Set-Cookie` parsing block.
2. Change `odooRes.headers.get('set-cookie')` to iterate all Set-Cookie headers using `odooRes.headers.getAll?.('set-cookie') ?? [odooRes.headers.get('set-cookie')].filter(Boolean)`.
3. For each cookie string, parse the flags and unconditionally add `; HttpOnly; Secure; SameSite=Lax` (or override if already present).
4. In development (`NODE_ENV !== 'production'`), omit `Secure` to allow HTTP localhost.
5. Set each processed cookie on the Next.js response using `response.headers.append('Set-Cookie', processedCookieString)`.
6. Test: login → inspect cookie flags in browser devtools → confirm `HttpOnly` and `Secure` are set.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Odoo login response sets `session_id=abc; Path=/` (no HttpOnly) |
| Processing | Proxy intercepts and adds `; HttpOnly; Secure; SameSite=Lax` |
| Output | Browser receives `session_id=abc; Path=/; HttpOnly; Secure; SameSite=Lax` |
| Error path | Multiple Set-Cookie headers from Odoo — all are forwarded correctly |
| Success evidence | `document.cookie` in browser console does not show `session_id` (httpOnly working) |

## Impact Checklist

- [ ] Session cookie always has `HttpOnly` and `Secure` in production
- [ ] Multiple `Set-Cookie` headers from Odoo all forwarded
- [ ] `Secure` omitted in local dev (HTTP)
- [ ] No session loss for existing users

## Test Requirements

- Manual: login → browser devtools → Cookie flags show `HttpOnly` ✓, `Secure` ✓
- Manual: `document.cookie` in console does not expose session_id (httpOnly working)
- Test: Odoo response with 2 Set-Cookie headers → both appear in Next.js response

## Simplicity Budget

~15 lines changed. No new files or dependencies.

## Assumptions

- `odooRes.headers.getAll('set-cookie')` is available in the Node.js fetch API (v18+) — or use a compatibility shim.
- `SameSite=Lax` is appropriate (same-site context for configurator iframe; `Strict` would break the iframe flow).
- In development, `Secure` is omitted to allow `http://localhost:3000`.

## Open Questions

1. Does Node.js `fetch` (as used in Next.js Route Handlers) support `headers.getAll()`? If not, is there a fallback?

## Resolved Decisions

- Unconditional `HttpOnly` + `Secure` in production — not conditional on what Odoo sends.
- `SameSite=Lax` (not `Strict`) to avoid breaking the configurator iframe cross-site context.

## Design Governance

No design review needed.

## Dependency Freshness

Not required.

## Observability Impact

None.
