# M11 — Tests & QA

> Statut : À FAIRE
> Dépend de : M1-M10 (test what's built)
> Target: 80% coverage minimum


## Résumé du contrat du jalon

- Test scope: unit + integration + e2e across navigation, catalogue, configurator, auth, checkout, i18n, tracking.
- Quality gate: regression safety for milestones M1-M10 plus tracking server contract checks.
- Vérifications tracking obligatoires : forme du payload événement, cycle de vie de `event_id`, comportement d’idempotence CAPI.

## Critères d’acceptation (obligatoires)

- Core unit suites pass for API/store/contexts/components.
- Critical e2e user journeys pass (browse, configure, auth, checkout).
- Les tests tracking couvrent le comportement contractuel Tier A + route CAPI.
- Test artifacts are documented and reproducible by another developer.

## Preuves requises

- Jest summary + Playwright summary attached to milestone.
- Failing tests (if any) explicitly triaged with owner/date.
- `npm test` and `npm run test:e2e` pass (or documented quarantine list).

## Contraintes globales à tester (décisions validées)

- Vérifier que les appels business ciblent `/api/oaksome/v1/*`.
- Vérifier la gestion des erreurs auth : `AUTH_REQUIRED` / `SESSION_EXPIRED`.
- Vérifier pagination avec `has_next` sur les endpoints liste.
- Vérifier le scénario mismatch prix checkout : blocage + delta + reconfirmation.

## Unit Tests (Jest)

### M11.1 — API client tests [M]
- [ ] Test `apiGet`, `apiPost` with mocked fetch
- [ ] Test error handling (network error, 404, 500)
- [ ] Test Result type guards (isSuccess, isError)
- **Portée** : `src/lib/api/__tests__/client.test.ts`

### M11.2 — Store tests [S]
- [ ] Test localStorage helpers (getItem, setItem, removeItem)
- [ ] Test SSR fallback (window undefined)
- **Portée** : `src/lib/store/__tests__/storage.test.ts`

### M11.3 — Feature context tests [L]
- [ ] CartContext: addItem, removeItem, updateQuantity, clearCart, persistence
- [ ] WishlistContext: add, remove, isInWishlist, persistence
- [ ] CountryContext: default BE, change to LU, persistence
- [ ] ConfiguratorContext: step navigation, setters, reset
- **Portée** : `src/features/*/__tests__/*.test.tsx`

### M11.4 — Utility tests [S]
- [ ] cn() helper
- [ ] format-price
- [ ] slugify
- **Portée** : `src/lib/utils/__tests__/*.test.ts`

### M11.5 — Component tests [L]
- [ ] ProductCard: rendus name, price, image, badges
- [ ] PriceDisplay: formats correctly for BE/LU
- [ ] FilterBar: chip selection, URL sync
- [ ] QtyStepper: increment, decrement, min/max
- [ ] BreadcrumbNav: rendus segments
- **Portée** : `src/components/**/__tests__/*.test.tsx`

### M11.6 — Tracking event tests [M]
- [ ] Test each Tier A event pushes correct dataLayer structure
- [ ] Test `event_id` UUID v4 is generated before push and reused client/server
- [ ] Test email hash normalization (`trim -> lowercase -> UTF-8 -> SHA-256`)
- [ ] Test GTM push function
- **Portée** : `src/features/tracking/__tests__/*.test.ts`

### M11.6b — CAPI contract tests [M]
- [ ] Validate event whitelist (`purchase`, `generate_lead`, `begin_checkout`)
- [ ] Validate consent gating and destination status (`sent/skipped/failed` + reason)
- [ ] Validate idempotence behavior (deduplicated response, conflict 409)
- [ ] Validate retry policy on transient errors only
- [ ] **Portée** : `app/api/tracking/capi/__tests__/route.test.ts`

## E2E Tests (Playwright)

### M11.7 — Navigation flow [M]
- [ ] Homepage loads, header visible
- [ ] Mega-menu opens on hover, shows collections/types/espaces
- [ ] Search modal opens, type query, results appear
- [ ] Footer visible, country selector works
- **Portée** : `e2e/navigation.spec.ts`

### M11.8 — Catalogue flow [M]
- [ ] `/acheter` loads products
- [ ] Filters work (click collection chip, products filter)
- [ ] Click product → product detail loads
- [ ] Back button preserves scroll + filters
- **Portée** : `e2e/catalogue.spec.ts`

### M11.9 — Configurator flow [L]
- [ ] Full tunnel: type → collection → facade → color → dimensions → price
- [ ] Step indicator updates
- [ ] Back/forward navigation between steps
- [ ] "Sauvegarder" opens email popup
- [ ] "Ajouter au panier" adds to cart
- **Portée** : `e2e/configurator.spec.ts`

### M11.10 — Auth flow [M]
- [ ] Register → login → profile visible
- [ ] Logout → redirected
- [ ] Password recover → email sent message
- **Portée** : `e2e/auth.spec.ts`

### M11.11 — Cart & checkout flow [M]
- [ ] Add product to cart → cart overlay shows item
- [ ] Update quantity, remove item
- [ ] "Commander" → auth check → checkout redirect
- **Portée** : `e2e/checkout.spec.ts`

### M11.12 — i18n flow [S]
- [ ] `/fr/` loads French content
- [ ] `/nl/` loads Dutch content
- [ ] Route segments translated correctly
- [ ] Language switch preserves current page
- **Portée** : `e2e/i18n.spec.ts`
