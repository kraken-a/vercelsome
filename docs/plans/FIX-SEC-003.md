---
task_id: FIX-SEC-003
title: "npm audit fix — patch next-intl CVE GHSA-8f24-v5vv-gm5j (open redirect)"
status: done
resolution: "2026-05-17 — Verified complete. Target CVE GHSA-8f24-v5vv-gm5j absent from current npm audit (next-intl now at 4.12.0, patched upstream). Residual: postcss < 8.5.10 (moderate, GHSA-qx2v-qp2m-jg93) in next sub-dependency requires breaking next@9.3.3 downgrade — deferred until next is intentionally bumped. No HIGH or CRITICAL CVEs remaining (0/0/3-moderate/0/0)."
risk_level: low
edit_mode: surgical_edit
parallelizable: false
conflict_scope:
  - oaksome-web/package.json
  - oaksome-web/package-lock.json
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: standard
  security: true
domain_terms: [CVE, npm-audit, next-intl, open-redirect]
dependency_freshness: required
observability_impact: none
affected_interfaces: []
---

# FIX-SEC-003 — Patch next-intl CVE GHSA-8f24-v5vv-gm5j

## Objective

Run `npm audit fix` in `oaksome-web/` to patch the confirmed open-redirect vulnerability in `next-intl` (CVE GHSA-8f24-v5vv-gm5j). This must land before any other wave-0 task that modifies `next.config.mjs`, because a broken dependency can mask config changes.

## Source Evidence

**QA-012 S3** — `reviews/QA-012-report.md`:
> `next-intl` CVE GHSA-8f24-v5vv-gm5j — open redirect in dependency. File: `package.json`. Confirmed: `npm audit` shows HIGH severity, fix available.

## Scope

- `oaksome-web/package.json` — version bump (automated by npm)
- `oaksome-web/package-lock.json` — lockfile update

No application source files change.

## Steps

1. `cd oaksome-web && npm audit --json | grep -A5 GHSA-8f24-v5vv-gm5j` — confirm CVE present pre-fix.
2. `npm audit fix` — auto-apply semver-safe patch.
3. If CVE not resolved by safe fix: `npm audit fix --force` only if breaking changes are acceptable (consult Rachid before running `--force`).
4. Run `npm run build` (or at minimum `npm run type-check`) to verify no breaking API changes.
5. Run `npm audit` again — confirm GHSA-8f24-v5vv-gm5j no longer listed as HIGH.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | `npm audit` reports GHSA-8f24-v5vv-gm5j |
| Processing | `npm audit fix` patches to non-vulnerable version |
| Output | `npm audit` reports 0 HIGH CVEs for GHSA-8f24-v5vv-gm5j |
| Error path | If `--force` required, flag for Rachid approval before proceeding |
| Success evidence | `npm audit` clean output + build passes |

## Impact Checklist

- [ ] Security: CVE patched, open-redirect vector closed
- [ ] Build: passes post-patch
- [ ] No runtime behavior change expected (patch-level bump)

## Test Requirements

- `npm run build` passes without error
- `npm audit` shows no HIGH/CRITICAL for this CVE
- `npm run dev` starts without webpack error regression

## Simplicity Budget

Exactly 1 command (`npm audit fix`). No source changes required.

## Assumptions

- The CVE has a semver-safe fix available (the audit report indicates it does).
- `npm audit fix` will not bump `next-intl` to a breaking major version without `--force`.

## Open Questions

1. If `npm audit fix --force` is required (breaking semver bump), should we pin to the last non-breaking safe version instead?

## Resolved Decisions

- Run in `oaksome-web/` only (monorepo root has no separate lockfile for this package).
- Do NOT run `--force` without explicit approval — escalate if standard fix fails.

## Design Governance

No design review required. Dependency bump only.

## Dependency Freshness

Required — this task IS the dependency update.

## Observability Impact

None.
