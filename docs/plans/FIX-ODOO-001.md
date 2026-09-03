---
task_id: FIX-ODOO-001
title: Delete accidental crm.lead 26935 from production Odoo
status: done
risk_level: low
edit_mode: ops_only
parallelizable: true
conflict_scope: []
integration_blockers: []
human_approval_stages: []
model_overrides: {}
domain_terms: [crm.lead, production_odoo]
dependency_freshness: not_required
observability_impact: none
completed_at: 2026-05-15
verified_at: 2026-05-15
---

# FIX-ODOO-001 — Delete accidental crm.lead 26935 from production Odoo

## Objective

Remove the test record `crm.lead id=26935` (`email: test@test.com`) that was accidentally created in production Odoo (`cdn.oaksome.com`) during QA-003 configurator endpoint discovery. This was the lone violation of the QA family's hard no-write constraint.

## Resolution

- Action: manual deletion by Rachid in production Odoo backend
- Date: 2026-05-15
- Verification: `mcp__odoo-tecnibo-com__odoo_search_count` on `crm.lead` with `[["id","=",26935]]` returns `count: 0` (record no longer exists)
- No residual prod data; QA-014 constraint-compliance row patched to `RESOLVED` in both `reviews/QA-014-report.md` (§2.4, §7) and `reviews/QA-014-pipeline-status.json`

## Impact Checklist

- Code changed: none
- API contracts changed: none
- Data migrations: none — single record unlink in production CRM
- Business workflows touched: none (test record only)
- Backwards compatibility: n/a
- Documentation: this file + QA-014 report patches

## Assumptions

- The deletion was performed via Odoo backend admin UI by an authenticated administrator (Rachid).
- No automations or webhooks fired on the unlink (no SO chain, no email).

## Open Questions

- (None — resolved.)

## Resolved Decisions

- No follow-up audit-trail entry required beyond this task file and the QA-014 patches.
- Future QA endpoint discovery must use the sandbox or a clearly-tagged test domain; see QA-006 methodology (capture payload via DevTools, abort before send) as the reference pattern.

## Design Governance

Not required (ops-only, single CRM record unlink, no code change).
