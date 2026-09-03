---
contract_version: v2
artifact_type: task
task_id: FIX-NL-OVERONS-001
title: NL /nl/over-ons h1 still renders Notre histoire — TASK-027 closed but bug persists
status: open
risk_level: low
edit_mode: surgical_edit
parallelizable: true
parallel_group: "wave-prod-cutover-fixups"
conflict_scope:
  - oaksome-web/src/app/[locale]/(marketing)/a-propos/_client.tsx
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
integration_blockers: []
human_approval_stages: []
risk_triggers:
  - launching the NL site with a French h1 on the about page is an immediate trust-killer for Belgian Dutch visitors and undermines the "Belgian design" positioning
merge_strategy: sequential_only
domain_terms:
  - Locale
  - I18n
model_overrides:
  executor: standard
  reviewer: light
  security: standard
  approval: standard
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
scope_paths:
  - oaksome-web/src/app/[locale]/(marketing)/a-propos/_client.tsx
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
generated_at: 2026-05-17
upstream_task: TASK-029
upstream_finding: reviews/TASK-029-smoke-report.md F-029-2

---

# FIX-NL-OVERONS-001 — NL about-page h1 still hardcoded in French

## Why this task exists

TASK-027 (commit `b122d60`) advertised "TASK-027 — about h1 (i18n completion)" and is marked `status: done`. The TASK-029 WebBridge smoke walk on 2026-05-17 confirms the bug is not actually fixed: `GET /nl/over-ons` returns `<h1>Notre histoire.</h1>` — identical to the FR page. The closure of TASK-027 was premature; either the wrong h1 was touched or the verification step was skipped. This task exists to actually fix the bug and add a regression guard so a future closure is verifiable.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | `GET /nl/over-ons` against the prod-built image. |
| Processing | App Router renders `[locale]/(marketing)/a-propos/_client.tsx` with `locale=nl`. |
| Output | The page `<h1>` is the NL-localized string ("Ons verhaal.", or the chosen NL phrase the brand prefers). |
| Error path | Missing translation key falls back to the FR string — must not happen post-fix. |
| Success evidence | `curl http://oaksome.com/nl/over-ons \| grep '<h1'` returns the NL string; `npm run i18n:check` exits 0. |

## Scope

**Included**
- Replace the hardcoded `Notre histoire.` literal in `_client.tsx` with `useTranslations()` keyed to the marketing namespace.
- Add the matching key to `messages/fr.json` and `messages/nl.json` (FR keeps current copy, NL gets the brand-approved Dutch translation).
- Add a minimal Jest test or Playwright assertion that `/nl/over-ons` exposes the NL h1.

**Excluded**
- No redesign of the about page.
- No changes to the rest of the about copy beyond the h1 (TASK-027 closed the rest; if other strings later surface, file a separate fix).

## Steps

1. Read `_client.tsx` to locate the hardcoded `<h1>Notre histoire.</h1>`.
2. Lift the string into `marketing.aboutH1` (or reuse an existing about-namespace key if one exists).
3. Add `"aboutH1": "Notre histoire."` to `fr.json` under the same parent key, `"aboutH1": "Ons verhaal."` to `nl.json`.
4. Replace the JSX literal with `{t('aboutH1')}` using the existing `useTranslations()` import.
5. Run `npm run i18n:check` — must exit 0.
6. Add a Playwright or unit test that hits `/nl/over-ons` and asserts the h1 text is the NL string.
7. Re-run the TASK-029 smoke row N-4 against this build; flip from FAIL → PASS in `reviews/TASK-029-smoke-report.md`.

## Impact Checklist

- UI: only the about-page h1 string changes for NL visitors.
- API contracts: none.
- Database / Odoo: none.
- Auth/session: none.
- i18n: one new translation key in each of `fr.json` and `nl.json`.
- SEO: NL page now has a Dutch h1 — material SEO improvement (matches Google's "page in the user's language" signal).
- Tracking: none.
- Operations: none.

## Test Requirements

**Required behavior to verify**
- `GET /nl/over-ons` returns the NL h1.
- `GET /fr/a-propos` still returns the FR h1.
- `npm run i18n:check` exits 0.

**Regressions to prevent**
- The FR page still renders the FR string (no accidental Dutch leak).
- No other marketing-namespace key is renamed or removed.

**Edge cases**
- The chosen NL string must be reviewed for tone — "Ons verhaal." is the literal translation, but brand voice may prefer "Wie wij zijn." or similar. Defer to the brand decision noted in Open Questions.

## Simplicity Budget

- Files changed: 3 (`_client.tsx`, `fr.json`, `nl.json`).
- New modules: 0.
- New dependencies: 0.

## Assumptions

1. `useTranslations()` is already wired in `_client.tsx` (TASK-013 i18n sweep). If not, the executor should import it as part of this fix.
2. The brand prefers `Ons verhaal.` as the NL translation unless the operator confirms a different choice in Open Question Q1.

## Open Questions

### Q1 — What NL phrase replaces `Notre histoire.`? (low-impact, fall-through default)

Candidates:
- **A. `Ons verhaal.`** — literal translation, matches the FR tone.
- **B. `Wie wij zijn.`** — "Who we are", warmer, common in Belgian Dutch marketing.
- **C. `Onze visie.`** — "Our vision", focuses on intent rather than history.

Planner recommendation: **A** (literal, preserves FR/NL parity). If the brand prefers a different feel, the operator can flip in a one-line follow-up before the regression test is written.

## Resolved Decisions

- This is a new FIX-* rather than reopening TASK-027. TASK-027 is closed and its commit can stay as-is; reopening a closed task pollutes the audit trail. The new task carries the verification gate the previous closure lacked.
- The bug surfaced as F-029-2 during the TASK-029 smoke walk; the smoke report is the upstream finding artifact.

## Dependency Freshness

not_required — no package or framework change.

## Observability Impact

none — pure string swap.
