---
contract_version: v2
artifact_type: task_index
task_family: FIX
revision: 1
revision_note: "2026-05-15 — Initial FIX master index. 29 tasks across 5 waves. FIX-ODOO-001 skipped (resolved by Rachid on 2026-05-15). HOTFIX-001 reopened (QA-013 §5 confirms cache error still recurs on warm dev server)."
---

# FIX Master Index — Production Fix Backlog

**Source**: `reviews/QA-014-fix-backlog.md` + `reviews/QA-014-report.md`
**Total tasks**: 29 (out of 30 ranked slugs — FIX-ODOO-001 excluded, already resolved)
**HOTFIX-001**: Reopened (status changed to `todo` in `tasks/HOTFIX-001-webpack-nextintl-cache.md`)

## Completed / Excluded

| Slug | Reason |
|---|---|
| FIX-ODOO-001 | **Already resolved** by Rachid on 2026-05-15. `crm.lead id=26935` deleted on production Odoo. No task file created. |

---

## Execution Graph

```yaml
execution_graph:
  # Wave 0 — Pre-deploy (serialize in order)
  - { id: HOTFIX-001, after: [] }
  - { id: FIX-SEC-003, after: [HOTFIX-001] }
  - { id: FIX-SEC-001, after: [FIX-SEC-003] }
  - { id: FIX-SEC-002, after: [HOTFIX-001] }

  # Wave 1 — Cart & Wishlist (serialize CART-001 → CART-002, rest parallel)
  - { id: FIX-CART-001, after: [FIX-SEC-001] }
  - { id: FIX-CART-002, after: [FIX-CART-001] }
  - { id: FIX-CART-003, after: [FIX-SEC-001] }
  - { id: FIX-CART-004, after: [FIX-CART-003] }
  - { id: FIX-CART-005, after: [FIX-CART-003, FIX-CART-004] }
  - { id: FIX-CART-006, after: [FIX-CART-003] }
  - { id: FIX-CART-007, after: [FIX-CART-004] }

  # Wave 2 — Auth & Security (FIX-AUTH-001 blocks FIX-SEC-007)
  - { id: FIX-AUTH-001, after: [FIX-SEC-001] }
  - { id: FIX-SEC-004, after: [FIX-SEC-001] }
  - { id: FIX-SEC-005, after: [FIX-AUTH-001] }
  - { id: FIX-SEC-006, after: [] }
  - { id: FIX-SEC-007, after: [FIX-AUTH-001, FIX-SEC-005] }

  # Wave 3 — Tracking & Analytics (FIX-TRACK-002 first, then TRACK-001 in same PR)
  - { id: FIX-TRACK-002, after: [FIX-SEC-001] }
  - { id: FIX-TRACK-001, after: [FIX-TRACK-002] }
  - { id: FIX-TRACK-003, after: [FIX-TRACK-002] }
  - { id: FIX-TRACK-004, after: [FIX-TRACK-003] }
  - { id: FIX-TRACK-005, after: [FIX-TRACK-002] }
  - { id: FIX-TRACK-006, after: [FIX-TRACK-003] }

  # Wave 4 — Content & Routing (mostly parallel, distinct file scopes)
  - { id: FIX-CONTENT-001, after: [] }
  - { id: FIX-CONTENT-002, after: [] }
  - { id: FIX-ROUTING-001, after: [] }
  - { id: FIX-CONTENT-003, after: [] }
  - { id: FIX-CONTENT-004, after: [FIX-CART-003] }
  - { id: FIX-CONTENT-005, after: [] }
  - { id: FIX-CONTENT-006, after: [] }
```

---

## Parallel Groups

```yaml
parallel_groups:

  - wave: 0
    label: "Pre-deploy — must land before any production deployment"
    note: "FIX-SEC-003 dep-bump must run first (clears CVE). FIX-SEC-001 after dep-bump (same file: next.config.mjs). FIX-SEC-002 is independent but in Wave 0 by policy."
    tasks:
      - id: HOTFIX-001
        conflict_scope: [oaksome-web/next.config.mjs]
      - id: FIX-SEC-003
        conflict_scope: [oaksome-web/package.json, oaksome-web/package-lock.json]
        after: [HOTFIX-001]
      - id: FIX-SEC-001
        conflict_scope: [oaksome-web/next.config.mjs]
        after: [FIX-SEC-003]
        note: "SERIALIZE after HOTFIX-001 — both touch next.config.mjs"
      - id: FIX-SEC-002
        conflict_scope: [oaksome-web/src/app/[locale]/(auth)/login/page.tsx]
        note: "Can run in parallel with FIX-SEC-001 (different files)"
    max_parallel: 2
    serialize_pairs:
      - [HOTFIX-001, FIX-SEC-003]
      - [FIX-SEC-003, FIX-SEC-001]

  - wave: 1
    label: "Cart & Wishlist — conversion-critical"
    tasks:
      - id: FIX-CART-001
        conflict_scope: [oaksome-web/src/components/header/header.tsx]
      - id: FIX-CART-002
        conflict_scope: [oaksome-web/src/components/header/header.tsx]
        after: [FIX-CART-001]
        note: "SERIALIZE after CART-001 — same file header.tsx"
      - id: FIX-CART-003
        conflict_scope: [oaksome-web/src/features/cart/context.tsx, oaksome-web/src/features/wishlist/context.tsx]
      - id: FIX-CART-004
        conflict_scope: [oaksome-web/src/app/[locale]/(shop)/panier/page.tsx, oaksome-web/src/app/[locale]/(shop)/wishlist/page.tsx]
        after: [FIX-CART-003]
      - id: FIX-CART-005
        conflict_scope: [oaksome-web/src/app/[locale]/(shop)/produit/[id]/page.tsx]
        after: [FIX-CART-003, FIX-CART-004]
      - id: FIX-CART-006
        conflict_scope: [oaksome-web/src/features/wishlist/context.tsx, oaksome-web/src/components/wishlist/anon-wishlist-modal.tsx]
        after: [FIX-CART-003]
      - id: FIX-CART-007
        conflict_scope: [oaksome-web/src/app/[locale]/(shop)/acheter/page.tsx, oaksome-web/src/features/wishlist/context.tsx]
        after: [FIX-CART-004]
    max_parallel: 3
    serialize_pairs:
      - [FIX-CART-001, FIX-CART-002]

  - wave: 2
    label: "Auth & Security — can run in parallel with Wave 3 (distinct conflict_scopes)"
    tasks:
      - id: FIX-AUTH-001
        conflict_scope: [oaksome-web/src/middleware.ts]
        risk_level: medium
      - id: FIX-SEC-004
        conflict_scope: [oaksome-web/src/app/api/odoo/, oaksome-web/src/lib/rate-limit.ts]
        risk_level: medium
      - id: FIX-SEC-005
        conflict_scope: [oaksome-web/src/app/api/oaksome/[...path]/route.ts]
        after: [FIX-AUTH-001]
      - id: FIX-SEC-006
        conflict_scope: [oaksome-web/src/app/api/oaksome/[...path]/route.ts]
        note: "Serialize with FIX-SEC-005 — same file"
        after: [FIX-SEC-005]
      - id: FIX-SEC-007
        conflict_scope: [oaksome-web/src/app/api/oaksome/[...path]/route.ts]
        after: [FIX-AUTH-001, FIX-SEC-005, FIX-SEC-006]
        note: "SERIALIZE after FIX-AUTH-001 (middleware) and FIX-SEC-005/006 (same proxy file)"
    max_parallel: 2
    serialize_pairs:
      - [FIX-SEC-005, FIX-SEC-006]
      - [FIX-SEC-006, FIX-SEC-007]

  - wave: 3
    label: "Tracking & Analytics — can run in parallel with Wave 2"
    tasks:
      - id: FIX-TRACK-002
        conflict_scope: [oaksome-web/src/app/[locale]/layout.tsx, oaksome-web/src/lib/tracking/gtm.ts]
        risk_level: medium
      - id: FIX-TRACK-001
        conflict_scope: [oaksome-web/src/app/[locale]/layout.tsx]
        after: [FIX-TRACK-002]
        note: "SERIALIZE after TRACK-002 — same file layout.tsx"
      - id: FIX-TRACK-003
        conflict_scope: [oaksome-web/src/lib/tracking/gtm.ts]
        after: [FIX-TRACK-002]
      - id: FIX-TRACK-004
        conflict_scope: [oaksome-web/src/app/[locale]/layout.tsx, oaksome-web/src/app/[locale]/(shop)/produit/[id]/page.tsx, oaksome-web/src/features/wishlist/context.tsx, oaksome-web/src/app/api/odoo/configurator/route.ts, oaksome-web/src/app/[locale]/(shop)/acheter/page.tsx]
        after: [FIX-TRACK-003]
      - id: FIX-TRACK-005
        conflict_scope: [oaksome-web/src/app/api/tracking/capi/route.ts]
        after: [FIX-TRACK-002]
        note: "Parallel with TRACK-003 — different files"
      - id: FIX-TRACK-006
        conflict_scope: [oaksome-web/src/lib/tracking/gtm.ts]
        after: [FIX-TRACK-003]
        note: "Serialize with TRACK-003 — same file gtm.ts"
    max_parallel: 2
    serialize_pairs:
      - [FIX-TRACK-002, FIX-TRACK-001]
      - [FIX-TRACK-003, FIX-TRACK-006]

  - wave: 4
    label: "Content & Routing — mostly parallelizable, distinct file scopes"
    tasks:
      - id: FIX-CONTENT-001
        conflict_scope: [oaksome-web/src/app/[locale]/(marketing)/etude-de-cas/page.tsx]
      - id: FIX-CONTENT-002
        conflict_scope: [oaksome-web/src/app/[locale]/(marketing)/a-propos/page.tsx, oaksome-web/src/app/[locale]/(marketing)/comment-ca-marche/page.tsx]
      - id: FIX-ROUTING-001
        conflict_scope: [oaksome-web/src/i18n/routing.ts, oaksome-web/src/app/[locale]/(shop)/espaces/]
      - id: FIX-CONTENT-003
        conflict_scope: [oaksome-web/src/app/[locale]/(marketing)/tva-6/page.tsx]
      - id: FIX-CONTENT-004
        conflict_scope: [oaksome-web/src/app/[locale]/(marketing)/(pro)/pro/inscription/page.tsx]
      - id: FIX-CONTENT-005
        conflict_scope: [oaksome-web/src/app/[locale]/(marketing)/mentions-legales/page.tsx]
      - id: FIX-CONTENT-006
        conflict_scope: [oaksome-web/src/app/[locale]/(marketing)/cookies/page.tsx]
    max_parallel: 7
    serialize_pairs: []
    note: "All Wave 4 tasks have disjoint conflict_scopes — fully parallelizable. FIX-CONTENT-004 requires FIX-CART-003 (401 feedback) from Wave 1."
```

---

## Task List

| Wave | Rank | Slug | Title | Severity | Complexity | Risk | Status |
|------|------|------|-------|----------|------------|------|--------|
| 0 | — | HOTFIX-001 | Fix webpack SSR module error (reopened) | CRITICAL | M | low | done |
| 0 | 2 | FIX-SEC-003 | npm audit fix — patch next-intl CVE | HIGH | S | low | todo |
| 0 | 3 | FIX-SEC-001 | Add security headers (CSP, HSTS, X-Frame, etc.) | CRITICAL | S | medium | todo |
| 0 | 4 | FIX-SEC-002 | Validate next= param on login page | HIGH | S | low | todo |
| 1 | 6 | FIX-CART-001 | Connect header cart button to CartContext | CRITICAL | S | low | todo |
| 1 | 7 | FIX-CART-002 | Fix header wishlist counter (stale localStorage key) | CRITICAL | S | low | todo |
| 1 | 8 | FIX-CART-003 | Show feedback on anonymous cart/wishlist 401 | CRITICAL | S | low | todo |
| 1 | 9 | FIX-CART-004 | Fix cross-stream buttons (legacy JSON-RPC → REST) | CRITICAL | M | low | todo |
| 1 | 10 | FIX-CART-005 | Add "Add to Cart" button on PDP | HIGH | M | low | todo |
| 1 | 11 | FIX-CART-006 | Anonymous wishlist email popup / lead creation | HIGH | M | low | todo |
| 1 | 12 | FIX-CART-007 | Unify wishlist state (localStorage + WishlistContext) | HIGH | M | low | todo |
| 2 | 13 | FIX-AUTH-001 | Add edge auth guard in middleware | CRITICAL | M | medium | todo |
| 2 | 14 | FIX-SEC-004 | Add rate limiting to auth/lead/newsletter routes | HIGH | M | medium | todo |
| 2 | 15 | FIX-SEC-005 | Add CORS allowlist to API routes | HIGH | S | low | todo |
| 2 | 16 | FIX-SEC-006 | Enforce httpOnly + Secure on re-emitted cookies | HIGH | S | low | todo |
| 2 | 17 | FIX-SEC-007 | Add Origin/Referer CSRF check on proxy mutations | HIGH | M | medium | todo |
| 3 | 18 | FIX-TRACK-001 | Inject GTM snippet in layout.tsx | CRITICAL | S | low | todo |
| 3 | 19 | FIX-TRACK-002 | Integrate Axeptio CMP | CRITICAL | M | medium | todo |
| 3 | 20 | FIX-TRACK-003 | Add consent guard to pushEvent() | HIGH | S | low | todo |
| 3 | 21 | FIX-TRACK-004 | Wire Tier A event call-sites | HIGH | M | low | todo |
| 3 | 22 | FIX-TRACK-005 | Create /api/tracking/capi route | HIGH | M | low | todo |
| 3 | 23 | FIX-TRACK-006 | Fix GA4 e-commerce schema (item_id, items array) | HIGH | S | low | todo |
| 4 | 24 | FIX-CONTENT-001 | Create /etude-de-cas index page | HIGH | S | low | todo |
| 4 | 25 | FIX-CONTENT-002 | Replace hardcoded .html hrefs in static pages | HIGH | S | low | todo |
| 4 | 26 | FIX-ROUTING-001 | Fix Drift A (espace vs espaces slug mismatch) | HIGH | S | low | todo |
| 4 | 27 | FIX-CONTENT-003 | Complete /fr/tva-6 legal page | MEDIUM | S | low | todo |
| 4 | 28 | FIX-CONTENT-004 | Implement /fr/pro/inscription page + form | MEDIUM | M | low | todo |
| 4 | 29 | FIX-CONTENT-005 | Fix mentions-légales placeholders | LOW | S | low | todo |
| 4 | 30 | FIX-CONTENT-006 | Fix cookies page (Mollie → Stripe) | LOW | S | low | todo |

---

## Wave Rationale

| Wave | Rationale |
|------|-----------|
| Wave 0 | Pre-deploy safety net: webpack cache fix, CVE patch, security headers, login redirect guard. No production deploy until these land. |
| Wave 1 | Conversion-critical: cart counter, wishlist counter, anonymous feedback, cross-stream mutations. These directly block revenue. |
| Wave 2 | Auth & security hardening: edge auth guard, rate limiting, CORS, cookie flags, CSRF. Can run in parallel with Wave 3. |
| Wave 3 | Tracking foundation: GTM injection, CMP consent, event wiring. Legal compliance (GDPR). Can run in parallel with Wave 2. |
| Wave 4 | Content and routing: missing pages, broken links, legal copy. Fully parallelizable within the wave. |

---

## Critical Path

Longest dependency chain (must serialize end-to-end):

```
HOTFIX-001 → FIX-SEC-003 → FIX-SEC-001 → FIX-CART-001 → FIX-CART-002
```
(5 sequential tasks, minimum time before cart is fully functional)

Second critical path (tracking):
```
FIX-SEC-001 → FIX-TRACK-002 → FIX-TRACK-001 → FIX-TRACK-003 → FIX-TRACK-004
```

---

## Hard Constraints

- Do NOT deploy to production until Wave 0 is fully complete.
- FIX-TRACK-001 (GTM) must NOT be deployed without FIX-TRACK-002 (Axeptio) — GDPR violation.
- FIX-SEC-001 and HOTFIX-001 both touch `next.config.mjs` — never run in parallel.
- FIX-AUTH-001 and FIX-SEC-007 both involve the proxy/middleware layer — serialize.
- FIX-CART-001 and FIX-CART-002 both touch `header.tsx` — serialize (CART-002 after CART-001).

---

## Open Questions (Aggregated — Rachid must answer before FIX run starts)

Priority blocking questions:

1. **FIX-TRACK-002**: Does an Axeptio account for Oaksome exist? What is the `clientId` and `cookiesVersion`?
2. **FIX-SEC-004**: Rate limiting strategy: in-memory (simpler) or Upstash/Redis (persistent)?
3. **FIX-ROUTING-001**: Rename filesystem to `espace/` (Option A) or update `routing.ts` to `espaces/` (Option B)?
4. **FIX-TRACK-005**: What are the `META_CAPI_ACCESS_TOKEN` and `META_CAPI_PIXEL_ID` values for production?
5. **FIX-CONTENT-006**: Is the payment provider Stripe or Mollie? (Blocking legal page fix.)
6. **FIX-TRACK-001**: What is the `NEXT_PUBLIC_GTM_ID` container ID?
7. **FIX-SEC-001**: Is the Axeptio script CDN `cdn.axeptio.eu`? (Needed for CSP `script-src`.)
8. **FIX-CART-005**: Is direct "Add to Cart" from PDP intended (vs. always going through configurator)?
9. **FIX-CONTENT-005**: What is Oaksome's registered office address and legal entity name?
10. **FIX-CONTENT-003**: Can Rachid provide TVA-6% legal copy?

---

## Pipeline Memory Inputs

- Source QA data: `reviews/QA-014-fix-backlog.md`, `reviews/QA-014-report.md`
- Individual QA evidence: `reviews/QA-004-report.md`, `reviews/QA-005-report.md`, `reviews/QA-007-report.md`, `reviews/QA-011-report.md`, `reviews/QA-012-report.md`, `reviews/QA-013-report.md`
- Template: `tasks/QA-002-catalogue-deep-test.md` (section structure)
- Style: `tasks/FIX-001-search-proxy-bypass.md` (frontmatter convention)

---

## Out of Scope (Wave 5+)

| Slug | Title |
|---|---|
| FIX-A11Y-001 | Accessibility blockers (WCAG 2.1 AA) |
| FIX-API-001 | Migrate acheter page from legacy `/api/odoo/*` |
| FIX-FUNNEL-001 | Implement echantillons sub-funnels |
| FIX-TRACK-007 | Capture gclid/fbclid into first-party cookies |
| FIX-PERF-001 | Convert /fr/acheter from CSR to SSR/ISR |
| FIX-SEC-008 | Add Zod body validation to POST routes |
| FIX-ROUTING-002 | Remove duplicate /collections/[slug] route |

Deferred i18n (NL locale): tracked in backlog, addressed in later phase.
