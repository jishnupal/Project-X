# BiyeFlow mobile — what exists (functionality bible)

**Rule:** UI revamp may change how things *look*. It must not remove or invent flows.  
Source of truth: `app/src` (not moodboards). Shell: `AppLayout` → `AppHeader` + page + `MobileBottomNav`.

**Home modules (rail):** Guests · Stay · Buzz · Buddies · **Menu last**  
**Below rail:** Getting started (until complete) → then **Team / Buddies** replaces it.

---

## App chrome (every screen)

### Bottom nav — `MobileBottomNav.tsx`
| Tab | Icon | Goes to |
|-----|------|---------|
| Home | `dashboard` | `/command-center` |
| People | `groups` | `/people` (Guests or Menu) |
| Buzz | `campaign` (special / pulse) | `/buzz` |
| Buddies | `handshake` | `/buddies` (managers) |
| Profile | `person` | `/profile` |

### Header — `AppHeader.tsx`
| When | Left | Right utilities (always) |
|------|------|--------------------------|
| Home & most screens | **BiyeFlow** + **+ Event** (`add`) → `NewEventModal` | Sync · Notifications → Buzz · Profile avatar → Profile |
| People (`/people*`) | **Guests \| Menu** segment | Same three utilities |

**Sync** (`SyncStatusChip`): live green chip → `SyncPopover` (wedding code, devices, copy, reconnect).  
**Notifications**: icon only — navigates to Buzz (not a separate inbox).

---

## 1. Home / Command Center

**Files:** `CommandCenterPage.tsx`, `HomeLandingHeader.tsx`, `CommandCenterWidget.tsx`

**Landing (top → bottom)**
1. Caps **Home** · couple/event name · Live/Syncing + “N to review”
2. **Wedding dates** row (`calendar_month`) → `WeddingScheduleModal` (if can edit)
3. **2×2 glass widgets** — Guests → guests · Stay → rooms · Menu → menu · Buzz → buzz  
   Each shows icon, title, value, Live/Review/Setup chip
4. **Getting started** — progress + up to 3 tasks (tap → navigate or open dates)
5. **Team** (managers) → Buddies

**Motion today:** glass orbs, hover lift, progress bar transition.  
**Revamp goal:** Adverse-level **tall immersive animated cards** (same destinations).

---

## 2. Guests — `GuestBoard.tsx` mobile stage

**Route:** `/people/guests`

| # | What you see | Does |
|---|--------------|------|
| 1 | Metric: **Guests** headcount (`groups`) | Display |
| 2 | Metric: **Need stay** (`hotel`) | → `/people/rooms` |
| 3 | Metric: **Invites sent** `N / families` + % | Display |
| 4 | **Event strip** | Filters list by day; `+` → New Event; selected day can delete |
| 5 | **Guest list** entry (`format_list_bulleted`) | Opens **GuestListSheet** (not inline expand on stage) |
| 6 | **Groups** + **Add group** | Tiles → GroupMemberSheet; Add → CreateGroupModal |
| 7 | FAB **Add** (`person_add`) | → **AddGuestModal** |

### GuestListSheet
Search · Share (`ios_share` copy plan) · workspaces (add group) · scroll of **GuestRowCard**s.

**GuestRowCard:** tap → expand/edit sheet: name, group select, headcount, stay, invite sent, per-event steppers, delete, Done.

### Groups (full use case — must stay)
1. Tap group tile → **GroupMemberSheet** (view): rename, member list, **Edit**, delete group confirm  
2. **Edit** → **GroupOpenPanel**: tabs **In group (N)** | **Add**  
   - In group: tap member → **Remove** from group  
   - Add: search + **Add** chips → assign to group (headcount confirm if multi)  
3. **Add group** → CreateGroupModal → creates + often opens edit  
4. Delete group → ConfirmDangerDialog (guests remain on list)

### AddGuestModal
Family name · people count · per-event attendance · need stay · invite · Confirm & Add.

---

## 3. Menu — `MenuBoard.tsx` mobile

**Route:** `/people/menu`

| # | What you see | Does |
|---|--------------|------|
| 1 | **Assist** (`assistant`) | → MenuAssistModal |
| 2 | **Share** (`ios_share`) | Copy menu plan |
| 3 | **FeaturedMealCard** + Lunch \| `swap_horiz` \| Dinner | Body → MenuDetailModal; switcher sets grand meal (~720ms swap) |
| 4 | Event strip | Same pattern as Guests |
| 5 | **Commercial dials** (4 courses) | Icons: `breakfast_dining` · `restaurant` · `bakery_dining` · `dinner_dining` → CommercialDialPopup |
| 6 | **Other courses** MiniMealCards | Open detail; Lunch/Dinner **Make grand** |

**CommercialDialPopup:** plates + per-plate rate + estimate (detail lives here — stage can stay minimal: icon · name · rate).

**MenuDetailModal:** Discuss/Confirmed · dish lists · live counters · caterer notes.  
**MenuAssistModal:** suggest/add dishes to a course.

---

## 4. Buzz — `BuzzBoard.tsx`
Welcome hero → Invitation (`mail`) → Venue (`location_on`) + Maps → Edit/Save inline (no sheet required).

## 5. Buddies — `BuddiesPage.tsx`
PIN unlock → invite links (copy) → buddy list + module checkboxes → Save · Remove device confirm.

## 6. Profile — `ProfilePage.tsx`
Avatar · name · save · wedding dates → schedule modal · sign out · disconnect code.

## 7. Rooms — `RoomsPage.tsx`
Coming soon from Need stay / Home Stay widget · Back to Guests.

---

## Shared modals
| Modal | From |
|-------|------|
| NewEventModal | Header + Event / day `+` |
| WeddingScheduleModal | Home dates / Profile |
| ConfirmDangerDialog | Delete group, etc. |
| GroupHeadcountConfirm | Multi-person group assign |

---

## What “like Adverse” means for BiyeFlow
| Adverse trait | BiyeFlow translation |
|---------------|----------------------|
| Immersive photo cards | Tall event/module cards with atmosphere + bold titles |
| Frosted glass overlays | Glass header pills, sheet handles, floating nav blur |
| Floating pill nav | Keep 5 tabs; heavier glass + soft |
| Profile as glass sheet | Our sheets/modals already — restyle, same actions |
| Motion | Card float/parallax, sheet rise, grand-meal swap, dial rings |

**Not copying:** casino LIVE social feed, rainbow star mascot, follower gallery.  
**Keeping:** Warm Sand + tangerine (or soft night canvas if approved), real icons & flows above.
