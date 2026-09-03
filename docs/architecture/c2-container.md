# C2 — Container

**Scope:** Zooms into the two systems from [C1](c1-context.md) — Oaksome Web (Next.js) and Oaksome ERP (Odoo) — and shows the deployable/runnable units inside them plus the runtime data stores.
**Audience:** Engineers onboarding to the codebase, DevOps, security reviewers.
**Source:** [System-Design](../System-Design.md), [frontend-spec](../frontend-spec.md), [backend-spec](../backend-spec.md), [api-contract](../api-contract.md).

---

## Diagram

```mermaid
flowchart LR
    visitor["Visitor / Customer / Pro<br/>Browser"]
    internal["CSM / FSM / Admin<br/>Odoo UI"]

    subgraph edge["Edge"]
        cf["Cloudflare<br/>CDN + WAF"]
    end

    subgraph webhost["Web Hosts"]
        vercel["Vercel<br/>(dev/test — auto deploy)"]
        nginxweb["Nginx<br/>(prod — Tecnibo BE)"]
    end

    subgraph nextapp["Oaksome Web — Next.js 15 (App Router)"]
        mw["Middleware<br/>locale routing + attribution<br/>(gclid / fbclid / epik cookies)"]
        rsc["Server Components + RSC<br/>SSG/ISR pages<br/>(home, catalogue, gamme, espace, produit)"]
        client["Client Components<br/>configurator, cart, wishlist<br/>(localStorage)"]
        apiproxy["API Routes — Proxy<br/>/api/oaksome/* → Odoo<br/>(server-side, session cookie)"]
        apicapi["API Routes — Tracking<br/>/api/tracking/capi<br/>Meta CAPI + GA4 MP"]
        auth["Auth Pages<br/>login / register / profile<br/>(NextJS custom + Odoo session)"]
    end

    subgraph erphost["ERP Host (Tecnibo BE)"]
        nginxerp["Nginx<br/>(reverse proxy, TLS)"]
        subgraph odoo["Odoo 17 Enterprise"]
            ctrl["HTTP Controllers<br/>oaksome_nextjs_api<br/>(CORS mixin, 41 REST endpoints)"]
            core["oaksome_nextjs_core<br/>(models + i18n + shared logic)"]
            saleflow["oaksome_sale_workflow<br/>(SO1 status, CGV block, smart buttons)"]
            fsmacc["oaksome_fsm_access<br/>(FS-MESURES checklist, mobile)"]
            portrack["oaksome_portal_tracker<br/>(customer portal progress)"]
            native["Native Modules<br/>CRM · Sale · Project (FSM)<br/>Portal · Sign · Stripe acquirer · Mail"]
        end
        pg[("PostgreSQL<br/>Odoo DB")]
        files[("Filestore<br/>attachments + images")]
    end

    subgraph external["External"]
        gtm["GTM → GA4 / Meta / Google Ads"]
        meta["Meta CAPI"]
        ga4["GA4 Measurement Protocol"]
        stripe["Stripe"]
        sign["Odoo Sign"]
        smtp["SMTP"]
    end

    visitor --> cf
    cf --> nginxweb
    cf -.->|"dev only"| vercel
    nginxweb --> nextapp
    vercel --> nextapp

    mw --> rsc
    mw --> client
    rsc --> apiproxy
    client --> apiproxy
    client --> apicapi
    auth --> apiproxy

    apiproxy -->|"REST + session cookie"| cf
    cf --> nginxerp
    nginxerp --> ctrl
    ctrl --> core
    ctrl --> saleflow
    ctrl --> native
    saleflow --> native
    fsmacc --> native
    portrack --> native
    core --> pg
    native --> pg
    native --> files

    internal --> nginxerp
    nginxerp --> odoo

    client -.->|"client events"| gtm
    apicapi -->|"server-side"| meta
    apicapi -->|"server-side"| ga4
    native --> stripe
    native --> sign
    native --> smtp
```

---

## Containers — Oaksome Web (Next.js 15)

| Container | Tech | Responsibility |
|---|---|---|
| **Middleware** | `middleware.ts` | Locale routing (`/fr`, `/nl`), attribution capture (`gclid`/`fbclid`/`epik` → first-party cookies, 90d) |
| **Server Components / RSC** | Next.js App Router | SSG/ISR for home, catalogue, gamme, espace, product detail. Caching per [System-Design §6](../System-Design.md) |
| **Client Components** | React 18 | Configurator (multi-step state), cart, wishlist, share popups. State in `localStorage`. |
| **API Proxy** | Next.js Route Handlers | Server-side proxy `/api/oaksome/*` → Odoo with session cookie forwarding (bypasses CORS for SSR) |
| **Tracking API** | Next.js Route Handlers | `/api/tracking/capi` — server-to-server to Meta CAPI + GA4 MP (Safari ITP + adblock proof) |
| **Auth Pages** | Next.js + custom forms | `/login`, `/register`, `/profile` — credentials posted to `/api/oaksome/auth/*`, Odoo issues session |

## Containers — Oaksome ERP (Odoo 17 Enterprise)

| Container | Tech | Responsibility |
|---|---|---|
| **HTTP Controllers** | `oaksome_nextjs_api` (Python) | 41 REST endpoints under `/api/oaksome/*` with shared CORS mixin + uniform response envelope (`{success,data,meta}`) |
| **Core models** | `oaksome_nextjs_core` | Shared Oaksome models (`oaksome.style`, `space`, `inspiration`, `case`, etc.), i18n helpers |
| **Sale workflow** | `oaksome_sale_workflow` | Blocks `action_confirm()` if CGV unsigned, computed `oaksome_status` (7-step), SO1 view + smart buttons |
| **FSM access** | `oaksome_fsm_access` | FS-MESURES delivery-access checklist on `project.task`, mobile-optimized view |
| **Portal tracker** | `oaksome_portal_tracker` | Customer-facing 7-step progress bar in Odoo Portal |
| **Native modules** | Odoo Enterprise | CRM, Sale, Project (FSM), Portal, Sign, Stripe acquirer, Mail (transactional) |
| **PostgreSQL** | DB | Single Odoo DB — products, orders, CRM, sessions, partners |
| **Filestore** | Local volume (Tecnibo host) | Image attachments (`product.gallery.image`, `custom.product.image`, signatures) — no S3 yet |

## Edge & Hosting

| Container | Tech | Notes |
|---|---|---|
| **Cloudflare** | CDN + WAF | TTLs per [System-Design §6](../System-Design.md) — 30min catalogue, 30d images, no-cache cart/leads. Fronts `oaksome.com` and `cdn.oaksome.com` |
| **Nginx (Web)** | Nginx | Reverse proxy + TLS in front of Next.js Docker container (Tecnibo, Belgium) |
| **Nginx (ERP)** | Nginx | Reverse proxy + TLS in front of Odoo (Tecnibo, Belgium) |
| **Vercel** | PaaS | Dev/test only — auto-deploy on push to `main` |

## Key Flows

### Browse + Configure (anonymous)
`Visitor → Cloudflare → Nginx → Next.js RSC → API proxy → Odoo controllers → Postgres` (ISR-cached on Next.js, edge-cached on Cloudflare).

### Save configuration (lead)
`Client component → /api/oaksome/leads (proxy) → Odoo controllers → crm.lead created → CSM automation J+1`.

### Cart → Checkout handoff
1. Client adds items → `localStorage` only (no server call).
2. Click "Commander" → loop `POST /api/oaksome/cart/add` syncs items to Odoo.
3. If country=BE → optional TVA 6% step → `PUT /api/oaksome/profile`.
4. `GET /api/oaksome/cart/checkout-url` returns Odoo URL with session.
5. Redirect to Odoo → CGV signature (Odoo Sign) → 50% deposit (Stripe) → redirect back to `oaksome.com/checkout/success`.

### Server-side conversion tracking
`Client event → /api/tracking/capi → Meta CAPI + GA4 MP` (reads `gclid`/`fbclid` cookies set by middleware).

## Cross-cutting

- **Auth:** Odoo session cookie is the source of truth. Next.js API proxy forwards the cookie; SSR pages can read it for server components that need user context.
- **CORS:** Custom mixin in `oaksome_nextjs_api/controllers/api.py` — allows `oaksome.com` origin + credentials.
- **i18n:** `next-intl` on web (FR default + NL prefix). Odoo uses native multi-lang; API accepts `?lang=fr|nl`.
- **Country/TVA:** `?country=BE` param on product endpoints; Odoo applies pricelist + TVA 6% flag at SO1 creation.

## Notes & Backlog

- **Odoo domain:** `cdn.oaksome.com` is the public face of Odoo. `oaksome.tecnibo.com` and the legacy `oaksome_website` addon are deprecated — ignore in current architecture.
- **Filestore:** local volume on the Tecnibo host. No S3/object storage yet. Backup policy is host-level.
- **Session store (backlog):** Odoo runs without Redis today — single worker / filesystem sessions. **Planned:** add Redis to enable multi-worker session sharing once traffic warrants it.
- **Update [System-Design](../System-Design.md)** to reflect the `cdn.oaksome.com` rename.
