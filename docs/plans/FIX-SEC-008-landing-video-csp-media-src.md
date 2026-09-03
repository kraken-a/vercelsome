---
task_id: FIX-SEC-008
title: Allow landing-page video host via CSP media-src
status: done
risk_level: low
edit_mode: existing_file
parallelizable: false
conflict_scope: ["oaksome-web/next.config.mjs"]
integration_blockers: []
human_approval_stages: []
affected_interfaces: []
model_overrides:
  executor: light
  reviewer: light
---

# FIX-SEC-008 — Allow landing-page video host via CSP media-src

## Symptom (production, browser console on `/landing`)

```
Content-Security-Policy: The page's settings blocked the loading of a
resource (media-src) at https://backend.tecnibo.com/api/proxy?media=oaksome-factory-v1-music-a.mp4
because it violates the following directive: "default-src 'self'"
```

Video element renders but no frames load: "All candidate resources failed to load. Media load paused."

## Root cause

`oaksome-web/next.config.mjs` (FIX-SEC-001) defines `CSP_DIRECTIVES` with
`default-src 'self'` and **no `media-src` directive**, so CSP falls back to
`default-src 'self'` for `<video><source>` elements. The landing hero in
`src/app/[locale]/(auth)/landing/page.tsx:129` sources the MP4 from
`https://backend.tecnibo.com/api/proxy?media=...`, which is cross-origin and
therefore blocked.

## Fix

Add a single CSP directive in `oaksome-web/next.config.mjs` `CSP_DIRECTIVES`
array (insert after `img-src`):

```
"media-src 'self' https://backend.tecnibo.com",
```

Scope is intentionally tight — only the proxy host that serves the marketing
MP4 is whitelisted. No other CSP changes.

## Out of scope

- `static.cloudflareinsights.com` beacon script block (separate Cloudflare
  Web Analytics decision — disable in CF dashboard or whitelist deliberately).
- Migrating the MP4 onto `oaksome.com` itself (would remove the need for
  cross-origin media entirely; track as a follow-up).

## Scope

- Modified file: `oaksome-web/next.config.mjs` (one new line in
  `CSP_DIRECTIVES`).
- No application code or component changes.

## Verification

1. `npm run build` succeeds.
2. Production response headers include
   `Content-Security-Policy: ...; media-src 'self' https://backend.tecnibo.com; ...`.
3. On `/landing`, browser console has no `default-src` violation for the MP4;
   the looping video plays.
