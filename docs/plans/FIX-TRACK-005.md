---
task_id: FIX-TRACK-005
title: "Create /api/tracking/capi route for server-side CAPI (Meta Pixel + GA4 Measurement Protocol)"
status: done
resolution: "2026-05-17 — Verified complete. src/app/api/tracking/capi/route.ts exists with __tests__ companion directory."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/api/tracking/capi/route.ts
  - oaksome-web/src/app/api/tracking/capi/__tests__/route.test.ts
  - oaksome-web/src/features/tracking/capi-hash.ts
  - oaksome-web/src/features/tracking/__tests__/capi-hash.test.ts
integration_blockers: [FIX-TRACK-002]
human_approval_stages:
  - capi_credentials_review
model_overrides:
  executor: standard
  reviewer: standard
  security: true
domain_terms: [CAPI, Meta-Pixel, server-side, GA4-Measurement-Protocol, event_id, PII-hashing]
dependency_freshness: not_required
observability_impact: high
affected_interfaces: []
---

# FIX-TRACK-005 — Create /api/tracking/capi route

## Objective

The `/api/tracking/capi` route does not exist. Without it, Meta CAPI and GA4 Measurement Protocol (server-side) never fire. Create the route that accepts `purchase`, `generate_lead`, and `begin_checkout` events, hashes PII (SHA-256), and forwards to Meta CAPI and GA4 MP with deduplication via `event_id`.

## Source Evidence

**QA-011 F-004 / QA-014 Should-Fix #11** — `reviews/QA-011-report.md`:
> "The `/api/tracking/capi` route does not exist. No file found at `src/app/api/tracking/`. `META_CAPI_ACCESS_TOKEN` and `META_CAPI_PIXEL_ID` env vars are defined in `.env.example` but there is no code consuming them. Severity: HIGH (P1 — required before paid campaign launch)."

## Scope

- New: `oaksome-web/src/app/api/tracking/capi/route.ts`
- `oaksome-web/.env.example` — verify `META_CAPI_ACCESS_TOKEN`, `META_CAPI_PIXEL_ID` present

## Steps

1. Create `src/app/api/tracking/capi/route.ts` as a POST handler.
2. Request body schema:
   ```ts
   { event_name: 'purchase' | 'generate_lead' | 'begin_checkout', event_id: string, value?: number, currency?: string, email?: string }
   ```
3. Validate input with Zod (or manual checks).
4. Hash PII: `sha256(email.trim().toLowerCase())` — NEVER send plaintext email to Meta.
5. Check consent: if no Axeptio consent signal in the request, return 200 (no-op).
6. Forward to Meta CAPI: `POST https://graph.facebook.com/v19.0/${META_CAPI_PIXEL_ID}/events` with `access_token=${META_CAPI_ACCESS_TOKEN}`.
7. Forward to GA4 MP (optional in Phase 1 — comment as TODO).
8. Return `{ success: true }`.
9. Add `META_CAPI_ACCESS_TOKEN` and `META_CAPI_PIXEL_ID` to `.env.example` if not already there.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | `POST /api/tracking/capi { event_name: 'purchase', event_id: 'uuid', value: 1500, email: 'user@example.com' }` |
| Processing | PII hashed; forwarded to Meta CAPI |
| Output | Meta CAPI returns 200; route returns `{ success: true }` |
| Error path | Meta CAPI fails → log error, return `{ success: false }` (non-blocking) |
| Success evidence | Meta Events Manager shows server-side purchase events |

## Impact Checklist

- [ ] Meta CAPI receives purchase/lead/checkout events server-side
- [ ] PII (email) never sent in plaintext — SHA-256 only
- [ ] `event_id` used for deduplication with client-side Pixel
- [ ] Consent checked before forwarding
- [ ] Route does not throw on Meta CAPI failure (non-blocking)

## Test Requirements

- Unit test: `hashEmail('User@Example.com')` === SHA-256 of `'user@example.com'`
- Manual: trigger a checkout → Meta Events Manager shows server-side event
- Manual: no email → route still works (email is optional)

## Simplicity Budget

~60 lines. No new npm packages (use native `crypto.subtle.digest` for SHA-256, `fetch` for Meta API).

## Assumptions

- `META_CAPI_ACCESS_TOKEN` and `META_CAPI_PIXEL_ID` will be provided by Rachid before this task runs.
- `crypto.subtle.digest('SHA-256', ...)` is available in Next.js Route Handlers (Edge or Node.js runtime).
- GA4 Measurement Protocol integration is deferred to Phase 2.

## Open Questions

1. What are the Meta CAPI `META_CAPI_ACCESS_TOKEN` and `META_CAPI_PIXEL_ID` values for production?
2. Should GA4 Measurement Protocol be included in Phase 1 or deferred?
3. Should the CAPI route accept the consent signal as a field in the request body, or check Axeptio state server-side?

## Resolved Decisions

- SHA-256 hash of PII — no plaintext email ever leaves the server.
- Non-blocking: CAPI failures do not impact user-facing purchase flow.
- Phase 1: Meta CAPI only. GA4 MP is a TODO comment.

## Design Governance

Requires CAPI credential review from Rachid (`capi_credentials_review`) before production deployment.

## Dependency Freshness

Not required (uses native fetch + crypto.subtle).

## Observability Impact

High — server-side events visible in Meta Events Manager and GA4 (if wired). Add structured logs for each CAPI call: `event_name`, `event_id`, Meta API response status.
