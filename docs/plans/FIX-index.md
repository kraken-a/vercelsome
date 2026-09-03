---
artifact_type: execution_index
scope: Production blockers — search proxy, home 500, product display
created: 2025-05-15
---

# Execution Index — Production Bug Fixes (FIX-001 → FIX-003)

## Summary

3 surgical fixes for production-blocking issues found in the May 2025 production-readiness audit.
All 3 tasks touch different files with no write-write conflicts → all parallelizable.

## Execution Graph

```
Layer 0 (all parallel — no dependencies between them):
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │   FIX-001   │   │   FIX-002   │   │   FIX-003   │
  │ Search URL  │   │ Home 500 log│   │ Product img │
  │ 1 file, 1ln │   │ 1 file, 3ln │   │ 1 file, 6ln │
  └─────────────┘   └─────────────┘   └─────────────┘
```

All 3 can be executed by a single executor sequentially, or assigned to 3 parallel agents.
No shared files, no shared state.

## Task List

| ID | Title | File | Risk | Status |
|---|---|---|---|---|
| FIX-001 | Fix search bypassing proxy | `header-client.tsx:63` | low | todo |
| FIX-002 | Home page error logging for Odoo 500 | `(marketing)/page.tsx` | low | todo |
| FIX-003 | Product image fallback + zero-dimension guard | `produit/[id]/page.tsx` | low | todo |

## Parallel Groups

```yaml
parallel_groups:
  - group_id: layer_0
    tasks: [FIX-001, FIX-002, FIX-003]
    rationale: >
      Each task touches a single distinct file.
      No conflict_scope overlap. No shared Impact Checklist domains.
      No integration_blockers between them.
```

## Wave Rationale

Single wave. All 3 tasks are independent surgical edits. No task produces output consumed by another.

## Verification Gate (after all 3 complete)

- [ ] `npm run type-check` passes (no new type errors)
- [ ] `npm run lint` passes
- [ ] Browser: search box triggers request to `/api/oaksome/v1/search` (not `localhost:8069`)
- [ ] Server log: `[home] Odoo /v1/home failed:` appears when Odoo endpoint is broken
- [ ] Product page `/fr/produit/1256570`: shows image from `image_url`; no "L0 × H0 × P0 cm"

## Out of Scope (companion Odoo tasks)

The following require fixes in the Odoo `oaksome_website` addon (separate repo):
- Fix root cause of `/api/oaksome/v1/home` returning 500
- Populate product `images[]` field properly
- Set correct `webpage_url` domain (currently points to vercel.app)
- Populate product `dimensions`, `collection`, `type`, `spaces` fields
- Clear "testing"/"TEST" promo bar notice before launch
