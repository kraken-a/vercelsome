---
contract_version: v2
artifact_type: task_index
revision: 1
revision_note: "2026-05-15 — initial QA family for production-readiness deep test vs Dorian prototype."
execution_graph:
  - { id: QA-001, after: [] }
  - { id: QA-002, after: [QA-001] }
  - { id: QA-003, after: [QA-001] }
  - { id: QA-004, after: [QA-001] }
  - { id: QA-005, after: [QA-001] }
  - { id: QA-006, after: [QA-001] }
  - { id: QA-007, after: [QA-001] }
  - { id: QA-008, after: [QA-001] }
  - { id: QA-009, after: [QA-001] }
  - { id: QA-010, after: [QA-001] }
  - { id: QA-011, after: [QA-001] }
  - { id: QA-012, after: [QA-001] }
  - { id: QA-013, after: [QA-001] }
  - { id: QA-014, after: [QA-002, QA-003, QA-004, QA-005, QA-006, QA-007, QA-008, QA-009, QA-010, QA-011, QA-012, QA-013] }
parallel_groups:
  - wave: 0
    tasks: [QA-001]
  - wave: 1
    tasks: [QA-002, QA-003, QA-004, QA-005, QA-006, QA-007]
  - wave: 2
    tasks: [QA-008, QA-009, QA-010, QA-011, QA-012, QA-013]
  - wave: 3
    tasks: [QA-014]
---

# Task Index — Production-Readiness Deep Test vs Prototype

## Scope

Verify that the Next.js production site at `http://localhost:3000` is functionally,
visually, and operationally equivalent to (or an authorised improvement over) the
HTML prototype at `oaksome-website.netlify.app` / `../oaksome-website-prototype/`,
and is safe to deploy to `oaksome.com`.

This family is **audit-only** — no production code is modified. Each task writes a
markdown report under `reviews/QA-00X-report.md`. QA-014 produces the go/no-go
decision and gates the production deploy.

## Test Environment — Production Odoo

- **Next.js**: local dev server at `http://localhost:3000` (already running).
- **Odoo API target**: `https://cdn.oaksome.com` (production).
  - `NEXT_PUBLIC_ODOO_URL=https://cdn.oaksome.com` (browser-facing)
  - `ODOO_URL=http://192.168.30.39:8069` (server-side, Docker internal)
  - Both already set in `oaksome-web/.env.local`. Restart the dev server if it
    was started with stale env.
- **Odoo MCP**: use `mcp__odoo-tecnibo-com__*` for any direct Odoo reads. **Never**
  use `mcp__odoo-tecnibo-com__odoo_create`, `odoo_write`, or `odoo_unlink` in this
  family — production data is read-only for QA.

### Hard No-Write Constraint (because target is production Odoo)

The following actions are **forbidden** in QA-001..QA-013:

| Forbidden write | Replacement audit method |
|---|---|
| Create `crm.lead` (configurator, contact, samples, pro) | Walk the form to the submit step, capture the payload via DevTools Network panel, **cancel** before send. Verify schema via `mcp__odoo-tecnibo-com__odoo_get_model_fields` on `crm.lead`. |
| Register a `res.users` / `res.partner` account | Use a pre-existing QA account if available; otherwise login-only paths are deferred — flag as "untested against prod" in QA-004 report. |
| Edit profile, change password, book appointment | Read-only render checks only. Capture the request payload, do not submit. |
| Add to `website.cart.item` / `website.wishlist.item` (authed) | Test anon localStorage paths only. Authed cart-sync test is deferred unless a sandbox account exists. |
| Trigger Odoo Sign, Stripe, or SO confirmation | Out of scope entirely. Stop at the Next.js `/cart` → Odoo handoff URL — do not follow the redirect through to a transaction. |
| Pollute prod analytics (GA4, Meta Pixel, Pinterest) | Block tracking in DevTools (request blocking) or use the Meta Pixel Helper / GA Debug View to inspect *would-be* payloads without firing. Server-side CAPI tests: skip; verify config and code path only. |

Any audit that genuinely requires a write must be paused, added to QA-014 as a
"deferred-write test" item, and re-run later against a sandbox Odoo.

## Reference inputs

- Existing shallow audit: `tasks/production-readiness-audit.md`
- Prototype: `oaksome-website.netlify.app` (live) + `../oaksome-website-prototype/` (local, 50+ HTML pages)
- Specs (source of truth): `docs/System-Design.md`, `docs/frontend-spec.md`, `docs/backend-spec.md`, `docs/api-contract.md`, `docs/data-model.md`, `docs/user-flows.md`
- Open production bugs: FIX-001 (todo), FIX-002 (done), FIX-003 (todo), HOTFIX-001
- Compat work: COMPAT-001..004 (Next.js 15 upgrade)

## Tasks

| Task | Title | Wave | Risk | Status |
|------|-------|------|------|--------|
| [QA-001](./QA-001-prototype-parity-matrix.md) | Prototype↔production parity matrix | 0 | low | todo |
| [QA-002](./QA-002-catalogue-deep-test.md) | Catalogue & product-detail deep test | 1 | low | todo |
| [QA-003](./QA-003-configurator-deep-test.md) | Configurateur tunnel deep test | 1 | low | todo |
| [QA-004](./QA-004-auth-account-deep-test.md) | Auth + account portal deep test | 1 | low | todo |
| [QA-005](./QA-005-cart-wishlist-checkout.md) | Cart, wishlist, Odoo checkout handoff | 1 | low | todo |
| [QA-006](./QA-006-lead-funnels.md) | Lead funnels (configurator, contact, samples, pro) | 1 | low | todo |
| [QA-007](./QA-007-content-static-pages.md) | Content & static pages | 1 | low | todo |
| [QA-008](./QA-008-i18n-fr-nl-audit.md) | i18n FR/NL coverage & translated routes | 2 | low | todo |
| [QA-009](./QA-009-performance-lighthouse.md) | Performance & Lighthouse (mobile + desktop) | 2 | low | todo |
| [QA-010](./QA-010-accessibility-wcag.md) | Accessibility WCAG 2.1 AA audit | 2 | low | todo |
| [QA-011](./QA-011-tracking-analytics.md) | Tracking & analytics (GTM, GA4, Pixel, CAPI) | 2 | low | todo |
| [QA-012](./QA-012-security-headers-cors.md) | Security headers, CORS, cookies, rate limits | 2 | low | todo |
| [QA-013](./QA-013-visual-fidelity-prototype.md) | Visual fidelity vs prototype (tokens, fonts, motion) | 2 | low | todo |
| [QA-014](./QA-014-production-go-nogo.md) | Production go/no-go consolidation | 3 | medium | todo |

## Hard Constraints

- **No code changes** in QA-001..QA-013. Findings go into `reviews/QA-00X-report.md`
  with: severity, evidence (screenshot path, network capture, log line), reproduction
  steps, and a recommended FIX-* or HOTFIX-* task id (without creating those tasks yet).
- **QA-014 cannot start** until every QA-002..QA-013 has produced its report.
- **No production env mutation** during testing — use `localhost:3000` against the
  configured dev/staging Odoo. Never run destructive flows (real Stripe payments,
  real SO confirmations, real Odoo Sign events) — stop at the handoff URL.
- **Compare against the prototype**, not against what "should" exist. If the prototype
  has a feature the Next.js site lacks, file a gap; the gap closes via a separate
  ADD-* or FIX-* task, not inside this family.

## Wave Rationale

- **Wave 0 — Parity matrix** (QA-001): every domain audit needs the same route map and
  feature inventory. Building it once removes duplicate work in Wave 1.
- **Wave 1 — Domain audits** (QA-002..QA-007): one audit per business domain. Fully
  parallel, no `conflict_scope` overlap (each writes a distinct report file).
- **Wave 2 — Cross-cutting audits** (QA-008..QA-013): same site, different lens
  (i18n, perf, a11y, tracking, security, visual). Independent reports → parallel.
- **Wave 3 — Decision** (QA-014): synthesises all reports into a single go/no-go and
  ranked FIX backlog. Requires `before_release` human approval.

## Pipeline Memory Inputs

`reviews/pipeline-memory.md` is empty. If patterns emerge during this family, write
them back so future audits can be calibrated.

## Out of Scope

- Implementing fixes for any finding (a follow-up FIX-* family will be created from
  QA-014 output).
- Odoo backend audits beyond the Next.js↔Odoo API surface (covered by a separate
  backend QA family if needed).
- Load testing or chaos testing (separate family).
- Penetration testing (separate engagement).
