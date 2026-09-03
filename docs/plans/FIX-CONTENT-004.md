---
task_id: FIX-CONTENT-004
title: "Implement /fr/pro/inscription page (form + CRM lead)"
status: done
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/[locale]/(marketing)/(pro)/pro/inscription/page.tsx
integration_blockers: [FIX-CART-003]
human_approval_stages:
  - pro_registration_form_design
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [pro-registration, B2B, CRM-lead, inscription, form]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CONTENT-004 — Implement /fr/pro/inscription page

## Objective

The `/fr/pro/inscription` (professional registration) page is a content stub. Implement the form and wire it to a CRM lead creation API call so pro users can register interest.

## Source Evidence

**QA-007 F-006 / QA-014 Should-Fix #15** — `reviews/QA-007-report.md`:
> "Pro registration funnel broken. `/fr/pro/inscription` is a content stub. The pro registration form does not exist."

## Scope

- `oaksome-web/src/app/[locale]/(marketing)/(pro)/pro/inscription/page.tsx` — implement form
- `oaksome-web/src/app/api/odoo/` — existing lead endpoint (reuse if available)

## Steps

1. Read the existing `/fr/pro` page to understand the B2B proposition and what data is needed.
2. Design the form fields (with Rachid): company name, contact name, email, phone, sector, message, GDPR consent checkbox.
3. Implement the form using React `useState` / `useActionState` (or a form library already in the project).
4. On submit: `POST` to `/api/oaksome/v1/leads` (or the lead creation endpoint) with `{ source: 'pro_registration', company, name, email, phone, sector, message }`.
5. On success: show confirmation message "Votre demande a été envoyée. Nous vous contacterons sous 48h."
6. On error: show error message, keep form data.
7. Add GDPR consent checkbox (required field) — aligned with Axeptio integration.
8. Test: submit form → CRM lead created in Odoo.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Pro user fills and submits registration form |
| Processing | Form data sent to lead API |
| Output | Lead created in Odoo CRM with `source: 'pro_registration'` |
| Error path | API failure → error shown in form |
| Success evidence | Lead visible in Odoo CRM after form submit |

## Impact Checklist

- [ ] Pro registration form functional
- [ ] GDPR consent checkbox required
- [ ] Lead created in Odoo CRM
- [ ] Success/error feedback shown to user

## Test Requirements

- Manual: fill form → submit → verify CRM lead in Odoo
- Manual: submit without consent → blocked (validation error)
- Manual: API error → user sees error message

## Simplicity Budget

~60 lines for the form component. Reuse existing lead API endpoint.

## Assumptions

- A lead creation endpoint exists that accepts a `source` field distinguishing pro registrations.
- Form will be client-rendered (`'use client'`) for real-time validation.
- GDPR consent text will be provided by Rachid.

## Open Questions

1. What form fields are required for pro registration? (company, sector, etc. — Rachid to specify)
2. Is a honeypot field needed to prevent spam bots? (See FIX-SEC-004 for rate limiting context)
3. Should pro registrations go to a separate Odoo CRM pipeline stage?

## Resolved Decisions

- GDPR consent checkbox is mandatory.
- Reuse existing lead API — no new Odoo endpoint needed.

## Design Governance

Requires form design approval from Rachid (`pro_registration_form_design`) before implementation.

## Dependency Freshness

Not required.

## Observability Impact

None.
