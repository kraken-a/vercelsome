---
task_id: COMPAT-003
title: Fix header-client.tsx typed Link hrefs + add /panier to routing
status: done
resolution: "2026-05-17 — Verified complete. zero `.html` hrefs remain in src/components/layout/header-client.tsx; routing.ts now declares /panier (with NL /winkelmand from TASK-024A)."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [header-client.tsx, routing.ts]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
---

# COMPAT-003 — Fix header-client.tsx typed Link hrefs

## Objective

11 TypeScript errors in `header-client.tsx` from next-intl typed `Link` (from `@/i18n/navigation`).
Dynamic template literals don't satisfy the strict href union type.

## Errors and fixes

### Dynamic parameterized routes (9 errors)

Replace template literals with typed `href` objects:

| Line | Before | After |
|---|---|---|
| 144 | `` `/gamme/${t.slug}` `` | `{ pathname: '/gamme/[slug]', params: { slug: t.slug } }` |
| 155 | `` `/espaces/${s.slug}` `` | `{ pathname: '/espace/[slug]', params: { slug: s.slug } }` |
| 166 | `` `/collection/${c.slug}` `` | `{ pathname: '/collection/[slug]', params: { slug: c.slug } }` |
| 180 | `` `/produit/${p.id}` `` | `{ pathname: '/produit/[id]', params: { id: String(p.id) } }` |
| 227 | `` `/gamme/${item.slug}` `` | `{ pathname: '/gamme/[slug]', params: { slug: item.slug } }` |
| 252 | `` `/espaces/${item.slug}` `` | `{ pathname: '/espace/[slug]', params: { slug: item.slug } }` |
| 277 | `` `/collection/${item.slug}` `` | `{ pathname: '/collection/[slug]', params: { slug: item.slug } }` |
| 349 | `` `/gamme/${item.slug}` `` | `{ pathname: '/gamme/[slug]', params: { slug: item.slug } }` |
| 370 | `` `/espaces/${item.slug}` `` | `{ pathname: '/espace/[slug]', params: { slug: item.slug } }` |
| 391 | `` `/collection/${item.slug}` `` | `{ pathname: '/collection/[slug]', params: { slug: item.slug } }` |

Note: `/espaces/${slug}` is also a routing bug — the routing config has `/espace/[slug]` (singular). All espace item links are corrected to `/espace/[slug]`.

### Static route not in routing config (1 error)

Line 448: `href="/panier"` — `/panier` is missing from `src/i18n/routing.ts`.

Fix: Add `/panier` to the `pathnames` object in `routing.ts`:
```ts
'/panier': '/panier',
```

## Scope

- `src/components/layout/header-client.tsx` — 10 href replacements (lines 144, 155, 166, 180, 227, 252, 277, 349, 370, 391)
- `src/i18n/routing.ts` — add `/panier` to pathnames

## Test Requirements

- `npm run type-check` shows no errors for `header-client.tsx`
- No template literal hrefs passed to typed `Link`
- `/espace/[slug]` used consistently (not `/espaces/[slug]`)
