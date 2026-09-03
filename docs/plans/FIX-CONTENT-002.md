---
task_id: FIX-CONTENT-002
title: "Replace hardcoded .html hrefs in a-propos and comment-ca-marche with <Link>"
status: done
resolution: "2026-05-17 — Verified complete. grep for `href="*.html"` in src/app/[locale] returned 0 hits."
risk_level: low
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - oaksome-web/src/app/[locale]/(marketing)/a-propos/page.tsx
  - oaksome-web/src/app/[locale]/(marketing)/comment-ca-marche/page.tsx
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
  reviewer: light
domain_terms: [hardcoded-hrefs, html-links, a-propos, comment-ca-marche, Link]
dependency_freshness: not_required
observability_impact: none
affected_interfaces: []
---

# FIX-CONTENT-002 — Replace hardcoded .html hrefs with <Link>

## Objective

Three static content pages still contain prototype-era `href="*.html"` links that resolve to 404 in the Next.js app. Replace them with `<Link>` from `@/i18n/navigation` for locale-aware routing.

## Source Evidence

**QA-007 F-003 / QA-014 Should-Fix #8** — `reviews/QA-007-report.md`:
> "Several content pages contain prototype-era `href='*.html'` links:
> - `/fr/a-propos` line 13: `href='contact.html'` → should be `<Link href='/contact'>`
> - `/fr/a-propos` line 120: `href='rendez-vous.html'` → should be `<Link href='/rendez-vous'>`
> - `/fr/comment-ca-marche` line 82: `href='configurer.html'` → should be `<Link href='/configurer'>`"

## Scope

- `oaksome-web/src/app/[locale]/(marketing)/a-propos/page.tsx` lines 13, 120
- `oaksome-web/src/app/[locale]/(marketing)/comment-ca-marche/page.tsx` line 82

## Steps

1. In `a-propos/page.tsx` line 13: replace `<a href="contact.html">` with `<Link href="/contact">` using `@/i18n/navigation`.
2. In `a-propos/page.tsx` line 120: replace `<a href="rendez-vous.html">` with `<Link href="/rendez-vous">`.
3. In `comment-ca-marche/page.tsx` line 82: replace `<a href="configurer.html">` with `<Link href="/configurer">`.
4. Verify `Link` is imported from `@/i18n/navigation` (locale-aware), not from `next/link` directly.
5. Run `grep -r 'href=.*html' src/app/` to confirm no other `.html` hrefs remain.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | User clicks "Contact" link on `/fr/a-propos` |
| Processing | `<Link href="/contact">` triggers Next.js client-side navigation |
| Output | Browser navigates to `/fr/contact` (locale prefix added automatically) |
| Error path | N/A — static link |
| Success evidence | No 404 on any link in a-propos or comment-ca-marche |

## Impact Checklist

- [ ] 3 broken links fixed
- [ ] Links use locale-aware `<Link>` component
- [ ] No remaining `.html` hrefs in these pages
- [ ] NL locales also work (Link adds `/nl/` prefix automatically)

## Test Requirements

- Manual: click each link → no 404
- `grep -r 'href=.*html' oaksome-web/src/app/` → 0 results (or only legitimate non-page hrefs)

## Simplicity Budget

3 line changes. Trivial.

## Assumptions

- `@/i18n/navigation` exports a locale-aware `Link` component.
- The routes `/contact`, `/rendez-vous`, `/configurer` are valid in `routing.ts`.

## Open Questions

None.

## Resolved Decisions

- Use `@/i18n/navigation` Link (not `next/link`) for locale awareness.
- Check for any other `.html` hrefs while in these files.

## Design Governance

No design review needed.

## Dependency Freshness

Not required.

## Observability Impact

None.
