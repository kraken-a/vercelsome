# M2 — Catalogue & Produits

> Statut : À FAIRE
> Dépend de : M1
> Spécification : autonome dans ce fichier de tâche (les docs externes sont optionnelles, pas nécessaires).


## Résumé du contrat du jalon

- Routes livrées : `/acheter`, `/produit/[id]` + shared catalogue components.
- APIs requises : `GET /api/oaksome/products`, `GET /api/oaksome/products/:id`, `POST /api/oaksome/leads` (share flow on product page).
- Core behavior: URL-driven filters, pagination, product detail configuration selection, add-to-cart/wishlist integration.
- Tracking minimum : `view_item`, `view_item_list`, `select_item`, `add_to_wishlist`.

## Critères d’acceptation (obligatoires)

- `/acheter` supports filter query params and keeps state on back-navigation.
- `/produit/[id]` rendus gallery, price, config options, related products, and CTA actions.
- L’action de partage produit appelle l’API leads avec `share=true` et retourne le payload du lien.
- Metadata + JSON-LD Product are present on product detail.

## Preuves requises

- Notes de test manuelles for catalogue filters + product detail journey.
- 1 API sample response captured for list + detail endpoints.
- `npm run lint` et `npm run build` passent.

## Contraintes globales (décisions validées)

- Tous les endpoints mentionnés dans ce jalon sont à appeler en versionnée : `/api/oaksome/v1/*`.
- Respect du contrat payload : `snake_case`, montants en minor units + `currency`, pagination avec `has_next`.
- Ajouter `lang`/`country` sur les requêtes liste/détail afin de garantir contenu traduit et prix TTC cohérents.

## Composants partagés

### M2.1 — ProductCard [M]
- [ ] `components/cards/product-card.tsx` — server component
- [ ] Image (next/image from Odoo), name, price (PriceDisplay), color dots, badge new/premium
- [ ] Wishlist heart button (client island)
- [ ] Hover: image scale(1.03) 700ms
- [ ] Sharp corners, no shadows
- **Portée** : `components/cards/product-card.tsx`

### M2.2 — PriceDisplay [S]
- [ ] `components/ui/price-display.tsx` — client component (depends on CountryContext)
- [ ] Format price with currency, TTC indicator based on country
- [ ] "A partir de X EUR" variant
- **Portée** : `components/ui/price-display.tsx`

### M2.3 — FilterBar [L]
- [ ] `components/filters/filter-bar.tsx` — client component
- [ ] Horizontal scrollable chips: collection, type, espace, prix range
- [ ] Active state styling (vert-persan)
- [ ] Sync with URL search params (preserve on back-navigation)
- [ ] Live result count
- [ ] Separators between filter groups
- **Portée** : `components/filters/filter-bar.tsx`, `components/filters/filter-chip.tsx`

### M2.4 — ProductGrid [M]
- [ ] `components/cards/product-grid.tsx` — responsive grid
- [ ] Desktop: 3-4 columns, Tablet: 2, Mobile: 1
- [ ] Supports `product.grid.block` visual blocks between products
- **Portée** : `components/cards/product-grid.tsx`

## Pages

### M2.5 — Catalogue page `/acheter` [L]
- [ ] SSR (dynamic filters from URL)
- [ ] `GET /api/oaksome/products` with filter params
- [ ] FilterBar + ProductGrid + pagination
- [ ] SEO: generateMetadata, breadcrumb
- [ ] Preserve scroll on back-navigation
- **Portée** : `app/[locale]/(shop)/acheter/page.tsx`
- **Dépend de** : M2.1-M2.4

### M2.6 — Product detail `/produit/[id]` [XL]
- [ ] SSG + ISR 30min
- [ ] `GET /api/oaksome/products/:id`
- [ ] Image gallery (main + thumbnails)
- [ ] Product info: name, price, description, dimensions
- [ ] Configuration options (facade, color, finition) — inline selection
- [ ] Add to cart button (CartContext)
- [ ] Wishlist button
- [ ] Share button → popup email → `POST /api/oaksome/leads` with share=true
- [ ] Related products carousel
- [ ] Selling points (icons + text)
- [ ] Rating display
- [ ] SEO: generateMetadata, JSON-LD Product schema, OG tags
- [ ] Tracking: view_item event
- **Portée** : `app/[locale]/(shop)/produit/[id]/page.tsx`
- **Dépend de** : M2.1, M2.2

### M2.7 — QtyStepper component [S]
- [ ] `components/ui/qty-stepper.tsx` — +/- buttons with value
- **Portée** : `components/ui/qty-stepper.tsx`
