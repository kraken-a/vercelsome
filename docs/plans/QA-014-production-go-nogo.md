---
task_id: QA-014
title: Production go/no-go consolidation
status: todo
risk_level: medium
edit_mode: surgical_edit
parallelizable: false
conflict_scope: [reviews/QA-014-go-nogo.md]
integration_blockers: []
human_approval_stages: [before_release]
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# QA-014 — Production go/no-go consolidation

## Objective

- Input: 13 audit reports + existing audit + open task index
- Processing path: collect → dedup → rank → decide → write go/no-go → submit for approval
- Output: `reviews/QA-014-go-nogo.md` + human approval signature
- Error path: missing inputs → block, do not produce a partial go/no-go
- Success evidence: signed go/no-go with explicit conditions, every BLOCKER resolvable or accepted

## Scope

**In scope**
- Consume every `reviews/QA-00X-report.md` from QA-001..QA-013
- Merge findings with existing `tasks/production-readiness-audit.md` and open FIX/HOTFIX/COMPAT tasks
- Classify every finding: BLOCKER / HIGH / MEDIUM / LOW / DEV-ONLY
- Produce a single ranked FIX backlog with recommended task IDs (FIX-004+, HOTFIX-002+)
- Issue the go/no-go decision with explicit conditions if conditional-go

**Out of scope**
- Creating the follow-up FIX tasks (separate `/dp-plan` cycle)
- Actually fixing anything (out of family)

## Steps

1. Read every QA-*-report.md; build a master findings table.
2. Deduplicate with existing audit + open FIX/HOTFIX/COMPAT tasks; cross-reference task IDs.
3. Rank by severity; ensure every BLOCKER has a recommended owner and ETA estimate.
4. Write `reviews/QA-014-go-nogo.md` containing: decision (GO / CONDITIONAL-GO / NO-GO), conditions (if any), ranked backlog with task ID suggestions, residual risks accepted, rollback plan.
5. Submit for human approval (`before_release` stage); the human signs the decision.

## Verifiable Flow Goals

- Input: 13 audit reports + existing audit + open task index
- Processing path: collect → dedup → rank → decide → write go/no-go → submit for approval
- Output: `reviews/QA-014-go-nogo.md` + human approval signature
- Error path: missing inputs → block, do not produce a partial go/no-go
- Success evidence: signed go/no-go with explicit conditions, every BLOCKER resolvable or accepted

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none
- Documentation: `reviews/QA-014-report.md`

## Test Requirements

- Required behavior to verify: completeness (every QA-* report consumed), traceability (every finding has a source report row), decidability (clear GO/CONDITIONAL/NO-GO).
- Regressions to prevent: a decision that skips a BLOCKER, double-counted findings, undocumented residual risks.
- Edge cases: a QA report flagged a finding the human disagrees with — must allow human override with rationale captured in the go/no-go doc.

## Simplicity Budget

- Expected files changed: 1 (reviews/QA-014-go-nogo.md)
- New modules allowed: no
- New dependencies allowed: no

## Assumptions

- Every QA-002..QA-013 report has been produced and reviewed.
- The human approver (Rachid) is authorised to issue the go/no-go.

## Open Questions

- Conditional-go criteria: which conditions are acceptable to defer to post-launch (e.g., MEDIUM a11y, MEDIUM perf)? Recommendation: define the cutoff in the go/no-go doc; default cutoff is 'no BLOCKER, no HIGH unresolved'.

## Resolved Decisions

- Audit-only. The decision document is the deliverable; no code changes.

## Design Governance

Required (medium risk, gates production deploy). Capture grill outputs below.

## Dependency Freshness

not_required

## Observability Impact

none
