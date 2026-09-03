# Oaksome — Data Model

> Source : prototype HTML/JS + module Odoo `oaksome_website` + sale_process v7.0
> Derniere maj : 2026-04-07

---

## 1. Vue d'ensemble

```
oaksome.website (singleton config)
       │
       ├── oaksome.combos ──M2o──> oaksome.style, oaksome.space, product.public.category
       │
product.template ──M2m──> oaksome.style (Collection)
       │          ──M2m──> oaksome.space (Espace/Piece)
       │          ──M2o──> product.public.category (Type/Gamme)
       │          ──M2o──> oaksome.combos
       │          ──O2m──> custom.product.image
       │          ──O2m──> product.template.config.line
       │                        ──M2m──> product.config.option
       │                        ──M2m──> product.config.value
       │
       ├── website.cart.item ──M2o──> product.product
       ├── website.wishlist.item ──M2o──> product.product
       │
       ├── oaksome.inspiration ──M2m──> oaksome.style, oaksome.space, product.public.category
       ├── oaksome.case ──M2m──> oaksome.style, oaksome.space, product.public.category
       ├── oaksome.testimonial ──M2o──> oaksome.style
       │
       ├── oaksome.photo.submission ──M2o──> res.partner, helpdesk.ticket
       ├── oaksome.showroom ──M2o──> res.country
       │
       ├── crm.lead ──M2o──> product.template, res.partner
       ├── sale.order (SO1) ──M2o──> project.project
       │       └── sale.order (SO2) ──M2o──> SO1
       │       └── sale.order.line ──Json──> configuration_json
       │
       ├── oaksome.notification ──M2o──> res.users
       └── website.top.notice (bandeau promo)
```

---

## 2. Produits

### 2.1 product.template (extensions Oaksome)

Herite de `product.template` standard Odoo.

> **Decision architecture :** Les produits Oaksome utilisent `product.template` + le systeme custom `product.config.option/value/line` — PAS les variantes Odoo (`product.template.attribute.line`). Raison : le mobilier sur mesure a des options ouvertes (dimensions libres, texte, swatches) incompatibles avec le systeme de variantes discretes. La configuration selectionnee est stockee en JSON (`json_config` sur `website.cart.item` et `crm.lead`).

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `publish_oaksome` | Boolean | default=False | Publier sur le site Oaksome |
| `flags_product` | Boolean | | Produit mis en avant |
| `is_new` | Boolean | | Badge "Nouveau" |
| `is_basic` | Boolean | | Gamme Basic |
| `is_premium` | Boolean | | Gamme Premium |
| `discount` | Float | digits=(16,2) | Pourcentage de reduction |
| `additional_image_ids` | One2many | -> custom.product.image | Images supplementaires |
| `space_ids` | Many2many | relation=product_space_rel | Espaces/pieces associes |
| `style_ids` | Many2many | relation=product_style_rel | Collections associees |
| `config_line_ids` | One2many | -> product.template.config.line | Lignes de configuration |
| `oaksome_combination_id` | Many2one | -> oaksome.combos, required, ondelete=cascade | Combinaison banner |
| `has_3d_config` | Boolean | default=False | Possede un configurateur 3D |
| `webpage_url` | Char | | URL du configurateur 3D |
| `config_json` | Json | | Configuration 3D par defaut |
| `service_txt` | Html | sanitize=True | Description services inclus |
| `safety_txt` | Html | sanitize=True | Informations de securite |
| `dim_width` | Float | | Largeur en cm |
| `dim_height` | Float | | Hauteur en cm |
| `dim_depth` | Float | | Profondeur en cm |
| `dim_width_max` | Float | | Largeur maximale configurable en cm |
| `dim_height_max` | Float | | Hauteur maximale configurable en cm |
| `dim_depth_max` | Float | | Profondeur maximale configurable en cm |

**Champs standard Odoo utilises :**
- `name`, `list_price`, `image_1920`, `description_sale`, `website_published`
- `public_categ_ids` (Many2many -> product.public.category)

### 2.2 product.product (extensions Oaksome)

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `config_json` | Json | | Configuration JSON de cette variante |
| `config_hash` | Char | index=True | Hash SHA-256 de config_json (unicite) |
| `is_from_webshop` | Boolean | default=False | Variante creee depuis le configurateur web |
| `ref_imos` | Char | | Reference IMOS fabrication |
| `webpage_url` | Char | | URL page produit |
| `related_product_ids` | Many2many | -> product.template | Produits similaires / suggeres |
| `is_sample` | Boolean | default=False | Est un echantillon |
| `rating_ids` | One2many | -> rating.rating | Avis clients |
| `rating_avg` | Float | compute, store=True | Note moyenne |

### 2.3 custom.product.image

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `product_tmpl_id` | Many2one | -> product.template, required, ondelete=cascade | Produit parent |
| `image` | Image | max 1024x1024 | Image du produit |
| `sequence` | Integer | default=10 | Ordre d'affichage |
| `name` | Char | | Titre de l'image |

---

## 3. Collections (Styles)

### 3.1 oaksome.style

4 collections : **Line**, **Satori**, **Vista**, **Lys**

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | | Nom de la collection |
| `slug` | Char | compute, store=True, unique | Slug URL (compute: slugify(name)) |
| `description` | Char | | Description courte |
| `image` | Image | max 1024x1024 | Image principale |
| `gallery_image_ids` | One2many | -> product.gallery.image | Galerie images |
| `product_ids` | Many2many | relation=product_style_rel | Produits de la collection |
| `config_value_ids` | Many2many | -> product.config.value | Valeurs de config disponibles (facades, couleurs, poignees) |
| `category_ids` | Many2many | -> product.public.category | Categories/gammes associees |
| `website_id` | Many2one | -> oaksome.website, ondelete=cascade | Site web |
| `sequence` | Integer | default=0 | Ordre d'affichage |

**Donnees prototype :**
- Line : `#E0E0E0` (gris clair, moderne)
- Satori : `#D4B896` (brun chaud, japandi)
- Vista : `#4A7C59` (vert foret, contemporain)
- Lys : `#C8AD7F` (dore, chaleureux)

---

## 4. Espaces (Pieces)

### 4.1 oaksome.space

5 espaces : **Chambre**, **Salon**, **Bureau**, **Entree**, **Buanderie**

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | | Nom de l'espace |
| `slug` | Char | compute, store=True, unique | Slug URL (compute: slugify(name)) |
| `description` | Char | | Description |
| `image` | Image | max 1024x1024 | Image principale |
| `gallery_image_ids` | One2many | -> product.gallery.image | Galerie |
| `product_ids` | Many2many | relation=product_space_rel | Produits de l'espace |
| `category_ids` | Many2many | -> product.public.category | Categories/gammes associees |
| `website_id` | Many2one | -> oaksome.website, ondelete=cascade | Site web |
| `sequence` | Integer | default=0 | Ordre |

---

## 5. Types / Gammes

### 5.1 product.public.category (standard Odoo)

10 types de meubles : **Dressings**, **Bibliotheques**, **Meubles TV**, **Ensembles muraux**, **Commodes**, **Buffets**, **Bureaux**, **Entree/Vestiaire**, **Placards**, **Pont**

Modele standard Odoo, etendu avec un slug pour les URLs.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `slug` | Char | compute, store=True, unique | Slug URL (compute: slugify(name)) |
| `category_desc` | Text | | Description affichee sur la page gamme |

Champs standard utilises : `name`, `image_128`, `parent_id`, `child_id`, `sequence`.
Filtrage par type via `public_categ_ids` (Many2many) sur `product.template`.

---

## 6. Configuration produit

### 6.1 product.config.option

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | required | Nom option (ex: Facade, Couleur, Finition) |
| `code` | Char | | Cle technique |
| `description` | Text | | Description |
| `icon` | Image | max 48x48 | Icone |
| `value_type` | Selection | selection/multi/number/text, default="selection" | Type de valeur |
| `value_ids` | One2many | -> product.config.value | Valeurs possibles |

### 6.2 product.config.value

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | required | Nom de la valeur |
| `option_id` | Many2one | -> product.config.option, required, ondelete=cascade | Option parente |
| `extra_price` | Float | | Supplement prix |
| `color_hex` | Char | | Code couleur hex (pour options couleur) |
| `value_image` | Image | max 1920x1080 | Image de la valeur |

### 6.3 product.template.config.line

Lie un produit a ses options de configuration.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `product_tmpl_id` | Many2one | -> product.template, required, ondelete=cascade | Produit |
| `option_ids` | Many2many | -> product.config.option, required | Options disponibles |
| `allowed_value_ids` | Many2many | -> product.config.value | Valeurs autorisees (filtre) |
| `required` | Boolean | default=False | Option obligatoire |

**Methode :** `_guard_related_values()` — onchange sur `option_ids`, met a jour `allowed_value_ids`.

---

## 7. Images & Galeries

### 7.1 product.gallery.image

Galerie partagee entre collections, espaces et etudes de cas.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `style_id` | Many2one | -> oaksome.style | Collection |
| `space_id` | Many2one | -> oaksome.space | Espace |
| `case_id` | Many2one | -> oaksome.case, ondelete=cascade | Etude de cas |
| `image` | Image | required, max 1600x1600 | Image |
| `name` | Char | | Nom |
| `caption` | Char | | Legende |
| `sequence` | Integer | default=10 | Ordre |

---

## 8. Contenu site

### 8.1 website.top.notice

Bandeau promotionnel en haut du site.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | required | Titre interne |
| `active` | Boolean | default=True | Actif |
| `message_html` | Html | sanitize=True | Message principal |
| `badge_html` | Html | sanitize=True | Badge accroche |
| `date_start` | Datetime | | Visible a partir de |
| `date_end` | Datetime | | Visible jusqu'a |

**Methode :** `get_current_notice()` — retourne la notice active dans la fenetre temporelle.

> **Modeles supprimes :** `how.it.works`, `website.craftsmanship`, `website.craftsmanship.item` — contenu gere en statique cote NextJS.

---

## 9. E-commerce

### 9.1 website.cart.item

> **Note phase 1 :** Le panier est gere en localStorage cote NextJS tant que l'utilisateur est anonyme. Les champs `session_id` et `session_max_age` ne sont pas utilises en phase 1 — le sync vers Odoo ne se fait qu'au checkout, utilisateur connecte.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `user_id` | Many2one | -> res.users, required, ondelete=cascade | Utilisateur |
| `variant_id` | Many2one | -> product.product, required, ondelete=cascade | Variante produit |
| `quantity` | Integer | default=1 | Quantite |
| `json_config` | Json | | Configuration selectionnee |
| `image` | Image | max 1920x1080 | Image custom |
| `webpage_url` | Char | compute, store=True | Lien page produit |
| `cart_date` | Datetime | default=now | Date ajout |
| `session_id` | Char | index=True | ID session guest |
| `session_max_age` | Integer | | Duree max session |
| `sale_order_id` | Many2one | -> sale.order | SO lie |

**Contrainte :** unique(user_id, variant_id)

### 9.2 website.wishlist.item

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `user_id` | Many2one | -> res.users, required, ondelete=cascade | Utilisateur |
| `name` | Char | | Nom |
| `product_id` | Many2one | -> product.product, required, ondelete=cascade | Produit |
| `json_config` | Json | | Configuration |
| `image` | Image | max 1920x1080 | Image |
| `webpage_url` | Char | compute, store=True | Lien page |
| `fav_date` | Datetime | default=now | Date ajout |
| `shareable_link` | Char | copy=False | Lien partageable |
| `session_id` | Char | index=True | ID session guest |
| `session_max_age` | Integer | | Duree max session |

**Contrainte :** unique(user_id, product_id)

---

## 10. Banners & Blocs

### 10.1 oaksome.combos

Combinaisons espace x categorie x collection pour affichage dynamique.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | | Titre |
| `image` | Image | required | Image banner |
| `sequence` | Integer | default=10 | Ordre |
| `website_id` | Many2one | -> oaksome.website, required, ondelete=cascade | Site |
| `style_id` | Many2one | -> oaksome.style | Collection |
| `space_id` | Many2one | -> oaksome.space | Espace |
| `category_id` | Many2one | -> product.public.category | Type |
| `product_tmp_id` | Many2one | -> product.template | Produit specifique |
| `product_tmp_domain` | Char | compute | Domaine filtre produits |
| `active` | Boolean | default=True | Actif |
| `for_inspiration` | Boolean | | Utilise pour inspirations |
| `product_ids` | One2many | -> product.template (inverse oaksome_combination_id) | Produits lies |
| `description` | Text | | Description |

### 10.2 product.grid.block

Blocs visuels dans les grilles produit.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | required | Titre |
| `position_index` | Integer | required | Position dans la grille |
| `background_color` | Char | default="#fbe2dc" | Couleur fond |
| `html_content` | Html | | Contenu HTML |
| `is_active` | Boolean | default=True | Actif |
| `category_id` | Many2one | -> product.public.category | Categorie liee |
| `image` | Image | max 1920x1920 | Image |

---

## 11. Contenu & Marketing

### 11.1 oaksome.inspiration

Galerie d'inspirations avec filtre par source, collection, espace, categorie.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | required | Titre |
| `slug` | Char | compute | Slug URL |
| `image` | Image | required, max 1920x1080 | Image principale |
| `description` | Text | | Description courte |
| `source` | Selection | oaksome/instagram/pinterest, required | Source de l'inspiration |
| `account_holder` | Char | | Nom du compte source (Instagram, Pinterest) |
| `source_url` | Char | | Lien vers la publication originale |
| `style_ids` | Many2many | -> oaksome.style | Collections associees |
| `space_ids` | Many2many | -> oaksome.space | Espaces associes |
| `category_ids` | Many2many | -> product.public.category | Categories associees |
| `product_ids` | Many2many | -> product.template | Produits Oaksome visibles dans la photo |
| `ville` | Char | | Ville du projet |
| `active` | Boolean | default=True | Actif |
| `sequence` | Integer | default=10 | Ordre |

### 11.2 oaksome.case

Etudes de cas detaillees — projets realises presentes sur le site.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | required | Titre du projet |
| `slug` | Char | compute | Slug URL |
| `image` | Image | required, max 1920x1080 | Image principale |
| `gallery_image_ids` | One2many | -> product.gallery.image (inverse: case_id) | Galerie images |
| `description` | Html | | Description longue |
| `style_ids` | Many2many | -> oaksome.style | Collections |
| `space_ids` | Many2many | -> oaksome.space | Espaces |
| `category_ids` | Many2many | -> product.public.category | Categories |
| `product_ids` | Many2many | -> product.template | Produits presentes |
| `ville` | Char | | Ville |
| `surface` | Float | | Surface en m2 |
| `budget` | Char | | Fourchette budget |
| `dim_width` | Float | | Largeur realisee (cm) |
| `dim_height` | Float | | Hauteur realisee (cm) |
| `dim_depth` | Float | | Profondeur realisee (cm) |
| `delay_weeks` | Integer | | Delai de realisation en semaines |
| `active` | Boolean | default=True | Actif |
| `sequence` | Integer | default=10 | Ordre |

### 11.3 oaksome.testimonial

Temoignages clients — geres depuis le backend Odoo.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `author` | Char | required | Nom du client |
| `text` | Text | required | Temoignage |
| `rating` | Integer | | Note /5 |
| `image` | Image | max 512x512 | Photo client |
| `date` | Date | | Date du temoignage |
| `collection_id` | Many2one | -> oaksome.style | Collection liee |
| `active` | Boolean | default=True | Actif |
| `sort_order` | Integer | default=10 | Ordre d'affichage |

> **Echantillons :** Pas de modele custom. Le "Pack echantillons" (gratuit) cree un `crm.lead` + `sale.order` type `so_sample`. Le "Kit decouverte" (100€) est un `product.template` standard avec configuration.

### 11.4 oaksome.notification

Notifications in-app pour les utilisateurs.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `user_id` | Many2one | -> res.users, required, ondelete=cascade | Destinataire |
| `type` | Selection | order/delivery/message/promo/system | Type de notification |
| `title` | Char | required | Titre |
| `message` | Text | required | Message |
| `read` | Boolean | default=False | Lu |
| `link` | Char | | URL de redirection |
| `created_at` | Datetime | default=now | Date creation |

---

## 12. Extensions CRM & Ventes (source: sale_process.md)

### 12.1 crm.lead (extensions)

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `oaksome_project_type` | Selection | placard/dressing/bibliotheque/bureau/sous-escalier/autre | Type de projet |
| `oaksome_score` | Selection | chaud/tiede/froid | Score prospect |
| `oaksome_channel` | Selection | whatsapp/chat/tel/email/site | Canal de contact |
| `oaksome_collection` | Selection | line/satori/vista/lys | Collection preferee |
| `oaksome_config_values` | Json | | Config sauvegardee (facade, couleur, dimensions) |
| `oaksome_estimated_price` | Float | | Prix estime configurateur |
| `oaksome_product_id` | Many2one | -> product.template | Produit d'interet |
| `oaksome_share_token` | Char | index=True, copy=False | Token de partage unique (UUID, genere par POST /leads avec share=true) |
| `oaksome_share_expires` | Datetime | | Date d'expiration du lien partageable (J+90) |
| `utm_source` | Char | | Source acquisition |
| `utm_medium` | Char | | Medium acquisition |
| `utm_campaign` | Char | | Campagne |

### 12.2 sale.order (extensions SO1)

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `oaksome_order` | Boolean | default=False | Commande provenant du site Oaksome |
| `oaksome_so_type` | Selection | so_sample/so1_deposit/so2_final | Type de commande |
| `oaksome_cgv_signed` | Boolean | default=False | CGV signees via Odoo Sign |
| `oaksome_tva6` | Boolean | default=False | TVA 6% renovation applicable |
| `oaksome_tva6_signed` | Boolean | default=False | Attestation TVA 6% signee |
| `oaksome_status` | Selection | compute | Statut commande consolide (9 etats, voir ci-dessous) |
| `date_mesures` | Date | | Date mesures prevue |
| `technicien_mesures` | Many2one | -> hr.employee | Technicien mesures |
| `date_validation_plan` | Date | | Date validation plan |
| `nb_iterations_plan` | Integer | | Nombre iterations plan |
| `collection` | Selection | line/satori/vista/lys | Collection |
| `oaksome_handling` | Boolean | default=False | Supplement manutention applicable |
| `oaksome_handling_amount` | Monetary | | Montant supplement manutention |
| `score_satisfaction` | Integer | | Score satisfaction /10 (post-pose) |
| `snag_list` | Text | | Liste reserves post-pose |
| `so2_id` | Many2one | -> sale.order | SO2 lie (inverse) |

**9 etats `oaksome_status` (computed field sur sale.order) :**

> Les etapes pre-SO1 (lead, contact, echantillons) vivent dans le pipeline CRM natif Odoo (`crm.stage`).
> `oaksome_status` commence au SO1 confirme.

| # | Cle | Label client | Condition compute |
|---|---|---|---|
| 1 | `cgv_pending` | A signer CGV | SO1 cree, sign.request CGV non signe |
| 2 | `deposit_pending` | Acompte en attente | CGV signees, facture 50% non payee |
| 3 | `measures_pending` | A mesurer | Acompte paye, FS-MESURES non planifiee |
| 4 | `measures_scheduled` | Mesures planifiees | FS-MESURES planifiee ou en cours |
| 5 | `plan_validated` | Plan valide | Plan valide, SO2 cree |
| 6 | `manufacturing` | En fabrication | PO Wood Cam confirme, en production |
| 7 | `ready` | Pret a livrer | Fabrication terminee, FS-POSE a planifier |
| 8 | `delivering` | Livraison & pose | FS-POSE planifiee ou en cours |
| 9 | `done` | Termine | Pose terminee + toutes factures payees |

**Mapping portail client (7 etapes simplifiees) :**

| Etape portail | Etats internes mappes |
|---|---|
| Commande confirmee | `cgv_pending` |
| Acompte paye | `deposit_pending` → `measures_pending` |
| Prise de mesures | `measures_scheduled` |
| Plan valide | `plan_validated` |
| En fabrication | `manufacturing` |
| Livraison et pose | `ready` → `delivering` |
| Projet termine | `done` |

### 12.3 sale.order (extensions SO2)

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `so1_id` | Many2one | -> sale.order | SO1 parent |

### 12.4 sale.order.line (extensions)

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `configuration_json` | Json | | Configuration produit du client |
| `formated_json` | Text | compute | JSON formate lisible (pour vues Odoo) |
| `sub_product_ids` | Many2many | -> product.product | Sous-produits composants (pour BOM) |
| `xml_data` | Binary | attachment=True | Fichier XML IMOS fabrication |
| `xml_file_title` | Char | | Nom du fichier XML IMOS |

### 12.5 project.task (extensions FS-MESURES & FS-POSE)

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `etage_livraison` | Integer | | Etage (0=RDC) |
| `ascenseur` | Boolean | | Ascenseur disponible |
| `oaksome_elevator_width` | Float | | Largeur ascenseur (cm) |
| `oaksome_elevator_depth` | Float | | Profondeur ascenseur (cm) |
| `oaksome_elevator_height` | Float | | Hauteur ascenseur (cm) |
| `oaksome_elevator_load` | Float | | Charge max ascenseur (kg) |
| `largeur_passage_min` | Integer | | Largeur min passage (cm) |
| `type_escalier` | Selection | aucun/droit/courbe/colimacon | Type escalier |
| `parking_livraison` | Selection | devant/<50m/>50m/difficile | Acces parking |
| `photos_acces` | Many2many | -> ir.attachment | Photos acces |
| `oaksome_handling` | Boolean | | Supplement manutention prevu |
| `oaksome_handling_amount` | Monetary | | Montant supplement estime |
| `commentaire_acces` | Text | | Commentaire CSM |
| `po_sous_traitant_id` | Many2one | -> purchase.order | PO installateur (FS-POSE) |

### 12.5 res.partner (extensions)

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `oaksome_collection_pref` | Selection | line/satori/vista/lys | Collection preferee |
| `oaksome_building_year` | Integer | | Annee construction logement (pour TVA 6% renovation) |
| `oaksome_company_id` | Char | | Numero entreprise BCE/KBO (pro BE) ou RCS (pro LU) |
| `oaksome_country_id` | Many2one | -> res.country | Pays prefere (pour TVA/prix) |
| `oaksome_accepts_terms` | Boolean | default=False | A accepte les CGU a l'inscription |
| `oaksome_accepts_marketing` | Boolean | default=False | A accepte les communications marketing |
| `is_pro` | Boolean | default=False | Client professionnel |

### 12.8 calendar.event (extension)

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `oaksome_sale_order_id` | Many2one | -> sale.order | SO associe (mesures ou pose) |

---

## 13. Nouveaux modeles

### 13.1 oaksome.website

Configuration globale du site Oaksome (modele singleton).

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | required | Nom de la configuration |
| `banner_image_ids` | One2many | -> oaksome.combos | Bannieres homepage |
| `video` | Binary | attachment=True | Video homepage |
| `video_filename` | Char | | Nom du fichier video |
| `product_flags_description` | Html | | Texte section produits phares |
| `category_description` | Html | | Texte section categories |
| `space_ids` | Many2many | -> oaksome.space | Espaces affiches |
| `category_ids` | Many2many | -> product.public.category | Categories affichees |
| `style_ids` | Many2many | -> oaksome.style | Styles affiches |
| `default_product_link` | Text | | URL par defaut du configurateur produit |
| `image` | Image | max 1920x1080 | Image principale |

### 13.2 oaksome.photo.submission

Soumission de photos par les clients. Cree un ticket Helpdesk automatiquement.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | compute | Reference auto : PHOTO/YYYY/XXXX |
| `partner_id` | Many2one | -> res.partner | Client soumetteur |
| `email` | Char | | Email si client non connecte |
| `photo_ids` | Many2many | -> ir.attachment | Photos envoyees |
| `description` | Text | | Commentaire du client |
| `state` | Selection | new/in_review/published/rejected, default="new" | Statut de la soumission |
| `submission_date` | Datetime | default=now | Date de soumission |
| `helpdesk_ticket_id` | Many2one | -> helpdesk.ticket | Ticket Helpdesk cree automatiquement |

### 13.3 oaksome.showroom

Points de vente physiques / showrooms Oaksome.

| Champ | Type | Parametres | Description |
|---|---|---|---|
| `name` | Char | required | Nom du showroom |
| `image` | Image | max 1920x1080 | Photo |
| `address` | Char | | Adresse complete |
| `city` | Char | | Ville |
| `country_id` | Many2one | -> res.country | Pays |
| `phone` | Char | | Telephone |
| `email` | Char | | Email de contact |
| `latitude` | Float | | Latitude GPS |
| `longitude` | Float | | Longitude GPS |
| `opening_hours` | Text | | Horaires d'ouverture |
| `active` | Boolean | default=True | Actif |

---

## 14. Regles d'acces (ir.model.access.csv)

### Acces public (lecture seule)
oaksome.style, oaksome.space, oaksome.combos, product.grid.block, product.gallery.image, oaksome.inspiration, oaksome.case, oaksome.testimonial, oaksome.showroom, website.top.notice

### Acces portal (lecture seule)
website.cart.item, website.wishlist.item, oaksome.notification (filtre: user_id = uid)

### Acces portal (ecriture)
oaksome.photo.submission (creation uniquement)

### Acces utilisateur interne (CRUD complet)
oaksome.style, oaksome.space, oaksome.combos, website.top.notice, custom.product.image, product.gallery.image, product.grid.block, oaksome.inspiration, oaksome.case, oaksome.testimonial, oaksome.notification, oaksome.photo.submission, oaksome.showroom

### Acces admin
oaksome.website

---

## 15. References

- Module Odoo : `oaksome_website/models/ (Odoo module)`
- Prototype HTML : `../oaksome-website-prototype/ (local)`
- Workflow complet : [Oaksome_sale_process](Oaksome_sale_process.md)
- API contract : [api-contract](api-contract.md)
- Backend spec : [backend-spec](backend-spec.md)
