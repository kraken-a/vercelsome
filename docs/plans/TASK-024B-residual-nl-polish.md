---
contract_version: v2
artifact_type: task
task_id: TASK-024B
title: Residual NL polish — 404 page, hreflang alternates, dead inspirations-section
status: done
status_note: "Code shipped in commit c06c988 (TASK-024B — NL residual polish: 404 i18n, hreflang, dead code). Closed outside dp-pipeline. human_approval_stages is empty so no approval-schema issue; design gate optional for low-risk."
risk_level: low
edit_mode: surgical_edit
parallelizable: false
parallel_group: ""
conflict_scope:
  - oaksome-web/src/app/not-found.tsx
  - oaksome-web/src/app/[locale]/layout.tsx
  - oaksome-web/src/components/home/inspirations-section.tsx
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
integration_blockers: []
human_approval_stages: []
risk_triggers:
  - 404 page is a public, low-traffic surface; bug here is visible but not conversion-blocking
  - hreflang affects SEO, not user-facing rendering
merge_strategy: sequential_only
domain_terms:
  - not-found
  - 404
  - hreflang
  - alternates
  - dead-code
model_overrides:
  executor: standard
  reviewer: light
dependency_freshness: not_required
observability_impact: none
scope_paths:
  - oaksome-web/src/app/not-found.tsx
  - oaksome-web/src/app/[locale]/layout.tsx
  - oaksome-web/src/components/home/inspirations-section.tsx
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
generated_at: 2026-05-17
upstream_task: TASK-024A
upstream_finding: reviews/TASK-024-report.md §4 (residual NL)
---

# TASK-024B — Residual NL polish

## Why this task exists

TASK-024A closed the launch-blocking NL gaps (root metadata, missing
slugs, chrome components). Three residual issues remain that don't
block FR launch but should land before NL goes live:

1. **404 page is fully hardcoded French.** `src/app/not-found.tsx`
   contains "Erreur 404", "Cette page n'existe pas (encore).", 3 card
   titles + descs, search placeholder, "← Retour à l'accueil". Worse,
   it imports the **old** `@/components/header/header` (legacy 434-line
   header with hardcoded FR search terms) instead of the active
   `@/components/layout/header`.
2. **`hreflang` / `alternates` absent from root layout metadata.** SEO
   crawlers cannot find the FR↔NL alternates pairing.
3. **`src/components/home/inspirations-section.tsx` is dead code** —
   the active home uses `InspoSection` from `app/[locale]/(marketing)/_components/inspo-section.tsx`.
   The dead file carries 6 hardcoded French card titles that show up in
   `grep` results and inflate the apparent "NL French residual" count
   without actually shipping to users.

## Verifiable Flow Goals

| Step | Detail |
|---|---|
| Input | Live state of oaksome-web at HEAD (post-TASK-024A + Drift B redirect) |
| Processing | (1) Localize not-found.tsx; (2) add `alternates: { languages: { fr, nl } }` to generateMetadata in layout.tsx; (3) delete dead inspirations-section.tsx |
| Output | PR-ready surgical edit |
| Error path | next-intl `getLocale()` on root not-found uses cookie/header fallback — handle when no locale set (default FR) |
| Success evidence | `/fr/not-a-real-page` and `/nl/not-a-real-page` render localized 404 chrome; `<link rel="alternate" hreflang>` tags appear in HTML head; grep for "Erreur 404" returns only the messages JSON file |

## Scope

**In scope**

| File | What to change |
|---|---|
| `src/app/not-found.tsx` (lines 5, 28-75) | Replace import of `@/components/header/header` with active `@/components/layout/header` (or just use `<Header />` from the layout). Route all visible strings through `useTranslations('notFound')` / `getTranslations()`. Use the i18n `Link` from `@/i18n/navigation` (already in scope). |
| `src/app/[locale]/layout.tsx` (generateMetadata at lines 64-74) | Add `alternates: { canonical, languages: { fr, nl } }` to the returned Metadata object. Canonical URL derives from `process.env.NEXT_PUBLIC_SITE_URL` + the current path. |
| `src/components/home/inspirations-section.tsx` | Delete the file. Confirm no imports outside __tests__. |
| `messages/fr.json` + `messages/nl.json` | Add `notFound` namespace: `errorCode`, `h1`, `intro`, `card1_title`, `card1_desc`, `card2_title`, `card2_desc`, `card3_title`, `card3_desc`, `search_placeholder`, `back_home`. |

**Out of scope**

- Pixel-perfect prototype 404 fidelity (QA-013 owns).
- A11Y label sweep on 404 (FIX-A11Y-001 if/when authored).
- Removing legacy `@/components/header/header` (still consumed by tests or other dead code? — out of scope; only swap the import in not-found.tsx).
- Re-routing not-found.tsx into the `[locale]/` segment (would change Next.js conventions; not justified for one page).

## Steps

1. **Add namespace** to messages/fr.json and messages/nl.json:
   - `notFound.errorCode`, `.h1`, `.intro`, `.card1_*`, `.card2_*`, `.card3_*`, `.search_placeholder`, `.back_home`.
2. **Localize not-found.tsx**:
   - Replace `import Header from '@/components/header/header'` with `import { Header } from '@/components/layout/header'`.
   - Call `const t = await getTranslations('notFound')`.
   - Replace every hardcoded literal with `t('…')`.
   - Keep the existing skip-link / 404 illustration / structure.
3. **Add alternates to layout.tsx generateMetadata**:
   - `const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oaksome.com'`.
   - Return `{ title, description, alternates: { languages: { fr: \`${baseUrl}/fr\`, nl: \`${baseUrl}/nl\` } } }`.
   - Note: per-page canonical alternates can be added later via per-route generateMetadata; this task only wires the root.
4. **Delete dead file**:
   - `git rm src/components/home/inspirations-section.tsx`.
   - Verify no consumers via `grep -rn 'inspirations-section\|InspirationsSection' src` (should return 0).
5. **`npm run i18n:check`** — parity must remain green.
6. **`npm run type-check && npm run lint`** — clean.
7. **Live verification on `:3001`**:
   - `/fr/__unknown__` and `/nl/__unknown__` render localized 404.
   - View source on `/fr` shows `<link rel="alternate" hreflang="fr" href="…/fr">` and `… hreflang="nl" href="…/nl">`.
   - Grep "Erreur 404" + "Mobilier encastré" in `src/` returns only messages JSON.

## Impact Checklist

- Code changed: yes (3 files edited, 1 deleted, 2 JSON expanded)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: not-found URL space unchanged
- Shared contracts: messages/*.json (additive)
- Documentation: none required

## Test Requirements

**Required behavior to verify**

- `/fr/<random>` → 404 rendered in French
- `/nl/<random>` → 404 rendered in Dutch
- HTML head contains `<link rel="alternate" hreflang>` tags for both locales
- Existing FR pages unchanged (spot-check `/fr`, `/fr/acheter`)

**Regressions to prevent**

- Removing the dead inspirations-section must not break tests (verify via grep).
- not-found page must not crash on missing `notFound` namespace — provide all 9 keys before deploying.
- next-intl's `getLocale()` in a root not-found may need a locale fallback; if so, default to FR.

**Edge cases**

- 404 hit at `/__not_in_any_locale__` (no locale prefix): middleware redirects to `/fr/__not_in_any_locale__` first, so the locale-aware 404 is correct.
- Crawler hits `/fr/old-page` with `Accept-Language: nl-BE` → middleware respects URL locale; alternates tell crawlers the NL equivalent exists.

## Simplicity Budget

- Effort: S (≤2h)
- LOC budget: ~80 lines (mostly JSON + not-found rewrite)
- New files: 0
- Deleted files: 1 (inspirations-section.tsx)

## Assumptions

- `next-intl` v3+ supports root-segment `getTranslations({ locale, namespace })` from outside the `[locale]` segment via cookie/header inference.
- `NEXT_PUBLIC_SITE_URL` is set in prod (CLAUDE.md confirms).
- Active `Header` component from `@/components/layout/header` is the canonical one; the legacy `@/components/header/header.tsx` is only consumed by not-found.tsx today (verify in step 4).

## Open Questions

1. **Should we also delete the legacy `@/components/header/header.tsx`** once not-found.tsx is migrated? It's a 434-line dead file with hardcoded FR. (Default proposed: yes — separate small commit.)
2. **Should `alternates` include `x-default`?** (Default proposed: yes — point to FR.)

## Resolved Decisions

- Scope is fixed at the 4 files in `scope_paths`. No "improve adjacent code" sweeps.
- Locale routing for the 404 stays as-is (not-found at app/ root, locale resolved at request time).
- hreflang lives in `generateMetadata` (not as static `<link>` tags in `<head>`) to leverage Next.js's metadata API.

## Design Governance

- Visible labels source of truth: prototype 404.html (FR only). NL copy from message-file translator pass.

## Dependency Freshness

not_required

## Observability Impact

none
