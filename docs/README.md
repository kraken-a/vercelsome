# Oaksome

> Mobilier encastre sur mesure, concu et produit en Belgique.
> Dressings, bibliotheques, meubles TV, placards et plus — prix tout inclus, livraison et pose comprises.

---

## Projet

Migration du site Oaksome depuis un prototype HTML statique vers une architecture NextJS + Odoo 17.

| | |
|---|---|
| **Deadline** | 2026-05-01 |
| **Marche** | Phase 1 : Belgique + Luxembourg. Phase 2 : France + Pays-Bas |
| **Stack frontend** | Next.js 14 (App Router), Tailwind CSS, Vercel (dev) / Docker (prod) |
| **Stack backend** | Odoo 17 Enterprise, module `oaksome_website`, PostgreSQL |
| **Domaines** | `oaksome.com` (NextJS) / `cdn.oaksome.com` (Odoo) |

---

## Equipe

| Personne | Role |
|---|---|
| Dorian Dormal | Prototype HTML, direction produit (Fox Ventures) |
| Rachid EL GHAZI | Odoo backend, supervision technique, deploiement (Tecnibo) |
| Equipe dev Tecnibo | Implementation NextJS + modules Odoo custom |

---

## Repositories

| Repo | Contenu | Statut |
|---|---|---|
| `oaksome-website` | Prototype HTML/JS (Dorian) | Livre |
| NextJS Oaksome | Frontend Next.js 14 | A creer |
| `oaksome_website` (Odoo) | Module Odoo backend + API JSON | En cours |

---

## Specs techniques (9 fichiers)

| Fichier | Description |
|---|---|
| [System-Design](System-Design.md) | Architecture, hosting, CORS, CDN, CI/CD, country/TVA, search, notifications |
| [backend-spec](backend-spec.md) | Modules Odoo, modeles custom, workflows CRM → SO1 → SO2, automations |
| [frontend-spec](frontend-spec.md) | Pages NextJS (50+), composants, design tokens, rendering strategy |
| [api-contract](api-contract.md) | 41 endpoints metier `/api/oaksome/*` + contrat infra tracking `/api/tracking/capi` |
| [data-model](data-model.md) | Tous les modeles Odoo avec champs exacts, relations, nouveaux modeles |
| [user-flows](user-flows.md) | 15 parcours utilisateur avec diagrammes mermaid |
| [Oaksome_sale_process](Oaksome_sale_process.md) | Process CSM complet : funnel 6 etapes, facturation, automations |
| `oaksome_website/CLAUDE.md` | Dev guide Odoo (dans le repo module) |

---

## Decisions cles

| Decision | Choix |
|---|---|
| Auth pages | NextJS custom (pas redirect Odoo portal) |
| Cart | localStorage, sync Odoo au checkout |
| Echantillons | Pack gratuit = lead+SO, Kit decouverte = product.template 100€ (pas de modele custom) |
| Pro/B2B | Inclus phase 1 (BCE/KBO, pas SIRET) |
| Etudes de cas | Modele `oaksome.case` (M2m collections/espaces/categories) |
| Testimonials | Modele Odoo dynamique |
| FAQ | Pages statiques NextJS |
| Contact form | Route dynamique → `crm.lead` ou `helpdesk.ticket` |
| Country/TVA | BE + LU phase 1, positions fiscales Odoo |
| Notifications | Systeme in-app (bell icon), polling |
| Search | Hybride : suggestions cache + resultats API Odoo |
| Produits | `product.template` + config custom (pas variantes Odoo) |
| oaksome_status | 9 etats sur sale.order (computed). Pre-SO1 = CRM natif |
| CGV signature | Odoo Sign redirect in-app pendant checkout (pas email) |
| URLs | Format `/collection/[slug]` (slash, pas tiret) |
| Prefixe champs | `oaksome_` sur tous les champs custom |
| Ascenseur | 4 champs separes (L x P x H x charge) |
| Success page | `/checkout/success` |
| Modeles renommes | product.style → oaksome.style, product.space → oaksome.space, tecnibo.website.banner → oaksome.combos |
| Modeles supprimes | oaksome.architect, oaksome.tag, oaksome.sample/kit, how.it.works, website.craftsmanship |
| Modeles ajoutes | oaksome.website (config), oaksome.photo.submission, oaksome.showroom |
| Contenu statique NextJS | "Comment ca marche", sections artisanat homepage |
| Showrooms | Modele oaksome.showroom avec geolocalisation |
| Photo submissions | oaksome.photo.submission → ticket helpdesk auto |
| Lien partageable | `POST /leads` avec `share=true` → token sur crm.lead, expiration 90j, configurateur + fiche produit |
| Tracking | GTM + GA4 + Meta Pixel + Pinterest Tag, 34 events (Tier A=11/B=17/C=6), CAPI server-side phase 1 |
| Pilotage paid | 3 checkpoints de recalibration campagnes : fin juin, fin juillet, fin octobre 2026 |
| CMP | Cookiebot ou Axeptio (recommandation Axeptio, choix final Nicolas/Clement) |
| SEO | Meta tags, JSON-LD (Product, Organization, BreadcrumbList, LocalBusiness, FAQPage), sitemap.xml dynamique, robots.txt |
| Open Graph | OG tags dynamiques par page, crucial pour liens partageables `/config/[token]` |
| Emails | 12 templates Odoo (auth, CRM relances, commande, post-achat) documentes dans backend-spec |
| i18n | FR (defaut) + NL, prefix path (`/fr/`, `/nl/`), routes traduites, slugs identiques, detection Accept-Language |

---

## Statut actuel

- [x] Prototype HTML livre (Dorian)
- [x] Specs techniques definies (8 fichiers)
- [x] CLAUDE.md Odoo cree
- [x] Revue complete des specs + corrections (2026-04-06)
- [x] Revue modeles data-model vs tech doc (2026-04-07)
- [x] Integration addendum partage config + tracking (2026-04-08)
- [ ] Implementation API JSON (TIER 1 bloquant)
- [ ] Repo NextJS cree
- [ ] GitHub Actions configure
- [ ] Positions fiscales BE + LU
- [ ] Nouveaux modeles Odoo (6 modeles)
- [ ] Brief technique Dorian
- [ ] Cloudflare prod

---

## Liens

- Prototype live : oaksome-website.netlify.app
- Serveur Odoo dev : cdn.oaksome.com
- Module Odoo : `oaksome_website/ (Odoo module)`
- Prototype HTML : `../oaksome-website-prototype/ (local)`
