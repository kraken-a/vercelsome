---
task_id: FIX-TRACK-001
title: "Inject GTM snippet (head <script> + body <noscript>) in [locale]/layout.tsx"
status: done
resolution: "2026-05-17 — Verified complete. src/app/[locale]/layout.tsx:32,94,109-116 emits GTM head <script> + noscript iframe; gated on NEXT_PUBLIC_GTM_ID env var."
risk_level: low
edit_mode: surgical_edit
parallelizable: false
conflict_scope:
  - oaksome-web/src/app/[locale]/layout.tsx
integration_blockers: [FIX-TRACK-002]
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [GTM, GoogleTagManager, layout, tracking, script]
dependency_freshness: not_required
observability_impact: high
affected_interfaces: []
---

# FIX-TRACK-001 — Inject GTM snippet in layout.tsx

## Objective

The `[locale]/layout.tsx` has no GTM script tag. Zero GA4/Pixel/Pinterest events fire as a result. Add the GTM `<script>` (head) + `<noscript>` (body) snippet, conditioned on consent (FIX-TRACK-002), using `NEXT_PUBLIC_GTM_ID` from the environment.

## Source Evidence

**QA-011 F-001 / QA-014 Go-Live Blocker #5** — `reviews/QA-011-report.md`:
> "The `[locale]/layout.tsx` contains no GTM script tag. There is no `GoogleTagManager` component, no `Script strategy='afterInteractive'` with GTM URL, no `<noscript>` iframe. Severity: CRITICAL (P0 blocker) — GTM not injected means zero tags fire, zero GA4/Pixel/Pinterest events delivered."

## Scope

- `oaksome-web/src/app/[locale]/layout.tsx` — add GTM head/body snippets

Note: FIX-TRACK-001 and FIX-TRACK-002 both touch `layout.tsx` — they must serialize (FIX-TRACK-002 first, then this, OR combine into one PR).

## Steps

1. Verify `NEXT_PUBLIC_GTM_ID` is defined in `.env.example` (should already be present per CLAUDE.md).
2. In `[locale]/layout.tsx`, add to `<head>`:
   ```tsx
   {process.env.NEXT_PUBLIC_GTM_ID && (
     <Script id="gtm-head" strategy="afterInteractive"
       dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){...})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');` }}
     />
   )}
   ```
3. Add `<noscript>` iframe after `<body>` opening tag (inside layout body).
4. The script must be gated: only inject if `NEXT_PUBLIC_GTM_ID` is non-empty.
5. FIX-TRACK-002 will handle consent mode — for now inject unconditionally but Consent Mode v2 default state will suppress tracking until consent.
6. Test: open browser, check Network tab → `gtm.js` request present.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | User visits `/fr` page |
| Processing | Layout renders GTM `<script>` in head |
| Output | GTM loads; `window.dataLayer` initialized |
| Error path | `NEXT_PUBLIC_GTM_ID` empty → script not injected (no error) |
| Success evidence | Network tab shows `gtm.js?id=GTM-XXXXX` loaded |

## Impact Checklist

- [ ] GTM loads on all locale pages
- [ ] `window.dataLayer` is initialized
- [ ] No CSP violations (FIX-SEC-001 must allow `www.googletagmanager.com` in `script-src`)
- [ ] Build passes

## Test Requirements

- Manual: check Network tab on `/fr` → `gtm.js` present
- Manual: `window.dataLayer` exists in console
- Build: no TypeScript errors

## Simplicity Budget

~10 lines added to layout.tsx. One `<Script>` component from `next/script`.

## Assumptions

- `NEXT_PUBLIC_GTM_ID` is set in the environment (empty in local dev is fine — script is gated).
- `next/script` is already available (it's part of Next.js).
- FIX-TRACK-002 (Axeptio) must be implemented together or immediately after this task, to avoid GDPR violation of injecting GTM without consent.

## Open Questions

1. What is the actual GTM container ID for Oaksome? (Rachid must provide `NEXT_PUBLIC_GTM_ID` value for production `.env`.)

## Resolved Decisions

- Use `strategy="afterInteractive"` (not `beforeInteractive`) — GTM does not need to block rendering.
- Gate on `NEXT_PUBLIC_GTM_ID` being non-empty — safe to deploy even before GTM account is set up.
- Serialize with FIX-TRACK-002 (same file).

## Design Governance

No design review needed.

## Dependency Freshness

Not required.

## Observability Impact

High — this enables tracking. Once live, all tracking events start flowing.
