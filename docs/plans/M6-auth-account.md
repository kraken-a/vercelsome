# M6 — Auth & Compte

> Statut : À FAIRE
> Dépend de : M1
> Spécification : autonome dans ce fichier de tâche (les docs externes sont optionnelles, pas nécessaires).


## Résumé du contrat du jalon

- Routes livrées : `/login`, `/register`, `/password-recover`, `/password-reset`, `/profile`, `/commandes`, `/commandes/[id]`, `/commandes/[id]/rendez-vous`.
- APIs requises : auth endpoints (`/auth/*`), profile (`GET/PUT /profile`), orders (`/orders*`), notifications, photos submit, appointments slots/book.
- Modèle de session : Odoo session cookie controls authenticated account areas.
- Tracking minimum : `login`, `sign_up`, `password_reset`, `appointment_booked`.

## Critères d’acceptation (obligatoires)

- L’auth guard bloque les routes du compte quand l’utilisateur n’est pas authentifié.
- Register/login/recover/reset flows all complete with proper user messaging.
- Orders list/detail and rendez-vous booking work on real account data.
- Photo submission and documents section appear under correct order conditions.

## Preuves requises

- Test account walkthrough from register -> orders detail.
- Exemples API pour login/profile/commandes/rendez-vous.
- `npm run lint` et `npm run build` passent.

## Contraintes globales (décisions validées)

- Tous les endpoints mentionnés dans ce jalon sont à appeler en versionnée : `/api/oaksome/v1/*`.
- Gérer explicitement `401 AUTH_REQUIRED` et `401 SESSION_EXPIRED` sur toutes les vues compte.
- Utiliser le format d’erreur unifié (`code`, `message`, `details`, `request_id`) pour les messages UI.

## Pages d’authentification

### M6.1 — Login page `/login` [M]
- [ ] Email + password form, Zod validation
- [ ] `POST /api/oaksome/auth/login` → set session cookie
- [ ] AuthContext.setUser() on success
- [ ] Redirect to previous page or `/profile`
- [ ] Link to register, password-recover
- [ ] Tracking: login event
- **Portée** : `app/[locale]/(auth)/login/page.tsx`

### M6.2 — Register page `/register` [M]
- [ ] Form: name, email, password, phone
- [ ] Zod validation (email format, password strength)
- [ ] `POST /api/oaksome/auth/register`
- [ ] Succès : redirect to `/login` with confirmation message
- [ ] Tracking: sign_up event
- **Portée** : `app/[locale]/(auth)/register/page.tsx`

### M6.3 — Password recover `/password-recover` [S]
- [ ] Email input → `POST /api/oaksome/auth/password-recover`
- [ ] Message de succès: "Email de reinitialisation envoye"
- **Portée** : `app/[locale]/(auth)/password-recover/page.tsx`

### M6.4 — Password reset `/password-reset` [S]
- [ ] New password input (from `?token=xxx`)
- [ ] `POST /api/oaksome/auth/password-reset` with token + password
- [ ] Succès : redirect to `/login`
- [ ] Invalid/expired token: error message
- **Portée** : `app/[locale]/(auth)/password-reset/page.tsx`

## Pages du compte

### M6.5 — Profile page `/profile` [M]
- [ ] CSR, auth required (redirect to `/login` if not authenticated)
- [ ] `GET /api/oaksome/profile` → display name, email, phone, address
- [ ] Edit form → `PUT /api/oaksome/profile`
- [ ] Pro status bandeau: "Compte pro en attente de validation" if is_pro pending
- [ ] Collection preference selector
- **Portée** : `app/[locale]/(account)/profile/page.tsx`

### M6.6 — Orders list `/commandes` [M]
- [ ] CSR, auth required
- [ ] `GET /api/oaksome/orders` → list SO1 + SO2
- [ ] Each order: name, date, oaksome_status with label, total, collection, product summary
- [ ] Click → `/commandes/[id]`
- **Portée** : `app/[locale]/(account)/commandes/page.tsx`

### M6.7 — Order detail `/commandes/[id]` [L]
- [ ] CSR, auth required
- [ ] `GET /api/oaksome/orders/:id`
- [ ] Statut tracker: 7-step visual progress bar (portal mapping)
- [ ] Order lines, amounts (paid, remaining)
- [ ] SO2 linked info if exists
- [ ] Next action display (date + label)
- [ ] CTA "Planifier mes mesures/pose" → `/commandes/[id]/rendez-vous` (when status allows)
- [ ] Photo submission section (visible when status=done) → `POST /api/oaksome/photos/submit`
- [ ] Documents section (invoices, signed CGV)
- **Portée** : `app/[locale]/(account)/commandes/[id]/page.tsx`
- **Dépend de** : M6.6

### M6.8 — Rendez-vous page `/commandes/[id]/rendez-vous` [L]
- [ ] CSR, auth required
- [ ] `GET /api/oaksome/appointments/slots?order_id=X&type=mesures`
- [ ] Calendar view or slot list by date
- [ ] Select slot → `POST /api/oaksome/appointments/book`
- [ ] Confirmation display with date/time
- [ ] Notes field for client
- [ ] Tracking: appointment_booked
- **Portée** : `app/[locale]/(account)/commandes/[id]/rendez-vous/page.tsx`
- **Dépend de** : M6.7

### M6.9 — Account layout with auth guard [M]
- [ ] `app/[locale]/(account)/layout.tsx`
- [ ] Check AuthContext.isAuthenticated → redirect to `/login` if false
- [ ] Sidebar: Profile, Commandes, Wishlist links
- **Portée** : `app/[locale]/(account)/layout.tsx`
