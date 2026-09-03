# M1 — Layout & Navigation

> Statut : À FAIRE
> Dépend de : M0
> Bloque : All other milestones


## Résumé du contrat du jalon

- Pages / composants livrés : shell global du layout, header, mega-menu, footer, modale de recherche, panneau de notifications, breadcrumb.
- APIs requises consommées : `GET /api/oaksome/home` (top_notice), `GET /api/oaksome/navigation`, `GET /api/oaksome/search`.
- Attentes de rendu : shell layout disponible sur toutes les routes localisées ; approche server-first quand possible avec de petits islands client.
- Condition de dépendance : this milestone unblocks all following milestones.

## Critères d’acceptation (obligatoires)

- Header/footer rendu on all pages under `app/[locale]/*`.
- Mega-menu (desktop + mobile) fonctionne avec les données live navigation data.
- Search opens, queries API for >=3 chars, et navigue correctement.
- Cart/wishlist/notification badges and panels rendu sans erreurs d’hydratation.

## Preuves requises

- Screen recording: desktop + mobile header/menu/search interactions.
- preuve API: navigation/home/search requests visible in network logs.
- `npm run lint` et `npm run build` passent.

## Contraintes globales (décisions validées)

- Tous les endpoints mentionnés dans ce jalon sont à appeler en versionnée : `/api/oaksome/v1/*`.
- Ajouter systématiquement `lang=en|fr|nl` (défaut `en`) et `country=BE|LU` (défaut `BE`) sur les appels API.
- Gérer les erreurs selon le contrat unifié (`code`, `message`, `details`, `request_id`).

## Tâches

### M1.1 — PromoBar component [S]
- [ ] `components/layout/header/promo-bar.tsx` — top banner from API (`website.top.notice`)
- [ ] Server component, content from `GET /api/oaksome/home` → `top_notice`
- [ ] Design: bleu-promo background, white text, closable
- **Portée** : `components/layout/header/promo-bar.tsx`

### M1.2 — Header shell (server) [M]
- [ ] `components/layout/header/header.tsx` — server component shell
- [ ] Logo (link to `/`), nav links, right-side icons (search, account, notifications, wishlist, cart)
- [ ] Badges on cart/wishlist/notifications (client islands)
- [ ] Mobile: hamburger icon
- [ ] Glassmorphism on scroll (class `.scrolled` at scrollY > 80px) — needs client wrapper
- **Portée** : `components/layout/header/header.tsx`, `components/layout/header/header-client.tsx`
- **Dépend de** : M1.1

### M1.3 — MegaMenu [L]
- [ ] `components/layout/header/mega-menu.tsx` — full-width overlay
- [ ] 3 sections: Par Type (10 gammes), Par Piece (5 espaces), Collections (4 swatches)
- [ ] Data from `GET /api/oaksome/navigation` (cached ISR 1h)
- [ ] Desktop: hover trigger, overlay with images
- [ ] Mobile: accordion inside hamburger menu
- **Portée** : `components/layout/header/mega-menu.tsx`, `components/layout/header/mobile-menu.tsx`
- **Dépend de** : M1.2

### M1.4 — Footer [M]
- [ ] `components/layout/footer.tsx`
- [ ] 4 columns: Explorer, Apprendre, Support, Legal
- [ ] Social icons: Instagram, Facebook, Pinterest, TikTok
- [ ] Country selector: Belgique / Luxembourg (uses CountryContext)
- [ ] Contact: telephone, email
- [ ] Newsletter signup (future — placeholder for now)
- **Portée** : `components/layout/footer.tsx`

### M1.5 — SearchModal [L]
- [ ] `components/layout/search-modal.tsx` — full-screen overlay
- [ ] Input autofocus, hints ("Essayez : dressing, bibliotheque, Satori, chambre...")
- [ ] < 3 chars: suggestions from navigation cache (collections, types, espaces)
- [ ] >= 3 chars: `GET /api/oaksome/search?q=...`
- [ ] Results: products + category suggestions
- [ ] Click result → navigate to product/category page
- **Portée** : `components/layout/search-modal.tsx`
- **Dépend de** : M1.2

### M1.6 — NotificationPanel [M]
- [ ] `components/layout/notification-panel.tsx` — dropdown from bell icon
- [ ] List of notifications, badge unread count
- [ ] Click → navigate to link (order detail, etc.)
- [ ] Mark as read on open
- [ ] Uses NotificationsContext (polling 60s)
- **Portée** : `components/layout/notification-panel.tsx`
- **Dépend de** : M1.2, features/notifications

### M1.7 — Intégration du layout racine [M]
- [ ] Wire PromoBar + Header + Footer into `app/[locale]/layout.tsx`
- [ ] Add all providers in correct hierarchy: Country → Auth → Cart → Wishlist → Notifications
- [ ] Vérifier: every page rendus with header/footer
- **Portée** : `app/[locale]/layout.tsx`
- **Dépend de** : M1.1-M1.6

### M1.8 — BreadcrumbNav [S]
- [ ] `components/ui/breadcrumb.tsx` — dynamic breadcrumb
- [ ] Auto-généré à partir des segments de route
- [ ] i18n: translate segment labels
- **Portée** : `components/ui/breadcrumb.tsx`
