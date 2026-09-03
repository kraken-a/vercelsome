---
task_id: COMPAT-001
title: Create missing @/features/toast/context module
status: done
resolution: "2026-05-17 — Verified complete. src/features/toast/context.tsx exists and is consumed by cart/wishlist contexts via useToast()."
risk_level: low
edit_mode: new_file
parallelizable: true
conflict_scope: []
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
---

# COMPAT-001 — Create missing @/features/toast/context

## Objective

Three files import from `@/features/toast/context` which does not exist on disk:
- `src/app/[locale]/layout.tsx:19` — imports `ToastProvider`
- `src/app/[locale]/(shop)/panier/page.tsx:8` — imports `useToast`
- `src/app/[locale]/(shop)/wishlist/page.tsx:8` — imports `useToast`

Create `src/features/toast/context.tsx` implementing `ToastProvider` and `useToast`.

## API contract (from call sites)

```ts
// layout.tsx wraps children
<ToastProvider>...</ToastProvider>

// page.tsx usage
const toast = useToast()
toast.show('Article déplacé vers la wishlist')
toast.show('Erreur lors de la sauvegarde', 'error')
```

## Implementation

Create `src/features/toast/context.tsx`:
- `ToastState` type: `{ id: string; message: string; type: 'success' | 'error' | 'info' }`
- `ToastContext` with `show(message: string, type?: 'success' | 'error' | 'info') => void`
- `ToastProvider` renders a fixed-position toast list + `<ToastContext.Provider>`
- `useToast()` hook — throws if used outside provider
- Auto-dismiss after 3000ms
- Minimal styling inline (no external CSS dependency)

## Scope

- New file: `src/features/toast/context.tsx`
- No modifications to existing files

## Test Requirements

- `show('msg')` adds a toast with type `'info'` by default
- `show('msg', 'error')` adds with type `'error'`
- Toast auto-dismissed after 3000ms
- `useToast` throws outside provider
