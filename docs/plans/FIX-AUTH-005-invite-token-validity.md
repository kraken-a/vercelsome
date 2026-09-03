---
contract_version: v2
artifact_type: task
task_id: FIX-AUTH-005
title: LandingGate cookie validates presence only — any value passes; harden before public launch
status: done
risk_level: medium
edit_mode: surgical_edit
parallelizable: true
parallel_group: "wave-public-launch-hardening"
conflict_scope:
  - oaksome-web/src/middleware.ts
  - oaksome-web/src/lib/auth-invite.ts
  - oaksome-web/src/app/[locale]/landing/page.tsx
integration_blockers: []
human_approval_stages:
  - before_coding
risk_triggers:
  - the current gate is presence-only — once any visitor or scraper sets the cookie name with any value (trivial via DevTools), they unlock the full site, defeating the soft-launch posture and exposing pre-launch copy / pricing / inventory
  - if an attacker scrapes the gated site at scale before public launch, the brand loses the controlled-reveal narrative and any pre-launch press embargo
merge_strategy: sequential_only
domain_terms:
  - Waitlist
  - LandingGate
  - I18n
model_overrides:
  executor: standard
  reviewer: standard
  security: standard
  approval: standard
dependency_freshness: not_required
observability_impact: logging_changed
affected_interfaces:
  - middleware locale + auth-gate decision for every route
  - /landing flow (token issuance)
scope_paths:
  - oaksome-web/src/middleware.ts
  - oaksome-web/src/lib/auth-invite.ts
  - oaksome-web/src/app/[locale]/landing/page.tsx
  - oaksome-web/src/app/[locale]/landing/_actions.ts
generated_at: 2026-05-17
upstream_task: TASK-029
upstream_finding: reviews/TASK-029-smoke-report.md F-029-3

---

# FIX-AUTH-005 — LandingGate cookie validates presence only

## Resolution (2026-06-13, via TASK-055)

**Status: DONE.** The "presence-only" description in this task is **stale**. Verification under
TASK-055 confirmed the HMAC invite-token chain is already implemented end-to-end:

- **Mint:** `src/app/[locale]/(auth)/landing/_actions.ts` mints via `mintInviteToken(secret)` and
  sets `oaksome_invite_token` with `httpOnly: true, secure: true, sameSite: 'lax', maxAge, path: '/'`.
- **Verify:** `src/middleware.ts` calls `verifyInviteToken` (timing-safe HMAC, expiry, nonce);
  returns `503` when `INVITE_TOKEN_SECRET` is unset (loud fail, not silent allow); on invalid token
  it clears the cookie (`Max-Age=0`) and redirects to `/{locale}/landing?next=...`.
- **Structured log:** `console.warn('[gate] invalid_token path=%s', pathname)` is emitted on an
  invalid/expired token (TASK-050); the raw token value is never logged. Asserted by Jest.
- **Cookie rename (Q3):** hard cutover to `oaksome_invite_token` is in place; `oaksome_auth` is no
  longer recognized by the gate.

**Residual work closed by TASK-055:** the forgeable client-set `oaksome_auth` indicator (written via
`document.cookie` in `login/_client.tsx`, `login/_components/rich-login-form.tsx`, and
`(account)/layout.tsx`) was **retired entirely**. It was write-only dead state — never read anywhere;
UI auth state derives from `AuthContext.getProfile()` (server session). No replacement cookie was
needed. A Jest guard now fails if any of the three files reintroduces `oaksome_auth`.

See `reviews/TASK-055-exec.md` for the execution record.

## Why this task exists

`src/middleware.ts:22` (the LandingGate per the ubiquitous-language definition) checks only that the `oaksome_auth` cookie is non-empty: `if (!oakAuth) redirectToLanding(req)`. Any value passes — `oaksome_auth=anything`, `oaksome_auth=1`, `oaksome_auth=smoke-walk-2026-05-17`. This is documented as F-029-3 in the TASK-029 smoke report, and was used (legitimately) by the AI smoke walk to bypass the gate against the prod-built image.

The intent of the LandingGate is the Belgian soft-launch posture: invite-only access until the public DNS flip. Presence-only validation cannot enforce that intent — any visitor with DevTools can mint the cookie themselves. The auth-gate must validate a real token before the public launch.

This task does not block the TASK-029 staging deploy, but it does block the **public DNS flip** to `oaksome.com`. Until then the site lives under a less-discoverable test host and the weak gate is an acceptable bridge.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | A visitor without the `oaksome_invite_token` cookie hits any non-whitelisted route. |
| Processing | Middleware reads cookie, runs `verifyInviteToken(value)` which checks an HMAC signature against `INVITE_TOKEN_SECRET` env var. |
| Output (valid token) | Request proceeds to the requested page. |
| Output (missing token) | Middleware redirects to `/{locale}/landing?next={originalPath}`. |
| Output (invalid token) | Middleware clears the cookie via `Set-Cookie: oaksome_invite_token=; Max-Age=0`, then redirects to landing. Logs `[gate] invalid_token` (no value logged). |
| Error path | Verification throws (malformed token, missing secret) → treated as invalid token. Never 500. |
| Success evidence | (a) the smoke probe with `oaksome_auth=anything` is rejected; (b) a token minted by the landing page action passes; (c) container log shows `[gate] invalid_token` for the negative case; (d) no token value ever appears in logs. |

## Scope

**Included**
- Add `INVITE_TOKEN_SECRET` to `.env.production.example` (operator fills on host).
- Implement `mintInviteToken(payload)` + `verifyInviteToken(value)` in `src/lib/auth-invite.ts` using `crypto.createHmac('sha256', SECRET)` over a stable payload (e.g. `iat|exp|nonce`). Token format: base64url(`payload.signature`).
- Rename the cookie from `oaksome_auth` to `oaksome_invite_token` to clarify intent (no overload with future authenticated-user state). Old cookie name is no longer recognized — all existing test cookies are invalidated.
- Update middleware to call `verifyInviteToken` instead of presence-check.
- Update the landing-page server action to mint a token after the visitor submits the invite code / email-allowlist check.
- Add a structured log line on invalid-token rejection (count of rejections per minute is fine; never log the token value itself).
- Update `reviews/TASK-029-smoke-report.md` row N-anything-using-cookie to note the new cookie name (smoke probes must re-mint).

**Excluded**
- No real user-account auth (login, password). That stays in the existing `(account)` route group and is orthogonal.
- No public sign-up. The invite gate stays invite-only.
- No CAPTCHA or rate limiting beyond what the gate redirect already provides — file a separate fix if needed at scale.

## Steps

1. Decide token shape at the `before_coding` gate (see Open Questions Q1 and Q2).
2. Add `INVITE_TOKEN_SECRET` to `.env.production.example` with a comment ("generate via `openssl rand -base64 32`"); add to `docker-compose.prod.yml` runtime env (not build-arg — keep secret out of bundle).
3. Implement `src/lib/auth-invite.ts` with `mintInviteToken` + `verifyInviteToken`. Unit-test both functions against the SECRET, plus tampered-signature and expired-token cases.
4. Update middleware: read `oaksome_invite_token`, call `verifyInviteToken`. On invalid: clear cookie, redirect to landing, log `[gate] invalid_token` (rate-limited).
5. Update landing-page server action to mint a token on successful invite-code submit and set it via `cookies().set('oaksome_invite_token', token, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60*60*24*30 })`.
6. Add an e2e test that walks: landing → submit valid invite code → cookie set → visit `/fr` → 200. Also: landing → no submit → visit `/fr` → 307 to landing. Also: tampered cookie → 307 to landing + cookie cleared.
7. Update F-029-3 in the smoke report from OPEN to RESOLVED-IN-FIX-AUTH-005 after the fix lands.

## Impact Checklist

- UI: landing page gains a real invite-code input; the rest of the site renders unchanged for valid-token visitors.
- API contracts: no public API change. Server-action signature internal.
- Database / Odoo: none (invite codes can be a static list in env or a small Odoo model — see Q3).
- Auth/session: the LandingGate is now real auth, not presence. The existing `(account)` auth is unchanged.
- i18n: one new landing-page input label + error message in `fr.json` and `nl.json`.
- SEO: gated routes still 307 to landing — no SEO change.
- Tracking: a `lead_invite_redeemed` event when a valid code is submitted (server-side, no PII).
- Operations: prod host must set `INVITE_TOKEN_SECRET` before launch.

## Test Requirements

**Required behavior to verify**
- Valid token → 200 on gated route.
- No token → 307 to `/{locale}/landing?next=...`.
- Tampered token → 307 to landing + `Set-Cookie: oaksome_invite_token=; Max-Age=0`.
- Expired token (past `exp`) → 307 + cleared cookie.
- Server-action mints a token only after the invite-code check passes.

**Regressions to prevent**
- The existing `(account)` auth flow continues to work.
- The Axeptio bridge and tracking pipeline still load correctly for invite-token visitors.
- The middleware does not 500 if `INVITE_TOKEN_SECRET` is unset — it must safe-fail by treating the env as a hard error at boot (refuse to serve) rather than silently accepting all visitors.

**Edge cases**
- Cookie clock skew: token `iat` from a client whose clock is wrong should still verify if `exp` is in the future (verification uses server clock).
- HMAC timing attack: use `crypto.timingSafeEqual` for signature comparison.
- Request without `host` header (some scrapers): verification path must not throw.

## Simplicity Budget

- Files changed: 4 (`middleware.ts`, `auth-invite.ts` new, landing `_actions.ts`, `.env.production.example`).
- New modules: 1 (`src/lib/auth-invite.ts`).
- New dependencies: 0 (use Node's built-in `crypto`).

## Assumptions

1. The invite-code allowlist is small enough (< 200 codes) to live in an env var or a flat file under `/etc/oaksome/invite-codes.txt`. Larger lists would justify an Odoo model.
2. The HMAC token is sufficient for soft-launch; full account auth supersedes this gate at the public launch.

## Open Questions

### Q1 — Token storage shape (decision-required, gates before_coding)

**A. HMAC-signed token (no DB):** payload = `iat|exp|nonce`, signed with `INVITE_TOKEN_SECRET`. Stateless. Revocation requires rotating the secret (invalidates everyone).
- Pros: zero DB, fastest path to ship. Matches the soft-launch goal.
- Cons: cannot revoke a single user.
- Planner recommendation: **A** for soft-launch. Acceptable trade-off given small audience.

**B. Server-side session table in Odoo:** token = opaque ID, verification = DB lookup with TTL.
- Pros: per-token revocation.
- Cons: new Odoo model + middleware DB call on every request (latency); over-engineered for soft-launch.
- Planner recommendation: defer.

**C. JWT with RS256 (asymmetric):**
- Pros: standardized.
- Cons: dependency added (`jose` or `jsonwebtoken`); overkill for one cookie that lives one month.
- Planner recommendation: defer.

### Q2 — Invite-code source (decision-required, gates before_coding)

**A. Env var `INVITE_CODES` (comma-separated):**
- Pros: simplest; redeploy required to add codes.
- Planner recommendation: **A** for v1; codes are minted manually by the operator.

**B. Odoo model `oaksome.invite_code`:**
- Pros: codes managed in the Odoo back-office without redeploy.
- Cons: new model + form + access rules.
- Planner recommendation: phase 2.

### Q3 — Should the cookie name rename be a hard cutover or a both-names-recognized transition? (decision-required, gates before_coding)

**A. Hard cutover (recommended):** stop recognizing `oaksome_auth`. All existing dev/test cookies are invalidated (smoke probes must re-mint).
- Pros: removes the F-029-3 vulnerability immediately.
- Cons: anyone currently using the gate (testers, the AI smoke walk) must re-acquire a token after this lands.
- Planner recommendation: **A**.

**B. Recognize both for a 7-day grace period:**
- Pros: smoother transition.
- Cons: keeps the weak path alive for a week — the very window we are trying to close.
- Planner recommendation: rejected.

## Resolved Decisions

- This task is medium-risk because it changes the auth surface and the cookie contract; it is not high-risk because the existing user-account auth and the data plane are untouched.
- `human_approval_stages: [before_coding]` is intentional — Q1/Q2/Q3 are decision-ready and need a human pick before the executor writes code.
- The fix does not block TASK-029 staging deploy; it blocks the public DNS cutover. Smoke walk during staging may continue with the legacy `oaksome_auth=smoke-walk-...` cookie until this fix lands.

## Dependency Freshness

not_required — uses Node's built-in `crypto` module.

## Observability Impact

logging_changed — adds a structured `[gate] invalid_token` log line on every rejected request. Implementation must:
- Reuse the existing `console.warn` pattern (no new logger dependency).
- Rate-limit emission to once per minute per IP to avoid log flooding under a scrape.
- Never log the token value itself (sensitive).
- Be a no-op on the hot path beyond the HMAC verify, which is microseconds.

## Design Governance

- shared_design_concept: The LandingGate becomes real authentication-of-invite, not just presence. The cookie carries an HMAC signature over a short payload; verification is stateless and runs in middleware on every request. The shape mirrors lightweight session cookies used by other invite-only Belgian launches.
- module_map: src/middleware.ts (consumer), src/lib/auth-invite.ts (new — mint/verify), src/app/[locale]/landing/_actions.ts (mint on submit), src/app/[locale]/landing/page.tsx (input + error UI), oaksome-web/.env.production.example (new INVITE_TOKEN_SECRET key).
- affected_interfaces: every route gated by middleware (i.e. all non-whitelisted paths in both locales); the landing-page server action; the cookie contract (name + format).
- ownership_boundaries: Frontend owns middleware + landing UI + auth-invite lib. Ops owns the INVITE_TOKEN_SECRET value and the invite-code allowlist content. Security review owns the threat model.
- dependency_impact: none (Node crypto is built-in).
- data_model_impact: none for v1 (env-based allowlist). Phase 2 would add `oaksome.invite_code` in Odoo.
- failure_modes: missing INVITE_TOKEN_SECRET at boot → service refuses to start (loud fail rather than silent allow); HMAC compare without timingSafeEqual → side-channel risk; cookie not flagged HttpOnly+Secure+SameSite=Lax → XSS / CSRF exposure; logging the token value → secret leak in observability tooling.
- test_strategy: unit tests for mint/verify (round-trip, tampered, expired); middleware e2e (valid / missing / tampered token); manual review of HttpOnly+Secure+SameSite cookie flags on the response; manual review of the log line to confirm no token value is emitted.
- questions_considered: stateless HMAC vs DB-backed sessions (Q1), env-var vs Odoo-managed codes (Q2), hard cutover vs grace-period (Q3), JWT vs custom HMAC (resolved to custom — simpler, no dep).
- discovered_constraints: middleware runs in the Edge runtime in Next.js 14; `crypto.createHmac` is supported in the Edge runtime via the Web Crypto API — implementation must use `crypto.subtle.importKey('raw', secret, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign', 'verify'])` not the Node `crypto` module directly.
- edge_cases: see Test Requirements §Edge cases.
- risk_reasoning: Medium — the new gate is the public-launch trust boundary, but it is bounded to a single cookie and verified by HMAC; the blast radius of a bug is "site is fully open" (current state) or "site is fully closed" (loud failure), both of which are recoverable in minutes by env rollback.
- domain_language_checked: `Waitlist`, `LandingGate` entries in docs/domain/UBIQUITOUS_LANGUAGE.md are consistent with this task. No new term introduced.
- glossary_update_needed: yes — update the `LandingGate` entry to note that v2 uses an HMAC-signed token rather than a presence-only cookie.
- ready_to_implement: pending Q1/Q2/Q3 resolution at the before_coding gate.
