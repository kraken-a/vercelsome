# M7 — Panier & Checkout

> Statut : À FAIRE
> Dépend de : M1, M2.2, M2.7, M6.1
> Spécification : autonome dans ce fichier de tâche (les docs externes sont optionnelles, pas nécessaires).


## Résumé du contrat du jalon

- Fonctionnalités livrées : cart overlay, TVA 6% step, checkout redirect flow, `/checkout/success`.
- APIs requises : tier panier (`/cart/add`, `/cart/update`, `/cart/remove`, `/cart`, `/cart/checkout-url`) et `PUT /api/oaksome/profile` pour l’année du bâtiment.
- Contrat de checkout : localStorage cart synced to Odoo before requesting checkout URL.
- Tracking minimum : `add_to_cart`, `view_cart`, `remove_from_cart`, `begin_checkout`, `purchase`.

## Critères d’acceptation (obligatoires)

- Cart overlay supports full CRUD and totals display.
- Checkout flow enforces auth + TVA step logic for BE before redirect.
- La page de succès vide le panier local et émet le payload de l’événement purchase.
- Redirect returns user to account order detail path when requested.

## Preuves requises

- Checkout test à blanc video including TVA branch.
- Exemples API pour la synchro panier + checkout-url + paramètres de succès.
- `npm run lint` et `npm run build` passent.

## Contraintes globales (décisions validées)

- Tous les endpoints mentionnés dans ce jalon sont à appeler en versionnée : `/api/oaksome/v1/*`.
- Snapshot prix requis à l’ajout panier : `unit_price_amount`, `currency`, `price_source`, `price_version|price_updated_at`, `computed_at`.
- Revalidation prix obligatoire par Odoo au checkout.
- En cas d’écart de prix checkout : bloquer confirmation, afficher ancien vs nouveau total, exiger reconfirmation.

## Tâches

### M7.1 — Cart overlay [L]
- [ ] Global overlay (not a separate page), triggered from cart icon in header
- [ ] List cart items from CartContext (localStorage)
- [ ] Each item: image, name, config summary, price, QtyStepper, remove button
- [ ] Subtotal, delivery info, total
- [ ] CTA "Commander" → checkout flow
- [ ] CTA "Continuer mes achats" → close overlay
- [ ] Empty state: "Votre panier est vide"
- [ ] Tracking: view_cart, remove_from_cart
- **Portée** : `components/layout/cart-overlay.tsx`

### M7.2 — TVA 6% step (Belgium) [M]
- [ ] Popup/step shown before checkout redirect when country=BE
- [ ] Question: "Votre logement a-t-il plus de 10 ans ?" + year input
- [ ] Si > 10 ans + usage privé → mettre à jour le profil avec `oaksome_building_year`
- [ ] `PUT /api/oaksome/profile` with building year
- [ ] Flag stored, Odoo applies position fiscale automatically on SO1
- **Portée** : `components/checkout/tva-step.tsx`

### M7.3 — Checkout flow [L]
- [ ] Triggered by "Commander" in cart overlay
- [ ] Check auth: if not connected → redirect to `/login?redirect=/checkout`
- [ ] Sync localStorage cart to Odoo: `POST /api/oaksome/cart/add` for each item
- [ ] If country=BE → show TVA 6% step (M7.2)
- [ ] `GET /api/oaksome/cart/checkout-url` → get Odoo checkout URL
- [ ] Redirect to Odoo checkout (cdn.oaksome.com)
- [ ] Tracking: begin_checkout
- **Portée** : `app/[locale]/(shop)/checkout/page.tsx`
- **Dépend de** : M7.1, M7.2

### M7.4 — Checkout success `/checkout/success` [M]
- [ ] CSR page, query param `?order=xxx`
- [ ] Display order confirmation, order number
- [ ] CTA: "Voir ma commande" → `/commandes/[id]`
- [ ] Clear cart (CartContext.clearCart)
- [ ] Tracking: purchase event (transaction_id, value, items)
- **Portée** : `app/[locale]/(shop)/checkout/success/page.tsx`

### M7.5 — Add to cart button component [S]
- [ ] `components/ui/add-to-cart-button.tsx` — client component
- [ ] Uses CartContext.addItem()
- [ ] Tracking: add_to_cart event
- [ ] Used on product detail, configurator, echantillons (kit)
- **Portée** : `components/ui/add-to-cart-button.tsx`
