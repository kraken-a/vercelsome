# Production Readiness Audit — Oaksome Web
Date: 2025-05-15 | Tested: localhost:3000

---

## Lighthouse Scores (Desktop & Mobile)
| Category | Score |
|---|---|
| SEO | 100 ✅ |
| Best Practices | 96 ✅ |
| Accessibility | 93 ⚠️ |
| CLS | 0.047 ✅ |

---

## 🔴 BLOCKERS — Must fix before go-live

### 1. `header-client.tsx:63` — Search bypasses Next.js proxy
**File**: `src/components/layout/header-client.tsx` line 63  
**Bug**: `fetch(\`${ODOO_URL}/api/oaksome/v1/search?q=...\`)` calls Odoo directly from the browser.  
In production, `ODOO_URL = https://cdn.oaksome.com` — this is cross-origin from `oaksome.com` and will fail silently (CORS block or blocked request).  
**Fix**: Replace with `fetch(\`/api/oaksome/v1/search?q=...\`)` — route through Next.js proxy (already set up in `[...path]/route.ts`).

---

### 2. `/api/oaksome/v1/home` returns Odoo 500
**Endpoint**: `GET http://localhost:8069/api/oaksome/v1/home` → `500 Internal Server Error`  
**Impact**:
- Bestsellers section on homepage is empty (silently fails, `bestsellers = []`)
- Promo bar shows nothing (unless stale ISR cache)
- `PromoBar` is currently showing "testing"/"TEST" from a stale ISR cache (revalidate: 3600)

**Fix**: Investigate and fix the Odoo `oaksome.homepage` module raising the 500. Run Odoo logs to identify the error.

---

## 🟠 HIGH — Fix before launch

### 3. NL locale shows French text on homepage
**File**: `src/app/[locale]/(marketing)/page.tsx` line 44  
**Bug**: `<h1>Faites de la place pour ce qui compte.</h1>` is hardcoded French.  
NL visitors at `/nl` see French content. No `useTranslations`/`getTranslations` used in the home page for this text.  
**Fix**: Wrap all user-visible strings in `t()` and add NL translations. The `nl.json` only has 2 home keys — it needs full coverage.

---

### 4. Promo bar content is test data
**Content**: badge="TEST", message="testing" visible on every page.  
**Source**: `top_notice` from Odoo `/api/oaksome/v1/home` (currently cached via ISR).  
**Fix**: Clear or disable the `top_notice` record in Odoo before production, or set it to actual launch announcement.

---

### 5. Product slugs are `"undefined"` in API
**Endpoint**: `/api/oaksome/v1/products` — `slug: undefined` for all products.  
**Impact**: Any URL built with the slug (breadcrumbs, canonical links, sitemap) will produce `/produit/undefined`.  
**Fix**: Ensure `slug` field is populated in Odoo product records, or map a fallback to the product's ID.

---

### 6. Product dimensions are all zeros
**Endpoint**: `/api/oaksome/v1/products/1256570` → `dimensions: { width: 0, height: 0, depth: 0, ... }`  
**Impact**: Product detail page shows `L0 × H0 × P0 cm`.  
**Fix**: Populate dimension fields in Odoo product records. May be a mapping issue in the Odoo module.

---

## 🟡 MEDIUM — Fix soon after launch

### 7. Accessibility failures (4 categories, Lighthouse score 93)
| Audit ID | Issue |
|---|---|
| `color-contrast` | Low-contrast text (score 0) |
| `heading-order` | H tags skip levels (score 0) |
| `label-content-name-mismatch` | Visible labels ≠ accessible names (score 0) |
| `landmark-one-main` | No `<main>` element on page (score 0) |

**Fix**: Run `npx axe-cli http://localhost:3000/fr` to get element-level details. Add `<main>` wrapper, fix heading hierarchy, fix label names, and adjust color contrast to 4.5:1.

---

### 8. Space named "space 1" — test/placeholder data
Odoo `oaksome.space` record with `name="space 1"` shows on the Espaces page.  
**Fix**: Rename or delete the placeholder record in Odoo.

---

### 9. Some product categories have no images (IDs 6–33)
Categories 6–33 return `image_128: null` from `/api/odoo/categories`. These categories show broken image placeholders on every page that has the category navigation widget.  
**Fix**: Upload images for all `product.public.category` records in Odoo.

---

## 🔵 DEV-ONLY — Will auto-resolve in production

### 10. Nav images use `127.0.0.1:8069` URLs
The Odoo API embeds its own base URL in image URLs. In dev: `http://127.0.0.1:8069/web/image/...` → blocked by Chrome (ERR_BLOCKED_BY_ORB, cross-origin from port 3000).  
In production with `NEXT_PUBLIC_ODOO_URL=https://cdn.oaksome.com`, Odoo will return `https://cdn.oaksome.com/web/image/...` which will load correctly via `<img>` tags (no CORS required for images).  
**Action**: No code change needed — just confirm `NEXT_PUBLIC_ODOO_URL` is set correctly in production `.env`.

---

## Production `.env` Checklist

Before deploying, verify these are set in production:
```
NEXT_PUBLIC_ODOO_URL=https://cdn.oaksome.com   # NOT localhost:8069
NEXT_PUBLIC_SITE_URL=https://oaksome.com
ODOO_URL=https://cdn.oaksome.com               # server-side
ODOO_DB=<production db>
ODOO_USER=<production user>
ODOO_WEBSITE_ID=<production website id>
NEXT_PUBLIC_GTM_ID=                                # Fill in
NEXT_PUBLIC_META_PIXEL_ID=                         # Fill in
NEXT_PUBLIC_GA4_MEASUREMENT_ID=                    # Fill in
META_CAPI_ACCESS_TOKEN=                            # Fill in
```

---

## Pages Tested
| Page | Status | Notes |
|---|---|---|
| `/fr` (home) | ⚠️ | Bestsellers empty (Odoo 500), promo bar stale cache |
| `/fr/collections` | ⚠️ | Hero image broken (no image in Odoo) |
| `/fr/acheter` | ✅ | Products load, filters work |
| `/fr/inspirations` | ✅ | Images load, layout correct |
| `/fr/espaces` | ⚠️ | Some spaces have no images ("space 1") |
| `/fr/configurer` | ✅ | Configurator loads |
| `/fr/commandes` | ✅ | Auth wall renders correctly |
| `/fr/produit/1256570` | ⚠️ | Broken image, zero dimensions |
| `/nl` | 🔴 | French text on Dutch locale |
| 404 | ✅ | Custom page renders correctly |
