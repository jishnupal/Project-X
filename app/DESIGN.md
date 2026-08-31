---
version: 1.0.0
name: BiyeFlow-design-system
description: Premium Wedding OS — warm ivory canvas, deep maroon primary (#570013), gold tertiary accents (#cca730), Playfair Display headlines, Manrope UI. Hospitality-first like Airbnb warmth, editorial like luxury print. Mobile PWA with role-gated modules (Command Center, People, Buddies, Buzz).

colors:
  primary: "#570013"
  primary-container: "#800020"
  on-primary: "#ffffff"
  on-primary-container: "#ff828a"
  tertiary: "#735c00"
  tertiary-container: "#cca730"
  on-tertiary-container: "#4f3d00"
  surface: "#fff8f5"
  surface-container-low: "#fbf2ed"
  surface-container: "#f5ece7"
  surface-container-high: "#efe6e2"
  background: "#fff8f5"
  on-surface: "#1e1b18"
  on-surface-variant: "#584141"
  secondary: "#635e53"
  secondary-container: "#e9e2d3"
  on-secondary-container: "#696458"
  outline: "#8c7071"
  outline-variant: "#e0bfbf"
  error: "#ba1a1a"
  error-container: "#ffdad6"
  hero-maroon-gradient: "linear-gradient(135deg, #570013 0%, #800020 100%)"
  hero-meal-gradient: "linear-gradient(135deg, #9a1630 0%, #800020 42%, #5c0016 100%)"
  gold-pill-border: "rgba(243,213,138,0.45)"
  card-border: "rgba(128,0,32,0.12)"
  card-border-strong: "rgba(128,0,32,0.18)"
  guest-banner: "#fff8f0"
  sync-popover-gold: "#a67c00"

typography:
  headline-xl:
    fontFamily: "'Playfair Display', serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
  headline-md:
    fontFamily: "'Playfair Display', serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.33
  headline-sm:
    fontFamily: "'Playfair Display', serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
  button:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.25
  label-caps:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: 9px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.14em
    textTransform: uppercase
  body-md:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.45
  wedding-code:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: 20px
    fontWeight: 600
    letterSpacing: 0.18em

rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  pill: 9999px

spacing:
  unit: 8px
  gutter-mobile: 12px
  gutter-desktop: 16px
  margin-mobile: 20px
  margin-desktop: 64px
  container-max: 1440px
  safe-bottom: "max(0.65rem, env(safe-area-inset-bottom))"
  safe-top: "env(safe-area-inset-top)"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    height: 44px
    minHeight: 44px
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    border: "1px solid {colors.card-border-strong}"
    rounded: "{rounded.pill}"
    height: 44px
  button-tertiary-gold:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    rounded: "{rounded.pill}"
  button-day-pill:
    background: "{colors.hero-maroon-gradient}"
    border: "1px solid {colors.gold-pill-border}"
    rounded: "{rounded.md}"
  card-bento:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.card-border}"
    rounded: "{rounded.lg}"
  input-default:
    backgroundColor: "#ffffff"
    border: "1px solid rgba(128,0,32,0.14)"
    rounded: "{rounded.md}"
    height: 44px
  pin-input:
    backgroundColor: "#ffffff"
    border: "1px solid rgba(128,0,32,0.14)"
    rounded: "{rounded.md}"
    height: 48px
    textAlign: center
    letterSpacing: 0.5em
  sidebar-item-active:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.sm}"
  mobile-bottom-nav:
    backgroundColor: "{colors.surface}"
    borderTop: "1px solid {colors.outline-variant}"
    height: "~72px with safe-area"
---

# BiyeFlow DESIGN.md

> Source of truth for UI in this app. Inspired by [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (Airbnb warmth + editorial luxury).  
> Implementation lives in `src/styles/globals.css` and Tailwind `@theme` tokens.

## 1. Visual Theme & Atmosphere

**Mood:** Warm, celebratory, premium — a wedding planner that feels like a boutique concierge app, not enterprise SaaS.

**Density:** Comfortable on mobile (PWA-first). Generous padding on auth and profile flows. Data-heavy boards (Menu, Guests) use bento cards with scrollable content areas.

**Philosophy:**
- Maroon is authority; gold is celebration — never swap their roles.
- Headlines are editorial (Playfair); everything interactive is Manrope.
- Rounded pills for actions; rounded-xl/2xl for cards.
- Ivory `#fff8f5` canvas — avoid pure white page backgrounds except inside inputs.

## 2. Color Palette & Roles

| Token | Hex | Role |
|-------|-----|------|
| primary | `#570013` | Brand maroon — primary CTAs, active nav, headlines accent |
| primary-container | `#800020` | Deeper maroon — hero fills, primary-container buttons |
| tertiary-container | `#cca730` | Gold — secondary CTAs, dial accents, premium highlights |
| surface | `#fff8f5` | Page canvas |
| on-surface | `#1e1b18` | Body text |
| secondary / on-surface-variant | `#635e53` / `#584141` | Muted labels, captions |
| outline-variant | `#e0bfbf` | Dividers, hairlines |
| error | `#ba1a1a` | Destructive actions, balance warnings |

## 3. Typography Rules

| Role | Font | Size | Weight | Usage |
|------|------|------|--------|-------|
| Headline | Playfair Display | 24–32px | 600–700 | Page titles, wedding name, section heroes |
| Button | Manrope | 13–15px | 600 | All buttons, nav labels |
| Label caps | Manrope | 9–12px | 600 | Section eyebrows, tracking 0.14–0.16em uppercase |
| Body | Manrope | 11–13px | 400 | Descriptions, helper text |
| Wedding code | Manrope | 20px | 600 | 0.18em letter-spacing, tabular |

**Never** use Playfair for buttons or form labels.

## 4. Component Stylings

### Buttons
- **Primary:** `{colors.primary}` fill, white text, full pill, min 44px height.
- **Secondary:** transparent, maroon text, `border rgba(128,0,32,0.18)`, pill.
- **Tertiary gold:** `{colors.tertiary-container}` — join actions, copy code.
- **Day pill (New Event):** maroon gradient + gold border — sidebar/footer CTA only.
- **Disabled:** 40% opacity, no hover tricks.

### Cards
- **Bento card:** white or surface fill, `border rgba(128,0,32,0.12)`, `rounded-2xl`.
- **Hero meal / guest group card:** maroon gradient fill, gold typography accents.
- **Auth sections:** white card on ivory page, soft maroon borders.

### Inputs
- White fill, maroon-tinted border, `rounded-xl`.
- PIN: centered, wide letter-spacing, numeric keyboard.
- Wedding code input: uppercase, wide tracking.

### Navigation
- **Desktop sidebar:** People module only — Guests + Menu nested. Maroon logo tile "B".
- **Desktop header:** Command Center, Buddies, Buzz pills.
- **Mobile bottom nav:** icons + 9px caps labels, active = primary color.

## 5. Layout Principles

- **Mobile:** Single column, bottom nav, scrollable main (`overflow-y-auto`).
- **Desktop:** Sidebar 224–240px + header module tabs + scrollable main.
- **Max width:** `1440px` container centered.
- **Spacing scale:** 8px base — 12, 16, 24, 32 for sections.
- **Safe areas:** Respect `env(safe-area-inset-*)` on PWA.

## 6. Depth & Elevation

- **Flat by default** — elevation via border + subtle shadow on modals only.
- **Modals:** `shadow-2xl`, `rounded-t-[28px]` on mobile sheets.
- **Toast:** fixed pill, primary fill, above bottom nav (`bottom-24` mobile).
- **Hero cards:** gradient fill instead of drop shadow.

## 7. Do's and Don'ts

**Do:**
- Use gold sparingly for celebration moments (CTAs, dials, badges).
- Keep guest-facing BUZZ view warm and readable — large type, generous line-height.
- Show role-appropriate nav only (Guest → Buzz; Admin → full modules).
- Use Material Symbols Outlined for icons.

**Don't:**
- Don't use cold grays or blue link colors — stay in warm maroon/gold/ivory family.
- Don't expose Super Admin / ops URLs in normal UI.
- Don't use heavy font weights on Manrope body text.
- Don't block scroll on mobile content areas (`overflow-hidden` only on desktop split layouts).

## 8. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| `< 1024px` | Bottom nav, collapsible header title, full-width cards, vertical scroll on main |
| `≥ 1024px` | Sidebar visible, header module tabs, Menu/Guest bento grids side-by-side |

**Touch targets:** Minimum 44×44px for all tappable controls.

## 9. Agent Prompt Guide

When building or redesigning BiyeFlow UI:

```
Follow app/DESIGN.md. Premium wedding aesthetic: ivory canvas #fff8f5,
maroon #570013 primary, gold #cca730 accents, Playfair headlines, Manrope UI,
pill buttons, rounded-2xl cards. Mobile PWA — ensure scroll works. Match
existing Tailwind tokens in globals.css (@theme). For inspiration see
design-md/references/ (Airbnb warmth, Notion structure).
```

**Quick reference:** Primary `#570013` · Gold `#cca730` · Canvas `#fff8f5` · Headline Playfair · UI Manrope
