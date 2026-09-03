---
contract_version: v2
artifact_type: task
task_id: TASK-024
title: Prototype↔Next.js parity refresh + production go/no-go verdict (post-TASK-013)
status: todo
risk_level: medium
edit_mode: surgical_edit
parallelizable: true
conflict_scope:
  - reviews/TASK-024-report.md
  - reviews/screenshots/TASK-024/
integration_blockers: []
human_approval_stages:
  - design
  - readiness
model_overrides:
  executor: standard
  reviewer: standard
  security: standard
  approval: light
domain_terms:
  - parity
  - prototype
  - landing gate
  - waitlist
  - configurer
  - kimi-webbridge
dependency_freshness: not_required
observability_impact: none
generated_at: 2026-05-17
locales: [fr, nl]
prototype_source: /home/rachid/01_Workspace/oaksome/oaksome-website-prototype
nextjs_dev_url: http://localhost:3001
nextjs_dev_url_auth_cookie: oaksome_auth=1
auth_gate_landing_path: /{locale}/landing
prior_artifacts:
  - tasks/QA-001-prototype-parity-matrix.md       # complete (2026-05-15)
  - tasks/QA-013-visual-fidelity-prototype.md     # report exists in reviews/
  - tasks/QA-014-production-go-nogo.md            # verdict: CONDITIONAL-GO
  - tasks/production-readiness-audit.md           # dev-state audit, 2025-05-15
  - tasks/FIX-master-index.md                     # 29 fix tasks across 5 waves
  - tasks/TASK-013.md                             # NL i18n sweep (just merged: 622612f, b0848bc, 18d9629)
---

# TASK-024 — Prototype↔Next.js parity refresh + production go/no-go verdict

## Why this task exists

The user requested a fresh audit of `http://localhost:3001` vs the prototype at
`/home/rachid/01_Workspace/oaksome/oaksome-website-prototype/`, with a
production verdict. **A substantial parity audit already exists** (QA-001,
QA-013, QA-014, `production-readiness-audit.md`, FIX master index with 29
tasks). Since those artifacts landed (2026-05-15), the codebase received the
**TASK-013 NL i18n sweep** (commits `622612f`, `b0848bc`, `18d9629`,
`77008dc`, `c9b8661`, …) which directly invalidates QA-008's NL findings and
likely several QA-013 / QA-014 / `Drift A` items.

This task is therefore **not "re-run the full audit"** — it is:

1. Refresh the parity verdict against the **current** state of the Next.js
   site on `:3001` (auth-gated behind `/landing`; cookie `oaksome_auth=1`).
2. Re-confirm or close the 12 go-live blockers and 6 QA-001 drifts (A–F).
3. Verify TASK-013's NL coverage on the live server using browser inspection
   (kimi-webbridge), not code reading.
4. Produce the **final production-readiness verdict** in
   `reviews/TASK-024-report.md` with the page-by-page table, severity-graded
   issue list, backend/API risk register, and curated fix plan that points
   to the already-existing FIX tasks (do not duplicate them).

## Verifiable Flow Goals

- **Input**: prototype filesystem + live Next.js dev server `http://localhost:3001` (auth-gate bypass cookie `oaksome_auth=1`) + Odoo addons in `tecnibo/website/oaksome_*`.
- **Processing path**: targeted live-browser audit (kimi-webbridge) of the
  changed surface area → cross-check vs QA-001/QA-013/QA-014 → status
  reconciliation per FIX task → consolidated verdict.
- **Output**: `reviews/TASK-024-report.md` with:
  - production-readiness verdict (READY / NOT READY / CONDITIONAL-GO + conditions)
  - summary table by page (prototype path → Next.js route → live status → severity)
  - issue list with severity (blocker / major / minor) and exact route + viewport
  - backend/API risk register (Odoo addons × Next.js consumption)
  - fix plan (groups FIX-XXX tasks by page/module, no new code)
  - final test checklist for human regression
- **Error path**: any page that errors on live curl/browser is logged as a
  parity gap; auth-gate cookie failure is logged as a process gap (not a
  prod regression — the gate is the intended waitlist behavior).
- **Success evidence**: the report passes governance (`design` + `readiness`
  approvals) and the FIX-master-index is updated only if a finding does not
  already map to an existing FIX/HOTFIX/COMPAT task.

## Scope

**In scope**
- Live-browser smoke pass of all 41 FR routes + 6 NL routes that respond to
  `oaksome_auth=1` cookie, at 3 viewports (390 × 844, 768 × 1024, 1440 × 900).
- Targeted side-by-side prototype↔Next.js compare for the 10 highest-traffic
  pages: `/`, `/acheter`, `/configurer`, `/collection/[slug]`, `/gamme/[slug]`,
  `/espace/[slug]`, `/inspirations`, `/contact`, `/panier`, `/checkout`.
- Re-test of QA-001 Drifts A–F against current `routing.ts` and file routes.
- Re-test of 12 QA-014 go-live blockers — close any that landed via TASK-013
  or other recent commits.
- Verification of `oaksome_nextjs_*` Odoo addons' contract surface
  (`@http.route('/api/oaksome/v1/*')`) against the Next.js proxy in
  `src/app/api/oaksome/[...path]/route.ts`.
- Page-by-page parity table (re-use QA-001 structure; do not re-derive).
- Production verdict with explicit conditions.

**Out of scope**
- Pixel-perfect visual diff (QA-013 owns this).
- Re-creating any of the 29 existing FIX tasks; this audit ends at "fix
  plan that references existing FIXes".
- Fixing anything (audit only — execution happens via `/dp-run FIX-...`).
- Performance/Lighthouse re-runs (QA-009 owns this; reference its findings).
- Pixel-perfect screenshots of every page (only the 10 high-traffic pages
  + any page where parity status changed since QA-001).

## Steps

1. **Read prior reports**, do not re-derive:
   - `reviews/QA-001-report.md` (parity matrix + Drifts A–F)
   - `reviews/QA-013-report.md` (visual fidelity)
   - `reviews/QA-014-report.md` (go/no-go)
   - `tasks/production-readiness-audit.md` (BLOCKERS, HIGH, MEDIUM)
   - `tasks/FIX-master-index.md` (29-task graph)

2. **Confirm the gate**: use `oaksome_auth=1` cookie in kimi-webbridge to
   bypass the waitlist landing. Document the bypass in the report; record
   that the gate is the intended production posture (per FIX-AUTH-002).

3. **Live route sweep** (already pre-done in this planning turn — see
   "Pre-audit snapshot" below). Re-run via kimi-webbridge to capture
   screenshots at 3 viewports for the 10 high-traffic pages. Store under
   `reviews/screenshots/TASK-024/{slug}-{viewport}.png`.

4. **Drift status reconciliation**: for each of Drifts A–F (QA-001), inspect
   the current code state and live page; mark as `closed`, `still-open`,
   `superseded-by-FIX-XXX`. The Drift A (`/espace/[slug]`) check is
   critical — live test confirms `/fr/espace/chambre` now returns 200 (with
   auth cookie); compare against routing.ts to confirm fix.

5. **TASK-013 NL coverage check**: visit `/nl`, `/nl/kopen`, `/nl/configureren`,
   `/nl/over-ons`, `/nl/contact`, `/nl/winkelmand` in kimi-webbridge and
   verify FR text no longer leaks. Compare against QA-014 §5a deferred list
   to close any items.

6. **Blocker reconciliation**: walk QA-014 §3 blockers (12 items), test each
   on the live server, mark each `closed` / `still-open` / `partial`.

7. **Backend contract audit**: for each Next.js `app/api/odoo/*` legacy
   route, list its Odoo `@http.route` counterpart and assess removal risk
   (FIX-API-001 will replace these with `/api/oaksome/v1/*`).

8. **Console / network errors**: capture browser console + network panel
   for each of the 10 high-traffic pages; record 4xx/5xx, CSP violations,
   missing assets, and unexpected `127.0.0.1:8069` URLs (dev-only).

9. **Issue list**: append only items **not already captured** in QA-001/
   QA-013/QA-014. New finding → propose a FIX-NNN ID (next free).

10. **Verdict**: READY / NOT READY / CONDITIONAL-GO. Conditions must point
    to specific FIX task IDs from the master index.

11. **Fix plan**: group existing FIX/HOTFIX/COMPAT tasks by page/module
    (cart, configurer, content pages, security, tracking, NL); do not
    create new tasks unless step 9 surfaced a true gap.

12. **Final test checklist**: human-regression checklist that QA can run
    before flipping the production switch.

## Impact Checklist

- Code changed: **none** (audit only)
- API contracts changed: none
- Data migrations: none
- Business workflows touched: none
- Backwards compatibility: n/a
- Shared contracts touched: none — read-only review
- Documentation: `reviews/TASK-024-report.md` + screenshots under
  `reviews/screenshots/TASK-024/`

## Test Requirements

- Required behavior to verify: every prior open issue has a fresh status
  flag (closed / still-open / superseded); every still-open item maps to
  a FIX task ID.
- Regressions to prevent: parity items dropped silently; verdict that does
  not reference specific FIX IDs.
- Edge cases:
  - Waitlist gate active → bypass via `oaksome_auth=1` cookie; if a page
    fails to render even with the cookie, that's a real regression.
  - First-compile latency in dev mode → re-test any 5xx/timeout against a
    warmed server before flagging (QA-001 Drift C lesson).
  - TASK-013 NL changes may have introduced French→French regression on
    FR pages; spot-check 3 FR pages for unchanged copy.

## Simplicity Budget

- Effort: M (2-4h synthesis + browser pass)
- LOC budget: 0 (audit only)
- New files: 1 report + ~30 screenshots

## Pre-audit snapshot (collected during planning turn, 2026-05-17)

Live `:3001` smoke (with `oaksome_auth=1`):

| route | HTTP | size | notes |
|---|---|---|---|
| `/fr` | 200 | 287 KB | renders |
| `/fr/acheter` | 200 | 214 KB | — |
| `/fr/configurer` | 200 | 214 KB | — |
| `/fr/collection/line` | 200 | 305 KB | singular route OK |
| `/fr/gamme/dressing` | 200 | 249 KB | — |
| `/fr/espace/chambre` | 200 | 268 KB | **Drift A appears closed** (was 404 in QA-001) |
| `/fr/espaces` | 200 | 259 KB | extra route still present (Drift F) |
| `/fr/pro` | 200 | 216 KB | — |
| `/fr/pro/inscription` | 200 | — | — |
| `/fr/contact` | 200 | 214 KB | — |
| `/fr/faq` | 200 | 216 KB | — |
| `/fr/inspirations` | 200 | 214 KB | — |
| `/fr/engagements` | 200 | 239 KB | — |
| `/fr/comment-ca-marche` | 200 | 215 KB | — |
| `/fr/a-propos` | 200 | 214 KB | placeholder copy (QA-007 F-009) |
| `/fr/echantillons` | 200 | 229 KB | sample funnels are stubs (FIX-FUNNEL-001) |
| `/fr/panier` | 200 | 213 KB | — |
| `/fr/checkout` | 200 | 210 KB | — |
| `/fr/cgv` | 200 | 231 KB | — |
| `/fr/mentions-legales` | 200 | 227 KB | placeholder address (FIX-CONTENT-005) |
| `/fr/livraison` | 200 | 213 KB | — |
| `/fr/garantie` | 200 | 213 KB | — |
| `/fr/cookies` | 200 | 242 KB | wrong PSP (FIX-CONTENT-006) |
| `/fr/accessibilite` | 200 | 227 KB | — |
| `/fr/tva-6` | 200 | 228 KB | content stub (FIX-CONTENT-003) |
| `/fr/return` | 200 | 229 KB | — |
| `/fr/prise-mesures` | 200 | 229 KB | — |
| `/fr/materiaux` | **404** | 172 KB | **Drift B still open** — fold or restore |
| `/nl` | 200 | 283 KB | TASK-013 just merged; verify FR text gone |
| `/nl/kopen` | 200 | 210 KB | — |
| `/nl/configureren` | 200 | 210 KB | — |
| `/nl/over-ons` | 200 | 214 KB | — |
| `/nl/contact` | 200 | 213 KB | — |
| `/nl/winkelmand` | 200 | 213 KB | — |

Auth-gated routes (`/login`, `/landing`, `/password-recover`) return 200
without cookie — correctly public per `src/lib/auth-gate.ts` whitelist.

## Pre-audit verdict (preliminary, pending kimi-webbridge confirmation)

**Verdict: CONDITIONAL-GO** — unchanged from QA-014 in policy, but the
condition list shrinks once TASK-013 closes the NL-text and i18n blockers.

The site is **not READY** because the following from QA-014 are still
unverified-closed:

- FIX-001 (search bypass), FIX-002 (home Odoo 500 logging), FIX-003 (product
  image fallback): all marked `todo` in `FIX-index.md`.
- HOTFIX-001 (next-intl webpack cache): reopened on 2026-05-15 per FIX
  master index revision.
- FIX-SEC-001 (security headers / CSP), FIX-SEC-002, FIX-SEC-003 (CVE
  dep-bump): Wave-0 pre-deploy gate, not yet executed.
- FIX-CART-001..007: full cart/wishlist integrity wave.
- FIX-TRACK-001..006: GTM + CMP + CAPI — zero tracking fires today.
- Drift B (`/materiaux` 404): still 404 on live server.

The site **is closer to READY than QA-014's snapshot** because:

- TASK-013 NL i18n sweep is now in `main` (commits `622612f`, `b0848bc`,
  `18d9629`, `77008dc`, `c9b8661`).
- Drift A (`/espace/[slug]` 404) appears resolved on the live server.
- The auth-gate (`/landing` waitlist) is correctly applied to all
  non-public routes — this is the intended production posture for the
  Belgian soft-launch.

## Backend / API risk register

Confirmed Odoo addon surface (read-only):

| Addon | Manifest | Surface used by Next.js | Risk |
|---|---|---|---|
| `oaksome_nextjs_api` | controllers/api.py (~50 `@http.route('/api/oaksome/v1/*')`) | proxied via `app/api/oaksome/[...path]/route.ts` | Contract drift: 12 endpoints in the controller have no Next.js consumer yet (config-share, wishlist user-auth flows, projects/<so1_id>/info). Verify against api-contract.md before launch. |
| `oaksome_nextjs_core` | controllers (present) + models | data layer (styles, spaces, gammes) | Low — read paths only. |
| `oaksome_sale_workflow` | wizards (SO2 creation), models on `sale.order`, `project.project` | indirect — touched by Odoo checkout post-redirect | Medium — `cart/confirm-order` writes to `sale.order`; mutate path bypasses Next.js once `/checkout` redirects to Odoo. |
| `oaksome_fsm_access` | `project.task` model | indirect — surfaces to `/projets/[id]` | Low — read-only consumer. |
| `oaksome_portal_tracker` | controllers/portal.py + `sale.order` model | `/api/oaksome/v1/projects/<so1_id>/info` | Medium — only authenticated portal users hit this; verify CORS + auth='user'. |

Risk flags:
- **R1 — Legacy proxy duplication**: 11 routes under `/api/odoo/*`
  (`spaces`, `styles`, `case`, `categories`, `configurator`, `contact`,
  `finitions`, `inspiration`, `newsletter`, `product`, `tracking/capi`)
  bypass the new contract. Maps to **FIX-API-001** (should-fix). Removal
  must come after consumers migrate.
- **R2 — Lead endpoint hardening**: `POST /api/oaksome/v1/leads` had no
  honeypot/CSRF/rate-limit during QA-006; FIX-SEC-004 covers.
- **R3 — Cart `auth='public'`** for `cart/update`, `cart/remove`, `cart`,
  `cart/checkout-url`: by design (guest cart), but verify FIX-CART-003/004
  before launch.

## Fix plan (groups existing FIX/HOTFIX/COMPAT tasks)

No new fix tasks are required by this audit. Curate the existing 29 by
page/module:

| Group | Pages affected | FIX IDs | Wave |
|---|---|---|---|
| Pre-deploy gate | global | HOTFIX-001, FIX-SEC-001, FIX-SEC-002, FIX-SEC-003 | 0 |
| Cart & Wishlist | `/panier`, header overlay, `/acheter`, `/wishlist` | FIX-CART-001..007 | 1 |
| Auth chrome | `/login`, `/landing` | FIX-AUTH-001..004, FIX-SEC-008 | 1 |
| Search & home | `/fr` home, header search | FIX-001, FIX-002 | 1 |
| Product display | `/produit/[id]` | FIX-003 | 1 |
| Tracking / CMP | global | FIX-TRACK-001..006 | 2 |
| Legal content | `/cgv`, `/mentions-legales`, `/cookies`, `/tva-6` | FIX-CONTENT-001..006 | 2 |
| Drift cleanup | `/materiaux`, `/collections` dup, rendez-vous routes | (open Q: assign IDs at /dp-go time) | 3 |
| Migrate cleanup | legacy `/api/odoo/*` | MIGRATE-001..006, FIX-API-001 | 3 |
| Routing compat | header link hrefs, toast context, configurer types | COMPAT-001..004 | per-wave |

## Final test checklist (production go/no-go)

A human regression must run this checklist on a fresh `next build` after
all Wave 0 + Wave 1 FIXes land. Each row is pass/fail with screenshot.

### Smoke

- [ ] `/fr` and `/nl` redirect to `/landing` when `oaksome_auth` cookie is absent
- [ ] `/fr/login`, `/fr/landing`, `/fr/password-recover` reachable without cookie
- [ ] After waitlist signup or admin override, `oaksome_auth` cookie set and gate cleared
- [ ] All 33 FR routes return 200 with cookie (per pre-audit snapshot)
- [ ] All 6 NL routes return 200 with cookie
- [ ] `/fr/materiaux` resolves (fold or restore decision applied)

### NL i18n (post TASK-013)

- [ ] `<title>` of `/nl` is in Dutch, not "Mobilier encastre sur mesure"
- [ ] Hero copy on `/nl/kopen`, `/nl/over-ons`, `/nl/contact` is in NL
- [ ] Locale switcher in header toggles `/fr/xxx` ↔ `/nl/yyy` (route translation applied)
- [ ] Form validation errors on `/nl/login` render in NL (Zod messages)
- [ ] FR pages unchanged — spot-check `/fr`, `/fr/acheter`, `/fr/configurer`

### Cart & checkout

- [ ] Add-to-cart from `/acheter` reflects in header counter and `/panier`
- [ ] Wishlist from `/acheter` reflects in account `/wishlist` (FIX-CART-007)
- [ ] `/checkout` redirects to Odoo at `cdn.oaksome.com` with token
- [ ] `/checkout/success` renders after Odoo redirect-back

### Forms & leads

- [ ] `/contact` form submits → `crm.lead` in Odoo (test env, not prod)
- [ ] Configurator end-step submits → lead created
- [ ] `/echantillons` submits → sample request lead

### Tracking

- [ ] GTM container loaded with correct `GTM-XXXX`
- [ ] Axeptio CMP banner appears
- [ ] `page_view`, `view_item`, `add_to_cart`, `generate_lead` fire (DevTools network → /collect or /tr)
- [ ] CAPI route `/api/tracking/capi` returns 200 on `purchase`

### Security headers (post FIX-SEC-001)

- [ ] CSP header present and includes `media-src` for landing video (FIX-SEC-008)
- [ ] HSTS header present in prod
- [ ] CORS allowlist limits `/api/odoo/*` and `/api/oaksome/*` (FIX-SEC-005)
- [ ] httpOnly + Secure on auth cookies (FIX-SEC-006)

### Responsiveness

- [ ] 390 × 844: mobile menu functional, no horizontal scroll
- [ ] 768 × 1024: tablet layout, hero stacking correct
- [ ] 1440 × 900: desktop nav full, mega-menu opens
- [ ] 1920 × 1080: no broken wide-layout assumptions

### Console / network

- [ ] Zero console errors on the 10 high-traffic pages
- [ ] No `127.0.0.1:8069` URLs in network panel (DEV-ONLY guard verified)
- [ ] All images ≤ 2 MB and dimensions ≠ 0

### SEO / a11y

- [ ] Hreflang tags on every page (FIX-A11Y-001 / QA-008 F-004)
- [ ] `lang="fr"` / `lang="nl"` on root html
- [ ] All `<img>` have alt text
- [ ] Skip-to-content link present

## Assumptions

- The waitlist auth-gate (`oaksome_auth` cookie) is the intended posture
  for the soft-launch; production audit must use the bypass cookie for
  every protected route.
- The existing FIX/HOTFIX/COMPAT tasks are authoritative — this audit
  must not duplicate them, only re-status them.
- TASK-013 NL i18n sweep landed (commits visible in `git log`); its
  effectiveness must be verified on the live server, not from code alone.
- Dev mode first-compile latency can cause false-positive 5xx — re-test
  warmed routes (QA-001 Drift C lesson).
- Prototype at `oaksome-website-prototype/` is the layout source of
  truth; spec drifts already reconciled in QA-001 stand.

## Open Questions

1. **Drift B / `/materiaux`**: fold into `/echantillons` (likely intent
   per QA-001) or restore as a standalone page? Blocks one FIX ID.
2. **Drift E / rendez-vous**: keep all three routes (`/projets/[id]/rendez-vous`,
   `/rendez-vous`, `/rendez-vous/prendre`) or simplify to match prototype's
   single page? UX decision.
3. **Drift F / `/collection` vs `/collections`**: which is canonical?
   Pick one and 308-redirect the other.
4. **`a-propos` "Offre de lancement" placeholder**: copy decision needed
   before launch (QA-007 F-009).
5. **Legacy `/api/odoo/*` proxy**: hard-cut at v1 launch or carry as
   transitional during Wave 3?

## Resolved Decisions

- Audit-only. No code changes in this task.
- Re-use QA-001/013/014 + production-readiness-audit findings; do not
  re-derive. Net new findings only.
- Verdict format: READY / NOT READY / CONDITIONAL-GO with each condition
  pinned to a specific FIX task ID.
- Browser inspection uses kimi-webbridge with `oaksome_auth=1` cookie.
- Screenshots limited to 10 high-traffic pages × 3 viewports (30 files),
  not all 41 routes.

## Design Governance

- Visual source of truth: prototype + design tokens documented in
  `docs/frontend-spec.md`.
- Prototype is reference for layout/structure; spec deviations recorded
  in QA-001 supersede prototype.

## Dependency Freshness

not_required

## Observability Impact

none
