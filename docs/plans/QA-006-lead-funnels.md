---
task_id: QA-006
title: Lead funnels (configurator, contact, samples, pro)
status: todo
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-006-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-006 — Lead funnels (configurator, contact, samples, pro)

## Objective

- User action: fill each lead form happy + edge
- Expected UI state: success message + reset; Odoo lead created
- Error state: locale-correct validation; throttling shows graceful UI
- Success evidence: 4 lead types in Odoo, each tagged correctly, each with UTM

## Scope

**In scope**
- Configurator lead submission (verify also covered by QA-003, no duplication of detail)
- `/{locale}/contact` form → `crm.lead`
- `/{locale}/echantillons` sample-request form → Odoo
- `/{locale}/pro` B2B inquiry → `crm.lead` (tagged B2B)
- Wishlist-share lead trigger (if exists)
- Honeypot, CSRF, rate-limit behavior on form endpoints

**Out of scope**
- Order/SO creation (QA-005)
- Email delivery internals (Odoo-side, out of family scope)

## Steps

**No-write mode (target is production Odoo).** Walk every form to the submit boundary; capture payloads; cancel before send.

1. Each form (contact, samples, pro, wishlist-share if exists) in FR + NL: fill happy-path values, capture the outgoing POST payload via DevTools (enable "block request URL" on the form's endpoint so the submit cannot reach Odoo). Verify the success-UI code path is unreachable without a real submit and note that as expected.
2. Repeat with invalid input (missing required, malformed email, oversized payload); verify locale-correct inline errors render — these are pure client-side checks, no network.
3. Schema verification: cross-reference the captured POST payload against `mcp__odoo-tecnibo-com__odoo_get_model_fields('crm.lead')` and any custom fields used per `docs/data-model.md`. Read 1–3 recent prod leads (read-only) to confirm shape and tag conventions.
4. Rate limiting: trigger rapid repeated submits with the form endpoint blocked client-side. Verify the Next.js middleware response (if proxy-level) or document that the test could not exercise the Odoo-side limiter without writes.
5. Inspect form HTML for honeypot fields and CSRF token; verify Next.js middleware adds appropriate protection.
6. Cross-check that consent (Axeptio) status gates tracking, not form submission.

## Verifiable Flow Goals

- User action: fill each lead form to submit boundary; cancel; inspect
- Expected UI state: client-side validation correct in both locales; payload well-formed
- Error state: locale-correct validation; rate-limit signals visible at Next.js proxy where applicable
- Success evidence: 4 captured payloads, each schema-verified against prod Odoo `crm.lead`, with zero writes

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-006-report.md`

## Test Requirements

- Required behavior to verify: every form creates a correctly-tagged lead in Odoo.
- Regressions to prevent: untagged leads, missing UTM, broken validation, spam susceptibility.
- Edge cases: emoji in name, very long message, duplicate submissions, no-JS submission (if supported).

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-006-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- Target Odoo is **production** (`cdn.oaksome.com`). No leads will be created during this audit.
- TASK-001 rate-limiting middleware is shipped (per `tasks/index.md`).
- DevTools "block request URL" reliably stops the form POST before it reaches Odoo.

## Open Questions

- Does any form rely on Axeptio consent being granted? Recommendation: if yes, document and verify pre-consent behavior is safe.
- Can rate-limit behavior be fully tested without writes? If the limiter lives in Odoo (not Next.js proxy), the live test is deferred to a sandbox run — flag in QA-014.

## Resolved Decisions

- Audit-only AND no-write. Forms are walked to the submit boundary and cancelled. Schema is verified by reading prod Odoo, not writing to it.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
