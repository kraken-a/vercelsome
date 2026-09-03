---
contract_version: v2
---

# Ubiquitous Language — Oaksome

## Domain Entities

- `Notification`: An in-app alert for an authenticated user, linked to an order event, delivery, message, promo, or system update. Maps to `oaksome.notification` in Odoo.
- `UnreadCount`: The number of notifications not yet marked as read by the authenticated user.
- `NotificationBell`: The header UI component that shows unread count and opens the notification panel.
- `NotificationsProvider`: Client-side React context that polls Odoo every 60s for user notifications and exposes markRead.
- `AuthProvider`: Client-side React context that holds the authenticated user state and exposes isAuthenticated.
- `PromoBar`: The top-of-page marquee banner driven by top_notice from the Odoo home API.
- `TopNotice`: A short announcement object (message, badge) served by the home API for the PromoBar.
- `Inspiration`: A curated image card sourced from Oaksome projects or external references, displayed in the inspiration gallery.
- `Gamme`: A product family (e.g. dressing, bibliotheque) mapping to product.public.category in Odoo.
- `Espace`: A room type (chambre, salon, bureau, entree, buanderie) used to filter products.
- `Collection`: A design style line — Line, Satori, Vista, or Lys — maps to oaksome.style.
- `Configuration`: A customer's personalized product setup (facade, couleur, dimensions) stored as product.config.
- `Lead`: A sales enquiry from the configurator, wishlist, or contact form. Maps to crm.lead.
- `SO1`: First sales order (acompte 50%) created after customer confirms configuration.
- `SO2`: Definitive sales order after field measurements, maps final price.
- `CaseStudy`: A published project showcase (oaksome.case) with images and linked inspirations.

## Process & Audit Terms

- `Configurer`: The product personalization tunnel route (`/configurer`) — sequential steps Type → Collection → Façade → Couleur → Dimensions → Prix. Generates a `Configuration` and optionally a `Lead`.
- `Prototype`: The HTML/CSS reference site under `oaksome-website-prototype/` used as the visual and structural source of truth for parity audits.
- `Parity`: The audit objective of confirming that the Next.js implementation matches the `Prototype` across routes, copy, design tokens, and interactions.
- `Waitlist`: The pre-launch capture surface that lets anonymous visitors leave an email while non-public routes are gated. Controlled by the `LandingGate` and the `oaksome_auth=1` cookie bypass.
- `LandingGate`: The middleware policy that redirects any non-whitelisted route to `/{locale}/landing` until the visitor presents `oaksome_auth=1` (intended Belgian soft-launch posture, per FIX-AUTH-002).
- `KimiWebBridge`: The browser-automation MCP used to inspect the live `:3001` server during audits — drives navigation, captures screenshots, reads DOM, with the visitor's actual session cookies.

## Routing & SEO Terms

- `Routing`: The Next.js App Router pathname map declared in `src/i18n/routing.ts`. Defines locale-specific pathnames (e.g. `/espace/[slug]` ↔ `/ruimte/[slug]`) and is the canonical source for both the localized `<Link>` helper and middleware locale negotiation.
- `Locale`: A supported language URL prefix; for Oaksome v1 the set is `{fr, nl}` with `fr` as the default. The `Locale` is always the first path segment under `localePrefix: 'always'`.
- `I18n`: The internationalization layer (next-intl). Holds message namespaces in `messages/{fr,nl}.json` and serves `useTranslations` / `getTranslations` to UI consumers. Locked by the `npm run i18n:check` parity guard.
- `Drift`: A divergence between the prototype, the spec doc, the filesystem, and `routing.ts`. Drifts A–F were catalogued by QA-001 and reconciled in TASK-024.
- `Canonical`: The single SEO-blessed URL form for a given page when more than one variant is addressable. Always returns HTTP 200; non-canonical variants return HTTP 301 to the canonical, never 404.
- `Hreflang`: The `<link rel="alternate" hreflang="...">` pair emitted on every locale-aware page. Points FR pages at their NL counterpart and vice versa using each side's canonical URL.

## Tracking & Compliance Terms

- `GTM`: Google Tag Manager — the umbrella container loaded in the root layout that brokers Pixel, GA4, and Ads tags. Reads consent state from `window.__oaksomeConsent` (set by the Axeptio bridge).
- `CMP`: Consent Management Platform. The user-facing surface that captures GDPR consent decisions. Oaksome uses Axeptio as its CMP provider.
- `Axeptio`: The CMP integration. Loaded via the Axeptio CDN as `axeptio-loader` + `axeptio-bridge` scripts (see `src/features/tracking/axeptio.ts`); the loader is gated by a non-empty `NEXT_PUBLIC_AXEPTIO_CLIENT_ID` validated against `^[a-zA-Z0-9-]+$`.
- `CAPI`: Meta Conversions API. The server-side conversion forwarder at `POST /api/tracking/capi` that hashes PII with SHA-256 before sending to Meta. Designed as a non-blocking complement to the client-side Pixel for iOS/ITP resilience.
- `CSP`: Content-Security-Policy HTTP header. Enforced in production (FIX-SEC-001) via `next.config.mjs`; Report-Only in dev. Must be the enforced variant on prod for the security gate to pass.

## Operations & Verification Terms

- `EnvVars`: Environment variables. Split between build-time (`NEXT_PUBLIC_*` baked into the JS bundle at `docker compose build`) and runtime server-only secrets loaded via `env_file:` in `docker-compose.prod.yml`.
- `Smoke`: The TASK-024 §"Final test checklist" run against a fresh `next build` image on a staging Docker target; one row = one verifiable assertion captured in `reviews/TASK-029-smoke-report.md`.
- `Regression`: Verification that a previously-shipped behaviour has not been broken by recent work; the smoke report doubles as the regression evidence for go-live.
