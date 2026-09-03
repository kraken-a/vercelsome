# Oaksome — API Contract

> Contrat API JSON entre NextJS (frontend) et Odoo 17 (backend)
> Derniere maj : 2026-04-08

---

## Convention globale

**Base URL :**
- backend odoo : `https://cdn.oaksome.com`
- Prod : `https://oaksome.com`

**Format reponse :**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 42, "page": 1, "limit": 12 }
}
```

**Format erreur :**
```json
{
  "success": false,
  "error": "Product not found",
  "code": 404
}
```

**CORS Mixin :**
Toutes les reponses incluent :
```
Access-Control-Allow-Origin: <oaksome.nextjs_origin>
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-CSRF-Token
```
Config : `ir.config_parameter` cle `oaksome.nextjs_origin`
- Dev : `http://localhost:3000`
- Prod : `https://oaksome.com`

**Authentification :**
- `auth=public` : catalogue, navigation, homepage, search, inspirations
- `auth=user` : cart, wishlist, profil, commandes, notifications

**Mecanisme session :**
NextJS envoie `credentials: 'include'` sur chaque fetch vers Odoo. La session est geree via le cookie `session_id` Odoo (HttpOnly, SameSite=None, Secure).
- Login : `POST /api/oaksome/auth/login` → Odoo set le cookie `session_id` dans la reponse
- Requetes auth=user : le cookie `session_id` est envoye automatiquement par le navigateur
- Logout : `POST /api/oaksome/auth/logout` → Odoo detruit la session

**Parametre country :**
Passe en query param `?country=BE` pour ajuster les prix TTC selon la position fiscale.
Phase 1 : BE (defaut) et LU. Phase 2 : FR, NL.

**Parametre lang :**
Passe en query param `?lang=fr` ou `?lang=nl` pour recevoir les contenus traduits (noms, descriptions).
Odoo utilise `translate=True` sur les champs texte — le parametre `lang` active le contexte de traduction.
Valeurs : `fr` (defaut), `nl`. Si absent, retourne FR.

---

## TIER 1 — Navigation & Catalogue (8 endpoints)

### 1. GET /api/oaksome/navigation

Menu complet du site.

**Auth :** public
**Cache :** ISR 1h

**Response :**
```json
{
  "success": true,
  "data": {
    "types": [
      { "name": "Dressings", "slug": "dressing", "image_url": "/web/image/..." },
      { "name": "Bibliotheques", "slug": "bibliotheque", "image_url": "/web/image/..." }
    ],
    "spaces": [
      { "name": "Chambre", "slug": "chambre", "image_url": "/web/image/..." }
    ],
    "collections": [
      { "name": "Line", "slug": "line", "color_hex": "#E0E0E0", "image_url": "/web/image/..." },
      { "name": "Satori", "slug": "satori", "color_hex": "#D4B896", "image_url": "/web/image/..." },
      { "name": "Vista", "slug": "vista", "color_hex": "#4A7C59", "image_url": "/web/image/..." },
      { "name": "Lys", "slug": "lys", "color_hex": "#C8AD7F", "image_url": "/web/image/..." }
    ],
    "static_links": [
      { "label": "Inspirations", "url": "/inspirations" },
      { "label": "Comment ca marche", "url": "/comment-ca-marche" },
      { "label": "Configurateur", "url": "/configurer" }
    ]
  }
}
```

---

### 2. GET /api/oaksome/home

Sections homepage.

**Auth :** public
**Cache :** ISR 1h
**Params :** `?country=BE`

**Response :**
```json
{
  "success": true,
  "data": {
    "top_notice": {
      "message_html": "<p>Offre de lancement...</p>",
      "badge_html": "<span>-20%</span>"
    },
    "collections": [
      {
        "name": "Satori", "slug": "satori", "color_hex": "#D4B896",
        "description": "Inspiration japandi...",
        "image_url": "/web/image/...",
        "prix_depuis": 890.0
      }
    ],
    "bestsellers": [
      {
        "id": 42, "name": "Dressing Satori 180",
        "slug": "dressing-satori-180",
        "price": 1290.0, "price_ttc": 1560.90,
        "image_url": "/web/image/...",
        "collection_slug": "satori",
        "is_new": false
      }
    ],
    "spaces": [
      { "name": "Chambre", "slug": "chambre", "image_url": "/web/image/..." }
    ],
    "how_it_works": [
      { "step": 1, "name": "Configurez", "description": "...", "image_url": "/web/image/..." }
    ],
    "craftsmanship": [
      {
        "heading": "Notre savoir-faire",
        "subhead": "...",
        "items": [
          { "title": "Bois certifie", "description": "...", "icon": "leaf" }
        ]
      }
    ],
    "testimonials": [
      { "author": "Marie D.", "text": "Excellent service...", "rating": 5 }
    ]
  }
}
```

---

### 3. GET /api/oaksome/products

Catalogue avec filtres et pagination.

**Auth :** public
**Cache :** SSR (pas de cache statique)

**Query params :**
| Param | Type | Description |
|---|---|---|
| `collection` | string | Slug collection (line, satori, vista, lys) |
| `space` | string | Slug espace (chambre, salon...) |
| `type` | string | Slug type (dressing, bibliotheque...) |
| `finition` | string | Filtre finition |
| `price_min` | float | Prix minimum |
| `price_max` | float | Prix maximum |
| `country` | string | Pays pour TVA (BE, LU) |
| `page` | int | Page (defaut: 1) |
| `limit` | int | Items par page (defaut: 12) |
| `sort` | string | Tri: price_asc, price_desc, newest, name |

**Response :**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 42,
        "name": "Dressing Satori 180",
        "slug": "dressing-satori-180",
        "price": 1290.0,
        "price_ttc": 1560.90,
        "image_url": "/web/image/...",
        "collection_slug": "satori",
        "type_slug": "dressing",
        "is_new": true,
        "is_premium": false,
        "discount": 0.0,
        "colors": [
          { "name": "Chene naturel", "hex": "#D4C5A9" }
        ]
      }
    ],
    "filters_available": {
      "collections": ["line", "satori", "vista", "lys"],
      "spaces": ["chambre", "salon", "bureau", "entree", "buanderie"],
      "types": ["dressing", "bibliotheque", "meuble-tv"],
      "price_range": { "min": 490, "max": 4500 }
    }
  },
  "meta": { "total": 56, "page": 1, "limit": 12 }
}
```

---

### 4. GET /api/oaksome/products/:id

Detail produit complet.

**Auth :** public
**Cache :** ISR 30min
**Params :** `?country=BE`

**Response :**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "name": "Dressing Satori 180",
    "slug": "dressing-satori-180",
    "price": 1290.0,
    "price_ttc": 1560.90,
    "description": "Dressing sur mesure...",
    "collection": { "name": "Satori", "slug": "satori", "color_hex": "#D4B896" },
    "type": { "name": "Dressing", "slug": "dressing" },
    "spaces": [{ "name": "Chambre", "slug": "chambre" }],
    "images": [
      { "url": "/web/image/...", "name": "Vue face", "sequence": 1 },
      { "url": "/web/image/...", "name": "Vue cote", "sequence": 2 }
    ],
    "dimensions": { "width": 180, "depth": 60, "height": 240 },
    "colors": [
      { "name": "Chene naturel", "hex": "#D4C5A9" },
      { "name": "Noir", "hex": "#2C2C2C" }
    ],
    "config_lines": [
      {
        "option": { "name": "Facade", "code": "facade", "value_type": "selection" },
        "values": [
          { "name": "Lisse", "extra_price": 0, "image_url": "/web/image/..." },
          { "name": "Cannele", "extra_price": 120, "image_url": "/web/image/..." }
        ],
        "required": true
      }
    ],
    "selling_points": [
      { "name": "Livraison et pose incluses", "icon": "truck" },
      { "name": "Garanti 10 ans", "icon": "shield" }
    ],
    "is_new": true,
    "is_premium": false,
    "is_basic": false,
    "discount": 0.0,
    "rating_avg": 4.5,
    "related_products": [
      { "id": 43, "name": "Bibliotheque Satori", "price_ttc": 890.0, "image_url": "/web/image/..." }
    ]
  }
}
```

---

### 5. GET /api/oaksome/collections

Liste des 4 collections.

**Auth :** public
**Cache :** ISR 1h
**Params :** `?country=BE`

**Response :**
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "name": "Line",
        "slug": "line",
        "color_hex": "#E0E0E0",
        "description": "Lignes epurees, design moderne...",
        "image_url": "/web/image/...",
        "gallery": ["/web/image/..."],
        "prix_depuis": 790.0,
        "product_count": 14,
        "finish": "Mat, Satine",
        "doors": "Lisse, Cannele",
        "handles": "Integree, Laiton"
      }
    ]
  }
}
```

---

### 6. GET /api/oaksome/collections/:slug

Detail collection + options de configuration.

**Auth :** public
**Cache :** ISR 1h

**Response :**
```json
{
  "success": true,
  "data": {
    "collection": {
      "name": "Satori",
      "slug": "satori",
      "color_hex": "#D4B896",
      "description": "Inspiration japandi, bois naturel...",
      "image_url": "/web/image/...",
      "gallery": ["/web/image/..."],
      "finish": "Naturel, Huile",
      "doors": "Panneau plein, Vitre",
      "handles": "Cuir, Bois"
    },
    "products": [
      { "id": 42, "name": "Dressing Satori 180", "price_ttc": 1560.90, "image_url": "/web/image/...", "type_slug": "dressing" }
    ],
    "config_options": {
      "facades": [
        { "name": "Panneau plein", "image_url": "/web/image/...", "extra_price": 0 }
      ],
      "colors": [
        { "name": "Chene naturel", "hex": "#D4C5A9", "extra_price": 0 }
      ],
      "finitions": [
        { "name": "Mat", "extra_price": 0 },
        { "name": "Satine", "extra_price": 80 }
      ]
    }
  },
  "meta": { "total": 14 }
}
```

---

### 7. GET /api/oaksome/gamme/:slug

Produits par type de meuble.

**Auth :** public
**Cache :** ISR 1h
**Params :** `?country=BE&page=1&limit=12`

**Response :**
```json
{
  "success": true,
  "data": {
    "gamme": {
      "name": "Dressings",
      "slug": "dressing",
      "description": "Dressings sur mesure...",
      "image_url": "/web/image/...",
      "dimension_ranges": {
        "width": { "min": 100, "max": 300 },
        "depth": { "min": 40, "max": 70 },
        "height": { "min": 200, "max": 270 }
      },
      "prix_depuis": 890.0
    },
    "products": [
      { "id": 42, "name": "Dressing Satori 180", "price_ttc": 1560.90, "image_url": "/web/image/...", "collection_slug": "satori" }
    ]
  },
  "meta": { "total": 8, "page": 1, "limit": 12 }
}
```

---

### 8. GET /api/oaksome/espace/:slug

Produits par espace/piece.

**Auth :** public
**Cache :** ISR 1h
**Params :** `?country=BE&page=1&limit=12`

**Response :**
```json
{
  "success": true,
  "data": {
    "espace": {
      "name": "Chambre",
      "slug": "chambre",
      "description": "Solutions pour votre chambre...",
      "image_url": "/web/image/...",
      "gallery": ["/web/image/..."]
    },
    "products": [
      { "id": 42, "name": "Dressing Satori 180", "price_ttc": 1560.90, "image_url": "/web/image/...", "collection_slug": "satori", "type_slug": "dressing" }
    ]
  },
  "meta": { "total": 12, "page": 1, "limit": 12 }
}
```

---

## TIER 2 — Contenu, Leads & Partage (8 endpoints)

### 9. GET /api/oaksome/inspirations

Galerie inspirations avec filtre.

**Auth :** public
**Cache :** SSR
**Params :** `?source=oaksome&collection=satori&space=chambre&page=1&limit=12`

**Response :**
```json
{
  "success": true,
  "data": {
    "inspirations": [
      {
        "id": 1,
        "name": "Dressing minimaliste Bruxelles",
        "image_url": "/web/image/...",
        "source": "oaksome",
        "collection": { "name": "Line", "slug": "line" },
        "space": { "name": "Chambre", "slug": "chambre" },
        "ville": "Bruxelles",
        "tags": ["minimaliste", "chambre"]
      }
    ]
  },
  "meta": { "total": 24, "page": 1, "limit": 12 }
}
```

---

### 10. GET /api/oaksome/case-studies

Liste etudes de cas.

**Auth :** public
**Cache :** ISR 1h
**Params :** `?collection=satori&space=chambre`

**Response :**
```json
{
  "success": true,
  "data": {
    "case_studies": [
      {
        "id": 1,
        "name": "Renovation complete Uccle",
        "slug": "renovation-complete-uccle",
        "image_url": "/web/image/...",
        "collection": { "name": "Satori", "slug": "satori" },
        "ville": "Uccle",
        "surface": 45.0,
        "tags": ["renovation", "chambre", "dressing"]
      }
    ]
  },
  "meta": { "total": 8 }
}
```

---

### 11. GET /api/oaksome/case-studies/:slug

Detail etude de cas.

**Auth :** public
**Cache :** ISR 1h

**Response :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Renovation complete Uccle",
    "slug": "renovation-complete-uccle",
    "description": "<p>Projet de renovation...</p>",
    "images": [
      { "url": "/web/image/...", "name": "Avant", "sequence": 1 },
      { "url": "/web/image/...", "name": "Apres", "sequence": 2 }
    ],
    "collection": { "name": "Satori", "slug": "satori" },
    "space": { "name": "Chambre", "slug": "chambre" },
    "ville": "Uccle",
    "surface": 45.0,
    "budget": "5000-8000",
    "tags": ["renovation", "chambre"],
    "related_products": [
      { "id": 42, "name": "Dressing Satori 180", "price_ttc": 1560.90, "image_url": "/web/image/..." }
    ]
  }
}
```

---

### 12. GET /api/oaksome/configurator

Donnees initialisation du configurateur.

**Auth :** public
**Cache :** ISR 1h

**Response :**
```json
{
  "success": true,
  "data": {
    "types": [
      { "name": "Dressing", "slug": "dressing", "image_url": "/web/image/..." }
    ],
    "spaces": [
      { "name": "Chambre", "slug": "chambre", "image_url": "/web/image/..." }
    ],
    "collections": [
      {
        "name": "Satori", "slug": "satori", "color_hex": "#D4B896",
        "image_url": "/web/image/...",
        "facades": [
          { "name": "Panneau plein", "image_url": "/web/image/...", "extra_price": 0 }
        ],
        "colors": [
          { "name": "Chene naturel", "hex": "#D4C5A9", "extra_price": 0 }
        ],
        "finitions": [
          { "name": "Mat", "extra_price": 0 }
        ]
      }
    ],
    "dimension_ranges": {
      "width": { "min": 60, "max": 300, "step": 10 },
      "depth": { "min": 30, "max": 70, "step": 5 },
      "height": { "min": 180, "max": 270, "step": 10 }
    }
  }
}
```

---

### 13. POST /api/oaksome/leads

Creation lead CRM (favori, sauvegarde config, ou partage).

**Auth :** public

**Request :**
```json
{
  "email": "client@example.com",
  "product_id": 42,
  "estimated_price": 1290.0,
  "config_values": {
    "collection": "satori",
    "facade": "cannele",
    "color": "chene-naturel",
    "dimensions": { "width": 180, "depth": 60, "height": 240 }
  },
  "share": false,
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "spring-2026"
}
```

| Champ | Type | Requis | Description |
|---|---|---|---|
| `email` | String | oui | Email du client |
| `product_id` | Integer | oui | ID produit |
| `estimated_price` | Float | non | Prix estime (configurateur) |
| `config_values` | Object | non | Config selectionnee (collection, facade, couleur, dimensions) |
| `share` | Boolean | non | Si `true`, genere un lien partageable (token + URL) |
| `utm_source` | String | non | Source UTM |
| `utm_medium` | String | non | Medium UTM |
| `utm_campaign` | String | non | Campaign UTM |

**Response (share=false ou absent) :**
```json
{
  "success": true,
  "data": {
    "lead_id": 123,
    "partner_exists": false,
    "invitation_sent": true
  }
}
```

**Response (share=true) :**
```json
{
  "success": true,
  "data": {
    "lead_id": 123,
    "partner_exists": false,
    "invitation_sent": true,
    "share_token": "abc123def456",
    "share_url": "https://oaksome.com/config/abc123def456",
    "expires_at": "2026-07-08T00:00:00Z"
  }
}
```

**Logique backend :**
1. Chercher `res.partner` par email (`is_exist`)
2. Si inexistant : creer partenaire + groupe portal + invitation email
3. Creer `crm.lead` (etape Interet) lie au partenaire
4. Declencher automation relance J+1/J+3
5. Si `share=true` : generer token unique (UUID), stocker `oaksome_share_token` + `oaksome_share_expires` (J+90) sur le lead, retourner `share_url`

---

### 14. GET /api/oaksome/samples

Echantillons disponibles + showrooms (affiches sur la meme page `/echantillons`).

**Auth :** public
**Cache :** ISR 1h

**Response :**
```json
{
  "success": true,
  "data": {
    "samples": [
      {
        "id": 1,
        "name": "Chene naturel mat",
        "material": "Chene massif",
        "finish_type": "mat",
        "image_url": "/web/image/...",
        "collection": { "name": "Satori", "slug": "satori" },
        "description": "Finition chene naturel..."
      }
    ],
    "showrooms": [
      {
        "id": 1,
        "name": "Showroom Bruxelles",
        "address": "Rue de la Loi 42, 1000 Bruxelles",
        "city": "Bruxelles",
        "country": "BE",
        "phone": "+32 2 123 45 67",
        "email": "bruxelles@oaksome.com",
        "latitude": 50.8467,
        "longitude": 4.3525,
        "opening_hours": "Lun-Ven 10h-18h, Sam 10h-16h",
        "image_url": "/web/image/..."
      }
    ]
  }
}
```

---

### 15. POST /api/oaksome/samples/request

Demande d'echantillon.

**Auth :** public

**Request :**
```json
{
  "email": "client@example.com",
  "name": "Marie Dupont",
  "address": {
    "street": "Rue de la Loi 42",
    "city": "Bruxelles",
    "zip": "1000",
    "country": "BE"
  },
  "sample_ids": [1, 3, 5],
  "utm_source": "site",
  "utm_medium": "organic"
}
```

**Response :**
```json
{
  "success": true,
  "data": {
    "request_id": 456,
    "lead_id": 124,
    "message": "Vos echantillons seront expedies sous 48h"
  }
}
```

**Logique backend :**
1. Creer/trouver `res.partner`
2. Creer `crm.lead` (etape Echantillons)
3. Creer `sale.order` (type `so_sample`, gratuit) lie au partenaire et au lead

> Note : pas de modele `oaksome.sample` — les echantillons sont des `product.product` standards. La demande cree un `crm.lead` + un `sale.order` (type `so_sample`).

---

### 16. GET /api/oaksome/config/:token

Consultation publique d'une configuration partagee. Aucun compte requis.

**Auth :** public
**Cache :** No cache

**Response :**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": 42,
      "name": "Dressing Satori 180",
      "image_url": "/web/image/...",
      "collection": { "name": "Satori", "slug": "satori", "color_hex": "#D4B896" },
      "type": { "name": "Dressing", "slug": "dressing" }
    },
    "config_values": {
      "collection": "satori",
      "facade": "cannele",
      "color": "chene-naturel",
      "dimensions": { "width": 180, "depth": 60, "height": 240 }
    },
    "estimated_price": 1560.90,
    "created_at": "2026-04-08T14:30:00Z",
    "expired": false
  }
}
```

**Erreur si token invalide ou expire :**
```json
{
  "success": false,
  "error": "Configuration expired or not found",
  "code": 404
}
```

**Logique backend :**
1. Chercher `crm.lead` par `oaksome_share_token`
2. Verifier `oaksome_share_expires` > now
3. Retourner les donnees du produit + config_values + prix depuis le lead

---

## TIER 3 — Cart & Wishlist (8 endpoints)

> **Cart anonyme vs connecte :** Le panier est stocke en localStorage cote NextJS tant que l'utilisateur est anonyme. Aucun appel API. La sync vers Odoo (`website.cart.item`) ne se fait qu'au clic "Commander", quand l'utilisateur est connecte. Tous les endpoints cart ci-dessous necessitent `auth=user`. Le champ `session_id` sur `website.cart.item` n'est pas utilise en phase 1.

### 17. POST /api/oaksome/cart/add

**Auth :** user (cookie session Odoo)

**Request :**
```json
{
  "product_id": 42,
  "quantity": 1,
  "config": {
    "facade": "cannele",
    "color": "chene-naturel",
    "dimensions": { "width": 180, "depth": 60, "height": 240 }
  }
}
```

**Response :**
```json
{
  "success": true,
  "data": { "cart_item_id": 789, "cart_count": 3 }
}
```

---

### 18. PUT /api/oaksome/cart/update

Modifier la quantite d'un item du panier.

**Auth :** user

**Request :**
```json
{
  "cart_item_id": 789,
  "quantity": 2
}
```

**Response :**
```json
{
  "success": true,
  "data": { "cart_item_id": 789, "quantity": 2, "cart_count": 3 }
}
```

---

### 19. POST /api/oaksome/cart/remove

**Auth :** user

**Request :**
```json
{ "cart_item_id": 789 }
```

**Response :**
```json
{
  "success": true,
  "data": { "cart_count": 2 }
}
```

---

### 20. GET /api/oaksome/cart

**Auth :** user
**Params :** `?country=BE`

**Response :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 789,
        "product": { "id": 42, "name": "Dressing Satori 180", "image_url": "/web/image/..." },
        "quantity": 1,
        "price_ttc": 1560.90,
        "config": { "facade": "cannele", "color": "chene-naturel", "dimensions": { "width": 180 } }
      }
    ],
    "subtotal": 1560.90,
    "delivery": 0.0,
    "total": 1560.90
  }
}
```

---

### 21. POST /api/oaksome/wishlist/add

> **Anonyme vs connecte :** Cet endpoint est reserve aux utilisateurs connectes. Quand un visiteur anonyme clique sur le coeur ou "Sauvegarder", le frontend affiche un popup email et appelle `POST /api/oaksome/leads` (public, endpoint #13) qui cree un lead CRM + partner + invitation portail. L'ajout en wishlist Odoo ne se fait qu'apres connexion.

**Auth :** user

**Request :**
```json
{
  "product_id": 42,
  "config": { "collection": "satori" }
}
```

**Response :**
```json
{
  "success": true,
  "data": { "wishlist_item_id": 101, "wishlist_count": 5 }
}
```

---

### 22. GET /api/oaksome/wishlist

**Auth :** user

**Response :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 101,
        "product": { "id": 42, "name": "Dressing Satori 180", "price_ttc": 1560.90, "image_url": "/web/image/..." },
        "config": { "collection": "satori" },
        "fav_date": "2026-03-15T10:30:00Z",
        "shareable_link": "https://oaksome.com/wishlist/abc123"
      }
    ]
  }
}
```

---

### 23. DELETE /api/oaksome/wishlist/remove

**Auth :** user

**Request :**
```json
{ "wishlist_item_id": 101 }
```

**Response :**
```json
{
  "success": true,
  "data": { "wishlist_count": 4 }
}
```

---

### 24. GET /api/oaksome/cart/checkout-url

Retourne l'URL de checkout Odoo avec session.

**Auth :** user

**Response :**
```json
{
  "success": true,
  "data": {
    "checkout_url": "https://cdn.oaksome.com/shop/checkout?session=xyz"
  }
}
```

---

## TIER 4 — Compte & Notifications (10 endpoints)

### 25. POST /api/oaksome/auth/login

**Auth :** public

**Request :**
```json
{
  "login": "client@example.com",
  "password": "***"
}
```

**Response :**
```json
{
  "success": true,
  "data": {
    "user_id": 10,
    "name": "Marie Dupont",
    "email": "client@example.com",
    "is_pro": false,
    "session_id": "abc123"
  }
}
```

---

### 26. POST /api/oaksome/auth/register

**Auth :** public

**Request :**
```json
{
  "name": "Marie Dupont",
  "email": "client@example.com",
  "password": "***",
  "phone": "+32 470 123 456",
  "is_pro": false,
  "company_name": null
}
```

**Response :**
```json
{
  "success": true,
  "data": {
    "user_id": 11,
    "confirmation_sent": true
  }
}
```

---

### 27. POST /api/oaksome/auth/logout

**Auth :** user

**Response :**
```json
{
  "success": true,
  "data": { "message": "Session terminee" }
}
```

---

### 28. POST /api/oaksome/auth/password-recover

Demande de reinitialisation mot de passe — envoie un email Odoo natif avec token.

**Auth :** public

**Request :**
```json
{ "email": "client@example.com" }
```

**Response :**
```json
{
  "success": true,
  "data": { "message": "Email de reinitialisation envoye" }
}
```

---

### 29. POST /api/oaksome/auth/password-reset

Reinitialisation effective du mot de passe via token recu par email. Page NextJS `/password-reset?token=xxx`.

**Auth :** public

**Request :**
```json
{
  "token": "abc123def456",
  "password": "new_secure_password"
}
```

**Response :**
```json
{
  "success": true,
  "data": { "message": "Mot de passe mis a jour. Vous pouvez vous connecter." }
}
```

**Erreur token invalide/expire :**
```json
{
  "success": false,
  "error": "Token invalide ou expire",
  "code": 400
}
```

**Logique backend :**
1. Valider le token via `auth_signup` Odoo
2. Mettre a jour le mot de passe du `res.users`
3. Invalider le token

---

### 30. GET /api/oaksome/profile

**Auth :** user

**Response :**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "Marie Dupont",
    "email": "client@example.com",
    "phone": "+32 470 123 456",
    "address": {
      "street": "Rue de la Loi 42",
      "city": "Bruxelles",
      "zip": "1000",
      "country": "BE"
    },
    "is_pro": false,
    "collection_pref": "satori",
    "order_count": 2,
    "wishlist_count": 5
  }
}
```

---

### 31. PUT /api/oaksome/profile

Mise a jour du profil utilisateur.

**Auth :** user

**Request :**
```json
{
  "name": "Marie Dupont-Martin",
  "phone": "+32 470 123 999",
  "address": {
    "street": "Avenue Louise 100",
    "city": "Bruxelles",
    "zip": "1050",
    "country": "BE"
  },
  "collection_pref": "line"
}
```

**Response :**
```json
{
  "success": true,
  "data": { "message": "Profil mis a jour" }
}
```

---

### 32. GET /api/oaksome/orders

**Auth :** user

**Response :**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 100,
        "name": "SO1-00100",
        "date": "2026-03-01",
        "oaksome_status": "measures_scheduled",
        "oaksome_status_label": "Mesures planifiees",
        "total": 2500.0,
        "collection": "satori",
        "product_summary": "Dressing Satori 180",
        "so2_id": 101
      }
    ]
  }
}
```

---

### 33. GET /api/oaksome/orders/:id

**Auth :** user

**Response :**
```json
{
  "success": true,
  "data": {
    "id": 100,
    "name": "SO1-00100",
    "date": "2026-03-01",
    "oaksome_status": "measures_scheduled",
    "oaksome_status_label": "Mesures planifiees",
    "status_history": [
      { "status": "cgv_pending", "date": "2026-03-01", "label": "A signer CGV" },
      { "status": "deposit_pending", "date": "2026-03-03", "label": "Acompte en attente" },
      { "status": "measures_pending", "date": "2026-03-05", "label": "A mesurer" },
      { "status": "measures_scheduled", "date": "2026-03-10", "label": "Mesures planifiees" }
    ],
    "lines": [
      { "product": "Acompte Oaksome", "quantity": 1, "price_ttc": 2500.0 }
    ],
    "total": 2500.0,
    "amount_paid": 2500.0,
    "amount_remaining": 2630.0,
    "so2": {
      "id": 101,
      "name": "SO2-00101",
      "total": 3200.0,
      "status": "manufacturing"
    },
    "next_action": {
      "label": "Mesures prevues le 15 mars",
      "date": "2026-03-15"
    }
  }
}
```

---

### 34. GET /api/oaksome/notifications

**Auth :** user
**Params :** `?unread_only=true&limit=20`

**Response :**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "order",
        "title": "Mesures confirmees",
        "message": "Vos mesures sont planifiees pour le 15 mars",
        "read": false,
        "link": "/commandes/100",
        "created_at": "2026-03-10T14:00:00Z"
      }
    ],
    "unread_count": 3
  }
}
```

---

### 35. POST /api/oaksome/notifications/mark-read

Marquer une ou plusieurs notifications comme lues.

**Auth :** user

**Request :**
```json
{ "notification_ids": [1, 2, 3] }
```

**Response :**
```json
{
  "success": true,
  "data": { "marked_count": 3, "unread_count": 0 }
}
```

### 36. POST /api/oaksome/photos/submit

Soumission de photos client post-pose. Cree un `oaksome.photo.submission` + ticket Helpdesk automatiquement.
Accessible depuis `/commandes/[id]` quand `oaksome_status = done`. Lien direct dans l'email satisfaction J+7.

**Auth :** user

**Request :**
```json
{
  "order_id": 100,
  "description": "Notre dressing Satori installe dans la chambre",
  "photos": ["base64_encoded_image_1", "base64_encoded_image_2"]
}
```

**Response :**
```json
{
  "success": true,
  "data": {
    "submission_id": 12,
    "ticket_id": 456,
    "message": "Merci pour vos photos ! Notre equipe les examinera sous 48h."
  }
}
```

**Logique backend :**
1. Creer `oaksome.photo.submission` lie au `res.partner`
2. Attacher les photos en `ir.attachment`
3. Creer `helpdesk.ticket` automatiquement
4. Notification interne equipe contenu

### 37. GET /api/oaksome/appointments/slots

Creneaux disponibles pour mesures ou pose lies a une commande.

**Auth :** user

**Params :** `?order_id=100&type=mesures&month=2026-04`

| Param | Type | Requis | Description |
|---|---|---|---|
| `order_id` | Integer | oui | ID de la commande (SO1) |
| `type` | String | oui | `mesures` ou `pose` |
| `month` | String | non | Mois au format YYYY-MM (defaut: mois courant) |

**Response :**
```json
{
  "success": true,
  "data": {
    "type": "mesures",
    "slots": [
      {
        "id": 1,
        "date": "2026-04-15",
        "start": "09:00",
        "end": "12:00",
        "technician": "Marc D."
      },
      {
        "id": 2,
        "date": "2026-04-15",
        "start": "14:00",
        "end": "17:00",
        "technician": "Marc D."
      }
    ]
  }
}
```

**Logique backend :**
1. Recuperer les creneaux libres depuis `appointment.type` (mesures ou pose)
2. Filtrer par mois et disponibilite technicien/installateur
3. Ne retourner que les creneaux lies a la zone geographique du client

---

### 38. POST /api/oaksome/appointments/book

Reservation d'un creneau mesures ou pose.

**Auth :** user

**Request :**
```json
{
  "order_id": 100,
  "slot_id": 1,
  "type": "mesures",
  "notes": "Sonnez au 2eme etage"
}
```

**Response :**
```json
{
  "success": true,
  "data": {
    "appointment_id": 456,
    "calendar_event_id": 789,
    "date": "2026-04-15",
    "start": "09:00",
    "end": "12:00",
    "message": "Votre rendez-vous mesures est confirme pour le 15 avril de 9h a 12h."
  }
}
```

**Logique backend :**
1. Verifier que le creneau est encore disponible
2. Creer `calendar.event` lie au SO1 (`oaksome_sale_order_id`)
3. Mettre a jour la tache FS (planifiee)
4. Envoyer email confirmation au client (template "Mesures planifiees" ou "Pose planifiee")
5. Notification in-app au client

---

## TIER 5 — Search & Contact (3 endpoints)

### 39. GET /api/oaksome/search

Recherche produits.

**Auth :** public
**Params :** `?q=dressing satori&limit=10&country=BE`

**Response :**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 42,
        "name": "Dressing Satori 180",
        "price_ttc": 1560.90,
        "image_url": "/web/image/...",
        "collection_slug": "satori",
        "type_slug": "dressing"
      }
    ],
    "suggestions": {
      "collections": [{ "name": "Satori", "slug": "satori" }],
      "types": [{ "name": "Dressings", "slug": "dressing" }],
      "spaces": []
    }
  },
  "meta": { "total": 5 }
}
```

---

### 40. GET /api/oaksome/testimonials

Temoignages clients.

**Auth :** public
**Cache :** ISR 1h

**Response :**
```json
{
  "success": true,
  "data": {
    "testimonials": [
      {
        "id": 1,
        "author": "Marie D.",
        "text": "Excellent service, meuble parfait...",
        "rating": 5,
        "image_url": "/web/image/...",
        "collection": "satori"
      }
    ]
  }
}
```

---

### 41. POST /api/oaksome/contact

Formulaire de contact — route vers CRM ou Helpdesk selon le type.

**Auth :** public

**Request :**
```json
{
  "type": "commercial",
  "name": "Pierre Martin",
  "email": "pierre@example.com",
  "phone": "+32 470 999 888",
  "subject": "Demande devis dressing",
  "message": "Je souhaite un devis pour...",
  "utm_source": "site"
}
```

| Type | Destination Odoo |
|---|---|
| `commercial` | `crm.lead` (equipe commerciale) |
| `support` | `helpdesk.ticket` (equipe support) |
| `pro` | `crm.lead` (equipe B2B) |

**Response :**
```json
{
  "success": true,
  "data": {
    "reference_id": 456,
    "message": "Votre message a ete envoye. Nous vous repondrons sous 24h."
  }
}
```

---

## Infra tracking (hors 41 endpoints metier)

Cet endpoint est gere cote NextJS (pas cote Odoo), et n'entre pas dans le comptage Tier 1-5.

### POST /api/tracking/capi

Ingress server-side pour relayer les conversions vers Meta CAPI, Google Enhanced Conversions et GA4 Measurement Protocol.

**Ownership :** NextJS (`app/api/tracking/capi/route.ts`)
**Auth :** same-origin uniquement (endpoint technique)
**Cache :** no-store

**Security guardrails :**
- rate limit initial : 60 requetes/minute/IP (ajustable)
- payload max : 32KB (reject au-dela)
- `event` whitelist stricte : `purchase`, `generate_lead`, `begin_checkout`
- content-type JSON obligatoire, validation schema stricte (`items` tableau valide)
- protection same-origin + verification CSRF selon strategie NextJS retenue

**Contraintes obligatoires :**
- `schema_version` requis (initial: `"1.0"`)
- `event_id` UUID v4 genere cote composant NextJS avant `dataLayer.push`
- meme `event_id` reutilise client-side + server-side (dedup)
- email transmis uniquement en hash SHA-256 (jamais en clair)
- normalisation email avant hash : `trim()` -> `toLowerCase()` -> UTF-8 -> SHA-256 hex

**Request (schema minimal) :**
```json
{
  "schema_version": "1.0",
  "event": "purchase",
  "event_id": "f8f40f7e-77f9-4a67-9a6f-a8d7cf72b89f",
  "timestamp": "2026-04-09T10:20:00Z",
  "source_url": "https://oaksome.com/checkout/success?order=SO0001",
  "consent_state": {
    "statistics": true,
    "marketing": true
  },
  "email_hash": "<sha256>",
  "transaction_id": "SO0001",
  "value": 5700,
  "currency": "EUR",
  "items": [
    { "item_id": "42", "item_name": "Dressing Satori 180", "price": 5700, "quantity": 1 }
  ]
}
```

**Champs d'enrichissement optionnels (recommandes) :** `user_agent`, `client_ip` (si conforme RGPD), `gclid`, `fbclid`, `epik`.

**Enrichissement attribution (middleware) :**
- `gclid`, `fbclid`, `epik` captures a l'entree via `middleware.ts`
- stockes en cookies first-party 90 jours (`SameSite=Lax`, `Secure`)
- lus par `/api/tracking/capi` pour les destinations server-side

**Routage des events (phase 1) :**
- `purchase` -> Meta CAPI + Google Enhanced Conversions + GA4 MP
- `generate_lead` -> Meta CAPI + Google Enhanced Conversions + GA4 MP
- `begin_checkout` -> Meta CAPI
- Pinterest CAPI -> backlog post-launch
- Google EC sans `gclid` : destination `skipped` avec raison `missing_gclid` (comportement normal, pas une erreur)

Note implementation Google EC : le transport concret (Google Ads API `ConversionUploadService` ou autre methode server-side equivalente) reste un detail d'implementation. Le contrat ici est defini au niveau destination/comportement.

**Statuts destination (contrat de reponse) :**
- `status` : `sent` | `skipped` | `failed`
- `reason` (enum) :
  - `sent` -> `forwarded`
  - `skipped` -> `no_consent` | `missing_gclid` | `destination_disabled` | `backlog` | `not_applicable_event`
  - `failed` -> `validation_error` | `timeout` | `vendor_error` | `network_error`
- champs optionnels : `http_status`, `vendor_event_id`

**Consentement :**
- pas de forwarding marketing sans consentement `marketing=true`
- pas de forwarding GA4 sans consentement `statistics=true`
- l'endpoint peut repondre `accepted` avec destinations `skipped` si consentement absent

**Idempotence / dedup server-side :**
- conserver les `event_id` pendant 48h minimum
- si le meme `event_id` est recu avec le meme payload : ne pas re-forwarder, repondre `success` avec `deduplicated=true`
- si le meme `event_id` est recu avec payload different : repondre erreur de conflit (`code` 409)

**Timeouts et retries (fiabilite) :**
- timeout par destination : 2s
- retries uniquement pour erreurs transientes (`timeout`, `network_error`, HTTP 5xx)
- max 2 retries avec backoff exponentiel (250ms, puis 1000ms)
- pas de retry pour `validation_error` ou erreurs 4xx
- ne jamais bloquer l'UX utilisateur sur un echec tracking (best effort + logs)

**Observabilite (obligatoire) :**
- logs structures : `event`, `event_id`, `deduplicated`, `destination.status`, `destination.reason`, `latency_ms`
- metriques : volumes `sent/skipped/failed` par destination
- metriques qualite : `dedup_rate`, `skip_rate_by_reason`, `retry_count`, `timeout_rate`
- correlation : utiliser `event_id` comme identifiant commun entre logs client et serveur

**Response (operationnelle) :**
```json
{
  "success": true,
  "data": {
    "accepted": true,
    "deduplicated": false,
    "event": "purchase",
    "event_id": "f8f40f7e-77f9-4a67-9a6f-a8d7cf72b89f",
    "destinations": {
      "meta": { "status": "sent", "reason": "forwarded", "http_status": 200 },
      "google_ads": { "status": "sent", "reason": "forwarded", "http_status": 200 },
      "ga4": { "status": "sent", "reason": "forwarded", "http_status": 204 },
      "pinterest": { "status": "skipped", "reason": "backlog" }
    }
  }
}
```

**Reponse erreur (validation) :**
```json
{
  "success": false,
  "error": "Invalid tracking payload",
  "code": 400
}
```

**Reponse erreur (conflit idempotence) :**
```json
{
  "success": false,
  "error": "event_id already used with different payload",
  "code": 409
}
```

---

## Resume des endpoints (41 total)

Le total 41 couvre uniquement les endpoints metier `/api/oaksome/*`. L'endpoint infra NextJS `/api/tracking/capi` est documente plus haut et reste hors comptage.

| # | Methode | Route | Auth | Tier |
|---|---|---|---|---|
| 1 | GET | `/api/oaksome/navigation` | public | 1 |
| 2 | GET | `/api/oaksome/home` | public | 1 |
| 3 | GET | `/api/oaksome/products` | public | 1 |
| 4 | GET | `/api/oaksome/products/:id` | public | 1 |
| 5 | GET | `/api/oaksome/collections` | public | 1 |
| 6 | GET | `/api/oaksome/collections/:slug` | public | 1 |
| 7 | GET | `/api/oaksome/gamme/:slug` | public | 1 |
| 8 | GET | `/api/oaksome/espace/:slug` | public | 1 |
| 9 | GET | `/api/oaksome/inspirations` | public | 2 |
| 10 | GET | `/api/oaksome/case-studies` | public | 2 |
| 11 | GET | `/api/oaksome/case-studies/:slug` | public | 2 |
| 12 | GET | `/api/oaksome/configurator` | public | 2 |
| 13 | POST | `/api/oaksome/leads` | public | 2 |
| 14 | GET | `/api/oaksome/samples` | public | 2 |
| 15 | POST | `/api/oaksome/samples/request` | public | 2 |
| 16 | GET | `/api/oaksome/config/:token` | public | 2 |
| 17 | POST | `/api/oaksome/cart/add` | user | 3 |
| 18 | PUT | `/api/oaksome/cart/update` | user | 3 |
| 19 | POST | `/api/oaksome/cart/remove` | user | 3 |
| 20 | GET | `/api/oaksome/cart` | user | 3 |
| 21 | POST | `/api/oaksome/wishlist/add` | user | 3 |
| 22 | GET | `/api/oaksome/wishlist` | user | 3 |
| 23 | DELETE | `/api/oaksome/wishlist/remove` | user | 3 |
| 24 | GET | `/api/oaksome/cart/checkout-url` | user | 3 |
| 25 | POST | `/api/oaksome/auth/login` | public | 4 |
| 26 | POST | `/api/oaksome/auth/register` | public | 4 |
| 27 | POST | `/api/oaksome/auth/logout` | user | 4 |
| 28 | POST | `/api/oaksome/auth/password-recover` | public | 4 |
| 29 | POST | `/api/oaksome/auth/password-reset` | public | 4 |
| 30 | GET | `/api/oaksome/profile` | user | 4 |
| 31 | PUT | `/api/oaksome/profile` | user | 4 |
| 32 | GET | `/api/oaksome/orders` | user | 4 |
| 33 | GET | `/api/oaksome/orders/:id` | user | 4 |
| 34 | GET | `/api/oaksome/notifications` | user | 4 |
| 35 | POST | `/api/oaksome/notifications/mark-read` | user | 4 |
| 36 | POST | `/api/oaksome/photos/submit` | user | 4 |
| 37 | GET | `/api/oaksome/appointments/slots` | user | 4 |
| 38 | POST | `/api/oaksome/appointments/book` | user | 4 |
| 39 | GET | `/api/oaksome/search` | public | 5 |
| 40 | GET | `/api/oaksome/testimonials` | public | 5 |
| 41 | POST | `/api/oaksome/contact` | public | 5 |

---

## References

- Modele de donnees : [data-model](data-model.md)
- Backend spec : [backend-spec](backend-spec.md)
- Frontend spec : [frontend-spec](frontend-spec.md)
- User flows : [user-flows](user-flows.md)
