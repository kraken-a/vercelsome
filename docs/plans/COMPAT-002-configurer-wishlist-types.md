---
task_id: COMPAT-002
title: Fix configurer WishlistItem type errors
status: done
resolution: "2026-05-17 — Verified complete. tsc --noEmit passes; no WishlistItem type errors in configurer/page.tsx."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope: [configurer/page.tsx]
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
---

# COMPAT-002 — Fix configurer/page.tsx WishlistItem type errors

## Objective

Two type errors in `src/app/[locale]/(shop)/configurer/page.tsx`:
1. Line 201: `addedAt` property doesn't exist on `WishlistItem` (correct field is `favDate`)
2. Line 203: `addToWishlist(item)` — `addToWishlist` is `addItem` from WishlistContext which expects `(productId: number, config?)`, not a full `WishlistItem`

## Root cause

Line 110: `const { addItem: addToWishlist } = useWishlist()` — correct alias.
Lines 195–203: builds a `WishlistItem` object with wrong field name, then passes whole object instead of `(productId, config)`.

## Fix

Replace lines 194–203:
```ts
// BEFORE
if (result?.product_id) {
    const item: WishlistItem = {
        productId: result.product_id,
        name: (result.product_name as string) || (data.name as string),
        price: 0,
        imageUrl: (result.image_base64 as string) || '',
        config: data as Record<string, string>,
        addedAt: new Date().toISOString(),
    }
    addToWishlist(item)
}
```

```ts
// AFTER
if (result?.product_id) {
    await addToWishlist(result.product_id as number, data as Record<string, unknown>)
}
```

The context's `addItem` calls the API and refreshes the wishlist from server — it does not need the local `name`, `price`, `imageUrl` fields.

## Scope

- `src/app/[locale]/(shop)/configurer/page.tsx` — lines 194–203 only
- Remove unused `WishlistItem` import if it becomes unused after this change
- Do NOT modify WishlistItem type, context, or hooks

## Test Requirements

- No `addedAt` in any WishlistItem literal
- `addToWishlist` called with `(number, Record<string, unknown>)` signature
- `npm run type-check` passes for this file
