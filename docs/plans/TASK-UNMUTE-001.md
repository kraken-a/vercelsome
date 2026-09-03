# TASK-UNMUTE-001 — Add unmute/mute toggle button to landing video

## Goal
Landing page video autoPlays muted (browser policy). Add a visible speaker icon button so users can unmute/remute.

## Scope
- `oaksome-web/src/app/[locale]/(auth)/landing/_client.tsx`
- `oaksome-web/src/app/[locale]/(auth)/landing/landing.css`

## Acceptance criteria
- Video starts muted, autoplays
- Unmute button visible in corner of hero video
- Clicking unmute → sound on, icon changes to muted-off
- Clicking again → mutes, icon reverts
- Works in FR and NL locales

## Risk: LOW
## affected_interfaces: []
