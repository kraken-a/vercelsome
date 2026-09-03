# Oaksome — Backend Odoo & API JSON

> Version 2.0 — Avril 2026
> Lie a : [System-Design](System-Design.md) | [frontend-spec](frontend-spec.md) | [Oaksome_sale_process](Oaksome_sale_process.md) | [api-contract](api-contract.md) | [data-model](data-model.md)
> Dev guide Odoo : `oaksome_website/CLAUDE.md`

---

## 1. Modules Odoo natifs à activer

| Module | Nom technique | Rôle |
|---|---|---|
| CRM | `crm` | Pipeline commercial 4 étapes + leads |
| Ventes | `sale_management` | SO échantillons, SO1 acompte, SO2 définitif |
| Facturation | `account` | 3 factures : 50% + 90% + 10% |
| Inventaire | `stock` | Échantillons + bons livraison drop-ship |
| Achats | `purchase` | PO Wood Cam (drop-ship) + installateur (pose) |
| Field Service | `industry_fsm` | Interventions terrain : mesures et pose |
| Planning | `planning` | Vue planning techniciens et installateurs |
| Appointments | `appointment` | Booking en ligne mesures + pose depuis oaksome.com |
| Odoo Sign | `sign` | Signature CGV + attestation TVA 6% |
| Portail client | `portal` | Espace client : commandes, factures, documents |
| Automatisation | `base_automation` | Relances et alertes automatiques |
| Email Marketing | `mass_mailing` | Templates emails relances / post-pose / parrainage |
| Live Chat | `im_livechat` | Chat en direct depuis oaksome.com — **Phase 2** |
| WhatsApp | `whatsapp` | Connexion WhatsApp Business (natif v17 ou Twilio/360dialog) |
| Paiement Stripe | `payment_stripe` | Paiement en ligne factures depuis portail client |
| Analytique | `analytic` | Suivi coûts et revenus par projet client |

**Config CRM :**
- Activer les Leads (Configuration → Paramètres)
- Assignation Round-robin (nouveaux leads répartis entre CSM)
- Motif de perte obligatoire : Prix / Délai / Concurrent / Projet annulé / Autre

---

## 2. Modules custom à créer

### Module 1 : `oaksome_sale_workflow`

**Rôle :** Personnaliser le workflow des Sales Orders Oaksome.

- Bloquer `action_confirm()` si `oaksome_cgv_signed = False` sur SO1
- Ajouter smart buttons sur SO1 : "Tâches FS" / "SO2 lié" / "Signatures" / "Factures"
- Ajouter le champ calculé **Statut commande** sur SO1 (voir §6)
- Vue formulaire SO1 personnalisée avec onglets clairs
- Ajouter tous les champs custom sur `sale.order` (voir §3)

**Modèles étendus :** `sale.order`

### Module 2 : `oaksome_fsm_access`

**Rôle :** Checklist conditions d'accès livraison (CSM + technicien terrain).

- Ajouter les champs accès livraison sur `project.task` (type FS-MESURES)
- Vue mobile optimisée pour technicien terrain
- Champs `oaksome_handling_needed` + `oaksome_handling_amount` remontés automatiquement dans SO2

**Modèles étendus :** `project.task`

### Module 3 : `oaksome_portal_tracker`

**Rôle :** Tracker visuel progression commande affiché sur le portail client Odoo.

- Afficher l'état de la commande en temps réel basé sur `oaksome_status` du SO1
- Vue portail avec étapes visuelles (barre de progression 7 étapes)
- Le client ne voit PAS : opportunités CRM, PO fournisseurs, marges, notes internes

**Modèles étendus :** `sale.order` (portail)

---

## 3. Champs personnalisés

### 3.1 Sur `crm.lead`

| Nom du champ | Nom technique | Type | Valeurs |
|---|---|---|---|
| Type de projet | `oaksome_project_type` | Selection | Placard, Dressing, Bibliothèque, Bureau, Sous-escalier, Autre |
| Score qualification | `oaksome_score` | Selection | Chaud, Tiède, Froid |
| Canal de contact | `oaksome_channel` | Selection | WhatsApp, Chat, Téléphone, Email, Site |
| Collection choisie | `oaksome_collection` | Selection | Line, Satori, Vista, Lys |
| Config sauvegardée | `oaksome_config_values` | Json | JSON config meuble (facade, couleur, dimensions) |
| Prix estimé | `oaksome_estimated_price` | Float | Prix estimé configurateur |
| Produit d'intérêt | `oaksome_product_id` | Many2one → product.template | Produit concerné |
| Token de partage | `oaksome_share_token` | Char (index=True, copy=False) | Token unique pour lien partageable config |
| Expiration partage | `oaksome_share_expires` | Datetime | Date d'expiration du lien (J+90) |

> Les champs UTM (source, medium, campagne) sont natifs Odoo CRM — ne pas recréer.

### 3.2 Sur `sale.order` (SO1 et SO2)

| Nom du champ | Nom technique | Type | Détail |
|---|---|---|---|
| Type de commande | `oaksome_so_type` | Selection | Échantillons / SO1 Acompte / SO2 Définitif |
| SO1 parent | `oaksome_so1_id` | Many2one → sale.order | Référence SO1 lié au SO2 |
| Date des mesures | `oaksome_measurement_date` | Date | Date effective visite mesures |
| Technicien mesures | `oaksome_technician_id` | Many2one → hr.employee | Technicien assigné |
| Date validation plan | `oaksome_plan_validated_date` | Date | Quand le client a validé le plan |
| Nb modifications plan | `oaksome_plan_iterations` | Integer | Compteur changements demandés |
| Supplément manutention | `oaksome_handling` | Boolean | Conditions d'accès difficiles |
| Montant supplément | `oaksome_handling_amount` | Monetary | Montant intégré dans SO2 |
| Collection choisie | `oaksome_collection` | Selection | Line, Satori, Vista, Lys |
| CGV signées | `oaksome_cgv_signed` | Boolean | Auto via Odoo Sign webhook |
| TVA 6% applicable | `oaksome_tva6` | Boolean | Logement > 10 ans, usage privé |
| Attestation TVA signée | `oaksome_tva6_signed` | Boolean | Auto via Odoo Sign webhook |
| Note satisfaction | `oaksome_satisfaction` | Integer | /10 après pose |
| Snag list | `oaksome_snag_list` | Text | Points à corriger après pose |
| Statut commande | `oaksome_status` | Computed Selection | Voir §6 |

### 3.3 Sur `project.task` — FS-MESURES

| Nom du champ | Nom technique | Type | Détail |
|---|---|---|---|
| Étage de livraison | `oaksome_floor` | Integer | 0 = RDC |
| Ascenseur disponible | `oaksome_elevator` | Boolean | |
| Largeur ascenseur | `oaksome_elevator_width` | Float | Largeur (cm) |
| Profondeur ascenseur | `oaksome_elevator_depth` | Float | Profondeur (cm) |
| Hauteur ascenseur | `oaksome_elevator_height` | Float | Hauteur (cm) |
| Charge max ascenseur | `oaksome_elevator_load` | Float | Charge max (kg) |
| Largeur passage minimum | `oaksome_min_width` | Integer | En cm |
| Type d'escalier | `oaksome_stairs_type` | Selection | Aucun / Droit / Courbe / Colimaçon |
| Parking livraison | `oaksome_parking` | Selection | Devant la porte / < 50m / > 50m / Difficile |
| Photos accès | — | Attachments | Entrée, couloir, escalier, porte |
| Supplément nécessaire | `oaksome_handling_needed` | Boolean | Déterminé par CSM |
| Montant supplément estimé | `oaksome_handling_amount` | Monetary | Repris dans SO2 |
| Commentaire accès | `oaksome_access_notes` | Text | Notes libres CSM |

### 3.4 Sur `project.task` — FS-POSE

| Nom du champ | Nom technique | Type | Détail |
|---|---|---|---|
| PO sous-traitant lié | `oaksome_subcontractor_po` | Many2one → purchase.order | |
| Snag list | `oaksome_snag_list` | Text | Points à corriger après pose |
| Signature client faite | `oaksome_client_signed` | Boolean | Déclenche facture 10% |

### 3.5 Sur `res.partner`

| Nom du champ | Nom technique | Type | Détail |
|---|---|---|---|
| Année de construction | `oaksome_building_year` | Integer | Pour attestation TVA 6% |
| N° entreprise | `oaksome_company_id` | Char | BCE/KBO (BE) ou RCS (LU) — pro |
| Collection préférée | `oaksome_collection_pref` | Selection | Line, Satori, Vista, Lys |
| Client pro | `is_pro` | Boolean | Client professionnel |

---

## 4. CRM Pipeline — 4 étapes

| Étape | Probabilité | Passage à l'étape suivante |
|---|---|---|
| Intérêt | 10% | Le prospect répond (email, WhatsApp, chat) |
| Contact | 25% | Le prospect demande des échantillons ou passe commande |
| Échantillons | 40% | Le prospect est prêt à commander |
| Gagné | 100% | SO1 créé |

---

## 5. Workflows

### 5.1 Wishlist / Favoris → Lead CRM

```
Clic ♡ ou "Sauvegarder config"
→ Popup email
→ is_exist(email) ? lier partner : créer res.partner (groupe portal)
→ Créer crm.lead (étape: Intérêt) lié au partner
→ Si nouveau partner → envoyer invitation portail
→ Automations J+1 / J+3 relance
```

### 5.2 Cart + Checkout → Opportunity

```
Cart en localStorage
→ Clic "Commander" → sync cart vers Odoo
→ crm.lead → opportunity
→ Redirect vers checkout Odoo
```

### 5.3 SO1 Workflow

```
Opportunity gagnée → Créer SO1
SO1 créé → Redirect client vers page signature CGV (Odoo Sign in-app, pas email)
CGV signées → oaksome_cgv_signed = True
[Optionnel] TVA 6% → attestation Sign (en même temps que CGV)
Manager confirme SO1 → [BLOQUÉ si CGV non signées]
Confirmation SO1 →
  [AUTO] Facture acompte 50%
  [AUTO] Tâches FS-MESURES + FS-POSE créées
  [AUTO] Invitation portail client
  [AUTO] Email récapitulatif + lien booking mesures
Client paie → FS-MESURES planifiée
FS-MESURES terminée → Technicien remonte checklist accès
Manager crée SO2 (lié SO1, avec produit réel + déduction acompte)
SO2 confirmé → [AUTO] PO Drop-ship Wood Cam
Fabrication terminée → Manager active FS-POSE
FS-POSE terminée + signature client → Facture 10% solde
```

---

## 6. Statut commande calculé (`oaksome_status` sur SO1)

> Champ computed sur `sale.order`. Les étapes pre-SO1 (lead, contact, échantillons) vivent dans le pipeline CRM natif (`crm.stage`).

**9 états internes :**

| # | Clé technique | Label | Condition compute |
|---|---|---|---|
| 1 | `cgv_pending` | À signer CGV | SO1 créé, sign.request CGV non signé |
| 2 | `deposit_pending` | Acompte en attente | CGV signées, facture 50% non payée |
| 3 | `measures_pending` | À mesurer | Acompte payé, FS-MESURES non planifiée |
| 4 | `measures_scheduled` | Mesures planifiées | FS-MESURES planifiée ou en cours |
| 5 | `plan_validated` | Plan validé | Plan validé, SO2 créé |
| 6 | `manufacturing` | En fabrication | PO Wood Cam confirmé, en production |
| 7 | `ready` | Prêt à livrer | Fabrication terminée, FS-POSE à planifier |
| 8 | `delivering` | Livraison & pose | FS-POSE planifiée ou en cours |
| 9 | `done` | Terminé | Pose terminée + toutes factures payées |

**Mapping portail client (7 étapes simplifiées) :**

| Étape portail | États internes mappés |
|---|---|
| Commande confirmée | `cgv_pending` |
| Acompte payé | `deposit_pending` → `measures_pending` |
| Prise de mesures | `measures_scheduled` |
| Plan validé | `plan_validated` |
| En fabrication | `manufacturing` |
| Livraison et pose | `ready` → `delivering` |
| Projet terminé | `done` |

> Détails opérationnels (checklist accès, planification FS, PV signature) gérés dans `project.task`, pas dans oaksome_status.

---

## 7. Automatisations

### 7.1 CRM (sur `crm.lead`)

| Quand | Condition | Action |
|---|---|---|
| J+1 après création lead | Étape = Intérêt, pas de contact | Email relance panier J+1 |
| J+3 après création lead | Étape = Intérêt, pas de contact | Email relance + invitation WhatsApp |
| J+7 après création lead | Étape = Intérêt, non converti | Notification interne CSM |
| J+7 sans suite (Contact) | Pas de modification | Notification interne CSM |
| J+5 après expédition SAMP-KIT | Pas de retour | Email relance échantillons |

### 7.2 Ventes (sur `sale.order`)

| Quand | Condition | Action |
|---|---|---|
| Création SO1 | Type = SO1 Acompte | Envoyer CGV via Odoo Sign |
| CGV signées | `oaksome_cgv_signed` → True | Notification CSM |
| Confirmation SO1 | Type = SO1 Acompte | Facture acompte 50% + email récapitulatif + invitation portail |
| J+7 sans validation plan | SO1 confirmé, plan non validé | Notification CSM |

### 7.3 Field Service (sur `project.task`)

| Quand | Condition | Action |
|---|---|---|
| Création tâche FS-MESURES | — | Email client avec lien booking |
| J+5 après SO1 confirmé | FS-MESURES en "À planifier" | Alerte urgente CSM |
| CSM active FS-POSE | Fabrication terminée | Email client + lien booking pose |
| Signature client tablette | `oaksome_client_signed` → True | Créer facture SO2 #2 (solde 10%) |
| J+7 après fin FS-POSE | — | Email satisfaction + demande photo UGC |
| J+30 après fin FS-POSE | — | Email parrainage + demande avis Google |

### 7.4 Alertes CSM

| Alerte | Délai | Priorité |
|---|---|---|
| CGV non signées après création SO1 | 3 jours | Haute |
| Acompte SO1 non encaissé | 5 jours | Haute |
| Attestation TVA non signée | 5 jours | Haute |
| FS-MESURES non planifiée après SO1 | 5 jours | Haute |
| Plan envoyé sans validation client | 7 jours | Haute |
| Fabrication en retard | 2 jours | Haute |
| FS-POSE sans signature client | 3 jours après pose | Haute |
| Snag list non résolue | 14 jours | Critique → Escalade |

---

## 8. Dashboard & Vues

| Vue | Modèle | Type | Contenu |
|---|---|---|---|
| Pipeline CRM | crm.lead | Kanban | 4 colonnes, badges rouges si alerte, filtre CSM |
| Commandes en cours | sale.order | Liste | SO1 actifs avec `oaksome_status`, montant, SO2 associé |
| Encaissements | account.move | Tableau croisé | Acompte SO1 + SO2 #1 + SO2 #2 par projet. Vert/orange/rouge |
| Planning terrain | project.task | Calendrier | FS-MESURES + FS-POSE par technicien/installateur |
| Tâches terrain | project.task | Liste | Groupé par statut, filtre CSM |
| Signatures en attente | sign.request | Liste | CGV + TVA en attente, alerte si > 3 jours |
| Conversion CRM | crm.lead | Rapport natif | Taux conversion par étape + UTM |

---

## 9. Portail client

### Ce que le client voit (natif Odoo)

| Élément | Visible | Config nécessaire |
|---|---|---|
| Commandes | SO1 + SO2 avec statut, lignes, montants | Natif |
| Factures | Toutes + bouton "Payer maintenant" | Activer Stripe |
| Documents Sign | CGV + attestation TVA signées | Natif Odoo Sign |
| Tâches terrain | FS-MESURES + FS-POSE : date, statut, rapport | Activer visibilité portail dans FSM |
| Rendez-vous | Créneaux réservés, modification possible | Natif Appointments |

Le client **ne voit PAS** : opportunités CRM, PO fournisseurs, marges, notes internes.

### 9.1 Création compte portail — Flow UX

**"Sauvegarder"** désigne deux actions équivalentes :

| Action | Contexte | Données |
|---|---|---|
| **♡ Ajouter aux favoris** | Carte produit catalogue | email, product_id, utm |
| **"Sauvegarder ma configuration"** | Configurateur | email, product_id, config_values JSON, estimated_price, utm |

**Flow :**
```
Browse oaksome.com (anonyme)
→ Clic ♡ ou "Sauvegarder ma config"
→ Popup : saisie email
→ Odoo : is_exist(email) ?
    Oui → lier au partenaire existant
    Non → créer res.partner (groupe portal) + envoyer invitation portail
→ Créer crm.lead (étape: Intérêt)
→ Automations J+1 / J+3 relance email
→ [Plus tard] Client clique "Commander" → redirect Odoo → login → checkout
```

**Règle déduplication :** un email = un partenaire Odoo. Vérification systématique avant création.

---

## 10. Intégrations externes

| Intégration | Source | Destination | Méthode |
|---|---|---|---|
| Favoris/Config → Lead CRM | oaksome.com (NextJS) | Odoo CRM | `POST /api/oaksome/leads` |
| Booking mesures + pose | Odoo Appointments | oaksome.com | API custom : `GET /appointments/slots` + `POST /appointments/book` → page NextJS `/commandes/[id]/rendez-vous` |
| WhatsApp Business | WhatsApp | Odoo CRM/Chatter | Module natif v17 ou Twilio/360dialog |
| Drop-ship Wood Cam | Confirmation SO2 | PO Wood Cam | Route Dropship native |
| Paiement en ligne | Portail Odoo | Stripe | `payment_stripe` natif |
| Signature électronique | SO1 | Client (email) | Odoo Sign natif |

---

## 11. API JSON (Odoo → NextJS)

> **Decision architecture :** Les produits utilisent `product.template` + le systeme custom `product.config.option/value/line` — PAS les variantes Odoo. Le mobilier sur mesure a des options ouvertes (dimensions libres, texte, swatches) incompatibles avec les variantes discretes. La configuration est stockee en JSON (`json_config`).

### Ownership des endpoints

| Scope | Owner | Exemple |
|---|---|---|
| `/api/oaksome/*` (API metier) | Odoo `controllers/api.py` | `/api/oaksome/products`, `/api/oaksome/leads`, `/api/oaksome/config/:token` |
| `/api/tracking/capi` (infra tracking) | NextJS `app/api/tracking/capi/route.ts` | Forwarding Meta/Google/GA4 |
| Attribution click IDs | NextJS `middleware.ts` | Capture `gclid` / `fbclid` / `epik` en cookies first-party |

### Internationalisation (i18n)

**Langues :** FR (defaut) + NL

Tous les champs texte visibles par le client doivent avoir `translate=True` :
- `product.template` : `name`, `description`, `description_sale`
- `oaksome.style` : `name`, `description`
- `oaksome.space` : `name`, `description`
- `product.public.category` : `name`, `category_desc`
- `oaksome.case` : `name`, `description`
- `oaksome.inspiration` : `name`, `description`
- `oaksome.testimonial` : `author`, `text`
- `product.config.option` : `name`
- `product.config.value` : `name`
- `oaksome.notification` : `title`, `message`
- `website.top.notice` : `content`

L'API recoit `?lang=fr` ou `?lang=nl` → Odoo active le contexte `{'lang': 'fr_BE'}` ou `{'lang': 'nl_BE'}`.

Les emails transactionnels (§12) sont envoyes dans la langue du partner (`res.partner.lang`).

### Modèles existants réutilisables dans `oaksome_website`

| Modèle | Fichier | Méthodes utiles |
|---|---|---|
| `website.top.notice` | `top_notice.py` | `get_current_notice()` |
| `oaksome.space` | `spaces.py` | espaces avec image, gallery, slug |
| `oaksome.style` | `styles.py` | collections Line/Satori/Vista/Lys — ajouter champ `slug` |
| `product.config.option` | `product_config_technical.py` | façade/couleur/finition |
| `product.config.value` | `product_config_technical.py` | `color_hex`, `extra_price`, `value_image` |
| `website.cart.item` | `cart.py` | `session_id` pour guest support |
| `oaksome.combos` | `tecnibo_website_banner.py` | combinaisons space × category × style |

Routes existantes dans `controllers/main.py` (NE PAS MODIFIER) :
- Cart : `/cart/add|remove|update|list|count|get` (auth=user)
- Wishlist : `/wishlist/add|remove|list|count|get` (auth=user)

### CORS Mixin — à implémenter en tête de `controllers/api.py`

```python
class OaksomeCORSMixin:
    def _json_response(self, data, meta=None):
        origin = request.env['ir.config_parameter'].sudo().get_param(
            'oaksome.nextjs_origin', '*'
        )
        response = request.make_json_response({
            'success': True, 'data': data, 'meta': meta or {}
        })
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRF-Token'
        return response
```

Config : `ir.config_parameter` clé `oaksome.nextjs_origin` = `https://oaksome.com`

### Format de réponse uniforme

```json
{ "success": true, "data": { ... }, "meta": { "total": 24, "page": 1, "limit": 12 } }
```
```json
{ "success": false, "error": "Product not found", "code": 404 }
```

### Endpoints TIER 1 — bloquants (à livrer en premier)

| # | Méthode | Endpoint | Source Odoo |
|---|---|---|---|
| 1 | GET | `/api/oaksome/navigation` | `product.public.category` + `oaksome.space` + `oaksome.style` |
| 2 | GET | `/api/oaksome/home` | notice + collections + bestsellers + spaces |
| 3 | GET | `/api/oaksome/products` | filters: collection, space, type, finition, price_min/max, page, limit |
| 4 | GET | `/api/oaksome/products/<id>` | produit + images + config_lines |
| 5 | GET | `/api/oaksome/collections` | 4 oaksome.style avec slug, tagline, gallery, prix_depuis |
| 6 | GET | `/api/oaksome/collections/<slug>` | collection + produits + options (façades, couleurs, finitions) |
| 7 | GET | `/api/oaksome/gamme/<slug>` | produits par `product.public.category` |
| 8 | GET | `/api/oaksome/espace/<slug>` | produits par `oaksome.space` |

### Endpoints TIER 2 — contenu, leads & partage (8 endpoints)

| # | Methode | Endpoint | Notes |
|---|---|---|---|
| 9 | GET | `/api/oaksome/inspirations` | Modele `oaksome.inspiration`. Filter: source |
| 10 | GET | `/api/oaksome/case-studies` | Modele `oaksome.case` (separe d'inspiration) |
| 11 | GET | `/api/oaksome/case-studies/<slug>` | Detail etude de cas + produits associes |
| 12 | GET | `/api/oaksome/configurator` | Types + espaces + collections + options |
| 13 | POST | `/api/oaksome/leads` | Lead CRM + compte portail + partage optionnel (`share=true` → token) |
| 14 | GET | `/api/oaksome/samples` | Echantillons — pack=lead+SO gratuit, kit=product.template |
| 15 | POST | `/api/oaksome/samples/request` | Demande echantillon → lead CRM + SO echantillon |
| 16 | GET | `/api/oaksome/config/:token` | Consultation publique config partagee (lookup crm.lead par token) |

### Endpoints TIER 3 — cart/wishlist (8 endpoints)

```
POST   /api/oaksome/cart/add        → proxy /cart/add + CORS
PUT    /api/oaksome/cart/update      → modifier quantite
POST   /api/oaksome/cart/remove      → proxy /cart/remove + CORS
GET    /api/oaksome/cart             → proxy /cart/list + CORS
POST   /api/oaksome/wishlist/add     → proxy /wishlist/add + CORS
GET    /api/oaksome/wishlist         → proxy /wishlist/list + CORS
DELETE /api/oaksome/wishlist/remove  → supprimer favori
GET    /api/oaksome/cart/checkout-url → URL /shop/checkout avec session
```

### Endpoints TIER 4 — compte, notifications & services (14 endpoints)

| # | Methode | Endpoint | Notes |
|---|---|---|---|
| 25 | POST | `/api/oaksome/auth/login` | Auth NextJS custom (cookie session Odoo) |
| 26 | POST | `/api/oaksome/auth/register` | Inscription + option Pro/B2B (BCE/KBO) |
| 27 | POST | `/api/oaksome/auth/logout` | Destruction session |
| 28 | POST | `/api/oaksome/auth/password-recover` | Envoi email reset password |
| 29 | POST | `/api/oaksome/auth/password-reset` | Reset effectif avec token |
| 30 | GET | `/api/oaksome/profile` | Profil utilisateur |
| 31 | PUT | `/api/oaksome/profile` | Mise a jour profil |
| 32 | GET | `/api/oaksome/orders` | Liste commandes (SO1 + SO2) |
| 33 | GET | `/api/oaksome/orders/<id>` | Detail commande + tracker oaksome_status (9 etats) |
| 34 | GET | `/api/oaksome/notifications` | Modele `oaksome.notification` |
| 35 | POST | `/api/oaksome/notifications/mark-read` | Marquer notifications lues |
| 36 | POST | `/api/oaksome/photos/submit` | Soumission photos post-pose → ticket helpdesk |
| 37 | GET | `/api/oaksome/appointments/slots` | Creneaux disponibles mesures/pose |
| 38 | POST | `/api/oaksome/appointments/book` | Reservation creneau mesures/pose |

### Endpoints TIER 5 — search & contact (3 endpoints)

| # | Methode | Endpoint | Notes |
|---|---|---|---|
| 39 | GET | `/api/oaksome/search` | Hybride : suggestions cache + resultats API |
| 40 | GET | `/api/oaksome/testimonials` | Modele `oaksome.testimonial` |
| 41 | POST | `/api/oaksome/contact` | Route vers `crm.lead` (commercial/pro) ou `helpdesk.ticket` (support) |

**Cart :** stocke en localStorage cote NextJS. Sync vers Odoo uniquement au clic "Commander".

**Important (tracking infra) :** l'endpoint `POST /api/tracking/capi` est **owner NextJS** (`app/api/tracking/capi/route.ts`) et ne doit pas etre implemente dans `controllers/api.py` Odoo. Voir contrat infra dans [api-contract](api-contract.md).

> Contrat API complet avec request/response JSON : [api-contract](api-contract.md)

### Fichiers à créer/modifier dans `oaksome_website`

| Fichier                              | Action                                                               |
| ------------------------------------ | -------------------------------------------------------------------- |
| `controllers/api.py`                 | **CREER** — OaksomeCORSMixin + OaksomeJsonApi (41 endpoints)         |
| `controllers/__init__.py`            | Ajouter `from . import api`                                          |
| `models/tecnibo_website_style.py`    | Ajouter champ `slug` sur `oaksome.style`                             |
| `models/oaksome_inspiration.py`      | **CREER** — modele `oaksome.inspiration`                             |
| `models/oaksome_case_study.py`       | **CREER** — modele `oaksome.case` + `oaksome.case.image` |
| `models/oaksome_testimonial.py`      | **CREER** — modele `oaksome.testimonial`                             |
| `models/oaksome_notification.py`     | **CREER** — modele `oaksome.notification`                            |
| `views/oaksome_inspiration_view.xml` | **CREER** — vue backend inspirations                                 |
| `views/oaksome_case_study_view.xml`  | **CREER** — vue backend etudes de cas                                |
| `views/oaksome_testimonial_view.xml` | **CREER** — vue backend temoignages                                  |
| `security/ir.model.access.csv`       | Ajouter acces tous nouveaux modeles                                  |
| `data/config_parameters.xml`         | **CREER** — `oaksome.nextjs_origin = oaksome.com`                    |
| `__manifest__.py`                    | Referencer tous nouveaux fichiers                                    |

> Modele de donnees complet avec tous les champs : [data-model](data-model.md)

### Vérification

```bash
curl http://localhost:8069/api/oaksome/navigation
curl http://localhost:8069/api/oaksome/home
curl "http://localhost:8069/api/oaksome/products?collection=satori&page=1"
curl http://localhost:8069/api/oaksome/collections/satori
# Vérifier headers CORS dans la réponse
```

---

## 12. Emails transactionnels

Templates `mail.template` Odoo a creer dans le module `oaksome_website`. Design a aligner avec l'identite Oaksome (couleurs, typo).

### Emails compte & authentification

| Email | Declencheur | Modele Odoo | Notes |
|---|---|---|---|
| Invitation portail | Nouveau partner cree via `POST /leads` ou `POST /auth/register` | `res.partner` | Lien activation compte |
| Confirmation inscription | `POST /auth/register` reussi | `res.partner` | Bienvenue + prochaines etapes |
| Reset mot de passe | `POST /auth/password-recover` | `res.partner` | Natif Odoo (`auth_signup`), a customiser le design |
| Approbation pro | CSM active `is_pro` + pricelist Pro | `res.partner` | "Votre compte pro est actif, remise X% appliquee" |
| Refus pro | CSM refuse la demande pro | `res.partner` | "Votre demande pro n'a pas ete retenue" |

### Emails commerciaux & CRM

| Email | Declencheur | Modele Odoo | Notes |
|---|---|---|---|
| Relance J+1 | Automation CRM 1 jour apres lead cree | `crm.lead` | "Votre configuration vous attend" |
| Relance J+3 | Automation CRM 3 jours apres lead cree | `crm.lead` | "Besoin d'aide pour choisir ?" |
| Confirmation echantillon | `POST /samples/request` → SO cree | `sale.order` (type so_sample) | "Vos echantillons sont en route" |

### Emails commande & suivi

| Email | Declencheur | Modele Odoo | Notes |
|---|---|---|---|
| Confirmation commande | SO1 confirme | `sale.order` | Resume commande + prochaines etapes |
| Facture acompte 50% | Facture creee | `account.move` | Natif Odoo, customiser design |
| Mesures planifiees | `calendar.event` cree (type mesures) | `calendar.event` | Date + adresse + instructions preparation |
| Pose planifiee | FS-POSE planifie | `project.task` | Date + instructions livraison |

### Emails post-achat

| Email | Declencheur | Modele Odoo | Notes |
|---|---|---|---|
| Satisfaction J+7 | Automation 7 jours apres `oaksome_status` = done | `sale.order` | "Comment s'est passee votre experience ?" |
| Parrainage J+30 | Automation 30 jours apres `oaksome_status` = done | `sale.order` | "Parrainez un proche, recevez X€" |

> 14 templates au total. Les automations (§7) declenchent les envois. Le contenu exact (texte, CTA, design) sera defini pendant l'implementation.

---

## 13. Checklist implémentation

### Phase 1 — Config Odoo (sans dev)
- [ ] Installer modules natifs (§1)
- [ ] Configurer CRM pipeline 4 étapes + round-robin
- [ ] Créer produits services (ACOMPTE, SRV-MESURES, SRV-POSE, SAMP-KIT…)
- [ ] Templates Odoo Sign (CGV + Attestation TVA 6%)
- [ ] 2 types Appointments (mesures + pose)
- [ ] Route Drop-ship SO2 → Wood Cam
- [ ] Position fiscale TVA 6% Rénovation Belgique
- [ ] Activer Stripe portail
- [ ] Templates emails 14 templates (§12)
- [ ] Règles automatisation (§7)
- [ ] Vues dashboard (§8)

### Phase 2 — Champs custom
- [ ] Champs sur `crm.lead` (§3.1)
- [ ] Champs sur `sale.order` (§3.2)
- [ ] Champs sur `project.task` FS-MESURES (§3.3)
- [ ] Champs sur `project.task` FS-POSE (§3.4)
- [ ] Champ `oaksome_building_year` sur `res.partner` (§3.5)
- [ ] Champ calculé `oaksome_status` sur SO1

### Phase 3 — Modules custom
- [ ] `oaksome_sale_workflow` (blocage SO1, vues, smart buttons, statut)
- [ ] `oaksome_fsm_access` (checklist accès + vue mobile)
- [ ] `oaksome_portal_tracker` (tracker visuel portail)

### Phase 4 — Nouveaux modeles
- [ ] `oaksome.inspiration` + vues backend
- [ ] `oaksome.case` + `oaksome.case.image` + vues
- [ ] `oaksome.testimonial` + vues
- [ ] `oaksome.notification`
- [ ] Champ `slug` sur `oaksome.style`, `oaksome.space`, `product.public.category`
> Note échantillons : pack=lead+SO gratuit, kit=product.template — pas de modèle `oaksome.sample` dédié
- [ ] Positions fiscales BE (21% + 6%) et LU (17%)
- [ ] `ir.model.access.csv` pour tous les nouveaux modeles

### Phase 5 — API JSON
- [ ] `controllers/api.py` TIER 1 (8 endpoints bloquants NextJS)
- [ ] `controllers/api.py` TIER 2 (7 endpoints : inspirations, case-studies, configurator, leads, samples)
- [ ] `controllers/api.py` TIER 3 (8 endpoints : cart/wishlist + update + remove)
- [ ] `controllers/api.py` TIER 4 (14 endpoints : auth, password-reset, profile CRUD, orders, notifications + mark-read, photos/submit, appointments slots + book)
- [ ] `controllers/api.py` TIER 5 (3 endpoints : search, testimonials, contact)

### Phase 6 — Integrations
- [ ] API Appointments : `GET /appointments/slots` + `POST /appointments/book` (integre dans NextJS `/commandes/[id]/rendez-vous`)
- [ ] Connexion WhatsApp Business
- [ ] Contact form routing (crm.lead / helpdesk.ticket)
- [ ] Pro/B2B : pricelist "Pro" (remise % globale), validation CSM (`is_pro` + pricelist), email approbation/refus
- [ ] Tests end-to-end : CRM -> SO1 -> FS -> SO2 -> Livraison
