---
contract_version: v2
artifact_type: task
task_id: TASK-030
title: Fix /fr/gamme/[slug] 500 (DYNAMIC_SERVER_USAGE) — restore catalogue → gamme browse flow before DNS cutover
status: not_started
status_note: "2026-05-17 — Filed as the prescribed follow-up from TASK-028 status_note (`Follow-up TASK-030 will be filed only if the symptom reproduces in TASK-029 staging smoke`). Symptom reproduced during TASK-029 local-Docker smoke: `/fr/gamme/<every-slug-returned-by-navigation>` → 500 with container log `Error: ... digest: 'DYNAMIC_SERVER_USAGE'`. See reviews/TASK-029-smoke-report.md F-029-1 for full diagnosis."
risk_level: medium
edit_mode: surgical_edit
parallelizable: false
parallel_group: "wave-prod-cutover"
conflict_scope:
  - oaksome-web/src/app/[locale]/(shop)/gamme/[slug]/page.tsx
  - oaksome-web/src/lib/api/navigation.ts
  - oaksome-web/src/lib/api/products.ts
integration_blockers:
  - blocks production DNS cutover (TASK-029 LOCAL-CONDITIONAL-GO names this as the F-029-1 launch blocker)
human_approval_stages: []
risk_triggers:
  - rendering-mode change (ISR → force-dynamic or fixed-cache fetch) affects edge cache behaviour and per-request server load
  - the same root cause may exist on other [slug] pages (collection, espace, etude-de-cas) — fix only the gamme page in this task; verify others in a follow-up if symptomatic
  - `generateStaticParams()` may need adjustment to stay consistent with the new rendering mode
merge_strategy: sequential_only
domain_terms:
  - Next.js App Router
  - ISR
  - revalidate
  - generateStaticParams
  - DYNAMIC_SERVER_USAGE
  - force-dynamic
  - gamme
model_overrides:
  executor: standard
  reviewer: standard
  security: standard
  approval: light
dependency_freshness: not_required
observability_impact: low
affected_interfaces:
  - GET /{locale}/gamme/[slug] (every gamme detail page)
scope_paths:
  - oaksome-web/src/app/[locale]/(shop)/gamme/[slug]/page.tsx
  - oaksome-web/src/lib/api/navigation.ts
  - oaksome-web/src/lib/api/products.ts
generated_at: 2026-05-17
upstream_task: TASK-028
upstream_finding: reviews/TASK-029-smoke-report.md §"Findings during smoke" row F-029-1
---

# TASK-030 — Fix `/fr/gamme/[slug]` 500 (DYNAMIC_SERVER_USAGE)

## Why this task exists

TASK-028's status_note (2026-05-17) said:

> "A separate SSR navigation-fetch failure surfaced during investigation (dev-server `/fr/espace/chambre` 404, `/fr/gamme/dressings` 500 due to empty `spaces` returned by server-side getNavigation()) — captured in reviewer's Architecture/Entropy table as a yes-on-Refactor-should-be-scheduled signal. Follow-up TASK-030 will be filed only if the symptom reproduces in TASK-029 staging smoke (rows S-6, N-1..N-6)."

The symptom **has reproduced** during TASK-029's local-Docker smoke walk. Filing this task is the prescribed next step.

## Reproduction (from TASK-029 smoke walk, 2026-05-17)

Local Docker built from `b122d60` + TASK-029 deploy-config changes, container `oaksome-web-oaksome-web-1` healthy on `:3000`, talking to test Odoo `https://oaksome.tecnibo.com`. Synthetic auth cookie `oaksome_auth=smoke-walk-2026-05-17` used to bypass the global auth-gate (F-029-3, separate concern).

```
$ curl -s "https://oaksome.tecnibo.com/api/oaksome/v1/navigation?country=BE" | jq '.data.types[].slug'
"bibliotheques" "buffets" "bureaux" "commodes" "dressings"
"entrees" "ensembles-muraux" "placards" "ponts-de-lit"

$ for s in bibliotheques buffets bureaux commodes dressings; do
    curl -s -o /dev/null -w "/fr/gamme/$s -> %{http_code}\n" \
      -H "Cookie: oaksome_auth=smoke-walk-2026-05-17" \
      "http://localhost:3000/fr/gamme/$s"
  done
/fr/gamme/bibliotheques -> 500
/fr/gamme/buffets -> 500
/fr/gamme/bureaux -> 500
/fr/gamme/commodes -> 500
/fr/gamme/dressings -> 500
```

Container log for one of those probes:

```
[Error: An error occurred in the Server Components render. The specific message
is omitted in production builds to avoid leaking sensitive details. A digest
property is included on this error instance which may provide additional details
about the nature of the error.] {
  digest: 'DYNAMIC_SERVER_USAGE'
}
```

The page already calls `notFound()` for unknown slugs at line 110, so the
`GAMME_NOT_FOUND` upstream case is handled. The 500 fires for **slugs that DO
exist** in the navigation response — meaning the bug is in the rendering-mode
wiring, not the lookup logic.

## Diagnosis

`src/app/[locale]/(shop)/gamme/[slug]/page.tsx` exports:

```ts
export const revalidate = 3600

export async function generateStaticParams() {
  const nav = await getNavigation()
  ...
}

export default async function GammePage({ params }: Props) {
  ...
  const [navResult, productsResult] = await Promise.all([
    getNavigation(),
    getProducts({ type: slug, limit: '8' }),
  ])
  ...
}
```

With `revalidate = 3600` + `generateStaticParams()`, Next.js wants to ISR this
page. But the underlying `getNavigation()` / `getProducts()` calls in
`src/lib/api/*` use a fetch pattern incompatible with ISR (likely
`{ cache: 'no-store' }` or read `cookies()`/`headers()` somewhere up the chain),
which triggers Next.js's `DYNAMIC_SERVER_USAGE` error at render time.

## Recommended fix (executor's call which path)

**Path A — Force dynamic rendering (tactical, lowest risk)**

```ts
// src/app/[locale]/(shop)/gamme/[slug]/page.tsx
// Replace `export const revalidate = 3600` with:
export const dynamic = 'force-dynamic'
```

Pros: one-line change, immediately unblocks the launch, deterministic.
Cons: every request hits the Next.js server (no ISR cache). For a catalogue
page this is acceptable short-term but should be revisited post-launch.

**Path B — Make the fetches ISR-friendly (correct, more work)**

Audit `src/lib/api/navigation.ts` and `src/lib/api/products.ts` for:

- `fetch(..., { cache: 'no-store' })` → replace with `{ next: { revalidate: 3600 } }`
- `cookies()` / `headers()` reads → remove from the data path (cookies should only be read in route handlers or client components)
- `unstable_noStore()` calls → remove

Keep `revalidate = 3600` on the page. Verify with `next build` that the page is
listed as `● /[locale]/(shop)/gamme/[slug]` (static), not `λ` (dynamic).

Pros: keeps ISR, faster TTFB on cached pages.
Cons: requires understanding the full fetch chain and may surface other latent
dynamic-usage in shared API helpers.

**Recommendation**: ship Path A in this task to unblock TASK-029. File a
follow-up after launch to do Path B properly for performance.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Reproduction commands above; live local Docker container or fresh `next dev` |
| Processing | Apply Path A (or B); rebuild prod image; reprobe the 9 navigation slugs |
| Output | All 9 `/fr/gamme/<slug>` probes return `200` with a real product grid render |
| Error path | If a slug genuinely has no products in test Odoo, the page should still render with the empty-grid fallback (`products.length > 0 && (...)` already guards this at line 194) |
| Success evidence | Updated F-029-1 row in `reviews/TASK-029-smoke-report.md` flipped from FAIL to PASS, with the new curl probe output as evidence |

## Out of scope for this task

- The same `DYNAMIC_SERVER_USAGE` may affect `/fr/espace/[slug]`, `/fr/collection/[slug]`, `/fr/etude-de-cas/[slug]` (they probably share the same getters). Verify only — if symptomatic, file TASK-031 separately. Do NOT fix them in this task to keep the change surface small.
- Auth-gate hardening (F-029-3) — separate.
- TASK-027 NL h1 (F-029-2) — separate.
- TASK-014 root metadata (F-029-5) — separate.

## Definition of done

1. Code change committed on a `FIX-CONTENT-001-gamme-rendering` branch (or amended into TASK-029 wave if simpler).
2. Local Docker rebuild succeeds; all 9 `/fr/gamme/<nav-slug>` return `200`.
3. F-029-1 row in `reviews/TASK-029-smoke-report.md` updated to PASS with evidence.
4. TASK-029 operator can re-sign the Resolved Decisions block with F-029-1 closed; LOCAL-CONDITIONAL-GO becomes CONDITIONAL-GO (host-only rows + tracking still pending).
