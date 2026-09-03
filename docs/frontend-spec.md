# Oaksome — Frontend Spec NextJS

> Version 2.0 — Avril 2026 | Deadline : 2026-05-01
> Lie a : [api-contract](api-contract.md) | [System-Design](System-Design.md) | [backend-spec](backend-spec.md) | [data-model](data-model.md) | [user-flows](user-flows.md)
> Prototype : `../oaksome-website-prototype/ (local)` (50+ pages HTML)

---

## Contexte

Dorian a livré un prototype HTML statique. L'objectif est de le migrer vers NextJS 14 (App Router)
en consommant l'API JSON Odoo sur `https://cdn.oaksome.com`.

Odoo reste en charge de : checkout, portail client, paiement, signature CGV.

---

## Stack technique

| Outil | Choix |
|---|---|
| Framework | Next.js 14 — App Router |
| Hosting dev | Vercel |
| Hosting prod | Docker + Nginx (serveur Tecnibo, Belgique) |
| CSS | Tailwind CSS (ou CSS Modules si Dorian préfère) |
| Images | `next/image` avec domaine `cdn.oaksome.com` |
| State cart/wishlist | localStorage (sync Odoo uniquement au checkout) |
| Auth | NextJS custom (login/register/profile) + Odoo session backend |
| i18n | `next-intl` ou `next-i18next`, prefix path (`/fr/`, `/nl/`) |

---

## Internationalisation (i18n)

**Langues :** FR (defaut) + NL
**Strategie :** Prefix path — toutes les routes sous `/{locale}/...`

| Parametre | Valeur |
|---|---|
| Langues | `fr` (defaut), `nl` |
| Routing | `/fr/produit/satori`, `/nl/meubel/satori` |
| Detection | `Accept-Language` header au premier visit → redirect vers `/fr/` ou `/nl/` |
| Fallback | `/` → redirect `/fr/` |
| Lib | `next-intl` ou `next-i18next` |

### Routes traduites

Les segments de route sont traduits, les slugs restent identiques (meme `slug` Odoo).

| Segment FR | Segment NL | Exemple |
|---|---|---|
| `/produit/` | `/meubel/` | `/fr/produit/dressing-satori` → `/nl/meubel/dressing-satori` |
| `/collection/` | `/collectie/` | `/fr/collection/satori` → `/nl/collectie/satori` |
| `/gamme/` | `/gamma/` | `/fr/gamme/dressing` → `/nl/gamma/dressing` |
| `/espace/` | `/ruimte/` | `/fr/espace/chambre` → `/nl/ruimte/slaapkamer` |
| `/acheter` | `/kopen` | |
| `/configurer` | `/configureren` | |
| `/inspirations` | `/inspiraties` | |
| `/etude-de-cas/` | `/casestudy/` | |
| `/etudes-de-cas` | `/casestudies` | |
| `/echantillons` | `/stalen` | |
| `/commandes` | `/bestellingen` | |
| `/commandes/[id]/rendez-vous` | `/bestellingen/[id]/afspraak` | |
| `/login` | `/login` | Identique |
| `/register` | `/register` | Identique |
| `/password-recover` | `/password-recover` | Identique |
| `/password-reset` | `/password-reset` | Identique |
| `/profile` | `/profiel` | |
| `/contact` | `/contact` | Identique |
| `/pro` | `/pro` | Identique |
| `/pro/inscription` | `/pro/registratie` | |
| `/config/` | `/config/` | Identique (liens partageables) |
| `/checkout/` | `/checkout/` | Identique (redirect Odoo) |
| `/faq` | `/faq` | Identique |

### Fichiers de traduction

```
/messages/fr.json    — labels UI, boutons, menus, messages
/messages/nl.json    — idem en neerlandais
```

Contenu traduit (noms produits, descriptions, collections) : depuis l'API Odoo via param `?lang=fr` ou `?lang=nl`.

### SEO i18n

Chaque page inclut les `hreflang` tags :
```html
<link rel="alternate" hreflang="fr" href="https://oaksome.com/fr/produit/satori" />
<link rel="alternate" hreflang="nl" href="https://oaksome.com/nl/meubel/satori" />
<link rel="alternate" hreflang="x-default" href="https://oaksome.com/fr/produit/satori" />
```

Sitemap : une entree par langue par page.

---

## Structure des pages (50+ pages du prototype)

> Toutes les routes ci-dessous sont sous `/{locale}/` (ex: `/fr/produit/42`, `/nl/meubel/42`).

### Core

| Page | Route | Rendu | API |
|---|---|---|---|
| Homepage | `/` | SSG + ISR 1h | `GET /api/oaksome/home?lang={locale}` |
| 404 | `/404` | SSG | — |

### Catalogue & Produits

| Page | Route | Rendu | API |
|---|---|---|---|
| Nos meubles | `/acheter` | SSR | `GET /api/oaksome/products?...` |
| Gamme (x10) | `/gamme/[slug]` | SSG + ISR 1h | `GET /api/oaksome/gamme/<slug>` |
| Espace (x5) | `/espace/[slug]` | SSG + ISR 1h | `GET /api/oaksome/espace/<slug>` |
| Collection (x4) | `/collection/[slug]` | SSG + ISR 1h | `GET /api/oaksome/collections/<slug>` |
| Detail produit | `/produit/[id]` | SSG + ISR 30min | `GET /api/oaksome/products/<id>` |

**Gammes (10) :** dressing, bibliotheque, meuble-tv, ensemble-mural, commode, buffet, bureau, entree, placard, pont
**Espaces (5) :** chambre, salon, bureau, entree, buanderie
**Collections (4) :** line, satori, vista, lys

### Configurateur

| Page | Route | Rendu | API |
|---|---|---|---|
| Configurateur | `/configurer` | CSR | `GET /api/oaksome/configurator` |

Tunnel mono-page, multi-etapes en React state : Type → Collection → Facade → Couleur → Dimensions → Prix temps reel.
Les etapes sont gerees en interne (pas de sous-routes). Le tracking identifie chaque etape via `step_name`.

Boutons finaux : "Sauvegarder" (popup email → lead) | "Partager" (popup email → lead + share_url copiable) | "Ajouter au panier"

### Partage de configuration

| Page | Route | Rendu | API |
|---|---|---|---|
| Config partagee | `/config/[token]` | SSR | `GET /api/oaksome/config/:token` |

**UX de la page :**
- Affiche le produit, la configuration selectionnee (collection, facade, couleur, dimensions), le prix estime
- Image produit correspondante
- CTA principal : "Modifier cette configuration" → `/configurer?from_share={token}` (pre-remplissage local)
- CTA secondaire : "Commander" → `/produit/{id}` avec config pre-selectionnee
- Si token expire : message "Cette configuration n'est plus disponible" + CTA vers `/configurer`

**Bouton "Partager" present sur :**
- Page configurateur (apres configuration)
- Fiche produit `/produit/[id]` (pour tracabilite CRM)

Les deux declenchent le meme flow : popup email → `POST /api/oaksome/leads` avec `share: true` → affichage du lien copiable.

### Inspirations & Etudes de cas

| Page | Route | Rendu | API |
|---|---|---|---|
| Inspirations | `/inspirations` | SSR | `GET /api/oaksome/inspirations` |
| Etudes de cas | `/etudes-de-cas` | SSG + ISR 1h | `GET /api/oaksome/case-studies` |
| Detail etude | `/etude-de-cas/[slug]` | SSG + ISR 1h | `GET /api/oaksome/case-studies/<slug>` |

### E-commerce

| Page | Route | Rendu | API |
|---|---|---|---|
| Cart | overlay (global) | CSR | localStorage + `GET /api/oaksome/cart` |
| Checkout | `/checkout` | CSR | `GET /api/oaksome/cart/checkout-url` |
| Confirmation | `/checkout/success` | CSR | — |
| Wishlist | `/wishlist` | CSR | `GET /api/oaksome/wishlist` |
| Echantillons | `/echantillons` | SSG + ISR | `GET /api/oaksome/samples` |

**Page Echantillons — 2 concepts :**
- **Pack echantillons** (gratuit) : client choisit collection + materiau + 1-2 paires couleurs (ext+int) → formulaire nom/email/adresse → `POST /api/oaksome/samples/request` cree un `crm.lead` + `sale.order` gratuit (ligne(s) produit echantillon a 0€)
- **Kit decouverte** (100€) : client choisit collection + facade + couleur ext/int + poignee → ajout au panier → checkout normal via Odoo (`product.template` standard)

### Compte utilisateur (NextJS custom)

| Page | Route | Rendu | API |
|---|---|---|---|
| Login | `/login` | CSR | `POST /api/oaksome/auth/login` |
| Inscription | `/register` | CSR | `POST /api/oaksome/auth/register` |
| Profil | `/profile` | CSR | `GET /api/oaksome/profile` |
| Commandes | `/commandes` | CSR | `GET /api/oaksome/orders` |
| Detail commande | `/commandes/[id]` | CSR | `GET /api/oaksome/orders/<id>` |
| Rendez-vous | `/commandes/[id]/rendez-vous` | CSR | `GET /api/oaksome/appointments/slots`, `POST /api/oaksome/appointments/book` |
| Mot de passe oublie | `/password-recover` | CSR | `POST /api/oaksome/auth/password-recover` |
| Reset mot de passe | `/password-reset` | CSR | `POST /api/oaksome/auth/password-reset` |

> **Detail commande — sections contextuelles :**
> - **Rendez-vous** : CTA "Planifier mes mesures" ou "Planifier ma pose" selon `oaksome_status`. Lien direct depuis l'email post-SO1. Redirige vers `/commandes/[id]/rendez-vous`.
> - **Photos** : section "Partagez vos photos" visible quand `oaksome_status = done`. Lien depuis l'email satisfaction J+7. Soumission via `POST /api/oaksome/photos/submit`.

### Pro/B2B

| Page | Route | Rendu | API |
|---|---|---|---|
| Page pro | `/pro` | SSR | — |
| Inscription pro | `/pro/inscription` | SSR | `POST /api/oaksome/auth/register` (is_pro=true, BCE/KBO) |

> **Flow pro :** Apres inscription, redirect vers `/profile` avec bandeau "Compte pro en attente de validation". Le pro navigue le site avec prix publics. Apres approbation CSM (Odoo), pricelist "Pro" activee (remise % globale) → prix pro affiches automatiquement quand connecte. L'API products respecte la pricelist de l'utilisateur via la session.

### Contenu statique

| Page | Route | Rendu |
|---|---|---|
| A propos | `/a-propos` | SSG |
| Engagements | `/engagements` | SSG |
| Comment ca marche | `/comment-ca-marche` | SSG |
| Contact | `/contact` | SSG + CSR form |
| FAQ | `/faq` | SSG |

### Legal

| Page | Route | Rendu |
|---|---|---|
| Mentions legales | `/mentions-legales` | SSG |
| CGV | `/cgv` | SSG |
| Cookies | `/cookies` | SSG |
| Accessibilite | `/accessibilite` | SSG |
| TVA 6% (Belgique) | `/tva-6` | SSG |
| Livraison | `/livraison` | SSG |
| Garantie | `/garantie` | SSG |

### Composants globaux (toutes pages)

| Composant | Rendu |
|---|---|
| Search modal | CSR |
| Notifications panel | CSR |

---

## API Odoo — Base URL

```
Dev  : https://cdn.oaksome.com   (domaine actuel)
Prod : https://oaksome.com           (à configurer après mise en prod)
```

Toutes les requêtes publiques (catalogue, navigation) sont sans cookie.
Cart / wishlist / leads nécessitent l'auth Odoo (cookie de session).

---

## Endpoints API

41 endpoints repartis en 5 tiers — contrat complet dans [api-contract](api-contract.md).

| Tier | Endpoints | Auth |
|---|---|---|
| TIER 1 | Navigation, home, products, collections, gammes, espaces (8) | public |
| TIER 2 | Inspirations, case-studies, configurator, leads, samples, config share (8) | public |
| TIER 3 | Cart (add/update/remove), wishlist (add/remove), checkout-url (8) | user |
| TIER 4 | Auth (login/register/logout/password-recover), profile (GET/PUT), orders, notifications + mark-read, photos/submit, appointments, password-reset (14) | public/user |
| TIER 5 | Search, testimonials, contact (3) | public |

Format reponse : `{ success, data, meta: { total, page, limit } }`
Param country : `?country=BE` pour prix TTC adaptes (BE/LU phase 1)

---

## Flow "Sauvegarder" (popup email)

Déclenché par deux actions :
- **♡ Ajouter aux favoris** sur une carte produit
- **"Sauvegarder ma configuration"** dans le configurateur

Les deux affichent un popup qui demande l'email. Si l'utilisateur est déjà connecté, bypasser le popup.

```
POST /api/oaksome/leads
{
  email,
  product_id,
  estimated_price,   // optionnel
  config_values,     // optionnel: {collection, finition, dimensions}
  utm_source,
  utm_medium,
  utm_campaign
}
→ { lead_id, partner_exists, invitation_sent }
```

Si `partner_exists = false` → afficher message "Vérifiez votre email pour accéder à votre espace client".

---

## Flow Checkout

1. Cart stocké en localStorage (CSR uniquement)
2. Clic "Commander" → sync cart vers Odoo : `POST /api/oaksome/cart/add` pour chaque item
3. **Etape TVA 6% (Belgique uniquement)** : si `country=BE`, popup/etape intermediaire demandant l'annee de construction du logement. Si > 10 ans et usage prive → `PUT /api/oaksome/profile` avec `oaksome_building_year`. Le flag `oaksome_tva6` sera applique automatiquement par Odoo sur le SO1.
4. `GET /api/oaksome/cart/checkout-url` → retourne URL Odoo checkout avec session
5. Redirect vers URL Odoo → checkout géré entièrement par Odoo

Si utilisateur non connecté → Odoo redirige vers `/web/login` puis revient au checkout.

---

## Images

- Domaine autorisé dans `next.config.js` : `cdn.oaksome.com`
- Format réponse API : `image_url` = path absolu Odoo (`/web/image/...`)
- En prod : Cloudflare CDN devant Odoo pour cache images

---

## Conventions de code

- Fichiers : 200-400 lignes max
- Composants : un composant par fichier
- Fetching : React Server Components pour SSG/SSR, SWR/fetch client pour CSR
- Variables env :
  - `NEXT_PUBLIC_ODOO_URL` = `https://cdn.oaksome.com`
  - `NEXT_PUBLIC_SITE_URL` = `https://oaksome.com`
  - `NEXT_PUBLIC_GTM_ID` = `GTM-XXXXXXX`
  - `NEXT_PUBLIC_META_PIXEL_ID` = `XXXXXXXXXX`
  - `NEXT_PUBLIC_PINTEREST_TAG_ID` = `XXXXXXXXXX`
  - `NEXT_PUBLIC_GA4_MEASUREMENT_ID` = `G-XXXXXXXXXX`
  - `META_CAPI_ACCESS_TOKEN` = `XXXXXXXXXX` (server-side only)
  - `META_CAPI_PIXEL_ID` = `XXXXXXXXXX` (server-side only)
  - `GOOGLE_ADS_CONVERSION_ID` = `XXXXXXXXXX` (server-side only)
  - `GOOGLE_ADS_CONVERSION_LABEL` = `XXXXXXXXXX` (server-side only)
  - `GA4_API_SECRET` = `XXXXXXXXXX` (server-side only)
- Branches : `[IMP|FIX|ADD]-feature-name`

---

## CI/CD

| Événement | Action |
|---|---|
| Push sur `main` | Auto-deploy sur Vercel (test) |
| Tag de release | Manuel → Docker build + deploy serveur Tecnibo |

GitHub Secrets à configurer :
- `ODOO_URL`
- `VERCEL_TOKEN`
- `SERVER_SSH_KEY`

---

## Composants reutilisables

### Header (global)
- Promo bar (bandeau bleu fixe, "Offre de lancement")
- Logo Oaksome
- Navigation : Nos meubles, Par Type (mega-menu 10 items), Par Piece (mega-menu 5), Collections (mega-menu 4 swatches)
- Icones droite : Search, Account, Notifications (bell + badge), Wishlist (badge), Cart (badge)
- Mobile : hamburger -> overlay menu plein ecran, accordeons pour sous-menus

### Footer (global)
- 4 colonnes : Explorer, Apprendre, Support, Legal
- Social : Instagram, Facebook, Pinterest, TikTok
- Country selector : Belgique / Luxembourg (phase 1)
- Contact : telephone, email

### Composants partages
- `ProductCard` — image, nom, prix, couleurs (dots), badge new/premium, bouton wishlist
- `FilterBar` — chips horizontales scrollables (collection/type/espace/prix), separateurs, active state
- `QtyStpper` — boutons +/-, valeur centrale
- `PriceDisplay` — prix TTC avec indicateur TVA selon country
- `PromoBar` — bandeau haut de page configurable
- `TestimonialSlider` — carousel prev/next avec compteur
- `BreadcrumbNav` — fil d'ariane
- `ConfiguratorTunnel` — tunnel multi-etapes avec viewer gauche + panel droit
- `SearchModal` — overlay plein ecran, input autofocus, suggestions instantanees, resultats API
- `NotificationPanel` — dropdown depuis bell icon, liste notifications, badge unread

---

## Design tokens (depuis prototype CSS)

### Couleurs
| Token | Hex | Usage |
|---|---|---|
| Vert Persan (primary) | `#0C524E` | Nav, liens, CTA |
| Mint | `#BEECCC` | Accents doux |
| Creme | `#F6F5F0` | Background principal |
| Beige fonce | `#696761` | Texte secondaire |
| Bleu promo | `#158AFF` | Bandeau promo |
| Bleu fonce | `#086DD3` | Liens promo |
| Vert neon | `#C1FD48` | Accents CTA |
| Jaune pale | `#EDFFC1` | Background alternatif |

### Collections (swatches)
| Collection | Hex |
|---|---|
| Line | `#E0E0E0` |
| Satori | `#D4B896` |
| Vista | `#4A7C59` |
| Lys | `#C8AD7F` |

### Typographie
| Font | Poids | Usage |
|---|---|---|
| Yet Grotesk | 400 (medium) | Body, nav |
| Yet Grotesk | 700 (bold) | Headlines |
| PP Air Mono | 400 | Specs, prix, dimensions |

Fichiers fonts : `/fonts/for-yetgroteskweb-medium.woff2`, `bold.woff2`, `PPAir-RegularMono.woff2`

### Breakpoints
| Nom | Valeur | Usage |
|---|---|---|
| Desktop | > 1024px | Layout complet, mega-menus |
| Tablet | <= 1024px | Grilles 2 colonnes, ajustements |
| Mobile | <= 768px | Layouts empiles, menu hamburger |
| Small | <= 480px | Micro ajustements |

### Animations
- Hover images : `transform: scale(1.03)` (700ms ease-out)
- Transitions background : 500ms ease-out
- Filtres chips : 200ms
- Steps configurateur : 250ms cubic-bezier
- Nav glassmorphism : classe `.scrolled` ajoutee a `scrollY > 80px`

---

## State management

| State | Stockage | Scope |
|---|---|---|
| Cart | localStorage | Global, sync Odoo au checkout |
| Wishlist | localStorage | Global, sync via API |
| Country preference | localStorage/cookie | Global, impacte TVA |
| Filtres catalogue | URL params | Page `/acheter` |
| Configurateur | React state (CSR) | Page `/configurer/*` |
| Search | React state (CSR) | Modal global |
| Notifications | React state + API | Panel global |
| Auth session | Cookie Odoo + state | Global |

---

## SEO & Social Sharing

### Meta tags (generateMetadata)

Chaque page genere dynamiquement `title`, `description`, `canonical` via `generateMetadata()` (Next.js App Router).

| Type de page | title | description | Source donnees |
|---|---|---|---|
| Homepage | "Oaksome — Mobilier encastre sur mesure" | Tagline statique | Statique |
| Produit `/produit/[id]` | "{nom} — Oaksome" | Depuis `product.template.description` | `GET /api/oaksome/products/:id` |
| Collection `/collection/[slug]` | "Collection {nom} — Oaksome" | Depuis `oaksome.style.description` | `GET /api/oaksome/collections/:slug` |
| Gamme `/gamme/[slug]` | "{nom} — Mobilier Oaksome" | Depuis `product.public.category.category_desc` | `GET /api/oaksome/gamme/:slug` |
| Espace `/espace/[slug]` | "{nom} — Oaksome" | Depuis `oaksome.space.description` | `GET /api/oaksome/espace/:slug` |
| Etude de cas `/etude-de-cas/[slug]` | "{titre} — Realisations Oaksome" | Depuis `oaksome.case.description` | `GET /api/oaksome/case-studies/:slug` |
| Config partagee `/config/[token]` | "{nom produit} — Configuration partagee" | "Collection {collection}, {dimensions} — {prix}€" | `GET /api/oaksome/config/:token` |
| Pages statiques | Titre statique | Description statique | Statique |

### Open Graph & Twitter Cards

Tags communs (toutes pages) :
```html
<meta property="og:site_name" content="Oaksome" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="fr_BE" />
<meta name="twitter:card" content="summary_large_image" />
```

Tags dynamiques par page :

| Page | og:title | og:image | og:description |
|---|---|---|---|
| Homepage | "Oaksome — Mobilier encastre sur mesure" | Image hero | Tagline |
| Produit | "{nom produit}" | Image produit principale | "{collection} — a partir de {prix}€" |
| Collection | "Collection {nom}" | Image ambiance collection | Description collection |
| Config partagee | "{nom produit} — Configuration partagee" | Image produit | "Collection {collection}, {dimensions} — {prix}€" |
| Etude de cas | "{titre}" | Image principale | Description courte |

> Important pour le lien partageable `/config/[token]` : l'OG preview sur WhatsApp/Messenger montre l'image du meuble + config + prix — impact direct sur la conversion multi-decideur.

### Structured Data (JSON-LD)

| Schema | Pages | Donnees |
|---|---|---|
| `Product` | `/produit/[id]` | name, image, description, offers (price, currency, availability) |
| `Organization` | Homepage | name, logo, url, contactPoint |
| `BreadcrumbList` | Toutes pages catalogue | Fil d'ariane dynamique |
| `LocalBusiness` | `/echantillons` (section showrooms) | name, address, geo, openingHours |
| `FAQPage` | `/faq` | Questions/reponses |

### Sitemap & Robots

**sitemap.xml** — genere dynamiquement (`app/sitemap.ts`). Inclut :
- Pages statiques (homepage, a-propos, faq, contact, etc.)
- Produits (`/produit/[id]`) — depuis API products
- Collections (`/collection/[slug]`) — 4 pages
- Gammes (`/gamme/[slug]`) — 10 pages
- Espaces (`/espace/[slug]`) — 5 pages
- Etudes de cas (`/etude-de-cas/[slug]`) — depuis API case-studies
- Inspirations (`/inspirations`)

**robots.txt** :
```
User-agent: *
Allow: /
Disallow: /profile
Disallow: /commandes
Disallow: /checkout
Disallow: /config/
Disallow: /login
Disallow: /register
Disallow: /password-recover
Disallow: /password-reset
Disallow: /wishlist
Sitemap: https://oaksome.com/sitemap.xml
```

> `/config/[token]` est `Disallow` — configs partagees privees, pas indexables.

---

## DataLayer & Tracking

> Source : strategie digitale MARKET — soft launch campagnes paid juin 2026
> Priorite : P0 GTM+CMP+Tier A → P1 CAPI → P2 Tier B → P3 Tier C

### Stack tracking

| Composant | Outil | Responsabilite |
|---|---|---|
| Tag Manager | Google Tag Manager (GTM) | Dispatch des events vers GA4, Meta, Pinterest, Google Ads |
| Analytics | GA4 (Google Analytics 4) | Funnel e-commerce, audiences, reporting |
| Meta Pixel | Meta Pixel + Conversions API | Remarketing, optimisation campagnes Meta |
| Pinterest Tag | Pinterest Tag | Remarketing Pinterest, conversion tracking |
| Google Ads | Google Ads Tag | Conversion tracking, ROAS Google |
| CMP | Cookiebot ou Axeptio (recommandation Axeptio, choix final Nicolas/Clement) | Consentement RGPD, conditionnement tags |
| Server-side | NextJS API routes → CAPI Meta + Google + GA4 MP | Conversion fiable (anti-adblocker, Safari ITP) |

**GTM Container :** Snippet injecte dans `app/layout.tsx` (head + body). Container ID fourni par Nicolas/Clement.

**CMP :** Integre dans `app/layout.tsx`. GTM configure en mode consent v2 : tags bloques par defaut, debloques selon categories acceptees (Necessaires / Statistiques / Marketing). Bandeau cookie en francais, conforme au style Oaksome (couleurs, typo).

**Attribution click IDs :** `middleware.ts` capture `gclid`, `fbclid`, `epik` depuis les query params d'entree et les stocke en cookies first-party (90 jours, `SameSite=Lax`, `Secure`). Ces cookies sont lus par `/api/tracking/capi` pour enrichir l'attribution server-side.

### Evenements — Tier A (11 events bloquants, P0)

Sans ces events, aucune campagne paid ne peut etre pilotee.

| Evenement | Declencheur | Page/Composant | Donnees |
|---|---|---|---|
| `page_view` | Chaque changement de route | `app/layout.tsx` (router event) | `page_title`, `page_location` |
| `view_item` | Chargement page produit | `/produit/[id]` | `item_id`, `item_name`, `item_category` (type), `item_variant` (collection), `price`, `currency` |
| `view_item_list` | Chargement grille produits | `/acheter`, `/gamme/[slug]`, `/espace/[slug]`, `/collection/[slug]` | `item_list_name` (ex: "gamme_dressing"), `items[]` |
| `select_item` | Clic sur un produit dans une grille/carousel | `/acheter`, `/gamme/[slug]`, `/espace/[slug]`, `/collection/[slug]` | `item_id`, `item_name`, `item_list_name`, `index` (position dans la liste) |
| `add_to_cart` | Ajout au panier (localStorage) | Bouton "Ajouter au panier" | `items[]` avec `item_id`, `price`, `quantity`, config |
| `view_cart` | Ouverture du cart overlay | Cart icon / bouton panier | `items[]`, `value`, `currency` |
| `remove_from_cart` | Suppression d'un item du panier | Bouton supprimer dans cart overlay | `items[]` avec `item_id`, `price`, `quantity` |
| `add_to_wishlist` | Clic coeur ou "Sauvegarder" | Bouton wishlist / popup email | `items[]` avec `item_id`, `price` |
| `begin_checkout` | Clic "Commander" (sync cart → Odoo) | Bouton checkout dans panier | `items[]`, `value`, `currency` |
| `purchase` | Arrivee sur `/checkout/success` | `/checkout/success` | `transaction_id` (= order ID Odoo), `value`, `currency`, `items[]` |
| `generate_lead` | Reponse OK de `POST /api/oaksome/leads` | Popup email | `lead_id`, `email_hash` (SHA-256), `product_id`, `estimated_price` |

### Evenements — Tier B (17 events importants, P2)

| Evenement | Declencheur | Page/Composant | Donnees |
|---|---|---|---|
| `configurator_start` | Entree dans le tunnel configurateur | `/configurer` | `configurator_step`: "type_selection" |
| `configurator_step` | Chaque etape du tunnel | `/configurer` (chaque step) | `step_name` (type, collection, facade, color, dimensions), `step_number` |
| `configurator_complete` | Prix affiche / configuration terminee | `/configurer` (step: prix) | `product_id`, `collection`, `estimated_price`, `dimensions` |
| `configurator_share` | Clic "Partager ma configuration" | `/configurer` (step: prix) | `share_token`, `product_id`, `collection` |
| `search` | Resultats de recherche affiches | SearchModal | `search_term`, `results_count` |
| `select_content` | Clic sur une inspiration ou etude de cas | `/inspirations`, `/etude-de-cas/[slug]` | `content_type` ("inspiration" / "case_study"), `content_id` |
| `sample_request` | Reponse OK de `POST /api/oaksome/samples/request` | `/echantillons` | `sample_type` ("pack_gratuit" / "kit_decouverte"), `collection` |
| `view_collection` | Chargement page collection | `/collection/[slug]` | `collection_name`, `collection_slug` |
| `contact_form` | Soumission formulaire contact | `/contact` | `contact_type` ("commercial" / "support" / "pro") |
| `sign_up` | Inscription reussie | `/register` | `method` ("email"), `is_pro` (boolean) |
| `login` | Connexion reussie | `/login` | `method` ("email") |
| `share_config_view` | Consultation d'un lien partage | `/config/[token]` | `share_token`, `product_id`, `collection` |
| `cta_click` | Clic sur un CTA (bouton d'action) | Toutes pages | `cta_name` (ex: "configurer_mon_meuble", "demander_echantillons", "commander", "partager"), `cta_location` (hero/header/footer/product_page/configurator/promo_bar), `cta_destination` (URL cible), `page_path` |
| `view_promotion` | Affichage du bandeau promo (PromoBar) | Header global | `promotion_id`, `promotion_name`, `creative_slot` ("top_banner") |
| `select_promotion` | Clic sur le bandeau promo | Header global | `promotion_id`, `promotion_name`, `creative_slot` ("top_banner") |
| `showroom_booking` | Demande de RDV showroom | `/echantillons` (section showrooms) | `showroom_id`, `showroom_name`, `booking_date` |
| `photo_submission` | Soumission photo client | `/commandes/[id]` (section photos, visible quand done) | `submission_type`, `product_id`, `order_id` |
| `appointment_booked` | Reservation creneau mesures ou pose | `/commandes/[id]/rendez-vous` | `appointment_type` ("mesures" / "pose"), `order_id`, `date` |
| `password_reset` | Reset mot de passe reussi | `/password-reset` | `method` ("email") |

### Evenements — Tier C (6 events analyse comportementale, P3)

| Evenement | Declencheur | Donnees |
|---|---|---|
| `scroll_depth` | 25%, 50%, 75%, 100% de la page | `percent_scrolled`, `page_path` |
| `outbound_click` | Clic vers lien externe (Instagram, Pinterest) | `link_url`, `link_domain` |
| `country_change` | Changement du selecteur pays (BE/LU) | `old_country`, `new_country` |
| `filter_apply` | Application d'un filtre catalogue | `filter_type`, `filter_value`, `results_count` |
| `notification_click` | Clic sur une notification | `notification_type`, `notification_id` |
| `pro_register` | Inscription pro | `company_id` (BCE/KBO) |

### Conversions API (server-side, P1)

Tracking server-side en complement du client-side pour les events critiques. Les adblockers bloquent 30-40% des events client-side.

**Events envoyes via CAPI :**
- `purchase` → Meta CAPI + Google Enhanced Conversions
- `generate_lead` → Meta CAPI + Google Enhanced Conversions
- `begin_checkout` → Meta CAPI
- Pinterest CAPI : backlog post-launch (non prioritaire phase soft launch)
- Activation Pinterest CAPI : a lancer quand le budget Pinterest depasse 1 000 EUR/mois

**Implementation :** API route NextJS (`/api/tracking/capi`) appelee cote serveur apres confirmation de l'action. Deduplication via `event_id` identique client + serveur.

**Regle consentement server-side :** `/api/tracking/capi` verifie les categories CMP avant forwarding (marketing requis pour Meta/Google Ads, statistics requis pour GA4).

**Regle deduplication `event_id` :** generer un UUID v4 cote composant NextJS **avant** le `dataLayer.push`, puis reutiliser exactement le meme `event_id` dans l'appel server-side vers `/api/tracking/capi`.

**Enhanced Conversions :** Email hashe SHA-256 envoye sur `generate_lead`, `purchase`, `sign_up`. Le hash est fait cote NextJS — jamais d'email en clair vers les plateformes.

**Normalisation `email_hash` (obligatoire) :** `trim()` -> `toLowerCase()` -> encodage UTF-8 -> SHA-256 hex. Interdit de logger ou transmettre l'email brut.

### GA4 Measurement Protocol (server-side)

En complement de Meta/Google CAPI, `/api/tracking/capi` envoie aussi `purchase` et `generate_lead` vers GA4 Measurement Protocol pour fiabiliser le reporting analytics.

Prerequis :
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (client-side)
- `GA4_API_SECRET` (server-side, genere dans GA4 Admin > Data Streams > Measurement Protocol API secrets)

### Ordre d'implementation tracking

1. GTM + CMP + Tier A client-side (P0 — bloquant soft launch)
2. CAPI server-side pour 3 events critiques (P1 — fiabilite conversion)
3. Tier B client-side (P2 — optimisation funnel)
4. Tier C client-side (P3 — analyse comportementale)

---

## References

- Contrat API complet : [api-contract](api-contract.md)
- Modele de donnees : [data-model](data-model.md)
- Backend Odoo : [backend-spec](backend-spec.md)
- System Design : [System-Design](System-Design.md)
- User flows : [user-flows](user-flows.md)
- Prototype HTML : `../oaksome-website-prototype/ (local)`
