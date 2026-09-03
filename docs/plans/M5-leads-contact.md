# M5 — Leads, Contact & Échantillons

> Statut : À FAIRE
> Dépend de : M1
> Spécification : autonome dans ce fichier de tâche (les docs externes sont optionnelles, pas nécessaires).


## Résumé du contrat du jalon

- Routes/components delivered: lead popup, `/contact`, `/echantillons`, `/config/[token]`, `/wishlist`.
- APIs requises : `POST /api/oaksome/leads`, `POST /api/oaksome/contact`, `GET /api/oaksome/samples`, `POST /api/oaksome/samples/request`, `GET /api/oaksome/config/:token`, `GET /api/oaksome/wishlist`.
- Share contract: `share=true` on leads returns token/url/expiry and powers `/config/[token]`.
- Tracking minimum : `generate_lead`, `contact_form`, `sample_request`, `showroom_booking`, `share_config_view`.

## Critères d’acceptation (obligatoires)

- Lead popup works from all required entry points and handles partner_exists states.
- Shared config page handles valid/expired token states with correct CTAs.
- Contact and sample request forms validate and submit successfully.
- Wishlist page supports logged-in API state and anonymous local fallback.

## Preuves requises

- Form submission matrix with success/error screenshots.
- API request/response examples for leads share + config token lookup.
- `npm run lint` et `npm run build` passent.

## Contraintes globales (décisions validées)

- Tous les endpoints mentionnés dans ce jalon sont à appeler en versionnée : `/api/oaksome/v1/*`.
- Les payloads et erreurs suivent le contrat API unifié (`snake_case` + erreur structurée).
- Les routes publiques restent compatibles avec `lang`/`country`.

## Tâches

### M5.1 — Email popup (lead capture) [M]
- [ ] Reusable modal component for email capture
- [ ] Triggered by: wishlist heart (anonymous), "Sauvegarder" (configurator), "Partager"
- [ ] Form: email input + submit
- [ ] Calls `POST /api/oaksome/leads` with product_id, config_values, utm params
- [ ] If share=true: display copyable link after success
- [ ] If partner_exists=false: show "Verifiez votre email" message
- [ ] Tracking: generate_lead
- **Portée** : `components/ui/email-popup.tsx`

### M5.2 — Contact page `/contact` [M]
- [ ] Form: type selector (commercial/support/pro), name, email, phone, subject, message
- [ ] Validation: Zod schema
- [ ] `POST /api/oaksome/contact` → route vers le CRM ou le Helpdesk
- [ ] Message de succès: "Nous vous repondrons sous 24h"
- [ ] Tracking: contact_form
- **Portée** : `app/[locale]/(marketing)/contact/page.tsx`

### M5.3 — Echantillons page `/echantillons` [L]
- [ ] Two concepts on one page:
  - **Pack gratuit**: collection → materiau → 1-2 couleurs → form (nom/email/adresse) → POST /api/oaksome/samples/request
  - **Kit decouverte (100 EUR)**: collection → facade → couleur ext/int → poignee → add to cart
- [ ] Section showrooms : depuis `GET /api/oaksome/samples` → `showrooms[]`
  - Show name, address, phone, opening hours, map (lat/lng)
  - JSON-LD LocalBusiness
- [ ] Tracking: sample_request, showroom_booking
- **Portée** : `app/[locale]/(shop)/echantillons/page.tsx`
- **Dépend de** : M5.1

### M5.4 — Shared config page `/config/[token]` [M]
- [ ] SSR, public (no auth needed)
- [ ] `GET /api/oaksome/config/:token`
- [ ] Display: product image, config (collection, facade, color, dimensions), estimated price
- [ ] CTA: "Modifier" → `/configurer?from_share=<token>`
- [ ] CTA: "Commander" → `/produit/{id}` with pre-selected config
- [ ] If expired: message + CTA to `/configurer`
- [ ] SEO: OG tags for WhatsApp/Messenger preview (image + price)
- [ ] Tracking: share_config_view
- **Portée** : `app/[locale]/(shop)/config/[token]/page.tsx`

### M5.5 — Wishlist page `/wishlist` [M]
- [ ] CSR, auth=user
- [ ] `GET /api/oaksome/wishlist` for connected users
- [ ] LocalStorage fallback for display (anonymous items shown from local)
- [ ] Grid of wishlist items with remove button
- [ ] Add to cart from wishlist
- **Portée** : `app/[locale]/(shop)/wishlist/page.tsx`
