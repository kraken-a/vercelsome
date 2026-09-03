# FIX-AUTH-004 — Accept any localhost port for CSRF/CORS in dev

## Objective

Stop rejecting authenticated POST requests when the Next.js dev server is
bound to a port other than 3000 (e.g. `localhost:3001` when 3000 is busy).

Today every POST through `/api/oaksome/[...path]` is blocked with
`CSRF check failed` (HTTP 403) because `DEV_ALLOWED` in
`oaksome-web/src/lib/cors.ts` whitelists only `:3000`. Login, cart,
wishlist mutations etc. are all unreachable in that situation.

## Expected Result

- In dev (`NODE_ENV !== 'production'`): any `http://localhost:<port>` or
  `http://127.0.0.1:<port>` origin passes `verifyCsrfOrigin` and gets
  echoed back in `Access-Control-Allow-Origin`.
- In production: behaviour is unchanged — only `oaksome.com`,
  `www.oaksome.com`, `cdn.oaksome.com` are accepted.
- `POST /api/oaksome/v1/auth/login` from `localhost:3001` returns the
  Odoo-proxied JSON, not `CSRF check failed`.

## Context

The CSRF/CORS allowlist is a hardcoded list. Next.js auto-picks the next
free port when 3000 is taken (CLI prints `Port 3000 is in use, using
available port 3001 instead`). The screenshot reported by the user shows
`:3001/api/oaksome/v1/auth/login → 403` plus downstream 401s on
`/wishlist` and `/profile` (those are unauth GETs that pass CSRF but
fail Odoo auth — they'll succeed once login does).

This is a dev-only ergonomics fix. We intentionally do not loosen the
production allowlist.

## Scope

- **Included**:
  - `oaksome-web/src/lib/cors.ts` — switch dev branch from a static list
    to a predicate (`localhost`/`127.0.0.1` on any port, http only).
  - `oaksome-web/src/lib/__tests__/cors.test.ts` — new file; covers
    dev port variation + prod allowlist + unsafe-origin rejection.
- **Excluded**:
  - No change to production allowlist.
  - No change to the proxy route, rate limiting, or cookie forwarding.
  - No new dependencies.

## Steps

1. In `cors.ts`, introduce a small `isDevLocalhostOrigin(origin)` helper
   that returns `true` when `NODE_ENV !== 'production'` and the origin's
   protocol is `http:` and host is `localhost` or `127.0.0.1` (any port).
2. Use it inside `resolveAllowedOrigin` so both `corsHeaders` and
   `verifyCsrfOrigin` benefit, and so the resolved origin is the one we
   echo back in `Access-Control-Allow-Origin` (correct CORS behaviour).
3. Keep the static `DEV_ALLOWED` list as an explicit comment-friendly
   shortcut — or drop it now that the predicate covers it. Drop it; one
   source of truth is simpler.
4. Add `oaksome-web/src/lib/__tests__/cors.test.ts` covering:
   - prod: rejects `http://localhost:3001`, accepts `https://oaksome.com`.
   - dev: accepts `http://localhost:3001`, `http://127.0.0.1:5173`,
     rejects `http://evil.test`, `https://localhost:3001` (https in dev
     is suspicious — not used), and malformed origin strings.
   - `verifyCsrfOrigin` returns `true` for safe methods regardless of
     origin, and returns `true` for POST with a valid referer.
5. Run `npm run type-check` and `npm test -- cors`.

## Acceptance Criteria

- `npm run type-check` passes.
- `npm test -- cors` passes (new file).
- Manual smoke: with `npm run dev` bound to `:3001`, submitting the
  login form to `r.elghazi@tencibo.com` no longer shows
  `CSRF check failed`; the response comes from Odoo (success or auth
  error, but not 403 from the Next proxy).
- `grep -n 'DEV_ALLOWED' oaksome-web/src` returns nothing (constant
  removed) — confirms there is no second allowlist to keep in sync.

## Risk

Low — dev-only widening, surgical edit to one ~70-line module, easy
revert (one file). Production allowlist untouched.

## Simplicity Budget

- expected_files_changed: 2 (1 modified, 1 new test)
- new_modules_allowed: no
- new_dependencies_allowed: no
