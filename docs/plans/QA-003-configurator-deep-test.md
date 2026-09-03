---
task_id: QA-003
title: Configurateur tunnel deep test
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-003-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-003 — Configurateur tunnel deep test

## Objective

- User action: complete a 6-step configuration, submit lead, share config
- Expected UI state: each step renders only valid next options; price updates within 500ms of change; submit shows confirmation
- Error state: invalid dimensions show inline error; submit failure preserves form state
- Success evidence: `crm.lead` record exists in Odoo with full configuration payload; share link restores state in incognito

## Scope

**In scope**
- `/{locale}/configurer` full tunnel: Type → Collection → Façade → Couleur → Dimensions → Prix
- Each step's UI state, validation, back/forward navigation
- Price computation correctness vs `/api/oaksome/v1/configurator` responses
- Submit → CRM lead creation in Odoo (verify lead appears, do not confirm SO)
- Configuration share link `/config/[token]` (open in incognito, verify state restoration)
- localStorage persistence of in-progress config across page reload

**Out of scope**
- Catalogue PDP (QA-002)
- Lead form fields used outside configurator (QA-006)

## Steps

1. Walk a happy path tunnel in FR: pick each option, advance through all 6 steps, verify price updates after each meaningful change. **Stop at the submit button.**
2. Repeat happy path in NL.
3. Walk an edge path: pick min dimensions, max dimensions, extreme combinations; verify validation errors render in locale.
4. Mid-flow: reload page, verify saved state restores correctly.
5. Mid-flow: switch locale (`/fr` → `/nl`); verify state preserved and labels translated.
6. **No-write submit audit** (target is production Odoo): with DevTools open, click submit and capture the outgoing request payload, then immediately cancel (DevTools "block request URL" pattern) so the lead is never written. Verify field names + types in payload against `mcp__odoo-tecnibo-com__odoo_get_model_fields('crm.lead')`. Read 1–3 recent prod leads via `mcp__odoo-tecnibo-com__odoo_search_read` (read-only) to confirm stored shape — these reads do not mutate state.
7. Generate share link, open in incognito, verify state restoration; share-link opens are read-only and must not create any Odoo record.

## Verifiable Flow Goals

- User action: complete a 6-step configuration up to the submit boundary, share config
- Expected UI state: each step renders only valid next options; price updates within 500ms of change; submit button is reachable
- Error state: invalid dimensions show inline error
- Success evidence: captured submit payload matches `crm.lead` schema in production Odoo; share link restores state in incognito with zero Odoo writes

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-003-report.md`

## Test Requirements

- Required behavior to verify: 6-step tunnel completability, price accuracy, lead creation, share link round-trip.
- Regressions to prevent: lost state on reload, price desync, missing UTM, duplicate leads from share-link opens.
- Edge cases: extreme dimensions, incompatible option combinations, locale switch, slow API responses, network drop mid-step.

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-003-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- `/api/oaksome/v1/configurator` returns price for all valid option combinations.
- Odoo `crm.lead` model is reachable via mcp__odoo-localhost__ in the test env.
- No real payment is triggered by lead submission (lead != SO).

## Open Questions

- Configurator share link: is the token signed/expiring? Recommendation: verify by inspecting token format; if not signed, flag as security concern in QA-012.

## Resolved Decisions

- Audit-only. Stop at lead creation; do not progress to SO/checkout from this task.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
