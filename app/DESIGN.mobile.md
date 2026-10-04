---
version: 0.2.0
name: BiyeFlow-mobile-design-system
description: Mobile/tablet (<1024px) dark-glass Gen Z event-OS skin. Desktop DESIGN.md unchanged.
status: exploring — dark glass locked (Adverse reference); flows via inventory
---

# BiyeFlow Mobile Design (feature/ui-revamp-mobile)

Applies only below `lg` (1024px). Desktop keeps maroon/cream [`DESIGN.md`](./DESIGN.md).

## Locked visual direction (user reference)

Adverse-style **dark glass**:
- Pitch-black canvas (`#050505`)
- Frosted glass surfaces (`backdrop-filter` blur)
- Immersive tall photo/module cards with glass pills
- Floating pill bottom nav
- Bold uppercase hierarchy on hero cards
- Accent gradient: tangerine → pink → violet highlights (CTA / Buzz / avatar)

## Tokens

| Token | Value |
|-------|-------|
| Background | `#050505` |
| Glass | `rgba(255,255,255,.07–.12)` + blur |
| Ink | `#F5F5F7` |
| Muted | `#9A9AA3` |
| Accent | `#FF6A1A` |
| Accent 2 | `#FF3D81` / `#FFB020` |
| Font | Manrope |
| Radius | 22–28px cards, 999px pills/nav |
| Nav | Home · People · Buzz · Buddies · Profile |

## Principles

1. **Look = your screenshot.** Dark · glass · immersive · floating.
2. **Functionality bible:** [`DESIGN.mobile.inventory.md`](./DESIGN.mobile.inventory.md) — same modules, sheets, group add/remove.
3. Commercial dials stage: icon + course + rate; plates in popup.
4. Desktop unchanged.

## Preview

`http://127.0.0.1:5173/moodboards/index.html`

## Rollback

- Git: `main` / tag `pre-ui-revamp-mobile`
- Cloudflare: `npm run deploy:rollback`
