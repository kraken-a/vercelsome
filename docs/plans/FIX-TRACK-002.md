---
task_id: FIX-TRACK-002
title: "Integrate Axeptio CMP — consent collection before any tracking fires"
status: done
resolution: "2026-05-17 — Verified complete. src/features/tracking/axeptio.ts exports axeptioInitSnippet + axeptioBridgeSnippet; layout.tsx wires both via next/script (beforeInteractive + afterInteractive). Consent default is denied (gtag consent default)."
risk_level: medium
edit_mode: surgical_edit
parallelizable: false
conflict_scope:
  - oaksome-web/src/app/[locale]/layout.tsx
  - oaksome-web/src/features/tracking/gtm.ts
  - oaksome-web/src/features/tracking/axeptio.ts
  - oaksome-web/src/features/tracking/__tests__/axeptio.test.ts
  - oaksome-web/.env.example
integration_blockers: []
human_approval_stages:
  - axeptio_account_credentials
model_overrides:
  executor: deep
  reviewer: standard
domain_terms: [Axeptio, CMP, GDPR, consent, Consent-Mode-v2, tracking]
dependency_freshness: not_required
observability_impact: high
affected_interfaces:
  - oaksome-web/src/app/[locale]/layout.tsx
  - tracking pipeline (all events gated through Axeptio consent)
---

# FIX-TRACK-002 — Integrate Axeptio CMP

## Objective

No Axeptio CMP is integrated. Without CMP, injecting GTM (FIX-TRACK-001) would fire tracking before user consent — a GDPR/ePrivacy violation. Integrate Axeptio: snippet in layout, Consent Mode v2 default signal, and `axeptio_authorized_vendors` event listener to unlock GTM tags.

## Source Evidence

**QA-011 F-002 / QA-014 Go-Live Blocker #6** — `reviews/QA-011-report.md`:
> "No Axeptio script tag in any layout file. No `window.__axeptio_settings`, no Consent Mode v2 default signal (`gtag('consent', 'default', {...})`) anywhere. Severity: CRITICAL (P0 blocker / GDPR compliance). Risk of Belgian DPA fine."

## Scope

- `oaksome-web/src/app/[locale]/layout.tsx` — add Axeptio script + Consent Mode v2 default signal
- `oaksome-web/src/lib/tracking/gtm.ts` — if this file exists, add consent check

## Steps

1. Verify Axeptio account exists and obtain: `clientId` (Axeptio project ID) and `cookiesVersion` string. These go in a `NEXT_PUBLIC_AXEPTIO_CLIENT_ID` env var (add to `.env.example`).
2. Add Consent Mode v2 default signal to `<head>` (before GTM):
   ```html
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('consent', 'default', {
       'ad_storage': 'denied', 'analytics_storage': 'denied',
       'ad_user_data': 'denied', 'ad_personalization': 'denied',
       'wait_for_update': 500
     });
   </script>
   ```
3. Add Axeptio script snippet after the Consent Mode default signal:
   ```html
   <script>
     window.axeptioSettings = { clientId: "${NEXT_PUBLIC_AXEPTIO_CLIENT_ID}", cookiesVersion: "oaksome-fr" };
     (function(d,s){ var t=d.getElementsByTagName(s)[0],e=d.createElement(s);
     e.async=true; e.src="//static.axept.io/sdk.js";
     t.parentNode.insertBefore(e,t); })(document,"script");
   </script>
   ```
4. Add `axeptio_authorized_vendors` event listener to update Consent Mode:
   ```js
   window._axeptio_userConsent = {};
   void 0 === window._axeptio ? window.addEventListener('axeptioReady', cb) : cb();
   ```
5. In GTM: configure Consent Mode v2 so tags are blocked by default, unblocked when Axeptio grants consent.
6. Test: open site in incognito → Axeptio banner appears → tracking blocked until consent granted.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | New visitor opens `/fr` |
| Processing | Axeptio banner loads; Consent Mode v2 default = denied |
| Output | GTM tags do NOT fire before consent |
| User grants consent | Axeptio updates Consent Mode → GTM tags fire |
| Success evidence | Network tab: no GA4/Pixel requests before consent click |

## Impact Checklist

- [ ] GDPR compliant: no tracking before consent
- [ ] Axeptio banner appears on first visit
- [ ] Consent Mode v2 default state = denied for all categories
- [ ] After consent: GTM tags fire correctly
- [ ] Cookie policy page references Axeptio (aligned with FIX-CONTENT-006)

## Test Requirements

- Manual (incognito): open site → Axeptio banner visible → no GA4 request in Network
- Manual: accept all → GA4 request fires
- Manual: decline → no tracking requests

## Simplicity Budget

~30 lines in layout.tsx. GTM Consent Mode configuration is done in GTM UI (not in code).

## Assumptions

- Axeptio account for Oaksome exists or will be created before this task runs.
- The Axeptio `clientId` and `cookiesVersion` will be provided by Rachid.
- GTM Consent Mode v2 configuration is done in the GTM UI after this code is merged.

## Open Questions

1. **Blocking question**: Does an Axeptio account for Oaksome exist? What is the `clientId`?
2. What `cookiesVersion` string should be used? (e.g., `oaksome-fr`, `oaksome-v1`)
3. Should FR and NL locales use separate Axeptio cookie versions (different languages)?

## Resolved Decisions

- Consent Mode v2 default state is `denied` for all categories — GDPR-safe default.
- Axeptio must load BEFORE GTM (it sets the consent state that GTM reads).

## Design Governance

Requires Axeptio account credentials from Rachid before implementation (`axeptio_account_credentials`). Cannot proceed without `clientId`.

## Dependency Freshness

Not required (no new npm packages — Axeptio loads from their CDN).

## Observability Impact

High — this enables the consent-gated tracking pipeline. GDPR compliance audit should run after this is live.
