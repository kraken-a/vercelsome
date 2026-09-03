---
task_id: HOTFIX-001
title: Fix __webpack_modules__[moduleId] is not a function on first SSR render
status: done
risk_level: low
edit_mode: surgical_edit
parallelizable: false
conflict_scope: [oaksome-web/next.config.mjs]
integration_blockers: []
human_approval_stages: []
revision_note: "2026-05-15 — Reopened. QA-013 §5 reports the cache error still recurs on warm dev server. The `ignoreWarnings` fix in next.config.mjs was merged but the @formatjs vendor chunk error (`Cannot find module './vendor-chunks/@formatjs.js'`) still triggers on every page load until `.next/cache` is manually cleared. The fix is incomplete — the one-time manual cache clear step was never automated, and the root webpack cache invalidation is still happening. Must be resolved before any production deploy."
resolution: "2026-05-15 — Resolved. Added `transpilePackages: ['next-intl', '@formatjs/intl-localematcher']` to oaksome-web/next.config.mjs. This forces Next.js to bundle these packages through its own pipeline instead of splitting them into pre-built vendor chunks, eliminating the stale-vendor-chunk failure mode at its source. Verified with cold-cache start + 2 warm-cache restarts + HMR trigger across /fr, /fr/acheter, /fr/configurer, /nl — all 200, zero `vendor-chunks/@formatjs` or `__webpack_modules__` errors in 3 separate dev session logs. Lint and type-check pass. See reviews/HOTFIX-001-pipeline-status.json and reviews/HOTFIX-001-rootcause.md."
---

# HOTFIX-001 — Fix webpack SSR module error caused by next-intl extractor

## Root Cause

`next-intl/dist/esm/production/extractor/format/index.js` contains a dynamic
`import(t)` expression that webpack cannot statically analyse. This triggers:

```
[webpack.cache.PackFileCacheStrategy/webpack.FileSystemInfo] Parsing of
next-intl/dist/esm/production/extractor/format/index.js for build dependencies
failed at 'import(t)'. Build dependencies behind this expression are ignored and
might cause incorrect cache invalidation.
```

On the first SSR render after server start, the stale/incomplete cache entry for
the next-intl module produces a missing module factory, causing:

```
TypeError: __webpack_modules__[moduleId] is not a function
Switched to client rendering because the server rendering errored
```

The error is *recoverable* (React falls back to CSR), but every page load after
a cold start suffers the performance penalty of a failed SSR + full CSR re-render.

## Fix Applied (2026-05-15 — durable)

**Previous attempt (incomplete):** A `webpack()` function added `ignoreWarnings`
for the next-intl extractor warning. This only suppressed the log message but
did not prevent webpack from writing an incomplete cache record for the
`@formatjs` vendor chunk. The warm-cache `Cannot find module
'./vendor-chunks/@formatjs.js'` error continued to recur (QA-013 §5).

**Durable fix:** Added `transpilePackages` to `oaksome-web/next.config.mjs`:

```js
transpilePackages: ['next-intl', '@formatjs/intl-localematcher'],
```

This forces Next.js to run these packages through its own webpack transpilation
pipeline, which means they are **never split into pre-built vendor chunks**.
Without a vendor chunk artifact, there is nothing to go stale and the
dynamic-import problem in the next-intl extractor cannot corrupt the cache.
The existing `ignoreWarnings` entry is retained as belt-and-suspenders log
suppression.

## Verification (2026-05-15)

Live tested on dev server (port 3000):

| Stage | Result |
|---|---|
| `rm -rf .next && npm run dev` (cold start) | Ready in 2.7s; `/fr`, `/fr/acheter`, `/fr/configurer`, `/nl` all 200; no errors |
| Stop dev + `npm run dev` (warm restart #1) | Ready in 4.4s; same 4 routes all 200; log clean |
| HMR trigger (edit/save TSX twice) | 2 clean recompiles; post-HMR routes all 200 |
| Stop dev + `npm run dev` (warm restart #2) | Ready in 2.9s; same 4 routes all 200; log clean |
| Final grep across 3 session logs | Zero `vendor-chunks/@formatjs`, zero `__webpack_modules__`, zero "Cannot find module", zero "Switched to client rendering" |
| `npm run lint` | Exit 0 |
| `npm run type-check` | Exit 0 (one pre-existing unrelated TS2322 in `landing/page.tsx`) |

Artifacts: `reviews/HOTFIX-001-pipeline-status.json`, `reviews/HOTFIX-001-rootcause.md`.

## Follow-up

FIX-SEC-003 (`npm audit fix`) may bump `next-intl` and `@formatjs/*` to versions
that resolve the upstream dynamic-import issue. After SEC-003 lands, retry the
same warm-restart procedure with `transpilePackages` removed — if it still
passes, the workaround can be dropped.

## Odoo /v1/home 500 (companion note)

The `[home] Odoo /v1/home failed` console error that appears alongside the webpack
error is a separate Odoo backend issue. The Next.js layer already handles it
gracefully (FIX-002 — done). The Odoo `/api/oaksome/v1/home` controller must be
investigated in the Odoo addon repository.
