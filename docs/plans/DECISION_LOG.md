# Decision Log — Oaksome Next.js × Odoo

Date: 2026-04-09  
Status: **Validated decisions for build kickoff**

## Scope
This document consolidates all validated planning decisions across:
- Next.js repo (`oaksome-web` + `oaksome/tasks`)
- Odoo repo (`odoo/tecnibo/website/tasks`)
- Cross-team integration with R&D configurator component

---

## 1) API Contract Freeze

1. Source of truth priority:
   1) `docs/api-contract.md`  
   2) `tasks/*.md`  
   3) code
2. API policy: **v1 frozen** before implementation.
3. Contract format: hybrid
   - primary narrative: `docs/api-contract.md`
   - canonical examples: `contracts/oaksome-api-v1/...`
4. Payload naming: `snake_case`.
5. Money format: integer minor units + `currency`.
6. Date/time: ISO 8601 UTC (`...Z`).
7. Nullability: explicit `null` by default; omit only when documented conditional.
8. Error schema: unified with `code`, `message`, `details`, `request_id`.
9. Pagination/meta: `total`, `page`, `limit`, `has_next` (page starts at 1).
10. Auth/session failures: HTTP `401` with `AUTH_REQUIRED` / `SESSION_EXPIRED`.
11. Country rule: `?country=BE|LU`, default `BE`, invalid => `400 INVALID_COUNTRY`, echo `meta.country`.
12. Language rule: `?lang=en|fr|nl`, default `en`, invalid => `400 INVALID_LANG`, echo `meta.lang`.
13. Version transport: URL prefix `/api/oaksome/v1/...`.
14. Canonical samples per endpoint:
    - mandatory: `success.json`, `error.json`
    - optional: `empty.json` when relevant.
15. Change governance (post-freeze):
    - `CHANGE-ID`
    - update contract first
    - update examples
    - mark breaking/non-breaking
    - dual approval (Odoo + Next.js)
16. Freeze rollout:
    - Wave 1: Tier 1–3
    - Wave 2: Tier 4–5
17. Ownership:
    - primary: Odoo/API owner
    - co-owner/validator: Next.js owner

---

## 2) Ownership Boundaries & Pricing Flow

### Validated boundary
- Pricing for **new configured products** comes from the R&D configurator component.
- For **existing products**, Next.js can use cached current price.
- **Final price authority is Odoo at checkout** (mandatory revalidation).

### Pricing behavior decisions
1. Existing product price source: cache/local state allowed.
2. Cache policy: short TTL + `price_updated_at`/`price_version` + refetch on expiration.
3. Checkout mismatch handling: block confirmation, show old vs new total, require reconfirmation.
4. Inter-system errors standardized (`PRICING_UNAVAILABLE`, `PRICING_TIMEOUT`, `PRICE_REVALIDATION_FAILED`).
5. Pricing timeout/retry: 3s timeout, 2 retries (300ms, 700ms).
6. Observability choice: basic logs (no global correlation ID requirement).
7. R&D pricing call path: via **Next.js server** (not browser direct).
8. Add-to-cart requires price snapshot metadata (amount/currency/source/version/computed_at).
9. Currency-country mismatch choice: auto-correct to EUR (non-blocking).
10. If new product pricing unavailable: save config allowed; cart/checkout blocked until pricing succeeds.
11. Cache invalidation: compare `price_updated_at`/`price_version`.

---

## 3) Odoo Addon Strategy (Legacy-safe)

1. Two-addon architecture approved:
   - `oaksome_nextjs_core`
   - `oaksome_nextjs_api`
2. Dependency direction: `api -> core`.
3. Controllers for `/api/oaksome/v1/*`: only in `oaksome_nextjs_api/controllers/`.
4. Custom models/fields: only in `oaksome_nextjs_core/models/`.
5. Reusable business logic: `oaksome_nextjs_core/services/`.
6. Security policy:
   - public/user auth per endpoint
   - strict ownership checks
   - no unjustified `sudo()` in API controllers
7. Legacy migration strategy (`oaksome_website`):
   - Step 1: Build & parity
   - Step 2: Shadow validation (staging)
   - Step 3: Prod cutover + uninstall legacy
8. Rollback: required, scripted/checklisted, with monitored window and trigger criteria.
9. Test strategy for addons:
   - unit/service tests (core)
   - API contract tests (api)
   - integration smoke tests

---

## 4) Delivery Workflow (Ayoub/Ahmed)

1. Branch naming:
   - `ADD-nextjs-<milestone>-<owner>`
   - `ADD-odoo-<milestone>-<owner>`
   - 1 milestone = 1 branch
2. PR size policy: soft guideline only.
3. Mandatory merge checks:
   - lint
   - type-check (Next.js)
   - relevant tests
   - contract sample update (if API changed)
   - at least 1 reviewer approval
4. Review model: Ayoub ↔ Ahmed cross-review by default; extra reviewer for sensitive changes.
5. Merge strategy: **squash merge** by default.
6. Hotfix workflow:
   - `FIX-<repo>-hotfix-<short-desc>`
   - minimal scope
   - fast-track review
   - post-fix regression check
   - backport/changelog note
7. Milestone DoD: full 6-point criteria (code, tests, checks, acceptance, evidence, task status).
8. Conflict protocol: dependency-first merges + rebase dependent PR.
9. Release cadence:
   - staging: daily
   - production: 2x/week (except hotfix)

---

## 5) Environment & Configuration Readiness

1. Environments: local + staging + production.
2. Staging policy: high parity with production behavior.
3. Env var governance: strict, documented, fail-fast, `.env.example` maintained.
4. Secret management: platform-managed only, no git secrets, rotation policy, least privilege.
5. CORS/cookies: strict per environment + auth/session dedicated tests.
6. Feature flags: not adopted for now.
7. Health/readiness checks: required (Next.js + Odoo + pre-release checks).
8. Alerts/logging: alerts in production only (staging logs minimum).
9. Backup policy (adapted for large DB):
   - backup before release/cutover
   - full restore drill before major cutover + periodically
   - intermediate backup validity checks

---

## 6) Data Readiness

1. Ownership split:
   - Oaksome team seeds own domains
   - configurator data/pricing owned by R&D
2. Temporary mode until R&D alignment: mock/contract only for configurator integration.
3. Staging reset: scheduled + on-demand scripted reset.
4. Test accounts: fixed role-based accounts.
5. Anonymization: partial masking (obvious sensitive fields).
6. Fixture ownership: domain-based (Odoo API / Next.js adapters / R&D configurator later).
7. Migration decision: **no legacy data migration needed**.
8. Seed volume: minimal dataset (intentional choice).

> Pending alignment item:
> - Live integration communication/process with R&D to be discussed later.

---

## 7) QA & Go-live Readiness

1. QA gate: soft gate (bypass with approval allowed).
2. UAT sign-off: dual sign-off required (business + technical).
3. Severity policy:
   - P0/P1 block release
   - P2 release only with explicit approval + mitigation
   - P3 can release, backlog
4. Post-deploy smoke tests: mandatory.
5. Production confidence window after deploy: mandatory.
6. Release incident ownership: named primary + backup.
7. Checklists: separate per team (not one shared single checklist).

---

## Final Note
All 7 planning points are validated and can be used as the execution baseline for implementation kickoff.
