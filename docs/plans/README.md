# Oaksome-Web — Tableau des tâches

## Structure

Tasks are organized by milestone, each in its own file.
Within each milestone, tasks are ordered by dependency (do top items first).

| Jalon | Statut | Description |
|---|---|---|
| [M0 — Fondation](M0-foundation.md) | TERMINÉ | Scaffold, configuration, architecture |
| [M0.1 — API Client Hardening](M0.1-api-client-hardening.md) | À FAIRE | Patterns high-ROI cherry-pick: wrapper API, operation types, normalizers, Zod, server actions ciblées |
| [M1 — Layout & Navigation](M1-layout-navigation.md) | À FAIRE | Header, footer, mega-menu, promo bar |
| [M2 — Catalogue & Produits](M2-catalogue-products.md) | À FAIRE | Product pages, grids, filters |
| [M3 — Collections, Gammes, Espaces](M3-taxonomy-pages.md) | À FAIRE | Taxonomy landing pages |
| [M4 — Configurateur](M4-configurator.md) | À FAIRE | Multi-step configurator tunnel |
| [M5 — Leads & Contact](M5-leads-contact.md) | À FAIRE | Création de leads, wishlist, formulaire de contact, échantillons |
| [M6 — Auth & Compte](M6-auth-account.md) | À FAIRE | Login, register, profile, orders, notifications |
| [M7 — Panier & Checkout](M7-cart-checkout.md) | À FAIRE | Cart overlay, checkout flow, TVA 6% |
| [M8 — Pages de contenu](M8-content-pages.md) | À FAIRE | Inspirations, case studies, static pages |
| [M9 — SEO & Tracking](M9-seo-tracking.md) | À FAIRE | Meta tags, JSON-LD, GTM, CAPI |
| [M10 — Pro/B2B](M10-pro-b2b.md) | À FAIRE | Pro inscription, pricelist, validation |
| [M11 — Tests & QA](M11-testing-qa.md) | À FAIRE | Unit, integration, E2E tests |
| [M12 — CI/CD & Déploiement](M12-cicd-deploy.md) | À FAIRE | GitHub Actions, Docker, Vercel |

## Ordre de priorité

```
M0.1 → M1 → M2 → M3 → M4 ⇄ M5 → M6 → M7 → M8 → M9 → M10 → M11 → M12
         ↘ M8 (parallèle)         ↗
```

M1 is blocking — everything needs the layout shell.
M2-M3 and M8 can run in parallèle (different page groups).
M4 et M5 sont fortement liés : commencer M5.1 (popup lead) avant de finaliser M4.8.
M6-M7 restent séquentiels (auth → checkout).
M9-M12 are finalisation touches.

## Conventions

- `[ ]` = À FAIRE
- `[x]` = TERMINÉ
- `[~]` = IN PROGRESS
- Each task has a **scope** (files to create/modify) and **depends on** (blocking tasks)
- Estimation : S (< 2h), M (2-4h), L (4-8h), XL (> 8h)

## Convention de branches

- Branche de production Next.js : `main`
- Branches de travail : `ADD-<milestone>-<owner>` ou `FIX-<milestone>-<owner>`
- Exemples :
  - `ADD-M1-ahmed`
  - `ADD-M4-ayoub`
  - `FIX-M9-ahmed`

## Répartition parallèle des responsabilités (2 développeurs)

- [Tâches Ayoub](Ayoub_tasks.md) — cross-repo split (Odoo + Next.js)
- [Tâches Ahmed](Ahmed_tasks.md) — cross-repo split (Odoo + Next.js)

## Décisions globales obligatoires (build kickoff)

Source consolidée : [DECISION_LOG.md](DECISION_LOG.md)

Ces règles s’appliquent à **tous** les jalons M1–M12 :

- API versionnée : utiliser `/api/oaksome/v1/*`.
- Contrat figé v1 : tout changement d’API passe d’abord par `docs/api-contract.md` + exemples JSON.
- Paramètres globaux API :
  - `?lang=en|fr|nl` (défaut `en`, invalide => `400 INVALID_LANG`)
  - `?country=BE|LU` (défaut `BE`, invalide => `400 INVALID_COUNTRY`)
- Format contrat API attendu côté frontend :
  - `snake_case`
  - argent en minor units + `currency`
  - dates ISO 8601 UTC (`...Z`)
  - erreurs unifiées (`code`, `message`, `details`, `request_id`)
  - pagination (`total`, `page`, `limit`, `has_next`)
- Pricing :
  - nouveaux produits configurés => calcul via composant R&D (appel **serveur Next.js**, pas navigateur)
  - produits existants => prix cache autorisé (TTL court + `price_updated_at`/`price_version`)
  - checkout => revalidation prix obligatoire par Odoo
  - écart de prix checkout => blocage + affichage delta + reconfirmation
- Tracking : `/api/tracking/capi` reste propriété Next.js.

## Implémentation des décisions

Les décisions validées sont intégrées directement dans les jalons M1–M12 (pas de fichier de plan séparé).
