# BiyeFlow · People module — Stitch design brief

Paste into **Google Stitch** as one prompt. Reference mood: airy fitness/home plan UI (soft pastels, lots of white space, small date capsules, masonry cards). Adapt to BiyeFlow wedding ops — warm ivory / terracotta / gold (NOT lavender/purple).

---

## Stitch prompt (copy below)

```
Design a high-fidelity mobile UI (iPhone 15 Pro, 393×852) for BiyeFlow — People module (/people/guests).

PRODUCT
BiyeFlow is a premium Bengali wedding operations app. People is the guest + menu hub: headcount, stay, invites, event-day filter, guest list, groups, and entry to Menu / Rooms. Calm, organised, family-first — not a fitness app, not a generic CRM.

VISUAL DIRECTION (match the attached reference layout language)
- Lots of breathing room. Large gaps between sections (20–28px). Side padding 20px.
- Soft off-white / warm ivory canvas (#FAF7F2), not flat grey.
- Soft rounded cards (22–28px radius). No heavy clay extrusion, no oversized capsules.
- Elements feel SMALLER and lighter than a “dashboard stuffed with big tiles.”
- Soft pastel accent cards: warm peach/terracotta, soft sand, soft gold, muted sage — NEVER lavender or purple.
- Clean Manrope-style sans. Bold titles, quiet secondary grey (#7A6F62).
- Floating dark charcoal bottom nav (optional) OR keep BiyeFlow’s existing light glass pill nav — prefer light glass to match current app chrome: Home · People (active) · Buzz · Buddies · Profile.

ANTI-PATTERNS (do NOT do)
- Giant metric tiles that dominate the first viewport
- Tall fat event-day pills filling half the screen
- Boxes that clip or cage the date rail
- Dense stacking with <12px gaps
- Purple / lavender / hot pink accents
- Spreadsheet tables on the stage

SCREEN STRUCTURE (top → bottom) — one composition, airy

1) HEADER (compact, ~44px content row under status bar)
- Left: “BiyeFlow” wordmark OR “People” + small subtitle “Guests · Menu”
- Right: small circular utilities (sync · bell · avatar) in one light glass pill — keep tiny

2) SUMMARY STRIP — replace today’s big 2×2 metric block
Inspired by the reference “Daily challenge” card, but ONE soft horizontal hero card only:
- Soft terracotta/peach rounded card (~120–140px tall), generous inner padding
- Left: label “This wedding” / “Guests”
- Big number: headcount (e.g. 394) + quiet “people”
- Tiny chips under: “28 / 60 invites” · “255 stay”
- Right: optional soft 3D clay illustration OR abstract warm rings (wedding-adjacent, not fitness donut)
- Tap targets implied: Invites → tracker; Stay → rooms (show as subtle chevrons or chips, not second giant cards)

3) EVENT DAY RAIL — free-flowing, reference-style date pills
- Section label: “Pick an event day” (small caps, muted)
- Horizontal scroll of SLIM vertical capsules — much smaller than current BiyeFlow clay towers
  - Width ~52–56px, height ~72–80px (NOT 130px+)
  - Idle: white fill, 1px soft border, dark grey text (weekday + day number + tiny event name)
  - Selected: solid deep espresso/black (#1A100C) or deep maroon (#570013), white text, small white dot near top
- Plenty of gap between pills (~12–14px)
- Trailing dashed “+” add-event capsule, same slim size
- NO outer frosted box around the rail — pills float on the page like the reference
- Leave vertical padding so selected state never clips

4) PRIMARY ACTIONS — masonry / asymmetric grid (like “Your plan”)
Section label: “Guests & menu” (bold, roomy)

Two-column airy grid with uneven heights:

A) Guest list card (tall, left or full-bleed soft peach)
   - Eyebrow: “This event · Sangeet”
   - Title: “Guest list”
   - Meta: “60 families”
   - Avatar stack + “+57”
   - Small chips: “28 sent” · “255 stay”
   - Soft illustration or empty — keep light

B) Menu portal card (shorter, warm sand/terracotta)
   - Title: “Menu”
   - Meta: “Courses · caterers”
   - Small arrow

C) Optional third small card: “Rooms” (soft sage) if space — or fold stay into hero chips only

5) GROUPS — quiet secondary section
- Label: “Groups” + small “Add” text button (not a loud gradient FAB competing with everything)
- 2×2 grid of SMALL soft solid clay tiles (Family / Friends / Work / Neighbors)
  - Tile height ~88–100px (not hero-sized)
  - Soft gradients in warm clay tones only
  - Name + “N families” + tiny avatar stack
- More margin between tiles (~12px)

6) FAB
- One floating “Add guest” pill, bottom-right above nav — compact, orange→coral gradient, not oversized

SPACING RULES
- First viewport: header + hero summary + start of date rail only — not metrics + rail + guest portal + menu all jammed
- Section gaps: 24px
- Card inner padding: 16–18px
- Reduce visual weight: thinner borders, softer shadows, smaller type (titles ~20–22px, not 28px+)

FUNCTIONALITY TO PRESERVE (visual only — do not invent new flows)
- Metrics: headcount, need stay → rooms, invites → invite tracker
- Event day filter + add/delete event
- Open guest list sheet
- Open menu
- Groups → member sheet; Add group
- FAB → Add guest

OUTPUT
1 screen: People / Guests stage (mobile). Also show a second frame: same screen scrolled to Groups. Clean component labels. Ready to hand to engineering.
```

---

## Layout map (reference → BiyeFlow)

| Reference | People module |
|-----------|----------------|
| Hello + date header | BiyeFlow / People header utilities |
| Daily challenge hero | One soft Guests summary card (headcount + invite/stay chips) |
| Slim date pills (white / black selected) | Event day rail — free-flow, no cage |
| “Your plan” masonry | Guest list + Menu (+ optional Rooms) cards |
| Small group-like tiles | Groups 2×2, smaller |
| Floating dark nav | Keep BiyeFlow light glass bottom nav |

## Spacing targets vs current

| Element | Current feel | Stitch target |
|---------|--------------|---------------|
| Metric tiles | Large 2×2 + wide invites | One slim hero card |
| Event pills | ~86×134, heavy clay | ~54×76, white/black |
| Guest list portal | Tall clay hero | Medium airy card |
| Groups | Big clay tiles | Compact soft tiles |
| Section gaps | Tight / boxed | 24px open air |

## Brand constraints (locked)

- Warm ivory canvas; terracotta / gold / sand / sage accents
- No lavender, violet, or hot pink
- Flows unchanged (inventory bible) — look only
