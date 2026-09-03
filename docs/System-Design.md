# Oaksome — System Design

> Version 2.1 — Avril 2026 | Deadline : 2026-05-01
> Lie a : [backend-spec](backend-spec.md) | [frontend-spec](frontend-spec.md) | [api-contract](api-contract.md) | [data-model](data-model.md) | [user-flows](user-flows.md)

---

## Architecture globale

```
[Client Browser]
      ↓ HTTPS
[NextJS — oaksome.com]
  Vercel (dev) / Docker+Nginx Tecnibo (prod)
      ↓ JSON REST /api/oaksome/*
      ↓ credentials: include (CORS)
[Odoo 17 — cdn.oaksome.com]
  Module oaksome_website / DB tecnibo176
      ↓
[PostgreSQL]          [IMOS/Woodstore via MSSQL]
```

---

## Point 1 — Hosting

| Env | Stack |
|---|---|
| **Dev/Test** | Vercel (free tier) — Dorian push, deploy auto |
| **Production** | Docker container + Nginx sur serveurs Tecnibo (Belgique) |

---

## Point 2 — Domaines

| Domaine | Destination | Usage |
|---|---|---|
| `oaksome.com` | NextJS | Site public (prod, pas encore configuré) |
| `cdn.oaksome.com` | Odoo | Checkout, login, portal client |

**Phase 2 future :** migrer le checkout dans NextJS (UI custom, Odoo en backend paiement uniquement).

---

## Point 3 — Authentication

| Action | Auth | Mécanisme |
|---|---|---|
| Browse catalogue, configurateur | ❌ anonyme | Public |
| "Sauvegarder ma config" | Email seulement | `POST /api/oaksome/leads` → crm.lead Étape 1 |
| Ajouter au panier | ❌ anonyme | API Odoo cart (CORS credentials) |
| Commander | ✅ Odoo login | Redirect Odoo si non connecté |
| Suivi commande | ✅ Odoo login | Portal Odoo natif |

**Flow login au checkout :**
```
User clique "Commander"
  → non connecté → redirect cdn.oaksome.com/web/login?redirect=oaksome.com/cart
  → connecté     → sync cart localStorage → Odoo
  → redirect cdn.oaksome.com/shop/checkout
  → SO1 créé → redirect page signature CGV (Odoo Sign in-app, pas email)
  → CGV signées → retour checkout → paiement acompte 50% (Stripe)
  → paiement OK → redirect oaksome.com/checkout/success?order=xxx
```

**CRM Lead = pont entre browsing anonyme et funnel vente :**
- Créé automatiquement quand l'utilisateur sauvegarde une configuration (email requis)
- Déclenche relance CSM J+1 via automation Odoo
- Étape 1 "Intérêt" du process CRM → SO1 → SO2

---

## Point 4 — Rendering Strategy

| Page | Stratégie | Raison |
|---|---|---|
| Homepage `/` | SSG + ISR 1h | SEO critique, contenu stable |
| Catalogue `/acheter` | SSR | Filtres URL dynamiques |
| Détail produit `/produit/[id]` | SSG + ISR 30min | SEO crucial, URL stable |
| Collections `/collection/[slug]` | SSG + ISR 1h | 4 pages fixes |
| Gammes `/gamme/[slug]` | SSG + ISR 1h | ~10 pages fixes |
| Espaces `/espace/[slug]` | SSG + ISR 1h | ~5 pages fixes |
| Inspirations `/inspirations` | SSR | Filtre source dynamique |
| À propos, Comment ça marche | SSG statique | Contenu très stable |
| Cart, Wishlist | CSR | Session utilisateur, pas de SEO |

---

## Point 5 — Images

| Env | Approche |
|---|---|
| **Dev** | `next/image` avec `cdn.oaksome.com` déclaré dans `next.config.js` → resize auto, WebP |
| **Prod** | Cloudflare devant `cdn.oaksome.com` (compte existant tecnibo.com) → cache images 30j |

Les images Odoo sont servies via `/web/image/product.template/{id}/image_1920`.

---

## Point 6 — Caching

```
Browser → Cloudflare (CDN) → Nginx → NextJS (ISR) → Odoo
```

| Données | NextJS ISR | Cloudflare TTL |
|---|---|---|
| Homepage | 1h | 30min |
| Catalogue, collections, gammes | 1h | 30min |
| Détail produit | 30min | 15min |
| Images produits | — | 30 jours |
| Cart / Wishlist / Leads | No cache | No cache |

> À ajuster si promos flash ou prix très dynamiques.

---

## Point 7 — Cart → Checkout Handoff

**Cart stocké en localStorage** côté NextJS. Sync vers Odoo uniquement au clic "Commander".

```
"Ajouter au panier" (NextJS)
    ↓ localStorage.setItem('cart', [...])
    ↓ Pas d'appel API — tout en local
    ↓
"Commander" → check session Odoo (cookie)
    ↓ Non connecté → redirect /login → retour /cart
    ↓ Connecté → sync cart vers Odoo
POST /api/oaksome/cart/add (pour chaque item, CORS activé)
    ↓
GET /api/oaksome/cart/checkout-url
    ↓
Redirect vers cdn.oaksome.com/shop/checkout
    ↓
Signature CGV (Odoo Sign in-app, redirect direct)
    ↓
Paiement acompte 50% (Stripe)
    ↓
Redirect oaksome.com/checkout/success?order=xxx
```

---

## Point 8 — CI/CD Pipeline

**Repo :** Nouveau repo GitHub dédié NextJS Oaksome.

**Convention branches :** `[IMP|FIX|ADD]-feature-name`
- `IMP` — amélioration existant
- `FIX` — correction de bug
- `ADD` — nouvelle fonctionnalité

**Rôles :**
- Dorian → livre le prototype HTML statique
- Équipe dev Tecnibo → implémentation NextJS sur branches dédiées
- Rachid → validation et déploiement prod

**Pipeline GitHub Actions :**

```
branch [IMP|FIX|ADD]-xxx
    ↓ PR → review → merge main
GitHub Action (auto)
    → docker build
    → deploy sur serveur TEST
    ↓
Rachid valide sur TEST
    ↓
GitHub Action (manuel — environment protection)
    → deploy sur serveur PROD (oaksome.com)
```

| Environnement | Déclencheur | Serveur |
|---|---|---|
| **Test** | Auto sur merge `main` | Serveur test Tecnibo |
| **Prod** | Manuel (approbation Rachid) | Serveur prod Tecnibo |

---

## Point 9 — Country / TVA

**Phase 1 :** Belgique + Luxembourg
**Phase 2 :** France + Pays-Bas

| Pays | TVA standard | TVA renovation | Position fiscale Odoo |
|---|---|---|---|
| Belgique | 21% | 6% (logement > 10 ans) | PF Belgique standard + PF Renovation 6% |
| Luxembourg | 17% | — | PF Luxembourg |
| France (phase 2) | 20% | — | PF France |
| Pays-Bas (phase 2) | 21% | — | PF Pays-Bas |

**Implementation :**
- Frontend : country selector dans footer (BE/LU), stocke en cookie/localStorage
- API : param `?country=BE` sur endpoints produits → prix TTC adaptes
- Backend : positions fiscales Odoo appliquees automatiquement au checkout
- Attestation TVA 6% : signee via Odoo Sign avant SO1 (voir sale_process)

---

## Point 10 — Search

Approche hybride : suggestions instantanees + resultats API.

```
User tape dans search modal
  → < 3 caracteres : suggestions locales (collections, types, espaces = cache navigation)
  → >= 3 caracteres : GET /api/oaksome/search?q=...&limit=10
  → Resultats : produits + suggestions categories
  → Clic → page produit ou page categorie
```

- Suggestions instantanees : donnees deja chargees via `GET /api/oaksome/navigation`
- Resultats API : recherche Odoo sur `product.template` (name, description)
- Pas de moteur de recherche externe en phase 1 (Algolia/Meilisearch si besoin en phase 2)

---

## Point 11 — Notifications

Systeme de notifications in-app (bell icon dans header).

| Type | Source | Exemple |
|---|---|---|
| `order` | Changement `oaksome_status` | "Vos mesures sont planifiees" |
| `delivery` | FS-POSE active | "Livraison prevue le 15 mars" |
| `message` | CSM envoie un message | "Nouveau message de votre conseiller" |
| `promo` | Marketing | "Offre de lancement -20%" |

**Implementation :**
- Modele `oaksome.notification` (voir [data-model](data-model.md))
- Endpoint `GET /api/oaksome/notifications` (polling, pas websocket en phase 1)
- Frontend : polling toutes les 60s quand user connecte
- Badge unread count sur bell icon
- Suffisant pour le volume phase 1 (quelques dizaines de clients actifs). Pas d'optimisation (ETag, long polling) necessaire pour l'instant
- Phase 2 : websocket si le volume le justifie

---

## Point 12 — Tracking & Attribution

Tracking hybride client + server-side pour fiabiliser la mesure des conversions paid (Meta/Google) et analytics (GA4).

**Composants :**
- GTM dans `app/layout.tsx` (dispatch tags)
- CMP (Cookiebot/Axeptio) en mode consent v2 : tags bloques par defaut
- DataLayer client-side pour events e-commerce
- API route server-side `/api/tracking/capi` pour conversions critiques

**Attribution click IDs :**
- `middleware.ts` capture `gclid`, `fbclid`, `epik` depuis les query params d'entree
- Stockage en cookies first-party 90 jours (`SameSite=Lax`, `Secure`)
- `/api/tracking/capi` lit ces cookies pour enrichir les events server-side

**Deduplication client/server :**
- UUID v4 genere cote composant NextJS avant `dataLayer.push`
- Meme `event_id` reutilise dans l'appel `/api/tracking/capi`

**Destinations server-side (phase 1) :**
- Meta CAPI : `purchase`, `generate_lead`, `begin_checkout`
- Google Enhanced Conversions : `purchase`, `generate_lead`
- GA4 Measurement Protocol : `purchase`, `generate_lead`
- Pinterest CAPI : backlog post-launch
- Pinterest CAPI : activation quand le budget Pinterest depasse 1 000 EUR/mois

**Pilotage campagnes (gouvernance) :** checkpoints fin juin, fin juillet, fin octobre 2026. Owner : Marketing + COO. Inputs : conversion Tier A + sante CAPI (`sent/skipped/failed`, `dedup_rate`, `timeout_rate`). Output : ajustements budget/creas/bidding.

**Priorites execution tracking :**
- P0 : GTM + CMP + Tier A client-side (bloquant paid + RGPD)
- P0 : enforcement consentement dans `/api/tracking/capi`
- P1 : server-side fiabilite (`/api/tracking/capi`) : Meta CAPI + Google EC + GA4 MP + dedup/idempotence/retries/security/observabilite
- P1 : partage configuration (`POST /api/oaksome/leads` avec `share=true` + `GET /api/oaksome/config/:token`)
- P2 : Tier B (optimisation funnel)
- P3 : Tier C (analyse comportementale)
- Pinterest CAPI : backlog jusqu'a budget Pinterest > 1 000 EUR/mois

---

## Prochaines etapes

- [ ] Implementer `controllers/api.py` TIER 1 (8 endpoints bloquants) — voir [api-contract](api-contract.md)
- [ ] Creer repo GitHub NextJS Oaksome
- [ ] Configurer GitHub Actions (test auto + prod manuel)
- [ ] Brief technique Dorian : URLs API, format reponses, domaine Odoo test
- [ ] Configurer `oaksome.com` sur Cloudflare (prod)
- [ ] Configurer positions fiscales BE + LU
- [ ] Creer les 6 nouveaux modeles Odoo — voir [data-model](data-model.md)
