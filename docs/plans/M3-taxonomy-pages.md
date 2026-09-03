# M3 — Collections, Gammes, Espaces

> Statut : À FAIRE
> Dépend de : M1, M2.1-M2.4
> Spécification : autonome dans ce fichier de tâche (les docs externes sont optionnelles, pas nécessaires).


## Résumé du contrat du jalon

- Routes livrées : `/collection/[slug]`, `/gamme/[slug]`, `/espace/[slug]`.
- APIs requises : `GET /api/oaksome/collections/:slug`, `GET /api/oaksome/gamme/:slug`, `GET /api/oaksome/espace/:slug`.
- Shared UI dependencies: testimonial slider, gallery slider, swatch component.
- Renduing mode: SSG + ISR (1h) for taxonomy pages.

## Critères d’acceptation (obligatoires)

- All 4 collections, 10 gammes, and 5 espaces resolve correctly by slug.
- Each taxonomy page shows hero + filtered product grid from live API.
- SEO metadata and canonical alternates are set per taxonomy page.
- `view_collection` tracking is emitted on collection pages.

## Preuves requises

- Checklist des routes avec succès/échec pour tous les slugs.
- Captures d’écran for one page per taxonomy type.
- `npm run lint` et `npm run build` passent.

## Contraintes globales (décisions validées)

- Tous les endpoints mentionnés dans ce jalon sont à appeler en versionnée : `/api/oaksome/v1/*`.
- Paramètres API obligatoires : `lang` (défaut `en`) et `country` (défaut `BE`).
- Traiter pagination via `meta.total/page/limit/has_next` sur les pages taxonomiques listant des produits.

## Pages

### M3.1 — Collection page `/collection/[slug]` [L]
- [ ] SSG + ISR 1h via `generateStaticParams` (4 collections: line, satori, vista, lys)
- [ ] `GET /api/oaksome/collections/:slug`
- [ ] Hero: collection name, description, ambiance gallery
- [ ] Config options preview: facades, colors, finitions available
- [ ] Products grid filtered by collection
- [ ] SEO: generateMetadata, OG tags
- [ ] Tracking: view_collection event
- **Portée** : `app/[locale]/(shop)/collection/[slug]/page.tsx`

### M3.2 — Gamme page `/gamme/[slug]` [L]
- [ ] SSG + ISR 1h via `generateStaticParams` (10 gammes)
- [ ] `GET /api/oaksome/gamme/:slug`
- [ ] Hero: gamme name, description, dimension ranges, "prix depuis X EUR" (above fold)
- [ ] Products grid filtered by type
- [ ] Single unambiguous primary CTA
- [ ] Preuve sociale : 2-3 témoignages
- [ ] SEO: generateMetadata
- **Portée** : `app/[locale]/(shop)/gamme/[slug]/page.tsx`

### M3.3 — Espace page `/espace/[slug]` [L]
- [ ] SSG + ISR 1h via `generateStaticParams` (5 espaces)
- [ ] `GET /api/oaksome/espace/:slug`
- [ ] Hero: espace name, description, gallery
- [ ] Products grid filtered by space
- [ ] SEO: generateMetadata
- **Portée** : `app/[locale]/(shop)/espace/[slug]/page.tsx`

### M3.4 — TestimonialSlider component [M]
- [ ] `components/sliders/testimonial-slider.tsx` — carousel with prev/next
- [ ] Author name, text, rating stars, photo
- [ ] Counter "1/5"
- [ ] Used on gamme pages + homepage
- **Portée** : `components/sliders/testimonial-slider.tsx`

### M3.5 — GallerySlider component [M]
- [ ] `components/sliders/gallery-slider.tsx` — image gallery with thumbnails
- [ ] Used on collection pages, espace pages, product detail
- **Portée** : `components/sliders/gallery-slider.tsx`

### M3.6 — Swatch component [S]
- [ ] `components/ui/swatch.tsx` — color circle with label
- [ ] Used for collection swatches in mega-menu + collection pages
- **Portée** : `components/ui/swatch.tsx`
