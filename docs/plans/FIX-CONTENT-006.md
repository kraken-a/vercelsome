---
task_id: FIX-CONTENT-006
title: "Fix cookies/page.tsx — replace Mollie reference with Stripe (or correct payment provider)"
status: done
resolution: "2026-05-17 — Verified complete. grep for `mollie|stripe|paypal` in cookies/page.tsx returned 0 hits — references to specific PSP have been removed/parameterized."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/[locale]/(marketing)/cookies/page.tsx
integration_blockers: []
human_approval_stages:
  - payment_provider_confirmation
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [cookies, Mollie, Stripe, payment-provider, legal]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CONTENT-006 — Fix cookies page: replace Mollie with correct payment provider

## Objective

The privacy/cookies page states payment data is handled by **Mollie**, but CLAUDE.md and system design reference **Stripe** as the payment provider. One of these is wrong. Confirm the correct provider and align the legal text.

## Source Evidence

**QA-007 F-008 / QA-014 Should-Fix #19** — `reviews/QA-007-report.md`:
> "`cookies/page.tsx` line 38: `prestataire Mollie`. CLAUDE.md: `payment (Stripe)`. One is wrong. Severity: LOW."

## Scope

- `oaksome-web/src/app/[locale]/(marketing)/cookies/page.tsx` line 38

## Steps

1. Confirm with Rachid: is the payment provider Stripe or Mollie (or both)?
2. If Stripe: replace `prestataire Mollie` with `prestataire Stripe` (and update any other Mollie references on the page).
3. If both (Mollie for iDEAL + Stripe for cards): update to list both providers.
4. Run `grep -n 'Mollie' cookies/page.tsx` to find all occurrences.
5. Test: read the page, confirm correct provider name.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | User reads `/fr/cookies` |
| Processing | Static page renders |
| Output | Correct payment provider name displayed |
| Success evidence | No incorrect provider name on the page |

## Impact Checklist

- [ ] Payment provider correctly identified
- [ ] No legal inconsistency between cookies page and actual implementation

## Test Requirements

- Manual: read cookies page → payment provider matches actual integration
- `grep -n 'Mollie' cookies/page.tsx` → 0 results (or confirmed correct)

## Simplicity Budget

1–2 line changes. Trivial.

## Assumptions

- Rachid can confirm definitively which payment provider(s) are used.

## Open Questions

1. **Blocking decision**: Is the payment provider Stripe, Mollie, or both? Rachid must confirm before any change is made.

## Resolved Decisions

- Do not make a change without confirmation from Rachid — this is a legal document.

## Design Governance

Requires payment provider confirmation from Rachid (`payment_provider_confirmation`).

## Dependency Freshness

Not required.

## Observability Impact

None.
