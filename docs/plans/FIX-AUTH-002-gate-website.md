# FIX-AUTH-002 — Gate entire website behind authentication, redirect to landing

## Objective

Make the entire `oaksome-web` site available only to authenticated visitors.
Unauthenticated visitors must be redirected to `/{locale}/landing` regardless of
which page they tried to reach. Auth-flow pages, legal pages, and the public
shared-config token route stay reachable without authentication.

## Expected Result

- An unauthenticated request to any protected URL (`/fr`, `/fr/acheter`,
  `/fr/produit/42`, `/nl/configureren`, …) returns a 307 redirect to
  `/{locale}/landing?next=<original_path>`.
- An authenticated request (with `session_id` cookie) is handled by
  `next-intl` as before.
- The public allowlist (landing, login, register, password-recover,
  password-reset, legal pages, `/config/[token]`) is reachable without
  authentication.
- All static assets, `/api/*`, `/_next/*`, `/_vercel/*` keep bypassing
  middleware via the existing matcher.

## Context

Source of truth: `oaksome-web/src/middleware.ts`. Currently only `/projets` and
`/profile` are gated (FIX-AUTH-001). Product decision: the whole site is
gated; the landing page (`/{locale}/landing`) is the public marketing surface
shown to logged-out visitors. Authentication state is detected via the
`session_id` cookie set by Odoo (same mechanism as FIX-AUTH-001).

## Scope

- **Included**:
  - `oaksome-web/src/middleware.ts` — replace denylist with allowlist logic.
  - `oaksome-web/src/lib/auth-gate.ts` — new pure helper `isPublicPath` for
    testability + Edge-runtime safety.
  - `oaksome-web/src/lib/__tests__/auth-gate.test.ts` — unit tests for the
    public-path matrix.
- **Excluded**:
  - No changes to `i18n/routing.ts`, login/register pages, or API routes.
  - No new auth model — keep using the `session_id` cookie.
  - No CSRF / token-validation work.

## Steps

1. Add `oaksome-web/src/lib/auth-gate.ts` exporting `PUBLIC_PATTERNS` and
   pure `isPublicPath(pathWithoutLocale)`.
2. Write Jest tests covering FR / NL / unknown locales, legal pages, the
   `/config/[token]` route, and root `/`.
3. Update `oaksome-web/src/middleware.ts` to:
   - Compute `pathWithoutLocale` from the URL.
   - If `!isPublicPath(pathWithoutLocale)` and the `session_id` cookie is
     missing, redirect to `/{locale}/landing?next=<encoded_original_path>`.
   - Otherwise fall through to `intlMiddleware`.
4. Run `npm test` and `npm run type-check` in `oaksome-web/`.

## Acceptance Criteria

- `npm test -- auth-gate` passes.
- `npm run type-check` passes.
- Manual cURL (or browser) checks:
  - `GET /fr/acheter` (no cookie) → 307 to `/fr/landing?next=/fr/acheter`.
  - `GET /fr/landing` (no cookie) → 200.
  - `GET /fr/cgv` (no cookie) → 200.
  - `GET /fr/config/abc` (no cookie) → 200.
  - `GET /nl/kopen` (no cookie) → 307 to `/nl/landing?next=/nl/kopen`.

## Risk

Medium — site-wide routing change; could cause redirect loops if the public
allowlist misses an auth-flow route. Mitigated by unit tests covering each
public path and by preserving the existing matcher (so static assets and API
routes remain untouched).

## Simplicity Budget

- expected_files_changed: 3 (1 modified, 2 new)
- new_modules_allowed: yes (pure helper `auth-gate.ts`)
- new_dependencies_allowed: no
