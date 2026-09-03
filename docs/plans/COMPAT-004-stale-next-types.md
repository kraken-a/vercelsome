---
task_id: COMPAT-004
title: Remove stale .next/types commandes type file
status: done
resolution: "2026-05-17 — Verified complete. find under .next/types for `commandes` returns 0 hits — stale file regenerated/removed by build pipeline; /commandes route was renamed to /projets (QA-001 Drift D)."
risk_level: low
edit_mode: delete_artifact
parallelizable: true
conflict_scope: []
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
---

# COMPAT-004 — Remove stale .next/types commandes page type file

## Objective

Two type errors from stale Next.js build artifact:
- `.next/types/app/[locale]/(account)/commandes/page.ts` tries to import `.../commandes/page.js` which doesn't exist (the source is `.tsx`, not `.js`)
- This is a stale generated file from a previous build

## Fix

Delete the stale file:
```bash
rm -f oaksome-web/.next/types/app/\[locale\]/\(account\)/commandes/page.ts
```

The `.next/types` directory is generated on each build. Removing the stale entry lets `tsc` ignore it. It will regenerate correctly on the next `npm run build`.

## Scope

- Delete: `oaksome-web/.next/types/app/[locale]/(account)/commandes/page.ts`
- No source file changes

## Test Requirements

- `npm run type-check` no longer reports errors for `.next/types/.../commandes/page.ts`
