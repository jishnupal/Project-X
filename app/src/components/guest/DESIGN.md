# Guest Invite Landing — DESIGN.md

**Product:** BiyeFlow guest door (claim / preview)  
**Design read:** Midnight grain banner → tech scan → **Buzz sneak peek** → accept → print + red CHECKED IN.  
**Style pick:** Gen-Z neon on purple grain + Framer Motion.  
**Dials:** `DESIGN_VARIANCE: 7` · `MOTION_INTENSITY: 8` · `VISUAL_DENSITY: 3`

---

## Tokens

| Token | Value | Role |
|-------|-------|------|
| `--gi-ink` | `#1a100c` | Text on cream / receipt |
| `--gi-gold` | `#feca43` | Accent |
| `--gi-cream` / vibe cream | `#fff8f5` / `#f7f2ff` | CTA + receipt / neon text |
| `--gi-stage` | `#05030a` | Purple-grain stage |
| vibe magenta | `#ff4fd8` | INVITED / accents |
| vibe cyan | `#5ce1ff` | ARE / scan beams |

---

## Scene order

| # | Scene | Hero | CTA |
|---|-------|------|-----|
| 1 | Pass | Banner **YOU / ARE / INVITED** → swipe roll → pass + centered scan lines (~5s) | Tap to scan |
| — | Film | Invitation video/photo box → tap fullscreen | Continue |
| — | Note | Customised host note | Continue |
| 2 | **buzzPeek** | Dates + **separate event boxes** + leaderboard tease | Continue to RSVP |
| 4 | RSVP | Yes / Maybe / Can't | Yes/Maybe → signup if needed |
| 5 | Receipt | VVIP slip prints (after auth) | Continue |
| 6 | Stamped | Pass with green rubber **CHECKED IN** stamp | Enter event |
| — | Signup | `/login?intent=invite` when guest has no real account | Google / create |

**Hard rules**

- Forward-only after banner (no pull-back)
- Flow after scan: **film → note → sneak peek** (film always in preview)
- Continues are minimal text links (FOMO Get App stays bold)
- Print + stamp only after accept (yes/maybe)
- Pass side punches use CSS mask (no painted black discs)
- Live Yes/Maybe requires signup/login; resume at print → stamp → Buzz
- Preview keeps FOMO “You’re in” handoff (no real auth)

---

## Scan readout (~5s)

Pass footer **barcode** stays visible. Dense **Reading** text stack under the pass (~16 lines). Then soft blast → note (media + message) → Buzz sneak peek.

---

## Buzz sneak peek

Data: `InviteBuzzPeekContent` from host `WeddingState` (preview) or claim preview API (live, thinner).  
Modules: countdown from first Plot date, event day cards + itinerary beats, games/activity teaser.

---

## Receipt + stamp

After accept: slot print (~7.5s) → stamped boarding pass (**CHECKED IN**, imperfect green rubber ink) → profile / You're in.

---

## Motion

- Vibe: YOU 0.7s → ARE 0.8s → INVITED neon 5s (no Y-slide) → event · swipe ready ~2s
- Banner: slow cloth ease; swipe up rolls away
- Scan: beams + readout ticker
- Peek: staggered module fade-in
- Reduced motion: shorter / static where possible
---
