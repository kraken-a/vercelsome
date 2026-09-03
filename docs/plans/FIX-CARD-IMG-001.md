---
task_id: FIX-CARD-IMG-001
title: "Fix product card image not filling container — blank beige space below image"
status: done
resolution: "2026-05-24 — Verified: container 429×429, img 429×429, gap 0px. Img `aspect-ratio: 1/1`."
resolution_attempts:
  - "Initial: targeted `.product-card .product-img > a` — no-op, DOM has no <a> wrapping the img"
  - "Real root cause: `.product-img-carousel img { aspect-ratio: 4/3 }` inside an `aspect-ratio: 1` container leaves a 25% gap. Fix: aspect-ratio: 1 on the img in acheter.css:206 and stitch-polish.css:2023"
risk_level: low
edit_mode: surgical_edit
parallelizable: false
conflict_scope:
  - oaksome-web/src/css/style.css
integration_blockers: []
human_approval_stages: []
model_overrides:
  executor: standard
---

## Problem

The `<Link>` element (renders as `<a>`) wrapping the `<img>` inside `.product-img` is `display: inline` by default.
Although the img has `width: 100%; aspect-ratio: 1; object-fit: cover`, the `<a>` does not fill
the container, leaving the `#E5E5E0` / `#f5f4ef` background visible below the image.

## Root Cause

`.product-img` has `position: relative; aspect-ratio: 1; overflow: hidden; background: #E5E5E0`.
The `<a>` inside is inline — its flow height doesn't match the container height.
The img fills its own intrinsic size but not the full `.product-img` square.

## Fix

Add to `style.css` after `.product-card:hover .product-img img` rule:

```css
.product-card .product-img > a {
  display: block;
  width: 100%;
  height: 100%;
}
```

This makes the `<a>` fill `.product-img` so the img fills it completely.

## Files

- `oaksome-web/src/css/style.css` — add one CSS rule after line 1159
