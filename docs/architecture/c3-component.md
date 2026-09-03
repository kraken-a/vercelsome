# C3 — Component

**Scope:** Zooms into the two most complex containers from [C2](c2-container.md):
- **C3a:** Oaksome Web (Next.js 15) — route groups, features, lib, middleware.
- **C3b:** `oaksome_nextjs_api` Odoo addon — HTTP controllers, CORS mixin, data, tests.

**Audience:** Engineers making changes inside these containers — onboarding, refactoring, code review.
**Source:** Live filesystem (`oaksome-web/src/`, `odoo/custom/website/oaksome_nextjs_api/`) + [api-contract](../api-contract.md) + [frontend-spec](../frontend-spec.md).

---

## C3a — Oaksome Web (Next.js 15)

### Diagram

```mermaid
flowchart LR
    user["Browser<br/>(Visitor / Customer / Pro)"]

    subgraph mw_layer["Edge of app"]
        mw["middleware.ts<br/>• locale routing<br/>• capture gclid / fbclid / epik<br/>→ first-party cookies (90d)"]
    end

    subgraph routes["app/[locale]/ — App Router (route groups)"]
        rmkt["(marketing)<br/>home, a-propos, contact,<br/>comment-ca-marche, faq,<br/>engagements, pro"]
        rshop["(shop)<br/>acheter, panier, wishlist,<br/>configurer, config/[token],<br/>collection(s), gamme, espace(s),<br/>produit, inspirations,<br/>etudes-de-cas, echantillons,<br/>checkout, checkout/success"]
        racct["(account)<br/>profile, projets, rendez-vous"]
        rauth["(auth)<br/>login, register, landing,<br/>password-recover, password-reset"]
        rlegal["(legal)<br/>cgv, cookies, mentions, garantie,<br/>tva-6, livraison, return,<br/>accessibilite, prise-mesures"]
    end

    subgraph api_routes["app/api/ — Route Handlers"]
        proxy["/api/oaksome/[...path]<br/>(catch-all REST proxy)"]
        odoo_legacy["/api/odoo/*<br/>(legacy direct endpoints —<br/>login, contact, configurator,<br/>product, inspiration, etc.)"]
        capi["/api/tracking/capi<br/>(Meta CAPI + GA4 MP)"]
    end

    subgraph features["src/features/"]
        f_auth["auth"]
        f_cart["cart<br/>(localStorage store)"]
        f_wish["wishlist<br/>(localStorage store)"]
        f_cfg["configurator<br/>(multi-step state)"]
        f_country["country<br/>(BE/LU + TVA 6%)"]
        f_notif["notifications"]
        f_toast["toast"]
        f_track["tracking<br/>(dataLayer + CAPI client)"]
    end

    subgraph lib["src/lib/"]
        l_api["lib/api<br/>(Odoo REST client,<br/>auth fetch, error envelope)"]
        l_i18n["lib/i18n<br/>(next-intl config)"]
        l_seo["lib/seo<br/>(generateMetadata helpers,<br/>JSON-LD, hreflang)"]
        l_store["lib/store<br/>(localStorage adapters)"]
        l_utils["lib/utils"]
    end

    subgraph comps["src/components/"]
        c_layout["layout<br/>(header, footer, top-notice)"]
        c_ui["ui<br/>(primitives)"]
        c_domain["domain<br/>(configurator, checkout,<br/>cards, filters, sliders,<br/>wishlist, samples, newsletter…)"]
    end

    other["src/hooks · src/types · src/utils · src/css · i18n/"]

    user --> mw
    mw --> rmkt
    mw --> rshop
    mw --> racct
    mw --> rauth
    mw --> rlegal

    rmkt --> c_layout
    rshop --> c_layout
    racct --> c_layout
    rauth --> c_layout
    rlegal --> c_layout

    rshop --> f_cart
    rshop --> f_wish
    rshop --> f_cfg
    rshop --> f_country
    racct --> f_auth
    rauth --> f_auth

    f_cart --> l_store
    f_wish --> l_store
    f_cfg --> l_api
    f_auth --> l_api
    f_country --> l_store
    f_track --> capi

    rmkt --> l_api
    rshop --> l_api
    racct --> l_api

    rmkt --> l_seo
    rshop --> l_seo

    l_api -->|"server-side fetch<br/>+ session cookie"| proxy
    l_api -.->|"legacy paths"| odoo_legacy

    proxy -->|"REST"| odoo[("Odoo<br/>cdn.oaksome.com")]
    odoo_legacy -->|"REST"| odoo
    capi -->|"server-to-server"| ext[("Meta CAPI · GA4 MP")]

    c_layout --> c_ui
    c_domain --> c_ui
```

### Components

| Component | Path | Responsibility |
|---|---|---|
| **Middleware** | `src/middleware.ts` | Locale prefix enforcement, attribution click-ID capture into first-party cookies |
| **Route groups** | `src/app/[locale]/(...)` | `(marketing)` · `(shop)` · `(account)` · `(auth)` · `(legal)` — share layouts within each group |
| **API proxy** | `src/app/api/oaksome/[...path]/route.ts` | Catch-all server-side proxy to Odoo `/api/oaksome/*` — forwards session cookie, applies CORS envelope |
| **Legacy API routes** | `src/app/api/odoo/*/route.ts` | Direct endpoints (login, contact, product, configurator, etc.) — predates the catch-all proxy. **Backlog:** consolidate under `/api/oaksome/[...path]`. |
| **Tracking API** | `src/app/api/tracking/capi/route.ts` | Server-to-server Meta CAPI + GA4 MP — reads attribution cookies set by middleware |
| **Features** | `src/features/{auth,cart,wishlist,configurator,country,notifications,toast,tracking}` | Self-contained vertical slices — own state, hooks, components |
| **lib/api** | `src/lib/api/` | Typed Odoo client (used by RSC + features) — wraps fetch, handles `{success,data,meta}` envelope |
| **lib/i18n** | `src/lib/i18n/` | `next-intl` configuration, message loading |
| **lib/seo** | `src/lib/seo/` | `generateMetadata` helpers, JSON-LD builders, hreflang alternates |
| **lib/store** | `src/lib/store/` | `localStorage` adapters consumed by cart/wishlist/country features |
| **components/layout** | `src/components/layout/` | Header (incl. `header-client.tsx`), footer, top notice |
| **components/ui** | `src/components/ui/` | Primitives shared across the app |
| **components/domain** | `src/components/{configurator,checkout,cards,filters,sliders,wishlist,samples,newsletter,...}` | Composed UI per feature area |

### Notes

- `app/[locale]/(shop)/` is the heaviest route group — owns catalogue, configurator, cart, wishlist, checkout.
- `src/features/` follows a feature-first split; cross-cutting code lives in `src/lib/`.
- Tests are co-located (`__tests__/` folders next to the code) — see `configurer/__tests__`, `login/__tests__`, `lib/api/__tests__`, etc.

---

## C3b — `oaksome_nextjs_api` (Odoo addon)

### Diagram

```mermaid
flowchart LR
    next["Next.js<br/>(API proxy + RSC fetches)"]
    portal["Odoo Portal<br/>(internal users)"]

    subgraph addon["oaksome_nextjs_api"]
        subgraph ctrl["controllers/"]
            api_py["api.py (~99 KB)<br/>• CORS mixin<br/>• {success,data,meta} envelope<br/>• 41 REST endpoints (5 tiers)<br/>• auth helpers"]
            get_prod["get_product.py<br/>(catalogue + detail)"]
            variants["variants.py<br/>(product variants, swatches)"]
            wish["wishlist.py<br/>(wishlist endpoints)"]
            notif["notification.py<br/>(oaksome.notification)"]
            rating["product_rating.py<br/>(testimonials)"]
            mail["send_mail.py<br/>(contact / lead emails)"]
        end

        data["data/<br/>(XML seeds — mail templates,<br/>config params)"]
        tests["tests/"]
    end

    subgraph deps["Depends on (other addons)"]
        core["oaksome_nextjs_core<br/>(models: style, space, inspiration,<br/>case, cart-item, wishlist-item,<br/>config-option/value)"]
        saleflow["oaksome_sale_workflow<br/>(SO1 status, CGV block)"]
        nat["Native Odoo<br/>CRM · Sale · Project · Portal ·<br/>Sign · Stripe acquirer · Mail"]
    end

    pg[("PostgreSQL")]
    files[("Filestore")]

    next -->|"HTTPS + session cookie<br/>cdn.oaksome.com/api/oaksome/*"| api_py
    next --> get_prod
    next --> wish
    next --> notif
    next --> rating
    next --> mail

    api_py --> get_prod
    api_py --> variants
    api_py --> wish
    api_py --> notif

    api_py --> core
    get_prod --> core
    variants --> core
    wish --> core
    rating --> core
    notif --> core

    api_py --> saleflow
    api_py --> nat
    saleflow --> nat
    core --> nat

    nat --> pg
    core --> pg
    nat --> files

    portal --> nat
```

### Components

| File | Approx size | Responsibility |
|---|---|---|
| `controllers/api.py` | ~99 KB | **Main controller.** CORS mixin, shared auth helpers, response envelope, the bulk of the 41 REST endpoints (navigation, home, collections, gammes, espaces, cart, leads, auth, profile, orders, notifications, search, contact) |
| `controllers/get_product.py` | ~16 KB | Product list + detail endpoints — pricing, gallery, config options |
| `controllers/variants.py` | ~7 KB | Variant resolution + swatches |
| `controllers/wishlist.py` | <1 KB | Thin wishlist endpoints (delegated to core models) |
| `controllers/notification.py` | ~1 KB | `oaksome.notification` GET + mark-read |
| `controllers/product_rating.py` | ~3 KB | Testimonials endpoint |
| `controllers/send_mail.py` | ~3 KB | Contact / sample-request / lead email dispatch |
| `data/` | — | Mail templates, config parameters (CORS allowed origins, etc.) |
| `tests/` | — | Endpoint integration tests |

### Cross-addon dependencies

| Calls into | Why |
|---|---|
| `oaksome_nextjs_core` | All custom models — products extensions, styles, spaces, content, cart/wishlist items, config options |
| `oaksome_sale_workflow` | SO1 status computation, CGV block — read by `/orders` endpoints |
| Native Odoo (CRM/Sale/Project/Portal/Sign/Mail/Stripe) | Lead creation, order creation, FSM tasks, portal access, signatures, payments |

### Notes

- `api.py` is doing a lot — controller, mixin, envelope, auth, and most endpoints in one file. **Refactor backlog:** split into one module per tier (`tier1_catalogue.py`, `tier2_leads.py`, …) and lift the CORS mixin into `controllers/_mixin.py`.
- `tracking/capi` infra endpoints live on the **Next.js** side, not in this addon — see [C3a](#c3a--oaksome-web-nextjs-15).
- `oaksome_website` (legacy) is **not** part of the current architecture — ignored even though it still sits in `odoo/custom/website/`.

---

## Open Questions / Backlog

- [ ] Consolidate Next.js `app/api/odoo/*` legacy routes under the `/api/oaksome/[...path]` catch-all proxy.
- [ ] Split `controllers/api.py` (~99 KB) into per-tier modules; extract CORS mixin.
- [ ] Map `oaksome_backend` addon — is it admin views only, or does it host any endpoints? (Mentioned in `odoo/custom/website/` but not in [backend-spec](../backend-spec.md).)
- [ ] Document `oaksome_nextjs_core` models in C4 (or rely on [data-model](../data-model.md)).
