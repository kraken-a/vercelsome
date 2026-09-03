# FIX-AUTH-003 — Repurpose /login with landing-style minimal chrome

## Objective

Make `/{locale}/login` render with the same minimal chrome as the landing
page (logo + language/country selector, no global header/footer/promo bar).
The existing rich split-screen login layout is kept in the codebase as a
hidden component (not routed), so we can switch back without recovering it
from git history.

## Expected Result

- `GET /{locale}/login` (no auth cookie) shows the new minimal page:
  - Landing-style header: OAKSOME logo, language (`FR`/`EN`) + country
    (`Belgique`) selector, and a globe icon. No global PromoBar / Header /
    Footer / HelpFab.
  - Centered email + password form using the same auth API and same
    redirect-to-`next` behaviour.
- The old rich layout (split visual + reassurance band) is no longer
  rendered at `/login` but is preserved as
  `_components/rich-login-form.tsx` so it can be reinstated.
- `/login` remains in `PUBLIC_PATTERNS` (auth path).
- All authentication logic (zod schema, `login()` API call, cookie set,
  `trackLogin()`, redirect) is unchanged.

## Context

Product is launching with a kickoff funnel anchored on `/landing`. To keep
the visual continuity, `/login` should adopt the same simple shell. The
current rich login (`auth-page` split layout) is kept around for the
post-launch experience but hidden from the active route. This is a UI swap
only; FIX-AUTH-001 / FIX-AUTH-002 auth-gate behaviour is preserved.

## Scope

- **Included**:
  - `oaksome-web/src/app/[locale]/(auth)/login/page.tsx` — replace JSX with
    landing-style shell + minimal form.
  - `oaksome-web/src/app/[locale]/(auth)/login/_components/rich-login-form.tsx`
    — new file; lift-and-shift of the old `LoginForm` component (no
    behavioural changes).
  - `oaksome-web/src/app/[locale]/(auth)/login/login.css` — new file;
    minimal-chrome styles scoped to `/login`. Reuses the landing tokens.
  - `oaksome-web/src/components/layout/layout-chrome.tsx` — extend
    `HIDE_CHROME_PATTERNS` to also match `/{locale}/login`.
- **Excluded**:
  - No changes to `/lib/api/auth`, `auth-pages.css`, register, password
    recovery, or middleware.
  - No new dependencies.
  - No change to `PUBLIC_PATTERNS` in `auth-gate.ts`.

## Steps

1. Move the body of the existing `LoginForm` into
   `_components/rich-login-form.tsx`, exporting it as `RichLoginForm`.
   Underscore prefix excludes it from the App Router.
2. Rewrite `login/page.tsx` to render the landing-style shell:
   - Top bar with logo, language box (`FR` from `useLocale()`), country
     (`Belgique`), globe SVG.
   - Centered `<form>` reusing the same zod schema and `handleSubmit`
     logic (lifted from the existing page; not the rich component).
   - Footer text only: "Pas de compte ? Créer un compte" link.
3. Create `login/login.css` with `.login-root`, `.login-header`,
   `.login-form` minimal styles. No global tokens needed — leverage CSS
   variables already defined in `globals.css`.
4. Extend `HIDE_CHROME_PATTERNS` in `layout-chrome.tsx` with
   `/^\/[^/]+\/login\/?$/` so the global Header/PromoBar/Footer are not
   rendered.
5. Run `npm run type-check`, `npm test -- auth-gate`, and smoke-test with
   `fetch` on `:3001/{fr,nl}/login` returning 200.

## Acceptance Criteria

- `npm run type-check` passes.
- `npm test -- auth-gate` still 45/45.
- `GET /fr/login` returns 200 and the HTML contains the OAKSOME logo and
  no `<header class="site-header">` (the global one).
- Submitting the new form with valid credentials sets `oaksome_auth=1`
  and redirects to `next` (verified manually).
- The rich layout file exists at
  `oaksome-web/src/app/[locale]/(auth)/login/_components/rich-login-form.tsx`
  and is not imported anywhere in `app/`.

## Risk

Low — single page swap; auth logic unchanged; rollback is one
`git checkout` of `login/page.tsx` and one CSS pattern revert.

## Simplicity Budget

- expected_files_changed: 4 (2 modified, 2 new)
- new_modules_allowed: yes (`rich-login-form.tsx`, `login.css`)
- new_dependencies_allowed: no
