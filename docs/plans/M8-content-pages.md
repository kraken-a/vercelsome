# M8 — Pages de contenu

> Statut : À FAIRE
> Dépend de : M1
> Peut être réalisé en parallèle avec M2-M3


## Résumé du contrat du jalon

- Routes livrées : homepage, inspirations, case studies list/detail, static marketing/legal pages.
- APIs requises : `GET /api/oaksome/home`, `GET /api/oaksome/inspirations`, `GET /api/oaksome/case-studies`, `GET /api/oaksome/case-studies/:slug`.
- Renduing mode: mostly SSG/ISR, SSR only where dynamic filtering is required.
- Tracking minimum : `page_view`, `view_item_list`, `select_content`.

## Critères d’acceptation (obligatoires)

- Les sections homepage sont rendues à partir du payload home live (y compris les dépendances top notice).
- Inspirations filters and cards behave correctly.
- Case study list + detail pages rendu with SEO metadata and related products.
- Toutes les pages statiques / légales se résolvent sous les routes localisées.

## Preuves requises

- Checklist des routes pour toutes les pages de ce jalon.
- Captures d’écran for homepage + inspirations + case detail.
- `npm run lint` et `npm run build` passent.

## Contraintes globales (décisions validées)

- Tous les endpoints mentionnés dans ce jalon sont à appeler en versionnée : `/api/oaksome/v1/*`.
- Paramètres API obligatoires : `lang` (défaut `en`) et `country` (défaut `BE`).
- Respecter l’enveloppe API standard (`success`, `data`, `meta`) sur tous les fetchs serveur.

## Contenu dynamique

### M8.1 — Homepage `/` [XL]
- [ ] SSG + ISR 1h
- [ ] `GET /api/oaksome/home?country=BE`
- [ ] Sections: hero, collections carousel, bestsellers grid, spaces, how-it-works, craftsmanship, testimonials
- [ ] PromoBar data from top_notice
- [ ] CTA: "Configurer mon meuble" → `/configurer`
- [ ] Preuve sociale : slider de témoignages
- [ ] SEO: generateMetadata, JSON-LD Organization
- [ ] Tracking: page_view, view_item_list (bestsellers)
- **Portée** : `app/[locale]/(marketing)/page.tsx`
- **Dépend de** : M3.4 (TestimonialSlider), M2.1 (ProductCard)

### M8.2 — Inspirations page `/inspirations` [L]
- [ ] SSR (dynamic filters)
- [ ] `GET /api/oaksome/inspirations?source=oaksome&collection=...&space=...`
- [ ] Filter by source (oaksome/instagram/pinterest), collection, space
- [ ] Grid of inspiration cards with hover
- [ ] Click: enlarged view (inspiration) or link to case study
- [ ] Tracking: select_content
- **Portée** : `app/[locale]/(shop)/inspirations/page.tsx`

### M8.3 — InspirationCard component [S]
- [ ] `components/cards/inspiration-card.tsx`
- [ ] Image, source badge, ville, collection/space tags
- **Portée** : `components/cards/inspiration-card.tsx`

### M8.4 — Case studies list `/etudes-de-cas` [M]
- [ ] SSG + ISR 1h
- [ ] `GET /api/oaksome/case-studies`
- [ ] Grid of case study cards
- **Portée** : `app/[locale]/(shop)/etudes-de-cas/page.tsx`

### M8.5 — Case study detail `/etude-de-cas/[slug]` [L]
- [ ] SSG + ISR 1h
- [ ] `GET /api/oaksome/case-studies/:slug`
- [ ] Gallery (avant/après), description, specs (surface, budget, delay)
- [ ] Related products
- [ ] SEO: generateMetadata, OG tags
- **Portée** : `app/[locale]/(shop)/etude-de-cas/[slug]/page.tsx`

### M8.6 — CaseStudyCard component [S]
- [ ] `components/cards/case-study-card.tsx`
- [ ] Image, title, ville, collection, surface
- **Portée** : `components/cards/case-study-card.tsx`

## Contenu statique

### M8.7 — A propos `/a-propos` [S]
- [ ] Static SSG, content from prototype
- **Portée** : `app/[locale]/(marketing)/a-propos/page.tsx`

### M8.8 — Comment ca marche `/comment-ca-marche` [M]
- [ ] Static SSG, step-by-step process (6 steps with images)
- **Portée** : `app/[locale]/(marketing)/comment-ca-marche/page.tsx`

### M8.9 — FAQ `/faq` [M]
- [ ] Static SSG, accordion Q&A
- [ ] JSON-LD FAQPage schema
- **Portée** : `app/[locale]/(marketing)/faq/page.tsx`

### M8.10 — Engagements `/engagements` [S]
- [ ] Static SSG
- **Portée** : `app/[locale]/(marketing)/engagements/page.tsx`

### M8.11 — Legal pages (7 pages) [M]
- [ ] All SSG: mentions-legales, cgv, cookies, accessibilite, tva-6, livraison, garantie
- [ ] Content from legal team (placeholder for now)
- **Portée** : `app/[locale]/(legal)/*.tsx`
