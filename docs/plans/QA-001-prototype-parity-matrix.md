---
task_id: QA-001
title: Prototype↔production parity matrix
status: done
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [reviews/QA-001-report.md]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-001 — Prototype↔production parity matrix

## Objective

- Input: prototype filesystem + live Next.js dev server on :3000
- Processing path: crawl → enumerate → map → screenshot pairs
- Output: `reviews/QA-001-report.md` with parity matrix + screenshot index
- Error path: any unreachable page or 5xx is logged as a parity gap, not a hard fail
- Success evidence: matrix covers 100% of prototype pages with explicit status per row

## Scope

**In scope**
- Enumerate every prototype page (HTML at `../oaksome-website-prototype/` and live mirror `oaksome-website.netlify.app`)
- Enumerate every Next.js route currently served at `http://localhost:3000` (FR + NL)
- Map prototype page → Next.js route (1:1, 1:N, N:1, missing, extra)
- Inventory components, sections, CTAs, and data sources per page
- Capture screenshot pairs (prototype vs production) at desktop 1440px and mobile 390px for the index of all pages

**Out of scope**
- Pixel-perfect visual diff (covered by QA-013)
- Functional behavior of forms / flows (covered by QA-002..QA-007)

## Steps

1. Crawl prototype: list all `.html` files in the local prototype repo + verify mirror on netlify.
2. Crawl Next.js site: enumerate App Router routes from `oaksome-web/src/app/[locale]/**/page.tsx`.
3. Build the parity table in `reviews/QA-001-report.md` with columns: prototype_path, prototype_url, nextjs_path, nextjs_url_fr, nextjs_url_nl, rendering_strategy, status (match/partial/missing/extra), notes.
4. Use Chrome DevTools MCP to take side-by-side screenshots; store under `reviews/screenshots/QA-001/{page-slug}-{prototype|prod}-{desktop|mobile}.png`.
5. Summarise: total prototype pages, matched, partial, missing in prod, extra in prod.

## Verifiable Flow Goals

- Input: prototype filesystem + live Next.js dev server on :3000
- Processing path: crawl → enumerate → map → screenshot pairs
- Output: `reviews/QA-001-report.md` with parity matrix + screenshot index
- Error path: any unreachable page or 5xx is logged as a parity gap, not a hard fail
- Success evidence: matrix covers 100% of prototype pages with explicit status per row

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-001-report.md`

## Test Requirements

- Required behavior to verify: every prototype page is accounted for in the matrix.
- Regressions to prevent: missing pages silently dropped from scope.
- Edge cases: prototype pages that intentionally merged into one Next.js route; locale-specific pages (FR-only or NL-only) in prototype.

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-001-report.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- Prototype source is `../oaksome-website-prototype/` (relative to repo) or `oaksome-website.netlify.app`.
- Dev server is running on `http://localhost:3000` with `NEXT_PUBLIC_ODOO_URL` pointed at a reachable Odoo (localhost or cdn.oaksome.com).
- Chrome DevTools MCP is available for screenshot capture.

## Open Questions

- Should `/pro` (B2B) page parity be measured against prototype or against `docs/frontend-spec.md`? (Prototype may lack a B2B page.) — recommendation: against spec, since spec is canonical.

## Resolved Decisions

- Audit-only. No code changes in this task.
- Output is a single markdown report; screenshots stored separately, not inlined.

## Design Governance

Not required (low risk, audit-only, empty affected_interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
