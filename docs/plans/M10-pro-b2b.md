# M10 — Pro/B2B

> Statut : À FAIRE
> Dépend de : M6.1 (auth), M6.5 (profile)
> Spécification : autonome dans ce fichier de tâche (les docs externes sont optionnelles, pas nécessaires).


## Résumé du contrat du jalon

- Routes livrées : `/pro`, `/pro/inscription`, profile pro status UI.
- APIs requises : `POST /api/oaksome/auth/register` with `is_pro=true`, `GET /api/oaksome/profile` for approval state.
- Pricing behavior: pro pricing comes server-side from Odoo session/pricelist.
- Tracking minimum : `pro_register`.

## Critères d’acceptation (obligatoires)

- Pro inscription validates BCE/KBO and submits with `is_pro=true`.
- Profile banner correctly handles pending vs active pro states.
- `/pro` landing page CTA and flow are functional end-to-end.
- Pro pricing difference is verified with a pro user session.

## Preuves requises

- Preuve de soumission pour un compte pro valide.
- Before/after screenshot for standard vs pro pricing.
- `npm run lint` et `npm run build` passent.

## Contraintes globales (décisions validées)

- Tous les endpoints mentionnés dans ce jalon sont à appeler en versionnée : `/api/oaksome/v1/*`.
- Les retours API suivent le contrat d’erreur unifié (gestion claire des erreurs côté UI).

## Tâches

### M10.1 — Pro landing page `/pro` [M]
- [ ] SSR, public
- [ ] Presentation: advantages pro (remise %, support dedie, conditions)
- [ ] CTA: "Devenir partenaire" → `/pro/inscription`
- **Portée** : `app/[locale]/(pro)/pro/page.tsx`

### M10.2 — Pro inscription `/pro/inscription` [M]
- [ ] Form: company name, BCE/KBO number, email, phone, name
- [ ] Zod validation (BCE/KBO format)
- [ ] `POST /api/oaksome/auth/register` with `is_pro: true`
- [ ] On success: redirect to `/profile` (bandeau "en attente de validation")
- [ ] Tracking: pro_register
- **Portée** : `app/[locale]/(pro)/pro/inscription/page.tsx`

### M10.3 — Profile pro bandeau [S]
- [ ] In profile page: show "Compte pro en attente de validation" when is_pro but not yet approved
- [ ] Show "Compte pro actif — remise X%" when approved
- [ ] Relies on `GET /api/oaksome/profile` → `is_pro` field
- **Portée** : `app/[locale]/(account)/profile/page.tsx` (update from M6.5)
- **Dépend de** : M6.5

### M10.4 — Pro pricing display [S]
- [ ] PriceDisplay component: when user is pro and authenticated, prices come with pricelist applied
- [ ] API automatically returns pro prices via session (Odoo pricelist)
- [ ] Aucune logique frontend nécessaire — vérifier seulement que les prix diffèrent quand on est connecté en pro
- **Portée** : Verification task, no code change expected
