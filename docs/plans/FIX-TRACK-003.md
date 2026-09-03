---
task_id: FIX-TRACK-003
title: "Add consent guard to pushEvent() — block pre-consent dataLayer pushes"
status: done
resolution: "2026-05-17 — Verified complete. Axeptio bridge listens for cookies:complete event and flips window.__oaksomeConsent { analytics, ads }; features/tracking/gtm.ts consults this flag before pushing to dataLayer."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/lib/tracking/gtm.ts
integration_blockers: [FIX-TRACK-002]
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [pushEvent, consent-guard, dataLayer, Axeptio, tracking]
dependency_freshness: not_required
observability_impact: medium
affected_interfaces: []
---

# FIX-TRACK-003 — Add consent guard to pushEvent()

## Objective

`pushEvent()` (the shared tracking helper) pushes to `window.dataLayer` immediately with no consent check. Once GTM is injected (FIX-TRACK-001), any tag configured to fire on these events would fire before consent — a GDPR violation. Add a consent state check before each push.

## Source Evidence

**QA-011 F-003 / QA-014 Should-Fix #9** — `reviews/QA-011-report.md`:
> "`pushEvent()` has no consent guard. Every call to any `track*` function pushes to `window.dataLayer` immediately, regardless of Axeptio state. Once GTM is injected, tags will fire before consent — a GDPR violation. The spec requires Consent Mode v2 in GTM to gate tags, but the `pushEvent` function itself never checks consent."

## Scope

- `oaksome-web/src/lib/tracking/gtm.ts` (or wherever `pushEvent` is defined)

## Steps

1. Locate `pushEvent()` in the tracking lib.
2. Add a consent check:
   ```ts
   export function pushEvent(event: TrackingEvent): void {
     // Only push if Axeptio has granted analytics consent
     if (typeof window !== 'undefined' && !window._axeptio_userConsent?.analytics) {
       // Queue event for after consent, or silently skip
       return;
     }
     window.dataLayer = window.dataLayer || [];
     window.dataLayer.push(event);
   }
   ```
3. Alternative: rely purely on GTM Consent Mode v2 (tags suppressed by GTM) rather than blocking the dataLayer push. Decide with Rachid.
4. If queuing approach: store events in a `pendingEvents` array, flush when Axeptio `axeptio_authorized_vendors` fires.
5. Ensure `view_collection` inline dataLayer push (in collection page) also gets this guard.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | User visits page before granting consent |
| Processing | `trackPageView()` calls `pushEvent()` → consent check fails |
| Output | No dataLayer push (or push is queued) |
| After consent | Queued events flushed to dataLayer |
| Success evidence | No GA4/Pixel network requests before consent |

## Impact Checklist

- [ ] No dataLayer push before Axeptio consent
- [ ] Events not lost (queued or deferred)
- [ ] No regression for authenticated users who have already consented

## Test Requirements

- Manual (incognito): navigate pages → check console `window.dataLayer` → no tracking events before consent
- Manual: grant consent → queued events appear in dataLayer
- Unit test: `pushEvent()` with `_axeptio_userConsent.analytics = false` → no push

## Simplicity Budget

~10 lines. Guard added to one function.

## Assumptions

- `window._axeptio_userConsent` is set by Axeptio after FIX-TRACK-002 is implemented.
- The choice between "block at pushEvent" vs "rely on GTM Consent Mode" needs Rachid's decision.

## Open Questions

1. Should we block the dataLayer push entirely (simpler, but events are lost), or queue and flush after consent (correct but more complex)?
2. Is GTM Consent Mode v2 configuration sufficient to suppress delivery, making client-side blocking redundant?

## Resolved Decisions

- This is a defense-in-depth measure even if GTM Consent Mode v2 handles delivery-side suppression.
- `view_collection` inline script must also be updated.

## Design Governance

No design review needed.

## Dependency Freshness

Not required.

## Observability Impact

Medium — tracking events will change from firing immediately to being gated on consent.
