---
task_id: FIX-003
title: Product detail page — image fallback and zero-dimension guard
status: done
resolution: "2026-05-17 — Verified complete. src/app/[locale]/(shop)/produit/[id]/page.tsx:25 falls back to `image_url` when `images[]` is empty; line 28 gates dimensions display on `width|height|depth > 0` (no more `L0 × H0 × P0 cm`)."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [produit/[id]/page.tsx]
integration_blockers: [FIX-001, FIX-002]
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: []
dependency_freshness: not_required
observability_impact: none
---

# FIX-003 — Product Detail Page: Image Fallback + Zero-Dimension Guard

## Objective

The product detail page (`/fr/produit/{id}`) shows:
1. **Broken image** — `p.images[]` is empty (`[]`) in the Odoo API response, but `p.image_url` is populated. The page uses `p.images?.[0]?.url ?? null`, which resolves to `null` → renders nothing.
2. **"L0 × H0 × P0 cm"** — `p.dimensions` object exists but all fields are `0` (Odoo data not populated). Displaying zeros is misleading to users.

Both are frontend display bugs. Root cause of empty data is Odoo, but we can and should guard against it.

**What this task does NOT fix:**
- `p.collection`, `p.type`, `p.spaces` being undefined — already guarded with `p.collection && ...` in the page.
- `webpage_url` pointing to wrong domain — Odoo configuration issue, separate Odoo task.
- `p.dimensions` values being 0 — Odoo data issue; we only change display logic.

## Scope

**Included:**
- `oaksome-web/src/app/[locale]/(shop)/produit/[id]/page.tsx` — surgical changes to `mainImage` derivation and `dims` rendering

**Excluded:**
- Do NOT modify the product type definitions in `src/types/product.ts`
- Do NOT change `getProduct()` or the API layer
- Do NOT refactor any other section of the product detail page
- Do NOT change anything on the product list (`acheter`) page

## Steps

- [ ] **Image fallback**: Change `mainImage` derivation from:
  ```ts
  const mainImage = p.images?.[0]?.url ?? null
  ```
  to:
  ```ts
  const mainImage = p.images?.[0]?.url ?? p.image_url ?? null
  ```

- [ ] **Zero-dimension guard**: Change `dims` derivation from:
  ```ts
  const dims = p.dimensions
    ? `L${p.dimensions.width} × H${p.dimensions.height} × P${p.dimensions.depth} cm`
    : null
  ```
  to:
  ```ts
  const hasDimensions = p.dimensions &&
    (p.dimensions.width > 0 || p.dimensions.height > 0 || p.dimensions.depth > 0)
  const dims = hasDimensions
    ? `L${p.dimensions!.width} × H${p.dimensions!.height} × P${p.dimensions!.depth} cm`
    : null
  ```
  (This ensures `dims` is `null` when all values are 0, so the dimension display is hidden.)

- [ ] Run `npm run type-check` — verify no type errors (especially the `!` non-null assertion on `p.dimensions` inside the `hasDimensions` guard).
- [ ] Run `npm run lint`.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Browser navigates to `/fr/produit/1256570` |
| Processing | `getProduct(1256570)` returns `{ images: [], image_url: "http://...", dimensions: { width: 0, height: 0, depth: 0 } }` |
| Output | Product image renders from `image_url`; dimension block is hidden |
| Error path | `image_url` is also null/falsy → `mainImage = null` → no image rendered (graceful, same as before) |
| Success evidence | Product page shows the product image; "L0 × H0 × P0 cm" is no longer displayed |

## Impact Checklist

- UI: product detail page image and dimension display only
- API contract: none (no API changes)
- Database: none
- Auth/session: none
- i18n: none (no translated strings affected)
- SEO: product image now renders → Open Graph / social sharing will include image

## Test Requirements

**Behaviour to verify:**
- When `p.images = []` and `p.image_url` is set: image renders
- When `p.images = [{ url: "..." }]`: image renders from `images[0].url` (existing path, no regression)
- When `p.dimensions` all zeros: dimension block is hidden
- When `p.dimensions` has real values: dimension block shows correctly
- When both `p.images = []` and `p.image_url = null`: no image renders (graceful empty state)

**Regressions to prevent:**
- Products with `p.images` populated must still use `images[0].url` (priority order preserved by `??`)
- Products with real non-zero dimensions must still display them

**Edge cases:**
- `p.dimensions = null` — `hasDimensions` is falsy, `dims = null` ✓
- `p.dimensions = { width: 0, height: 0, depth: 0 }` — `hasDimensions` is false, `dims = null` ✓
- `p.dimensions = { width: 100, height: 0, depth: 0 }` — `hasDimensions` is true, dims show ✓
- `p.image_url` is `http://127.0.0.1:8069/...` (dev env) — renders in dev; in prod will be `https://cdn.oaksome.com/...` ✓

## Simplicity Budget

- Files changed: 1 (`produit/[id]/page.tsx`)
- New modules: no
- New dependencies: no
- Lines changed: ~6 lines modified

## Assumptions

1. `p.image_url` is typed as `string | null | undefined` in `Product` type — the `??` handles all cases.
2. The dimension block rendering in the JSX uses `{dims && <span>{dims}</span>}` or equivalent conditional — if not, the fix still works because `dims = null` is falsy.
3. When the Odoo backend is fixed and returns real images in `p.images[]`, the fallback will be bypassed correctly (priority: `images[0].url > image_url`).

## Open Questions

1. **What type is `p.image_url` in `Product`?** — Likely `string` from the API shape. Check `src/types/product.ts` before implementing to ensure `??` chain is type-safe.
   - Options: (A) `string` → `??` is valid, (B) `string | false` → need `|| null` instead, (C) `string | undefined` → `??` is valid.
   - Recommendation: Check at implementation time; adjust chain if needed. Not blocking — executor resolves by reading the type file.

## Resolved Decisions

- Use `??` (nullish coalescing) not `||` to preserve empty-string behaviour.
- Use named boolean `hasDimensions` for readability rather than inline ternary.
- Do not introduce a "dimensions not available" placeholder text — hide the block entirely (cleaner UX than showing "N/A").

## Design Governance

Not required (low risk, no affected interfaces).

## Dependency Freshness

not_required

## Observability Impact

none
