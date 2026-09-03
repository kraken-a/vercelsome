---
task_id: FIX-CONTENT-005
title: "Fix mentions-légales — correct registered address and hosting provider"
status: done
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/[locale]/(marketing)/mentions-legales/page.tsx
integration_blockers: []
human_approval_stages:
  - legal_content_review
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [mentions-legales, legal, address, hosting, placeholder]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CONTENT-005 — Fix mentions-légales placeholders

## Objective

The `mentions-légales` page contains two inaccuracies: (1) the registered office address is `[À CONFIRMER]` (placeholder), and (2) the hosting provider is listed as "Vercel Inc." when production runs on self-hosted Docker servers (Tecnibo, Belgium).

## Source Evidence

**QA-007 F-007 / QA-014 Should-Fix #18** — `reviews/QA-007-report.md`:
> "1. Siège social `[À CONFIRMER]` (line 31): registered office not filled in — legal requirement. 2. Hébergeur listed as 'Vercel Inc.' (line 42): production runs on self-hosted Docker (Tecnibo, Belgium), not Vercel. Evidence: `grep 'CONFIRMER\|Vercel' mentions-legales/page.tsx`."

## Scope

- `oaksome-web/src/app/[locale]/(marketing)/mentions-legales/page.tsx` lines 31, 42

## Steps

1. Obtain from Rachid: the real registered office address of Oaksome (legal entity).
2. Replace `[À CONFIRMER]` on line 31 with the actual address.
3. Replace "Vercel Inc." on line 42 with the correct hosting provider details (e.g., "Tecnibo SRL, serveurs dédiés, Belgique" or equivalent).
4. Run `grep -n 'CONFIRMER\|Vercel' mentions-legales/page.tsx` — should return 0 results.
5. Test: read the page, verify no placeholders remain.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | User reads `/fr/mentions-legales` |
| Processing | Static page renders |
| Output | Correct registered address + hosting provider |
| Success evidence | No `[À CONFIRMER]` or "Vercel" on the page |

## Impact Checklist

- [ ] Registered office address is real and legally accurate
- [ ] Hosting provider is correct (Tecnibo/self-hosted, not Vercel)
- [ ] No placeholder text remains

## Test Requirements

- `grep -n 'CONFIRMER\|Vercel' mentions-legales/page.tsx` → 0 results
- Manual: read page → correct information

## Simplicity Budget

2 line changes. Trivial.

## Assumptions

- Rachid can provide the correct registered office address and hosting provider name.

## Open Questions

1. What is Oaksome's legal registered office address?
2. How should the hosting provider be listed? (Full legal name of the entity operating the servers?)

## Resolved Decisions

- Do not remove the hébergeur section — it's legally required in Belgium.
- Vercel may remain mentioned as the test/preview host, but production host must be correct.

## Design Governance

Requires legal content review from Rachid (`legal_content_review`).

## Dependency Freshness

Not required.

## Observability Impact

None.
