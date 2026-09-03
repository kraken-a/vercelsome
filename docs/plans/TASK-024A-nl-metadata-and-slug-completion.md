---
contract_version: v2
artifact_type: task
task_id: TASK-024A
title: Close TASK-013 NL gaps — root metadata, untranslated chrome, missing NL slugs
status: todo
risk_level: medium
edit_mode: surgical_edit
parallelizable: false
parallel_group: ""
conflict_scope:
  - oaksome-web/src/app/[locale]/layout.tsx
  - oaksome-web/src/app/[locale]/(shop)/espace/[slug]/page.tsx
  - oaksome-web/src/i18n/routing.ts
  - oaksome-web/src/components/header/header.tsx
  - oaksome-web/src/components/ui/breadcrumb.tsx
  - oaksome-web/src/components/howitworks/howitworks.tsx
  - oaksome-web/src/components/samples/samples.tsx
  - oaksome-web/src/components/assurance/assurance.tsx
  - oaksome-web/src/components/footer/footer.tsx
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
integration_blockers:
  - blocks TASK-014 (per-page metadata needs translated meta keys)
  - blocks production go/no-go (TASK-024 verdict)
human_approval_stages:
  - design
risk_triggers:
  - hardcoded French strings shipped to NL locale (regression of TASK-013)
  - NL slug choice may collide with existing routes
  - breadcrumb / breadcrumb-id collisions if slug changes propagate
merge_strategy: sequential_only
domain_terms:
  - locale
  - useTranslations
  - getTranslations
  - next-intl routing
  - generateMetadata
model_overrides:
  executor: standard
  reviewer: standard
  security: standard
  approval: light
dependency_freshness: not_required
observability_impact: none
scope_paths:
  - oaksome-web/src/app/[locale]/layout.tsx
  - oaksome-web/src/app/[locale]/(shop)/espace/[slug]/page.tsx
  - oaksome-web/src/i18n/routing.ts
  - oaksome-web/src/components/header
  - oaksome-web/src/components/ui/breadcrumb.tsx
  - oaksome-web/src/components/howitworks
  - oaksome-web/src/components/samples
  - oaksome-web/src/components/assurance
  - oaksome-web/src/components/footer
  - oaksome-web/messages/fr.json
  - oaksome-web/messages/nl.json
generated_at: 2026-05-17
upstream_finding: reviews/TASK-024-report.md §4 (F-N1, F-N2)
upstream_task: TASK-013 (NL i18n sweep — merged but incomplete)
---

# TASK-024A — Close TASK-013 NL gaps

## Why this task exists

TASK-024 (production-readiness refresh, 2026-05-17) found that TASK-013's
NL sweep is **incomplete**:

- **F-N1**: every `/nl/*` page emits `<title>Oaksome — Mobilier encastre
  sur mesure</title>` and a French `<meta name="description">` because the
  root layout exports a static `metadata` object instead of using
  `generateMetadata({ params: { locale } })` + `getTranslations()`. The
  promo bar, header search terms, breadcrumb labels, samples copy, "how
  it works" titles, assurance trust label, and footer link text remain
  hardcoded French.
- **F-N2**: `src/i18n/routing.ts` declares five routes as locale-agnostic
  (`/register`, `/checkout`, `/checkout/success`, `/wishlist`, `/panier`)
  → `/nl/winkelmand`, `/nl/afrekenen`, `/nl/registreren`, `/nl/verlanglijst`
  all 404. Cart is the conversion page; this is launch-blocking for NL.

This task closes those two gaps and **only** those two gaps. It does not
re-do TASK-013's component sweep.

## Verifiable Flow Goals

- **Input**: live state of `oaksome-web` at HEAD (post TASK-013 merges
  `622612f`, `b0848bc`, `18d9629`, `77004bc`, `c9b8661`), plus
  `messages/fr.json` / `messages/nl.json` namespaces.
- **Processing path**:
  1. Switch `src/app/[locale]/layout.tsx` from `export const metadata` to
     `export async function generateMetadata({ params })` using
     `getTranslations({ locale, namespace: 'meta.root' })`.
  2. Same change in `(shop)/espace/[slug]/page.tsx` (template literal
     hardcoded French) and audit other `generateMetadata` exports under
     `src/app/[locale]/(shop)/(gamme|collection)/[slug]` for parity.
  3. Add NL pathnames in `src/i18n/routing.ts` for the 5 untranslated
     routes (decisions in §"Resolved Decisions").
  4. Move hardcoded French in 7 components to `messages/*.json` namespaces
     and call sites to `useTranslations()` / `getTranslations()`.
  5. Run `npm run i18n:check` (introduced by TASK-013) to confirm key set
     parity between `fr.json` and `nl.json`.
- **Output**: PR-ready surgical edit limited to the files in
  `scope_paths`, plus updated message files.
- **Error path**: any locale crash at request time falls back to FR keys
  via next-intl default; do not introduce throw paths.
- **Success evidence**:
  - `curl -b oaksome_auth=1 http://localhost:3001/nl` returns `<title>` and
    `<meta name="description">` in Dutch.
  - `/nl/winkelmand`, `/nl/afrekenen`, `/nl/afrekenen/succes`,
    `/nl/registreren`, `/nl/verlanglijst` all return 200.
  - Body grep on `/nl/*` HTML returns **zero** of: `Mobilier`,
    `Configurez`, `encastré`, `Échantillons`, `Engagements`, `Découvrir`,
    `Offre de lancement`, `Livraison & pose`.
  - FR pages unchanged — spot-check `/fr`, `/fr/acheter`, `/fr/configurer`,
    `/fr/panier`.
  - `npm run type-check` + `npm run lint` clean.

## Scope

**In scope**

| File | What to change |
|---|---|
| `src/app/[locale]/layout.tsx` (lines 64-67) | Convert static `metadata` → `generateMetadata({ params: { locale } })` calling `getTranslations({ locale, namespace: 'meta.root' })`. Read both `title` and `description` from `nl.json` / `fr.json`. |
| `src/app/[locale]/(shop)/espace/[slug]/page.tsx` (line 28) | Replace template-literal French description with `t('meta.espace.description', { name })` keyed by `nl.json`. |
| `src/i18n/routing.ts` (lines 82, 88, 90, 91) | Add NL aliases per §"Resolved Decisions". |
| `src/components/header/header.tsx` (lines 18-25 search terms; 90 promo bar; 365, 383, 392 notif-desc) | Route all literals through `useTranslations('header')`. |
| `src/components/ui/breadcrumb.tsx` (lines 11-18 label record) | Replace static record with `useTranslations('breadcrumb')` lookup keyed by slug. |
| `src/components/howitworks/howitworks.tsx` (lines 20, 26, 87, 93) | `useTranslations('howitworks')`. |
| `src/components/samples/samples.tsx` (line 28) | `useTranslations('samples')`. |
| `src/components/assurance/assurance.tsx` (line 21) | `useTranslations('assurance')`. |
| `src/components/footer/footer.tsx` (line 73) | `useTranslations('footer')` — pull `nav.livraison`. |
| `messages/fr.json` + `messages/nl.json` | Add the new namespaces (`meta.root`, `meta.espace`, `header.search.*`, `header.promo`, `header.notif`, `breadcrumb.*`, `howitworks.*`, `samples.*`, `assurance.*`, `footer.nav.livraison`). Run `npm run i18n:check`. |

**Out of scope**

- Visual fidelity polish (QA-013 owns).
- Per-product / per-collection content from Odoo (TASK-018 owns).
- Wave-0 security gate (HOTFIX-001, FIX-SEC-*) — separate tracks.
- Cart/wishlist interaction bugs (FIX-CART-* track).
- Drift B/E/F (`/materiaux`, rendez-vous, `/collection` dup) — separate decisions.
- `generateMetadata` for `(shop)/gamme/[slug]` and `(shop)/collection/[slug]`
  **unless** they currently emit hardcoded French (verify during step 2).
  If they already use translations, leave them alone.

## Steps

1. **Audit `(shop)/(gamme|collection|espace)/[slug]/page.tsx`** for hardcoded
   French in `generateMetadata`; fold into scope if found.
2. **Add namespaces** to `messages/fr.json` and `messages/nl.json`:
   - `meta.root.title`, `meta.root.description`
   - `meta.espace.description` (interpolated with `{name}`)
   - `header.search.terms.*` (object keyed by slug → `{label, type}`)
   - `header.promo.text` (full marquee line)
   - `header.notif.config_desc`, `header.notif.promo_desc`,
     `header.notif.samples_desc`
   - `breadcrumb.*` keyed by slug (`inspirations`, `contact`, `faq`,
     `echantillons`, `engagements`, `pro`, …)
   - `howitworks.steps.*.title`, `howitworks.steps.*.alt`
   - `samples.subtitle`
   - `assurance.trust.livraison`
   - `footer.nav.livraison`
3. **Convert `src/app/[locale]/layout.tsx`** to `generateMetadata` async;
   read `params.locale`; call `getTranslations({ locale, namespace: 'meta.root' })`.
   Pattern reference: any existing `generateMetadata` in
   `(shop)/gamme/[slug]/page.tsx`.
4. **Update `routing.ts`** with the 5 NL slug mappings per §"Resolved Decisions".
5. **Component sweep** (7 files): replace each literal with a
   `useTranslations()` call. Keep callsite signatures stable; only change
   the string source.
6. **`npm run i18n:check`** (introduced by TASK-013) — must pass.
7. **`npm run type-check && npm run lint`** — must pass.
8. **Live verification** on `:3001` with `oaksome_auth=1`:
   - `/nl` title is Dutch
   - 5 new NL slugs return 200
   - FR pages unchanged
9. **Snapshot diff vs `/fr`** to confirm no FR regression.

## Impact Checklist

- Code changed: yes — surgical, ~11 files
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: NL slug additions are **additive** in `routing.ts`
  (new pathnames map FR slug ↔ new NL slug). Existing FR URLs unaffected.
  Internal `<Link href="/panier">` continues to resolve correctly because
  next-intl resolves the canonical pathname; the NL surface alias changes,
  not the canonical key.
- Shared contracts touched: `messages/*.json` (new keys only)
- Documentation: none required (TASK-013 README already describes pattern)

## Test Requirements

**Required behavior to verify**

- `/nl` and 5 new NL slugs serve Dutch metadata.
- Internal navigation from `/nl` pages to cart/checkout/wishlist still
  routes through the canonical pathname.
- FR title/meta unchanged on `/fr`.

**Regressions to prevent**

- FR-locale pages losing their copy because a namespace was renamed.
- Internal `<Link>`s broken by the routing change.
- Breadcrumb labels missing on routes without a translation entry (fall
  back to the slug, never throw).
- Auto-detected locale on first visit must still default to FR (no
  unintended cookie change).

**Edge cases**

- `/nl/panier` (the FR slug under NL prefix): should 301 → `/nl/winkelmand`
  or 404. Decide explicitly (default: 404, matches next-intl behavior
  when canonical NL alias exists).
- Mid-render server component using `getTranslations` without `locale` —
  next-intl will infer from request; verify no `headers()` race in App
  Router server components.

## Simplicity Budget

- Effort: M (3-5h)
- LOC budget: ~250 lines (mostly JSON additions + thin component edits)
- New files: 0

## Assumptions

- TASK-013 introduced `npm run i18n:check` and an `i18n` script
  infrastructure. If it did not, the scope expands by ~30 lines to
  add the script.
- `next-intl` v3+ is in use (matches `routing.ts` `defineRouting` API).
- Rachid signs off on the proposed NL slugs before coding.

## Open Questions

1. **NL slugs — exact spelling**:
   - `/register` → `/registreren` ✓ proposed (alt: `/inschrijven`)
   - `/checkout` → `/afrekenen` ✓ proposed (alt: `/betalen`)
   - `/checkout/success` → `/afrekenen/succes` ✓ proposed (alt: `/bedankt`)
   - `/wishlist` → `/verlanglijst` ✓ proposed
   - `/panier` → `/winkelmand` ✓ proposed (alt: `/winkelmandje`)
   - `/faq` → keep as `/faq` (NL accepts the term) ✓ proposed
2. **`/fr/panier` ↔ `/nl/winkelmand` redirect strategy**: 301 from
   "wrong-locale slug" or pure 404? (default proposed: 404, next-intl
   convention.)
3. **Header search terms array**: the current `terms` array mixes search
   keyword + label + type. Should we localize all three or only `label`?
   (default proposed: localize `label` and `type`; keep `term` as the
   FR canonical for matching.)
4. **Promo bar source**: currently inline in `header.tsx`. Move to
   `messages/*.json` only, or also extract into a `<PromoBar>` component?
   (default proposed: messages-only; component extraction is a separate
   refactor.)

## Resolved Decisions

- Scope is **fixed at 11 files** listed in `scope_paths`. New
  hardcoded-French findings outside this list become a TASK-024B, not a
  scope creep.
- NL slugs default to the ✓-proposed values above unless Rachid overrides
  during the `design` approval stage.
- `routing.ts` change is **additive** — no removal of existing keys.
- `getTranslations({ locale, namespace })` over `useTranslations` for
  server components (root layout, page.tsx); `useTranslations` for client
  components.
- No new translation keys in `meta.*` until they're consumed by code in
  this task — avoid orphan keys.
- Risk-tier: **medium** (visible launch-blocking surface, but pure
  string-routing edits with strong type coverage).
- Single human approval stage: `design` (NL slug list + namespace shape).
- No security review needed (no auth/data surface touched).

## Design Governance

- Source of truth for visible labels: prototype + design tokens.
  Prototype is FR-only; NL strings come from `messages/nl.json` curated
  by TASK-013 + this task.
- Slugs documented in `docs/frontend-spec.md` route table — update if
  Rachid confirms the proposed NL slugs.

## Dependency Freshness

not_required

## Observability Impact

none
