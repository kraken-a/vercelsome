# M4 — Configurateur

> Statut : À FAIRE
> Dépend de : M1, M2.2
> Spécification : autonome dans ce fichier de tâche (les docs externes sont optionnelles, pas nécessaires).


## Résumé du contrat du jalon

- Route delivered: `/configurer` with 6-step tunnel and share import support `?from_share=<token>`.
- APIs requises : `GET /api/oaksome/configurator`, `POST /api/oaksome/leads` (save/share).
- Contrat d’état : ConfiguratorContext holds type, collection, facade, color, dimensions, estimated price.
- Tracking minimum : `configurator_start`, `configurator_step`, `configurator_complete`, `configurator_share`.

## Critères d’acceptation (obligatoires)

- User can complete full 6-step flow and reach price summary.
- Save/share actions call leads API and display success outcome.
- `from_share` token pre-fills the configurator state when valid.
- L’ajout au panier depuis le récapitulatif envoie le payload complet de configuration.

## Preuves requises

- Enregistrement end-to-end: open configurator -> complete -> save/share/add-to-cart.
- Exemple de payload API pour le bootstrap du configurateur + la soumission de lead.
- `npm run lint` et `npm run build` passent.

## Contraintes globales (décisions validées)

- Tous les endpoints mentionnés dans ce jalon sont à appeler en versionnée : `/api/oaksome/v1/*`.
- Le calcul pricing configurateur passe par appel **serveur Next.js** (jamais direct navigateur).
- Timeout/retry pricing : 3s + 2 retries (300ms, 700ms).
- Si pricing indisponible : sauvegarde config autorisée, panier/checkout bloqués, CTA “Réessayer le calcul”.

## Tâches

### M4.1 — StepIndicator component [S]
- [ ] `components/configurator/step-indicator.tsx`
- [ ] "Etape 2 sur 6" with progress dots/bar
- [ ] Active step in vert-persan
- **Portée** : `components/configurator/step-indicator.tsx`

### M4.2 — ConfiguratorTunnel layout [M]
- [ ] `components/configurator/configurator-tunnel.tsx`
- [ ] Grid: 7fr (viewer/image left) + 5fr (options panel right)
- [ ] Panel scrollable, price sticky at bottom
- [ ] Close button (X) to exit tunnel
- [ ] Step transitions: 250ms cubic-bezier
- [ ] Uses ConfiguratorContext
- **Portée** : `components/configurator/configurator-tunnel.tsx`
- **Dépend de** : M4.1

### M4.3 — Step: Type selection [M]
- [ ] Select furniture type (10 gammes) with images
- [ ] Data from `GET /api/oaksome/configurator` → types
- [ ] On select → setType() → next step
- [ ] Tracking: configurator_start
- **Portée** : `components/configurator/steps/step-type.tsx`

### M4.4 — Step: Collection selection [M]
- [ ] Select collection (4 swatches: Line, Satori, Vista, Lys)
- [ ] Show swatch color + name + image
- [ ] On select → setCollection() → next step
- [ ] Tracking: configurator_step
- **Portée** : `components/configurator/steps/step-collection.tsx`

### M4.5 — Step: Facade selection [M]
- [ ] Select facade option (filtered by collection)
- [ ] Show facade images, extra_price if any
- [ ] On select → setFacade() → next step
- **Portée** : `components/configurator/steps/step-facade.tsx`

### M4.6 — Step: Color selection [M]
- [ ] Select color (filtered by collection)
- [ ] Show color swatches with hex
- [ ] On select → setColor() → next step
- **Portée** : `components/configurator/steps/step-color.tsx`

### M4.7 — Step: Dimensions [M]
- [ ] Width, depth, height inputs with min/max/step from API
- [ ] Live price update as dimensions change
- [ ] Validation: within allowed ranges
- [ ] On confirm → setDimensions() → next step
- **Portée** : `components/configurator/steps/step-dimensions.tsx`

### M4.8 — Step: Price summary [L]
- [ ] Display final config: type, collection, facade, color, dimensions
- [ ] Estimated price (computed from base + options + dimensions)
- [ ] 3 CTAs: "Sauvegarder" | "Partager" | "Ajouter au panier"
- [ ] "Sauvegarder" → popup email → POST /api/oaksome/leads
- [ ] "Partager" → popup email → POST /api/oaksome/leads (share=true) → show copy link
- [ ] "Ajouter au panier" → CartContext.addItem()
- [ ] Tracking: configurator_complete
- **Portée** : `components/configurator/steps/step-price.tsx`
- **Dépend de** : M5.1 (lead popup)

### M4.9 — Configurator page `/configurer` [M]
- [ ] CSR page wrapping ConfiguratorProvider + ConfiguratorTunnel
- [ ] Support `?from_share=<token>` for pre-filled config (from shared link)
- [ ] Load initial data: GET /api/oaksome/configurator
- **Portée** : `app/[locale]/(shop)/configurer/page.tsx`
- **Dépend de** : M4.2-M4.8
