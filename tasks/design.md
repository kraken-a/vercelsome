---
contract_version: v2
artifact_type: design
scope: "Security remediation plan from reviews/SEC-AUDIT-2026-06-12.md (TASK-040 … TASK-058)"
date: 2026-06-12
---

# Design — Security Hardening Waves (audit 2026-06-12)

Source audit: `reviews/SEC-AUDIT-2026-06-12.md`. Nineteen surgical-fix tasks across two codebases:
the Next.js frontend (`oaksome-web/`) and the Odoo addons (`/home/rachid/01_Workspace/odoo/custom/website/`).

## Shared design concepts (govern every task)

1. **No session minting outside `authenticate()`** — public endpoints never grant sessions
   (TASK-040), and clients never inject session cookies from unverified senders (TASK-043, TASK-051).
2. **Ownership at the lookup** — every record-returning/mutating endpoint scopes by
   `request.env.user.partner_id` next to the search, mirroring the already-correct
   `get_so2_balance` pattern; obscurity (sequential IDs) is never access control (TASK-041).
3. **Privilege per operation, never per environment** — `su=True` on a shared env helper is
   replaced by documented, scoped `.sudo()` calls (TASK-046); ACL/record rules state the intent
   declaratively (TASK-056).
4. **Validate at the boundary, generic errors out** — Zod (frontend, TASK-052) and per-field checks
   (backend, TASK-049) gate inputs; internal exception text never reaches clients (TASK-047).
5. **Untrusted HTML/JS sinks are encoded or sanitized** — `JSON.stringify` for script contexts
   (TASK-042), DOMPurify allowlist for HTML (TASK-044), `textContent` for DOM text (TASK-043).
6. **Security controls fail closed** — middleware gate (TASK-050), image proxy pattern gate
   (TASK-045), trusted-IP rate limiting (TASK-053), no unguarded ingress side doors (TASK-054).

## Module map / boundaries

| Area | Files | Tasks |
|---|---|---|
| Odoo controllers (sequential chain — same file `api.py`) | `api.py` | 041 → 046 → 047 → 049 → 057 |
| Odoo mail controller | `send_mail.py` | 040 |
| Odoo rating controller | `product_rating.py` | 048 |
| Odoo security matrix | `ir.model.access.csv`, `ir_rules.xml` | 056 |
| Odoo core service | `auth_service.py` | 057 |
| Frontend pages/components | collection page, configurer client, etude-de-cas client, checkout client | 042, 043, 044, 052 |
| Frontend API routes | image, contact, newsletter, configurator, revalidate, catch-all proxy | 045, 047, 051, 052 |
| Frontend platform | `middleware.ts`, `next.config.mjs`, `rate-limit.ts`, `auth-invite.ts`, env examples | 050, 053, 054, 055, 058 |

Cross-codebase note: backend tasks deploy via module upgrade on the Odoo host (outside this repo);
frontend tasks gate on `npm run build` per AGENTS.md. The two streams are independent except that
TASK-041 (endpoint auth) should land before or with any frontend change that assumes authenticated
order endpoints (frontend already sends sessions — no frontend change required).

## Interfaces affected (aggregate)

- `POST /shop/send_config_email` — loses implicit-login side effect (040).
- `projects/<id>/info`, `get_so_line_config`, `cart/confirm-order` — gain auth/ownership (041).
- Product rating — `auth='public'` → `auth='user'` (048).
- Frontend proxy — cookie allowlist (051); legacy `/shop|/wishlist|/cart` rewrites guarded (054).
- `oaksome_auth` cookie contract — server-set or removed (055).
- Image proxy — strict path/content-type/redirect policy (045).

## Failure modes & mitigations (plan level)

- **Hidden coupling to removed behavior** (implicit login 040, su=True 046, legacy rewrites 054,
  dropped cookies 051): every such task carries a staging QA flow list and `before_coding` gates
  where the dependency is unconfirmed (040 Q1, 041 Q1, 046 Q1, 054 Q1).
- **Over-restriction breaking revenue flows** (configurator, cart, checkout): e2e journeys are
  mandatory verification in 043, 048, 051, 054, 056.
- **Same-file write conflicts**: `api.py` chain is strictly sequential; `middleware.ts` tasks
  (050 → 055, and 054 touching the matcher) are sequenced via integration_blockers.

## Test strategy (plan level)

- Backend: Odoo HTTP tests per endpoint (anonymous / owner / foreign-partner matrix), ACL matrix
  tests (056), failure-injection for error-message checks (047).
- Frontend: route unit tests with hostile fixtures (traversal, encoding, oversized, XSS payloads),
  middleware integration tests, `npm run lint && type-check && test && build`, and
  `npm run test:e2e` for configurator/cart/checkout/auth journeys.
- Security regression suite: the audit's attack scenarios become the test fixtures — each Critical/High
  finding gets a test that re-runs its exploit and asserts rejection.

## Open decisions routed to before_coding gates

| Task | Decision | Recommendation |
|---|---|---|
| 040 | Does any flow depend on implicit login? | A: none — delete outright |
| 041 | Technician access to line config | A: short-lived HMAC token |
| 046 | Staging QA scope for su=True removal | A: full six-flow staging QA |
| 054 | Legacy rewrite dependents | B: keep GET-only, guard mutations (pending sweep) |
