# BiyeFlow Handoff

Last updated: 2026-06-26

This document is a checkpoint for continuing BiyeFlow development on another machine or with another coding agent.

## Product Summary

BiyeFlow is a unified supervision control room for Indian weddings and events. The first template is a Bengali wedding, but the architecture should not be hardcoded to weddings only.

The long-term product should be an event supervision platform:

```text
Core Engine + Event Template + Plug-in Modules + Theme Wrapper
```

Wedding is the first high-pain use case. Later the same engine should support other events such as engagement, birthday, puja, housewarming, corporate events, conferences, and anniversaries.

The product should not feel like an admin portal. It should feel like a premium, calm, easy control room for a groom, bride, parent, sibling, elder, or family member who is supervising the event while also managing work and daily life.

Core promise:

```text
Turn scattered wedding planning into one connected supervision experience.
```

BiyeFlow should replace:

```text
Diary + Excel + WhatsApp notes + phone-call memory + Pinterest folders + scattered vendor files + mental load
```

The first version should be low-cost and local-first, with only a tiny cloud layer where unavoidable.

Product truth:

```text
BiyeFlow is not a checklist app, not a vendor marketplace, and not an invitation builder.
It is a family-first supervision control room.
```

## Target Users

Primary:

- Groom or bride planning their own wedding
- Father or mother supervising son/daughter's wedding
- Sibling or close family member helping with execution
- Non-tech elders who want one clear picture
- Middle-class families trying to avoid vendor confusion, overquoting, and missed commitments
- Bride side and groom side working together on shared decisions

Secondary, later:

- Event managers
- Wedding planners
- Small wedding operations teams
- Friends and close groups joining the wedding buzz layer

## Main Pain Points

Captured from real user context:

- Working professionals have very little time to call, compare, and supervise vendors.
- Vendors often ask the family to come to the venue before giving an actual quotation.
- Trust is difficult. Families do not know how well vendors will execute.
- Budget is unclear. Gold, gifts, shopping, rituals, travel, stay, and small payments go untracked.
- WhatsApp and phone calls are still needed, but context gets lost.
- Families want a better picture after work: what is done, what is pending, what is risky.
- Earlier people used diaries. Some use Excel. BiyeFlow should be easier and clearer than both.
- The app should not create extra work. It must reduce confusion.
- People may live in one city and the venue/vendors may be in another city, so repeated physical visits are not practical.
- Vendor leads may come from friends, family, venue, Google, or directories, but the family still needs to compare and supervise the deal.
- Families often do not know what to ask before paying advance.
- Vendors may quote in different styles, making comparison difficult.
- Guest count changes until the last moment. Under-counting creates shortage or extra charges; over-counting creates unavoidable waste.
- Stay and room allocation is painful for outstation guests.
- Decor/layout ideas are hard to communicate verbally to decorators and event managers.
- Shopping, gifts, invitation gifts, return gifts, and ritual items create hidden work.
- WhatsApp remains the main communication channel, so BiyeFlow should prepare clean context that can be sent manually.

## Product Positioning

Avoid positioning as:

```text
Another wedding checklist app
Another invitation maker
Another vendor marketplace
```

Position as:

```text
A unified supervision control room for Indian weddings and events.
```

Feature rule:

```text
Every feature must help the family supervise better.
Every module must feed the Control Room.
Every module should produce a clear status, risk, next action, or handover.
```

USP direction:

- Unified control room for guests, vendors, rooms, menu, decor, shopping, gifts, invites, budget, reminders, and handovers
- Decision/readiness engine that shows whether the family has checked the right things before booking vendors
- Vendor-ready handover packs for caterer, decorator, room/stay, photography, and event-day run sheet
- Guest count linked to menu/caterer count, accommodation, rooms, and control room alerts
- Guided layout brief for decorators and event managers, not a blank aesthetic design tool
- Room planner with guest clusters and drag/drop allocation
- Shopping and gift modules as Indian wedding-specific workstreams
- Invitation/RSVP as a logistics gateway, not only an invitation template builder
- Friend buzz as an optional emotional layer, separate from supervision
- WhatsApp and calls remain human-first, but BiyeFlow prepares and stores the context
- Local-first, low-cost, simple enough for non-tech family members


## Strategic Business Update - 2026-06-26

This update captures the latest product/business conclusions from the BiyeFlow strategy discussion.

### Core Strategic Shift

BiyeFlow should not compete directly as a vendor or venue discovery marketplace. WedMeGood, WeddingWire India, WeddingBazaar, and similar platforms already occupy that space with vendor listings, inspiration, photos, reviews, and lead generation.

BiyeFlow should instead own the family-side operating layer:

```text
Wedding Digital Twin + Fair Cost Intelligence + Family Control Room + Vendor-Ready Handover
```

The product should help families see, understand, compare, and supervise the wedding before they commit money or lose control in scattered WhatsApp/call/Excel workflows.

### Updated Product Promise

```text
Before you book, see the wedding.
Before you pay, know the fair range.
Before the event, hand over everything clearly.
```

Recommended public positioning:

```text
BiyeFlow - Fair Wedding Control Room
Plan clearly. Compare fairly. Avoid overpaying.
```

For Bengal launch, `BiyeFlow` has emotional familiarity. For PAN India scale, always pair the brand with a clear descriptor such as `Fair Wedding Control Room`, `Wedding Digital Twin`, or `Wedding Operating System`.

### Services To Offer

The current service map should be:

1. Wedding Control Room
   - One dashboard for family tasks, risks, decisions, budget, vendors, registry, guests, and handovers.

2. Guest, RSVP, Stay, and Transport Hub
   - Guest count, event-wise attendance, family grouping, room allocation, pickup/drop, and stay pressure.

3. Menu and Caterer Board
   - Day-wise menu, food timing, snacks/live counters, plate count, rate estimate, and caterer handover.

4. Vendor Deal Room, Not Vendor Discovery
   - Families add vendors they already found from friends, family, venue, Google, Instagram, or other apps.
   - BiyeFlow helps compare quotes, ask the right questions, track advances, remember commitments, and generate handovers.

5. Budget and Fair Cost Intelligence
   - City-wise expected ranges, quote comparison, hidden cost warnings, and budget leak detection.
   - This is a trust-building wedge because families search for cost clarity before they trust a platform.

6. Theme, Decor, Layout, and 3D Event View
   - Pinterest/reference intake, moodboard, floor plan, stage/entry/dining layout, decorator brief, and eventually full 3D event visualization.
   - 3D visualization can become a strong B2B demo tool for event managers and decorators because it helps families approve the concept before booking.

7. Marriage Registry and Legal Hub
   - State-wise official portal guidance, document checklist, witness checklist, timeline, appointment reminders, certificate guidance, and fake-agent red flags.
   - The app should guide users to official government flows first, then optionally connect verified legal/document partners later.

8. Shopping, Gifts, and Ritual Items
   - Gold, clothes, gifts, invitation gifts, return gifts, puja items, trousseau, and family shopping tracker.

9. WhatsApp-Ready Communication
   - Clean copy outputs for vendors, caterers, decorators, family updates, RSVP follow-ups, and handover summaries.
   - Manual WhatsApp should remain free in v1; automation can be a paid add-on later.

10. Post-Wedding Hub
   - Marriage certificate follow-up, name/document update checklist, vendor reviews, real cost archive, anniversary reminders, and reuse for sibling/friend weddings.

### Why Users Will Come For Free

Families are unlikely to pay upfront for generic wedding planning software. The free product must therefore solve high-anxiety searches immediately:

- Wedding cost calculator
- Wedding budget calculator India
- Wedding cost in Durgapur
- Caterer per plate rate
- Wedding decorator cost
- Bridal makeup package price
- Photographer package comparison
- Marriage registration documents
- Marriage certificate online guide
- Guest list template
- Room allocation template
- Bengali wedding checklist
- Reception stage decoration ideas
- Vendor quotation comparison
- Decor brief generator

The acquisition hook should be free tools, not a paid app wall:

```text
Find the fair cost of your wedding before vendors quote you.
```

### Trust And Noble-Cause Positioning

The product should not sound anti-vendor. It should support fair families and honest vendors.

Recommended mission:

```text
Fair wedding planning for Indian families and honest vendors.
```

Trust rules:

- No hidden paid ranking.
- No vendor/venue discovery as the core surface.
- Families can add any outside vendor manually.
- Sponsored/partner services must be clearly marked.
- Cost ranges must be educational, not manipulative.
- Vendor comparison must work even if no vendor pays BiyeFlow.
- The app must preserve family trust before monetization pressure.

### Revenue Model Conclusion

Revenue should not depend only on vendors. If vendor revenue dominates too early, the product risks becoming vendor-controlled and losing family trust.

Use a mixed model:

1. Family Free Layer
   - Free control room, guest/stay planner, budget tracker, legal guide, basic vendor comparison, decor brief, and WhatsApp handovers.

2. Family Premium Pack
   - One-time or event-pass upgrades for advanced 3D visualization, premium exports, WhatsApp automation, advanced budget reports, family command center, or concierge review.

3. Event Manager / Decorator 3D Proposal Revenue
   - Event managers and decorators pay to create polished 3D proposals, venue-specific digital twins, revision views, and client approval packs.
   - This is stronger than generic vendor listing because it helps close deals.

4. Venue Digital Twin SaaS
   - Banquet halls pay for reusable digital venue models, layout variants, capacity maps, decor packages, and event handover previews.

5. Planner Pro
   - Professional planners pay for multi-client workspaces, client portals, approval flows, team assignments, and printable handover packs.

6. Partner Revenue
   - Hotels, transport, legal/document assistance, printing, gifts, insurance, honeymoon, payment gateway, and finance partners.

7. City Cost Intelligence
   - Anonymous, privacy-safe market reports for vendors, venues, planners, and brands after enough local data exists.

### Why Vendors Or Event Managers Would Use BiyeFlow

Vendors will not join unless BiyeFlow increases profit or reduces effort. The vendor-side value is:

- Quote-ready families instead of vague enquiries.
- Structured requirement briefs with date, guest count, venue, references, budget range, and scope.
- Faster proposal creation.
- Better conversion through 3D visualization and clear approval packs.
- Lower revision confusion.
- Cleaner final handover before event day.
- Reputation for transparent, fair execution.

Vendor pitch:

```text
We do not sell random leads. We help serious families approve and execute faster.
```

### 3D Event Visualization Wedge

This is now one of the strongest differentiators.

Current market behavior:

- Families save Pinterest/Instagram references.
- Venues often have poor or incomplete photos.
- Decorators quote verbally or with reused photos.
- Families struggle to imagine whether the stage, entry, lighting, dining, and counters will look cohesive.
- Event managers need better demos to confirm deals.

BiyeFlow opportunity:

```text
Turn family references + venue details + guest count + budget range into a visual wedding concept and handover.
```

3D modules can evolve in layers:

1. Guided 2D layout planner.
2. Decorator brief canvas with reference boards.
3. Semi-3D visual mockups for stage, entry, dining, counters, and lighting mood.
4. Venue-specific reusable 3D digital twins.
5. Event manager proposal mode with client approval and quote bands.

Benchmark tools/resources to study:

- Prismm / Allseated style 3D event visualization.
- Cvent Social Tables style event diagramming.
- magicplan style scan-to-floor-plan workflow.
- RoomSketcher / Planner 5D style consumer-friendly space visualization.
- Pinterest wedding trend behavior for decor inspiration demand.

### Desktop Vs Mobile Conclusion

BiyeFlow should be desktop-powerful but mobile-dependent.

Desktop should handle:

- Control room review
- Excel import/export
- Budget planning
- Vendor comparison
- Decor layout and 3D views
- Handover generation

Mobile should handle:

- Quick updates
- RSVP
- Reminders
- Vendor/family WhatsApp sharing
- Approval taps
- Photo/reference capture
- Guest-side interactions

The product cannot be desktop-only because Indian users are increasingly mobile-first, but the heavy planning experience should not be weakened for mobile constraints.

### Local Market Study Plan

Start with Durgapur before scaling to West Bengal and then PAN India.

Research sample:

- 30 recently married families.
- 30 currently planning families.
- 20 banquet halls/venues.
- 20 decorators/event managers.
- 20 caterers.
- 10 photographers/videographers.
- 10 makeup artists.
- 10 legal/document agents or registry-aware professionals.

Questions for families:

- Where did you feel vendors were unclear?
- Did you know fair price ranges before meeting vendors?
- Which category created the most surprise cost?
- Did final decor match the reference?
- Who maintained guest count, food count, stay, and room allocation?
- What was managed in Excel, WhatsApp, diary, or memory?
- Would a 3D preview have helped you approve decor faster?
- Would you pay for a 3D wedding preview if it prevented one wrong decision?
- What would you trust more: vendor listing, cost checker, legal guide, or real family cost examples?

Questions for event managers/decorators:

- How do you currently convince families?
- How often do families reject because they cannot visualize?
- Do you lose deals due to poor portfolio/photos?
- Would a venue-wise reusable 3D model help close deals faster?
- Would you pay per 3D proposal or monthly for proposal tools?
- What is the cost of one failed revision or unclear brief?
- Which decor items create the most quotation confusion?

Data to collect:

- Real quote formats.
- Package names and inclusions.
- Per plate catering rates.
- Decor category ranges.
- Venue capacity and restrictions.
- Hidden charges.
- Advance/payment patterns.
- Photo/portfolio quality gaps.
- Families' most common Google searches.

### Updated Expansion Strategy

1. Durgapur pilot
   - Build trust through free cost tools, registry guide, guest/stay planner, and decor handover.

2. West Bengal scale
   - Add Bengali wedding templates, MARREG/legal guide, city-wise fair ranges, and venue/decor digital twin pilots.

3. PAN India expansion
   - Add regional wedding templates, state-wise registry/legal guidance, city cost intelligence, and partner ecosystem.

### Strategic Product Truth

```text
If BiyeFlow starts vendor-first, it becomes another marketplace.
If BiyeFlow starts family-first and vendors/event managers come later for serious execution infrastructure, it becomes wedding infrastructure.
```


## Cost Planning And Agile Roadmap - 2026-06-26

This section captures the product cost model and agile roadmap direction. BiyeFlow should be built with cost discipline from day one because the family-facing product is expected to be mostly free.

### Cost Thinking Framework

Track cost at three separate levels:

1. Family wedding cost
   - What families actually spend across venue, catering, decor, photography, makeup, clothes, gold, gifts, stay, transport, legal, printing, and hidden charges.
   - This powers Fair Cost Intelligence and trust.

2. Product operating cost
   - Hosting, database, storage, AI, image/3D processing, WhatsApp/SMS/email, analytics, support, domain, and monitoring.
   - This decides whether free users can scale safely.

3. Business build and go-to-market cost
   - Research, product design, development, content, local market surveys, sales, partner onboarding, legal/compliance, and field operations.
   - This decides how much runway is needed before revenue.

Every feature should have a cost/revenue note:

```text
User pain -> Feature -> Build cost -> Run cost -> Trust value -> Revenue path -> Risk
```

### Major Cost Buckets

Planning assumptions only; verify exact prices before launch.

1. Research and local data collection
   - Durgapur pilot interviews, travel, incentives, quote collection, data entry, and local event-manager/venue visits.
   - Keep this lean but real; this data becomes the moat for fair-cost intelligence.

2. Product development
   - Founder-led build keeps cash cost low, but opportunity cost is high.
   - Avoid overbuilding. First build only the modules that prove retention, trust, and decision support.

3. Infrastructure
   - Local-first PWA keeps early server cost low.
   - Cloudflare Workers has a free plan; the paid Workers plan has a minimum charge of $5/month if higher limits are needed.
   - Cloudflare D1 has a free prototyping tier; D1 free limits can block queries when exceeded, so production needs monitoring.
   - Cloudflare R2 has a free tier for storage/operations and then usage-based pricing; useful for images, handovers, and exported assets.
   - Image-heavy and 3D-heavy features can become the main infrastructure cost if not controlled.

4. AI and visualization
   - Text-based planning, quote extraction, and checklist assistance are cheaper than image/3D generation.
   - 3D should start with reusable templates, local assets, and Three.js-style rendering before expensive generative workflows.
   - Venue digital twins should be created only for venues/event managers that can generate revenue or strong pilot proof.

5. Communication
   - Manual WhatsApp copy is free and should remain the v1 behavior.
   - WhatsApp Business API, SMS, and automated reminders should be paid add-ons or partner-funded because message costs scale directly with usage.

6. Legal and compliance
   - Privacy policy, terms, consent language, data deletion/export, and partner disclaimers are mandatory before public beta.
   - Registry Hub must guide users to official government flows and clearly separate guidance from paid legal/document partner assistance.

7. Marketing and trust-building
   - SEO/content around cost calculators, registry guides, guest templates, and decor planning is more important than paid ads early.
   - Local Durgapur trust can be built through useful tools, survey reports, family case studies, and transparent cost education.

8. Support and operations
   - Free users still create support load. Design the app with self-explanatory flows, exports, onboarding checklists, and in-product guidance.
   - Human concierge should be paid or limited to beta learning.

### Cost Control Principles

- Local-first until cloud sync is truly needed.
- Manual WhatsApp before paid automation.
- 2D layout before full 3D.
- Template-based 3D before venue-specific digital twins.
- Family free layer before paid marketplace-like monetization.
- No vendor/venue discovery as a core build cost.
- Measure storage and AI cost per wedding, not only monthly cloud bill.
- Build every paid feature only after it has a clear buyer: family, planner, event manager, venue, or partner.

### Agile Delivery Model

Use practical agile, not ceremony-heavy agile.

Cadence:

- 2-week sprints.
- 1-week spikes only for uncertain technical or market questions.
- Demo every sprint, even if only to internal users.
- Retrospective every sprint: what shipped, what confused users, what cost too much, what should be cut.
- Maintain one prioritized backlog with epics, user stories, acceptance criteria, and cost/revenue notes.

Each sprint should ship one visible improvement and one measurable learning.

Definition of Done:

- Works on desktop and acceptable mobile view.
- Feeds the Control Room with a status, risk, metric, or next action.
- Produces a useful export, handover, or WhatsApp copy where relevant.
- Has local persistence and import/export safety where relevant.
- Has empty state, error state, and mobile behavior checked.
- Has clear cost implication if it uses cloud, AI, storage, messaging, or 3D assets.

### Roadmap Epics

Epic A: Market Study and Fair Cost Data

- Durgapur family interviews.
- Vendor/event manager/venue quote workflow study.
- Caterer rate and hidden-cost collection.
- Wedding cost taxonomy.
- First fair-cost range model.

Epic B: Family Control Room

- Wedding setup.
- Event template.
- Dashboard metrics.
- Risk and pending action queue.
- Local backup/export.

Epic C: Guest, Stay, Transport, and RSVP

- Guest import.
- Event-wise attendance.
- Stay requirement.
- Room allocation.
- Transport fields.
- RSVP later through tiny cloud layer.

Epic D: Budget and Fair Cost Checker

- Budget categories.
- Actual vs expected.
- Quote comparison.
- Hidden cost detector.
- City-wise fair range notes.

Epic E: Vendor Deal Room Without Discovery

- Family-added vendors.
- Quote, advance, balance.
- Readiness checklist.
- Question prompts.
- Vendor handover.

Epic F: Menu and Caterer Board

- Day-wise menu.
- Count sent tracking.
- Plate/counter estimate.
- Caterer handover.
- Guest-count-change alerts.

Epic G: Registry / Legal Hub

- West Bengal registry guide first.
- Official portal links.
- Document/witness checklist.
- Appointment and certificate tracker.
- Partner path later.

Epic H: Decor Brief, Layout, and 3D Event View

- Moodboard/reference intake.
- Guided layout planner.
- Stage, entry, aisle, dining, counter, and lighting zones.
- Decorator handover.
- Semi-3D view.
- Venue digital twin pilot later.

Epic I: Planner / Event Manager / Venue Pro

- Proposal workspace.
- 3D client demo.
- Approval flow.
- Multi-client workspaces.
- Venue-specific reusable layouts.

Epic J: Integrations and Automation

- Excel import/export.
- PDF/print handovers.
- WhatsApp copy links.
- WhatsApp automation later.
- Payment, legal, hotel, transport, gift, print, and honeymoon partners later.

### Suggested Release Roadmap

Phase 0: Validation and Data Spine, 2 to 3 weeks

- Run initial Durgapur interviews.
- Define wedding cost taxonomy.
- Define event, guest, vendor, budget, registry, and decor data models.
- Build landing-style free tools or prototype screens for cost checker and guest/stay planner.
- Success gate: families understand the promise and would use at least one free tool.

Phase 1: Family MVP, 4 to 6 weeks

- Wedding setup.
- Control Room.
- Guest import and event-wise counts.
- Budget tracker.
- Basic Registry Hub.
- Basic Vendor Deal Room without discovery.
- WhatsApp-ready outputs.
- Success gate: one real wedding can run guest, budget, registry, and vendor memory inside BiyeFlow.

Phase 2: Operational Wedding MVP, 6 to 8 weeks

- Stay/room planner.
- Menu and caterer board.
- Caterer handover.
- Decorator brief canvas v1.
- Better dashboard risks.
- Import/export backup.
- Success gate: families revisit weekly because the app has become the source of truth.

Phase 3: Fair Cost and Decor Differentiator, 8 to 12 weeks

- Durgapur fair-cost ranges.
- Quote comparison with warnings.
- 2D layout planner.
- Stage/entry/dining/counter visual concepts.
- Semi-3D event view prototype.
- Success gate: event managers/decorators say the visual proposal helps close or clarify deals.

Phase 4: Private Beta, 8 to 10 weddings

- Run with real families.
- Track usage, confusion, repeat visits, exported handovers, vendor quote comparisons, and budget changes.
- Do not scale before learning where the app genuinely reduces stress or saves money.

Phase 5: B2B Monetization Pilot

- Event manager/decorator proposal mode.
- Venue digital twin pilot.
- Planner Pro workspace.
- Paid advanced 3D or premium handover pack.
- Success gate: at least one B2B buyer pays because BiyeFlow helps them close or execute better.

### Agile Backlog Prioritization Score

Score each item 1 to 5:

```text
Trust impact
Frequency of use
Money saved or clarified
Uniqueness vs existing apps
Build effort, inverted score
Run cost, inverted score
Revenue path clarity
```

Build highest total score first. If two items tie, choose the one that teaches more about real user behavior.

### Key Metrics

Family metrics:

- Event created.
- Guest list imported.
- Budget categories filled.
- Registry checklist started.
- Vendor quote added.
- Handover generated.
- Day-7 and day-30 revisit.
- Number of WhatsApp-ready copies used.

Trust metrics:

- Cost checker completions.
- Quote comparison completions.
- Hidden-cost warnings viewed.
- Users saying they avoided confusion or overpaying.

3D/decor metrics:

- Moodboard created.
- Layout created.
- Decorator handover exported.
- 3D preview viewed.
- Event manager/decorator proposal conversion.

Business metrics:

- Cost per active wedding.
- Cloud/AI/storage cost per wedding.
- Support minutes per wedding.
- Free-to-premium conversion.
- B2B pilot revenue.
- Partner referral revenue.

### Build Discipline

Do not build a feature because it sounds good. Build it only if it supports one of these:

```text
Trust
Cost clarity
Repeat usage
Execution control
Vendor/event-manager handover
Revenue path
```


## Current Workspace State

Current folder:

```text
D:\Codex\Project X
```

Important files:

```text
index.html
README.md
BIYEFLOW_HANDOFF.md
build_guest_template.mjs
inspect_guest_template.mjs
outputs/biyeflow_guest_template/BiyeFlow_Guest_Count_Stay_Template.xlsx
```

Current prototype:

- Single static HTML prototype in `index.html`
- It already contains a visual prototype of BiyeFlow
- Tabs include Control Room, Checklist, Guests & Stay, Menu, Research, Theme & Decor
- It is not the final technical foundation
- Future build should move to Vite React PWA
- Guest import supports `.xlsx` and CSV-like text parsing
- Guests have invitation sent tracking
- Menu is day-wise under parent Menu with Sangeet, Marriage, Reception sub-tabs
- Menu has four food timings per day: Breakfast, Lunch, Evening Snacks, Dinner
- Menu has basic caterer count, rate per plate, live estimate, and copy handover output
- Control Room includes catering estimate as a connected signal
- Theme & Decor supports local photo references, but needs to evolve into Decorator Brief Canvas

Existing generated screenshots:

```text
biyeflow-home.png
biyeflow-guests.png
biyeflow-menu.png
biyeflow-menu-tabs.png
biyeflow-menu-cost.png
```

## Current Excel Template Checkpoint

Generated workbook:

```text
outputs/biyeflow_guest_template/BiyeFlow_Guest_Count_Stay_Template.xlsx
```

Current columns:

```text
Guest Name
Total Head Count
Reception Count
Sangeet Count
Biyebari Count
Borjatri Count
Stay Needed
Stay Head Count
```

Current formula logic:

- Reception Count auto-fills from Total Head Count
- Sangeet, Biyebari, and Borjatri can each have separate counts
- Stay Head Count auto-fills from Total Head Count when Stay Needed is Yes
- Summary area calculates families and head count per event

Important formula references:

```excel
Reception Head Count = SUM(C5:C1004)
Sangeet Head Count   = SUM(D5:D1004)
Biyebari Head Count  = SUM(E5:E1004)
Borjatri Head Count  = SUM(F5:F1004)
Stay Head Count      = SUM(H5:H1004)
```

Recent issue discovered:

- User manually counted a copied Excel column and got 472.
- Workbook summary showed 547 in the accessible file.
- If the first row `Us (Ourself) = 10` is excluded, total becomes 537.
- Workbook had 205 filled guest rows, while the pasted image had 171 numbers.
- Difference came from extra rows being included by the formula range, not from broken formulas.

Recommended next improvement:

Add a visible `Include in Reception` column or `Guest Type` column so rows like self/internal/family exceptions can be controlled explicitly.

Potential improved columns:

```text
Guest Name
Total Head Count
Include in Reception
Reception Count
Sangeet Count
Biyebari Count
Borjatri Count
Stay Needed
Stay Head Count
Notes
```

Reception Count formula could become:

```excel
=IF($A5="","",IF($C5="Yes",$B5,0))
```

## Recommended Tech Stack

For the real v1 local-first app:

```text
Vite
React
TypeScript
Tailwind CSS
shadcn/ui style components
Dexie.js / IndexedDB
Recharts
SheetJS / xlsx
vite-plugin-pwa
Cloudflare Pages
Cloudflare Workers
Cloudflare D1
Cloudflare R2 later if needed
```

Do not start with Next.js for local-first v1. Vite React is simpler and better suited for an installable PWA with local data.

Frontend notes:

- React is preferred because the product will be modular and component-heavy.
- V0/Vercel can be used for UI exploration, but production components should be cleaned and placed into the app's own design system.
- Use React + Vite + TypeScript for local-first v1.
- Use `dnd-kit` for room planner and layout brief drag/drop.
- Use a proper domain/service layer. Do not put scoring, room pressure, menu cost, or handover logic directly inside React components.

Progressive backend strategy:

```text
V1 local: no backend required for core supervision
Hybrid: Cloudflare Workers/D1 for RSVP links and public response collection
Hosted SaaS later: cloud database, auth, roles, sync, and file storage
```

Architectural goal:

```text
LocalStorage/IndexedDB adapter now.
Cloud storage/sync adapter later.
UI should not care where data comes from.
```

## Architecture Decision

BiyeFlow should be built as a modular event supervision engine.

High-level structure:

```text
Core Engine
  - Control Room
  - Event data model
  - People/guest model
  - Vendor model
  - Budget model
  - Risk/readiness engine
  - Reminder/action engine
  - Handover generator

Event Template
  - Bengali Wedding
  - Indian Wedding
  - Corporate Event
  - Puja
  - Birthday
  - Housewarming

Plug-in Modules
  - Guests
  - Invitation/RSVP
  - Stay & Room Planner
  - Vendor Deal Room
  - Menu/Caterer Board
  - Theme/Decor Layout Brief
  - Shopping
  - Gift Corner
  - Transport/Commute
  - Friend Buzz

Theme Wrapper
  - event-specific labels
  - visual theme
  - module defaults
  - handover templates
```

Each module must have a small contract:

```text
Inputs it needs
Data it owns
Risks it can raise
Metrics it contributes to Control Room
Handover output it can generate
```

This keeps modules assemble-able and deassemble-able, like a toy with core functionality and optional accessories.

BiyeFlow should still be deployed in two technical layers for v1.

### 1. Local App

Main wedding diary/control room. Data stays on the user's device.

Stores:

```text
wedding profile
events
guests
invitations
RSVP imported responses
vendors
budget
payments
menu
accommodation
commute
decor references
notes
follow-ups
local files/photos metadata
```

Storage:

```text
IndexedDB via Dexie.js
Export/import .biyeflow backup file
Excel import/export
```

No login required for local mode.

### 2. Tiny Cloud RSVP Layer

Only used for public invite links and guest responses.

Stores minimal public data:

```text
wedding_id
guest_token
guest display name
events attending
people count
accommodation needed
guest note
submitted_at
```

Suggested cloud:

```text
Cloudflare Pages for invitation page
Cloudflare Workers for RSVP submit/fetch APIs
Cloudflare D1 for RSVP response storage
Cloudflare R2 later for invite/media assets
```

This avoids heavy backend cost while still enabling public RSVP links.

## Why RSVP Cannot Be Fully Local

Guests open invitation links from their own phones. Their response needs somewhere public to go.

Therefore:

```text
Local-only app cannot receive guest RSVP responses directly.
Tiny cloud mailbox is required.
```

Flow:

```text
Local app creates guest list
-> Local app generates unique RSVP links
-> User shares links manually on WhatsApp
-> Guest opens hosted invitation page
-> Guest submits RSVP
-> Response is saved in Cloudflare D1
-> Local app fetches responses
-> Local guest list updates
```

## Free Invitation Sending Plan

Avoid paid WhatsApp API in v1.

Use manual sharing:

```text
navigator.share()
Copy Message
Copy Link
Open WhatsApp Web using wa.me link
Mark Sent
```

The user still presses send manually.

This keeps sending free and natural.

Future paid upgrade:

```text
WhatsApp Business API
Bulk sends
Delivery tracking
Automated reminders
```

## Interactive Invitation Vision

The invite should feel like BookMyShow, not a static PDF.

Guest experience:

```text
Open invite link
-> Beautiful Bengali wedding intro
-> Event pass cards
-> Sangeet / Biyebari / Borjatri / Marriage / Reception
-> Venue and map
-> Dress note or family message
-> Select attending events
-> Confirm number of people
-> Need accommodation?
-> Submit RSVP
-> Confirmation screen
```

Template variants later:

```text
Bengali Classic
Minimal Ivory
Royal Maroon
Floral Pastel
Modern Black-Gold
BookMyShow Pass Style
```

Build only one premium template first.

## Core Modules For Local v1

### Supervision / Decision Engine

This is the core differentiator. It should not be fake AI and should not overpromise. It should convert small pieces of family-entered data into clear supervision signals.

Engine purpose:

```text
Show what is known.
Show what is missing.
Show what can affect cost, execution, or guest experience.
Show the next smart question/action.
```

For vendors, the score should be a readiness score, not a quality score:

```text
Deal Readiness: 76/100
Meaning: We have checked 76% of the important things before booking.
```

Initial score pillars:

```text
Date & Capacity Fit
Price Clarity
Inclusion Clarity
Agreement Safety
Execution Readiness
```

Use simple states:

```text
Done = full points
Partial / Unknown = half or low points
Missing = zero
```

Show the explanation next to the score:

```text
Strong:
- Rate known
- Minimum count known

Missing:
- Extra plate rate
- GST clarity
- Final count deadline
```

The user psychology goal is confidence and control, not a complex analytics dashboard.

### Control Room

The first screen should answer:

```text
What is done?
What is pending?
What needs attention?
What can go wrong?
```

Control Room is the product spine. No feature should exist only inside its own tab. Every module should feed a metric, risk, change, or next action back to the Control Room.

Suggested cards:

- Days remaining
- Invitation progress
- RSVP progress
- Guest count by event
- Accommodation estimate
- Room allocation gaps
- Vendor follow-ups
- Vendor deal readiness gaps
- Budget paid vs pending
- Catering estimate
- Upcoming decisions
- Risk alerts
- Handover packs needing update
- Shopping/gift pressure

### Invitation Tracker

Do not show 800 rows by default.

Use queues:

```text
Need to Send
Sent
Awaiting RSVP
Follow-up Needed
Coming
Not Coming
Need Accommodation
Manual Confirmation
```

Each guest/family should have:

```text
Guest name
Phone
Guest count
Invite status
RSVP status
Events attending
Accommodation needed
Notes
Last action
```

Invitation should not compete as a generic design builder. It should be a control gateway:

```text
Guest list -> Invite sent -> Response/manual update -> Stay/menu/room/control room sync
```

Interactive invitation can exist later, but its differentiator is response tracking and logistics sync, not template design.

### Guests and Accommodation

Should support:

- Excel import
- Event-wise count
- Stay needed
- Stay head count
- Hotel/house allocation later
- Check-in/check-out later
- Search instead of showing huge table

For 800 to 4000 entries:

- Show summaries first
- Show search and filtered lists
- Avoid rendering all rows at once

### Vendors and Budget

Vendors are humans, not APIs.

Keep vendor communication human-first:

```text
Call
WhatsApp
Meeting
Quote
Follow-up
Payment
Notes
```

BiyeFlow should store context:

```text
last call note
pending question
quote attachment
advance paid
balance pending
next follow-up
risk level
confidence score
```

Vendor module should not start as a lead-finding marketplace. It can show a simple caterer/vendor options list with name, city, contact, and link, but the main value starts after the family contacts a vendor.

The main product feature is Deal Readiness:

```text
You are 72% ready to book this vendor.
These 3 things can still affect cost or execution.
Ask these before paying advance.
```

For caterers, key practical fields should be low-input:

```text
rate per plate
minimum guaranteed count
extra plate rate
available dates
can handle expected count
GST/tax clarity
advance amount
final count deadline
written quote received
included items: service, crockery, water, counter setup, transport, leftover packing
```

Avoid weak subjective parameters as score drivers:

```text
tasting done
response speed
source
venue experience
generic quotation clarity
```

Decision/readiness score should mean:

```text
Have we checked the right things before making this decision?
```

It should not claim:

```text
This vendor is objectively best.
```

Budget categories:

```text
Venue
Catering
Decorator
Photography
Makeup
Gold
Shopping
Gifts
Accommodation
Transport
Priest/Rituals
Invitation
Tips/Miscellaneous
Emergency buffer
```

Budget views:

- Donut chart by category
- Paid vs pending
- Upcoming payments
- Over-budget alerts
- Hidden expenses tracker

### Menu / Caterer Board

Menu should not be a food suggestion engine first and should not feel like a notepad. Food choice is highly subjective and depends on taste, family preference, budget, region, and vendor capability.

The practical value is caterer supervision:

```text
Final menu + live count control + rate memory + count sent tracking + caterer handover
```

Current direction:

```text
Parent tab: Menu
Sub-tabs: Sangeet, Marriage, Reception
Each day: Breakfast, Lunch, Evening Snacks, Dinner
```

Minimal useful fields per food timing:

```text
menu list
caterer/vendor
caterer count
rate per plate
minimum guarantee
extra plate rate
final count deadline
count sent status
notes for caterer
status: Draft / Discuss / Locked / Count Sent
```

Smart outputs:

```text
Expected count
Committed/caterer count
Rate memory
Catering estimate
Difference after guest count changes
Warnings if count changed after count sent
```

Print/copy output:

```text
Caterer Handover
- day and date
- food timing
- menu list
- expected count
- caterer count
- rate/terms memory
- final count deadline
- notes
- leftover or extra guest instruction
```

Do not overbuild detailed quotation breakdown inside Menu. Caterers may provide polished quotations, and families may negotiate manually. The app should help with clarity, memory, and handover rather than replacing negotiation.

### Theme, Decor, and Layout Brief

The old "mood description" fields are not enough and are not very useful. Replace this direction with a Guided Layout Planner / Decorator Brief Canvas.

Important product judgment:

```text
Do not start with a totally blank design canvas.
Most families are not trained in floor planning or aesthetics.
Start with guided templates and draggable zones.
```

Purpose:

```text
Help the family express intent before agreement with decorator/event manager.
The goal is vendor clarity, not replacing the decorator.
```

Templates:

```text
Banquet hall
Open lawn
Rooftop
Community hall
Home ceremony
Reception stage layout
Sangeet layout
Mandap layout
```

Draggable objects:

```text
Stage
Mandap
Entry
Food counter
Seating
Photo booth
DJ
Gift table
Bride/groom entry path
Elder seating
Washroom marker
Parking/gate
Vendor area
```

Still support local reference photos:

```text
Mandap
Stage
Entrance
Flowers
Lighting
Outfit
Table setup
Other
```

Print/copy output:

```text
Decorator Handover
- layout image
- zones
- guest flow notes
- must-have notes
- avoid notes
- reference photos
- open questions for decorator
```

This is a strong differentiator because it turns family imagination into a vendor-ready brief.

### Commute

Important Indian wedding gap.

Future module:

- Stay location
- Venue location
- Pickup/drop needed
- Vehicle type
- Driver/contact
- Route timing
- Family group allocation

### Stay and Room Planner

This is a strong Indian wedding USP and should be treated as a core module.

Problem:

```text
Outstation guests need stay.
Families need to decide who goes to which room.
Elders, close family, friend groups, and bride/groom side clusters need sensible grouping.
```

UX direction:

- Summary first, not a giant table
- Unassigned guests queue
- Room cards with capacity
- Drag/drop guests into rooms
- Cluster groups such as family, elders, friends, bride side, groom side
- Check-in/check-out by event day
- Room pressure and overflow alerts

Print/copy output:

```text
Room Allocation Handover
- room number/name
- guest/family assigned
- head count
- check-in/check-out
- contact person
- special notes
```

### Shopping Tracker

Indian weddings have large shopping workloads. This should not be an e-commerce flow; it should be a supervision flow.

Categories:

```text
Groom clothes
Bride clothes
Family clothes
Jewellery/gold
Gifts
Tattwa/trays
Return gifts
Ritual items
Alterations
Pickup/delivery dates
```

Keep it low input:

```text
item
for whom
status
budget/actual optional
due date
notes/photo optional
```

### Gift Corner

Gift Corner is an optional experience layer, not procurement management.

Purpose:

```text
Help families think about personal gifting ideas.
The app owner may later curate vendors and get products delivered manually.
```

Gift types:

```text
Invitation gift replacing old card culture
Return gift
Sangeet gift
Welcome room hamper
Bride/groom custom gift
Close family gift
Friend squad gift
Cocktail party favor
```

Do not build inventory/procurement in v1. Use curated cards with:

```text
idea
best for
budget range
personalization option
interest marker
```

Optional cocktail/intimate-event preference capture:

```text
veg/non-veg count
mocktail/alcohol/no preference count
special notes
```

### Friend Buzz and Collaboration

This is emotional, optional, and should not pollute the core supervision workspace.

Use cases:

- Friends join before the wedding
- Bride side and groom side can interact
- Photos, polls, messages, memories
- Bride and groom collaborate on theme, decor, invitation, preferences

Roles should stay simple:

```text
Owner
Family editor
View-only family
Friend buzz participant
Vendor later
```

### Vendor Handover Packs

This is one of the strongest USP directions.

Every major module should produce a vendor-ready handover:

```text
Menu -> Caterer Handover
Theme/Layout -> Decorator Handover
Room Planner -> Stay/Room Handover
Photography -> Shot/Timeline Handover
Event Day -> Run Sheet Handover
Shopping/Gifts -> Purchase/Gifting Summary
```

Each handover needs:

```text
Preview
Print
Copy for WhatsApp
Export PDF later
```

This fits Indian wedding behavior because WhatsApp/calls remain normal. BiyeFlow should prepare clean context that families send manually.

## Data Model Draft

Local IndexedDB stores:

```ts
EventTemplate {
  id: string
  name: string
  category: "wedding" | "corporate" | "puja" | "birthday" | "other"
  defaultModules: string[]
  labels: Record<string, string>
  themeToken: string
  handoverTemplates: string[]
}

ModuleInstance {
  id: string
  weddingId: string
  moduleKey: string
  enabled: boolean
  order: number
  config?: Record<string, unknown>
}

Wedding {
  id: string
  name: string
  coupleNames: string
  templateId?: string
  startDate: string
  location?: string
  theme?: string
  createdAt: string
  updatedAt: string
}

Event {
  id: string
  weddingId: string
  name: string
  date: string
  time?: string
  venue?: string
  mapUrl?: string
  notes?: string
}

Guest {
  id: string
  weddingId: string
  name: string
  phone?: string
  totalHeadCount: number
  receptionCount: number
  sangeetCount?: number
  biyebariCount?: number
  borjatriCount?: number
  stayNeeded?: boolean
  stayHeadCount?: number
  inviteStatus: "not_ready" | "ready" | "sent" | "follow_up" | "responded"
  rsvpStatus: "pending" | "coming" | "not_coming" | "maybe" | "manual"
  notes?: string
}

Vendor {
  id: string
  weddingId: string
  category: string
  name: string
  contactName?: string
  phone?: string
  whatsapp?: string
  quoteAmount?: number
  advancePaid?: number
  balancePending?: number
  bookingStatus: "researching" | "shortlisted" | "quoted" | "booked" | "cancelled"
  confidence?: "low" | "medium" | "high"
  nextFollowUp?: string
  lastNote?: string
}

VendorReadiness {
  id: string
  vendorId: string
  dateAvailable?: "yes" | "no" | "partial" | "unknown"
  countCapacity?: number
  ratePerPlate?: number
  minimumGuarantee?: number
  extraPlateRate?: number
  gstClarity?: "included" | "extra" | "unknown"
  advanceAmount?: number
  finalCountDeadline?: string
  writtenQuoteReceived?: boolean
  inclusions?: {
    serviceStaff?: boolean
    crockery?: boolean
    water?: boolean
    counterSetup?: boolean
    transport?: boolean
    leftoverPacking?: boolean
  }
  score?: number
  missingItems?: string[]
  riskNotes?: string[]
}

MenuSlot {
  id: string
  weddingId: string
  eventId: string
  timing: "Breakfast" | "Lunch" | "Evening Snacks" | "Dinner"
  vendorId?: string
  items: string
  expectedCount?: number
  catererCount?: number
  ratePerPlate?: number
  minimumGuarantee?: number
  extraPlateRate?: number
  finalCountDeadline?: string
  countSentAt?: string
  status: "draft" | "discuss" | "locked" | "count_sent"
  notes?: string
}

Room {
  id: string
  weddingId: string
  name: string
  capacity: number
  location?: string
  notes?: string
}

RoomAssignment {
  id: string
  roomId: string
  guestId: string
  headCount: number
  checkIn?: string
  checkOut?: string
  cluster?: string
}

LayoutBrief {
  id: string
  weddingId: string
  eventId?: string
  layoutType: string
  objectsJson: string
  notes?: string
  mustHave?: string
  avoid?: string
  referencePhotoIds?: string[]
}

GiftIdea {
  id: string
  weddingId: string
  category: string
  title: string
  budgetRange?: string
  bestFor?: string
  personalization?: string
  interested?: boolean
  notes?: string
}

HandoverPack {
  id: string
  weddingId: string
  type: "caterer" | "decorator" | "room" | "photography" | "run_sheet" | "shopping_gift"
  sourceModule: string
  title: string
  payloadJson: string
  updatedAt: string
}

Payment {
  id: string
  weddingId: string
  vendorId?: string
  category: string
  amount: number
  paidOn?: string
  dueOn?: string
  status: "planned" | "paid" | "pending"
  notes?: string
}

RsvpResponse {
  id: string
  weddingId: string
  guestId: string
  guestToken: string
  coming: boolean
  peopleCount: number
  events: string[]
  accommodationNeeded: boolean
  note?: string
  submittedAt: string
}
```

## Future Cloud Data Model

Minimal D1 tables:

```sql
weddings_public (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  display_name TEXT,
  invite_template TEXT,
  event_payload_json TEXT,
  created_at TEXT
)

guest_invites (
  token TEXT PRIMARY KEY,
  wedding_id TEXT,
  guest_local_id TEXT,
  guest_display_name TEXT,
  status TEXT,
  created_at TEXT
)

rsvp_responses (
  id TEXT PRIMARY KEY,
  wedding_id TEXT,
  guest_token TEXT,
  coming INTEGER,
  people_count INTEGER,
  events_json TEXT,
  accommodation_needed INTEGER,
  note TEXT,
  submitted_at TEXT
)
```

## Build Roadmap

### Phase 0: Current Prototype

- Static HTML prototype exists
- Useful for UX reference only
- Continue feature thinking there only if needed

### Phase 1: Real Local App Foundation

Create a new app:

```text
Vite React TypeScript PWA
Tailwind
Dexie
Recharts
SheetJS
```

Build:

- Wedding setup
- Event template setup
- Module registry
- Local database
- Export/import `.biyeflow` backup
- Basic Control Room
- Risk/readiness service foundation
- Handover generator foundation
- Guest import from Excel
- Event-wise guest counts

### Phase 2: Guests, Invitation Tracker, and Stay Base

Build:

- Unique guest tokens locally
- Invite message generation
- Share/copy/open WhatsApp
- Manual mark sent
- Invitation queues
- RSVP status manual update
- Stay needed summary
- Event-wise guest count feeding Control Room and Menu

### Phase 3: Room Planner

Build:

- Room model
- Unassigned guests queue
- Drag/drop room assignment
- Cluster tags
- Room pressure alerts
- Room Allocation Handover

### Phase 4: Vendor Deal Room, Budget, and Fair Cost

Build:

- Manual vendor records added by the family, not marketplace discovery
- Caterer/decorator vendor cards
- Deal Readiness score
- Missing questions / risk prompts
- Quote comparison and fair-range notes
- Quote, advance, balance
- Budget chart
- Vendor follow-up queue

### Phase 5: Menu / Caterer Board

Build:

- Day-wise food board
- Caterer count and count sent tracking
- Rate/terms memory
- Caterer Handover preview
- Print/copy WhatsApp output
- Alerts when guest count changes after count sent

### Phase 6: Theme / Decorator Brief Canvas and 3D Event View

Build:

- Guided layout templates
- Drag/drop decor zones
- Local reference photos and Pinterest-style moodboards
- Stage, entry, aisle, dining, counter, lighting, and flow zones
- Decorator Handover preview
- Print/copy WhatsApp output
- Later: semi-3D views and venue-specific 3D digital twins for event-manager proposal demos

### Phase 7A: Registry / Legal Hub

Build:

- State-wise official portal guidance
- Document, witness, appointment, and certificate checklist
- West Bengal MARREG guidance first
- Fake-agent red flags and transparent legal-partner path later

### Phase 7: Shopping and Gift Corner

Build:

- Shopping tracker
- Gift idea cards
- Optional cocktail/intimate guest preference capture
- Shopping/Gift summary handover

### Phase 8: Tiny RSVP Cloud

Build Cloudflare:

- Hosted invite page
- RSVP submit API
- Response fetch API
- Local app pulls responses

### Phase 9: Optional Sync Mode

Only after local-first product is validated:

- Cloud backup
- Family collaboration
- Multi-device sync
- Role permissions

### Phase 10: Friend Buzz and Collaboration

Build:

- Bride/groom/family collaboration
- Friend buzz space
- Simple roles
- Keep emotional buzz separate from core supervision

### Phase 11: Event Manager / Vendor Execution Portal

Later:

- Event-manager and decorator proposal workspace
- 3D proposal/demo mode
- Scope confirmation
- Upload quote/bill
- Deliverable status
- Family-vendor shared updates
- Keep this execution-focused, not vendor-discovery-first

## Marriage Registry And Legal Hub

Add a dedicated Registry / Legal Hub tab.

Purpose:

- Help families understand marriage registration without depending on random agents.
- Provide state-wise official portal links and document checklists.
- Track witnesses, appointment, certificate status, and post-wedding document tasks.
- Start as guidance only; do not claim to register marriages directly.
- Later, add verified legal/document partners with transparent pricing.

For West Bengal, study and link the official MARREG portal flow.

## Cost Strategy

Keep v1 cost minimal.

Initial:

```text
Local app: free
Cloudflare Pages: free
Workers: free initially
D1: free initially
R2: free initially up to free tier
Domain: optional until real invites, roughly yearly cost only
Manual WhatsApp sharing: free
```

Do not include paid WhatsApp API in the basic plan.

Charge WhatsApp automation separately later.

Suggested pricing direction:

```text
Family free layer
Family premium event pass
Advanced 3D visualization add-on
WhatsApp automation credits optional later
Event manager / decorator proposal mode
Venue digital twin SaaS
Planner Pro workspace
Partner/referral revenue for hotel, transport, legal, gifts, printing, honeymoon, insurance, and payments
City cost intelligence reports later
```

## Design Principles

- Premium but not flashy
- iPhone-inspired simplicity
- Low input
- No giant admin tables by default
- No boring checklist-heavy UX for key modules like Menu, Vendor, or Decor
- Prefer smart cards, stages, queues, drag/drop, and guided briefs
- Summaries and action queues first
- Search when needed
- Use progressive detail
- Non-tech friendly
- Bengali/Indian wedding emotion without clutter
- Do not hide important numbers
- Avoid text overlap
- Avoid oversized fonts
- Keep mobile-first behavior in mind
- Make printable handovers look like proper vendor templates, not raw data dumps
- Make WhatsApp copy outputs clean, short, and directly usable
- The first-wow moment should be "I can see what is risky and what to do next"

Every screen should answer:

```text
What changed?
What is pending?
What needs action?
What is risky?
```

## Competitor Insight

Known competitor categories and examples:

- Vendor discovery / Indian wedding marketplaces: WedMeGood, WeddingWire India, WeddingBazaar
- Global wedding planning apps: The Knot, Zola, Joy
- Generic all-in-one planners: Vowra, Folia, Altar, My Wed Hub
- Seating/floor plan tools: Seatbee, Seatly, Seat Maker, Aisle Planner
- Planner/agency CRMs: Coordon, GoodEvent, Kordo, Polivents

Most competitors offer some combination of:

- Wedding website
- RSVP
- Checklist
- Guest list
- Budget
- Vendor marketplace
- Planner dashboard
- Seating chart or floor plan
- Vendor portals for professional planners

BiyeFlow should win by being:

```text
Family-first, not planner-first
Indian wedding supervision-first, not marketplace-first
Bengali-first initially, template-based later
Local-first and low cost
Low-input and non-tech friendly
Decision/readiness engine before vendor booking
Guest/stay/room/menu/vendor/budget connected into one Control Room
Vendor-ready handover packs for WhatsApp and print
Guided layout brief for decorator clarity
Custom emotional layers: gifts, friend buzz, bride/groom collaboration
```

Important market observation:

Some tools have floor plans, seating charts, PDFs, vendor portals, or planner-side coordination. The gap BiyeFlow should own is the family-side pattern:

```text
A non-tech family creates a simple vendor-ready brief from their own supervision workspace
and sends it manually on WhatsApp.
```

Avoid trying to beat big players on lead discovery, venue discovery, invitation templates, or generic checklists. Use them as external lead/inspiration sources. BiyeFlow starts where families lose control:

```text
Found vendor/venue elsewhere -> Add to BiyeFlow -> Compare quote -> Ask right questions -> Understand risk -> Visualize decor/layout -> Book -> Track agreement -> Final count -> Handover
```

## Important Open Decisions

- Should Biyebari and Marriage be separate events in the app, or should Biyebari represent the marriage-day home function?
- Should Borjatri be treated as event attendance, commute group, or both?
- Should Reception always default to all guests, or should `Include in Reception` be explicit?
- Should self/family/internal rows be excluded from guest totals by default?
- What should the first invitation template look like visually?
- What minimum fields should RSVP ask without annoying guests?
- Should phone number be mandatory in guest import for invite sharing?
- What should the first event template schema look like?
- Which modules should be enabled by default for Bengali Wedding?
- What is the exact formula and weightage for Vendor Deal Readiness?
- What is the first version of Fair Cost Intelligence: manual ranges, survey data, or quote comparison only?
- What should the Registry / Legal Hub include for West Bengal first?
- What is the minimum useful 3D visualization: stage-only, full venue zones, or venue digital twin?
- What are the first 8 to 12 caterer readiness checks that are practical and non-subjective?
- What should the Decorator Brief Canvas templates include first?
- Should layout canvas be rough/not-to-scale first, or support dimensions from v1?
- What room planner assumptions should be default: 2 per room, family cluster, elder preference?
- What should be core supervision versus optional emotional layer?
- How should print/WhatsApp handover templates look visually?

## Immediate Next Steps For Another Agent

1. Read this file.
2. Inspect `index.html` only for UX ideas, not as final architecture.
3. Inspect the Excel template if continuing guest import work.
4. Add `Include in Reception` or `Guest Type` to the Excel template to remove count confusion.
5. Start a new Vite React TypeScript PWA if building the real app.
6. Implement module registry and Dexie schema using the data model draft above.
7. Keep business logic in domain services:

```text
calculateVendorReadiness()
calculateRoomPressure()
calculateMenuCost()
detectGuestCountChanges()
generateCatererHandover()
generateDecoratorHandover()
generateRoomHandover()
```

8. Build the first real slice:

```text
Wedding setup
Guest Excel import
Event-wise counts
Invitation tracker
Local backup export/import
Control Room signals
```

9. Then build the first strong differentiator slice:

```text
Fair Cost Checker
Registry / Legal Hub
Vendor Deal Room without vendor discovery
Menu Caterer Handover
Decorator Brief Canvas
2D Layout Planner -> 3D Event View path
Room Planner
```

10. Run the Durgapur business study in parallel:

```text
Recent family interviews
Currently planning family interviews
Decorator/event manager quote workflow study
Venue photo/portfolio gap study
Caterer rate and count workflow study
Real quote and hidden-cost collection
```

11. Keep the app usable for the user's own wedding testing first.






