# M9 — SEO & Tracking

> Statut : À FAIRE
> Dépend de : M2-M8 (pages must exist before wiring SEO/tracking)
> Spécification : autonome dans ce fichier de tâche (les docs externes sont optionnelles, pas nécessaires).


## Résumé du contrat du jalon

- Périmètre SEO : metadata, OG/hreflang, JSON-LD, sitemap.
- Périmètre tracking : GTM + CMP + Tier A/B/C events + route serveur `/api/tracking/capi`.
- Points clés du contrat CAPI : `schema_version=1.0`, UUIDv4 `event_id`, consent gating, idempotence 48h, status by destination.
- Exigence d’attribution : `middleware.ts` captures `gclid/fbclid/epik` cookies (90 days).

## Critères d’acceptation (obligatoires)

- Tous les grands types de routes exposent les bonnes métadonnées + alternates + OG.
- Les événements Tier A sont émis avec les champs payload requis.
- `/api/tracking/capi` returns destination statuses and handles dedup/conflict rules.
- Consent rules block forwarding when categories are not granted.

## Preuves requises

- Event audit sheet (Tier A/B/C mapping -> component path).
- Example CAPI request/response for `purchase` and `generate_lead`.
- `npm run lint`, `npm run type-check` et `npm run build` passent.

## Contraintes globales (décisions validées)

- Les appels de données business utilisés pour SEO/sitemap sont en `/api/oaksome/v1/*`.
- `/api/tracking/capi` reste propriété Next.js (aucune implémentation Odoo).
- Le contrat d’erreur CAPI reste structuré et traçable (`request_id`).

## SEO

### M9.1 — generateMetadata per page type [L]
- [ ] Homepage: static title + description
- [ ] Product: "{name} — Oaksome", description from API
- [ ] Collection: "Collection {name} — Oaksome"
- [ ] Gamme: "{name} — Mobilier Oaksome"
- [ ] Espace: "{name} — Oaksome"
- [ ] Case study: "{title} — Realisations Oaksome"
- [ ] Shared config: "{product} — Configuration partagee"
- [ ] Static pages: hardcoded
- **Portée** : Each `page.tsx` file's `generateMetadata` export

### M9.2 — Open Graph & hreflang tags [M]
- [ ] OG tags: og:title, og:image, og:description per page
- [ ] Critical for `/config/[token]` -> WhatsApp/Messenger preview
- [ ] hreflang tags: fr + nl + x-default on every page
- [ ] Implemented via generateMetadata `alternates` field
- **Portée** : Layout + each page's metadata

### M9.3 — JSON-LD structured data [M]
- [ ] `Product` schema on `/produit/[id]`
- [ ] `Organization` on homepage
- [ ] `BreadcrumbList` on all catalogue pages
- [ ] `LocalBusiness` on `/echantillons` (showrooms section)
- [ ] `FAQPage` on `/faq`
- **Portée** : Créer `components/seo/json-ld.tsx` helper + wire into pages

### M9.4 — Dynamic sitemap [M]
- [ ] Extend `app/sitemap.ts` to fetch from API:
  - Products: `GET /api/oaksome/products` (all IDs)
  - Collections: 4 slugs
  - Gammes: 10 slugs
  - Espaces: 5 slugs
  - Case studies: all slugs
- [ ] One entry per locale per page
- **Portée** : `app/sitemap.ts`

## Tracking

### M9.5 — GTM + CMP integration [L]
- [ ] GTM snippet in root layout (`app/layout.tsx` or locale layout if architecture requires it) (head + body noscript)
- [ ] CMP (Axeptio) integration in layout
- [ ] Consent mode v2: tags blocked by default, unblocked per category
- [ ] CMP banner styled to match Oaksome (colors, typography)
- **Portée** : `app/layout.tsx`, `app/[locale]/layout.tsx`, `components/tracking/gtm-script.tsx`, `components/tracking/cmp.tsx`

### M9.6 — Tier A events (11 blocking) [L]
- [ ] Wire all 11 Tier A events into components:
  - page_view (événement router du layout)
  - view_item (product detail)
  - view_item_list (catalogue, gamme, espace, collection)
  - select_item (product click in grid)
  - add_to_cart, view_cart, remove_from_cart (cart)
  - add_to_wishlist (wishlist button)
  - begin_checkout, purchase (checkout flow)
  - generate_lead (email popup)
- [ ] Use `features/tracking/events.ts` functions
- **Portée** : Multiple components across M2-M7

### M9.7 — CAPI server-side (3 events, contract complet) [L]
- [ ] Route API : `app/api/tracking/capi/route.ts`
- [ ] Events: purchase, generate_lead, begin_checkout
- [ ] Destinations phase 1: Meta CAPI + Google Enhanced Conversions + GA4 Measurement Protocol (Pinterest = backlog)
- [ ] Email hashed SHA-256 with required normalization (`trim -> lowercase -> UTF-8 -> SHA-256`)
- [ ] Generate UUID v4 `event_id` before `dataLayer.push`, then reuse same value server-side
- [ ] Exiger `schema_version="1.0"`, whitelist stricte des événements, schéma payload strict
- [ ] Consent enforcement before forwarding (marketing/statistics categories)
- [ ] Read attribution cookies (`gclid`, `fbclid`, `epik`) captured by `middleware.ts` (90 days)
- [ ] Idempotence : conserver `event_id` 48h, retourner une réponse dédupliquée, retourner 409 pour le même `event_id` + payload différent
- [ ] Timeouts/retries policy (2s timeout, retries only transient/network/5xx)
- [ ] Garde-fous sécurité (stratégie same-origin/CSRF, rate-limit, taille du payload)
- [ ] Structured logs + metrics (`sent/skipped/failed`, `dedup_rate`, `timeout_rate`)
- **Portée** : `app/api/tracking/capi/route.ts`, `features/tracking/capi.ts`, `middleware.ts`

### M9.8 — Tier B events (19 events) [M]
- [ ] Wire configurator_start/step/complete/share
- [ ] search, select_content, sample_request, view_collection
- [ ] contact_form, sign_up, login, share_config_view
- [ ] cta_click, view_promotion, select_promotion
- [ ] showroom_booking, photo_submission, appointment_booked, password_reset
- **Portée** : Various components

### M9.9 — Tier C events (6 events) [S]
- [ ] scroll_depth, outbound_click, country_change
- [ ] filter_apply, notification_click, pro_register
- **Portée** : Various components
