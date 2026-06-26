# BiyeFlow Product Roadmap Overview

Last updated: 2026-06-26

## 1. Product Thesis

BiyeFlow is a family-first wedding operations platform for Indian weddings.

It should not become another vendor marketplace, venue discovery app, invitation builder, or generic checklist product. Existing platforms already cover those areas strongly.

BiyeFlow should own the part where families actually lose control:

```text
Guest count -> event-wise headcount -> food count -> stay/room pressure -> decor/layout handover -> family/vendor clarity
```

Core positioning:

```text
BiyeFlow - Fair Wedding Control Room
Plan clearly. Compare fairly. Avoid overpaying.
```

Long-term vision:

```text
Wedding Digital Twin + Fair Cost Intelligence + Family Control Room + Vendor-Ready Handover
```

The product must help families:

- Reduce confusion.
- Avoid overpaying.
- Track changing guest counts.
- Prevent food count mistakes.
- Manage stay and rooms.
- Explain decor ideas clearly.
- Prepare clean handovers for vendors/event managers.
- Keep all wedding planning context in one place.

## 2. Strategic Decisions

### What We Will Build

- Multi-day wedding operations control room.
- Guest count and event-wise attendance system.
- Caterer headcount and meal-count board.
- Room and stay planner.
- Decorator brief and layout planner.
- Registry/legal guidance hub.
- Budget and fair-cost intelligence.
- Handover generator for caterer, decorator, rooms, and vendors.
- Private wedding buzz layer with trivia, friend invites, games, and leaderboard after core operations are stable.
- PWA that works on desktop and mobile from one codebase.
- Later: 2D layout planner, 3D event preview, event-manager proposal mode, venue digital twins.

### What We Will Not Build First

- Vendor discovery marketplace.
- Venue discovery marketplace.
- Public social wedding community.
- Full 3D event rendering in the first MVP.
- Paid WhatsApp automation in the free layer.
- Native Android/iOS apps before PWA validation.
- PAN India launch before local proof.

### Why No Vendor/Venue Discovery First

The market already has strong vendor and venue discovery players. Competing there would make BiyeFlow look similar to existing apps.

BiyeFlow should start after a family finds or shortlists a vendor/venue elsewhere:

```text
Found vendor/venue elsewhere
-> Add to BiyeFlow
-> Compare quote
-> Ask right questions
-> Understand risk
-> Track commitment
-> Prepare handover
-> Execute wedding with less confusion
```

## 3. Primary Users

### Family Users

- Bride or groom planning their own wedding.
- Parents supervising the wedding.
- Siblings managing guest, stay, food, and vendor follow-up.
- Relatives helping with event-day execution.
- Non-technical elders who need simple status visibility.

### Business Users Later

- Event managers.
- Decorators.
- Wedding planners.
- Banquet/venue operators.
- Legal/document partners.
- Hotel and transport partners.

## 4. Product Pillars

### Pillar 1: Family Control Room

One dashboard showing:

- What changed.
- What is pending.
- What is risky.
- What needs action.
- Which handovers are ready.

### Pillar 2: Multi-Day Guest And Headcount Engine

The same guest list should feed:

- Event attendance.
- Meal counts.
- Caterer brief.
- Stay requirement.
- Room pressure.
- Transport need.
- Control Room alerts.

### Pillar 3: Vendor-Ready Handover

Every operational module should produce a clean output:

- Caterer handover.
- Room allocation handover.
- Decorator brief.
- Event-day run sheet.
- WhatsApp-ready summary.
- Printable/PDF export later.

### Pillar 4: Fair Cost And Trust

BiyeFlow should help families understand:

- What should this cost?
- What questions should I ask?
- What hidden costs should I check?
- What has been paid?
- What is still pending?

### Pillar 5: Visual Wedding Planning

Decor should not remain only as words and screenshots.

Roadmap:

```text
Reference images -> moodboard -> guided decor brief -> 2D layout -> semi-3D event view -> venue digital twin
```

### Pillar 6: Private Engagement And Buzz

Community features should support a specific wedding, not become a generic public community.

Examples:

- Friend invite.
- Couple trivia.
- Games.
- Leaderboard.
- Countdown.
- Photo prompts.
- Wedding-side challenges.

This comes after the operations spine, because the trust product must come first.

## 5. Complete Functionality Map

### 5.1 Wedding Setup

Planned functionality:

- Wedding name.
- Bride/groom details.
- Family sides.
- City.
- Venue notes.
- Wedding date range.
- Event list.
- Expected total guests.
- Role setup later.

MVP status: Core.

### 5.2 Event Engine

Planned functionality:

- Multi-day events.
- Sangeet, Haldi, Mehendi, Biyebari, Wedding, Reception, After-party, custom events.
- Meal slots per event.
- Event timing.
- Venue/location per event.
- Expected guest count per event.
- Actual count per event.
- Control Room status per event.

MVP status: Core.

### 5.3 Guest Master

Planned functionality:

- Guest group/family name.
- Head count.
- Bride side/groom side/common.
- Contact person.
- Phone optional.
- City.
- Invite sent status.
- RSVP status later.
- Stay needed.
- Transport needed.
- Notes.
- Tags: elder, VIP, close family, outstation, internal, staff, etc.
- Excel import/export.

MVP status: Core.

### 5.4 Multi-Day Attendance Matrix

Planned functionality:

- Guest/group vs event grid.
- Headcount per event.
- Meal-specific count later.
- Reception include/exclude flag.
- Event-specific overrides.
- Count change tracking.
- Alerts when count changes after caterer count is sent.

MVP status: Core.

### 5.5 Headcount Engine

Planned functionality:

- Event-wise totals.
- Meal-wise totals.
- Stay headcount.
- Room pressure.
- Caterer count.
- Bride/groom side split.
- Last updated timestamp.
- Difference between expected and confirmed.

MVP status: Core.

### 5.6 Caterer Board

Planned functionality:

- Event-wise food board.
- Meal slots: breakfast, lunch, snacks, dinner, late night.
- Veg/non-veg split later.
- Per plate estimate.
- Live counter estimate later.
- Count sent to caterer.
- Date/time count was sent.
- Alert when count changes after sending.
- Caterer brief.
- WhatsApp-ready summary.

MVP status: Core.

### 5.7 Room Planner

Planned functionality:

- Stay-needed guest list.
- Room count estimate.
- Room type.
- Family cluster allocation.
- Elder priority.
- Couple/family grouping.
- Check-in/check-out.
- Hotel/house allocation.
- Room allocation handover.

MVP status: Core Lite.

### 5.8 Decorator Brief

Planned functionality:

- Theme.
- Color palette.
- Reference images.
- Stage concept.
- Entry concept.
- Aisle concept.
- Dining concept.
- Food counter concept.
- Lighting mood.
- Must-have list.
- Avoid list.
- Budget range.
- Decorator handover.

MVP status: Core Lite.

### 5.9 Layout Planner

Planned functionality:

- Venue zones.
- Stage area.
- Guest circulation.
- Appetizer counters.
- Dining area.
- Entry gate.
- Aisle.
- Lounge/seating areas.
- Entertainment area if required.
- Service/vendor area.
- 2D floor-plan output.

MVP status: Phase 2.

### 5.10 3D Event View

Planned functionality:

- Stage 3D preview.
- Entry 3D preview.
- Dining/counter 3D preview.
- Lighting mood.
- Theme variants.
- Event-manager proposal view.
- Venue digital twin later.

MVP status: Later differentiator.

### 5.11 Registry / Legal Hub

Planned functionality:

- State-wise marriage registration guide.
- Official portal links.
- Document checklist.
- Witness checklist.
- Appointment tracker.
- Certificate tracker.
- Fake-agent warning.
- Legal/document partner path later.

MVP status: Basic guide in MVP or immediately after MVP.

### 5.12 Budget And Fair Cost

Planned functionality:

- Budget categories.
- Planned vs actual.
- Paid vs pending.
- Quote comparison.
- Hidden-cost checklist.
- City-wise fair range later.
- Wedding cost calculator.
- Budget leak detector.

MVP status: Basic budget in MVP, Fair Cost Phase 2/3.

### 5.13 Vendor Deal Room Without Discovery

Planned functionality:

- Family-added vendor records.
- Quote memory.
- Package inclusions.
- Advance paid.
- Balance due.
- Follow-up date.
- Readiness checklist.
- Missing question prompts.
- Vendor handover.

MVP status: Basic in MVP, deeper later.

### 5.14 Shopping And Gifts

Planned functionality:

- Clothes.
- Gold/jewellery.
- Return gifts.
- Invitation gifts.
- Puja/ritual items.
- Trousseau.
- Responsible person.
- Budget.
- Purchase status.

MVP status: Later.

### 5.15 Private Wedding Buzz

Planned functionality:

- Friend invite link.
- Couple trivia.
- Leaderboard.
- Guessing games.
- Countdown.
- Photo prompts.
- RSVP engagement.
- Private sharing.

MVP status: Post-core MVP.

Reason:

This can drive engagement and virality, but should not distract from the serious planning spine.

### 5.16 RSVP And Invitation Gateway

Planned functionality:

- Shareable RSVP link.
- Guest confirmation.
- Event-wise RSVP.
- Guest-side mobile form.
- Updates to Guest Master.
- Invite sent tracking.

MVP status: Later cloud layer.

### 5.17 Integrations And Automation

Planned functionality:

- Excel import/export.
- PDF export.
- WhatsApp copy link.
- WhatsApp automation later.
- Payment gateway later.
- Hotel/transport/legal/printing/gift partners later.

MVP status: Excel and manual WhatsApp only.

## 6. First MVP Scope

The first MVP should be called:

```text
Wedding Operations MVP
```

It should not be a collection of unrelated tabs. It should be one connected system.

Core MVP flow:

```text
Wedding setup
-> Multi-day events
-> Guest master
-> Event-wise attendance
-> Headcount engine
-> Caterer board
-> Room planner lite
-> Decorator brief lite
-> Control Room alerts
-> Handover outputs
```

### MVP In Scope

- Wedding setup.
- Event setup.
- Guest master.
- Excel import/export.
- Multi-day attendance matrix.
- Headcount engine.
- Caterer board.
- Caterer handover.
- Stay/room planner lite.
- Room allocation handover.
- Decorator brief lite.
- Decorator handover.
- Control Room.
- Manual WhatsApp-ready summaries.
- PWA responsive UI.
- Local-first storage.
- Backup/export.

### MVP Optional If Time Allows

- Basic Registry / Legal Hub.
- Basic budget tracker.
- Basic vendor deal notes.

### MVP Out Of Scope

- Full 3D event view.
- Vendor discovery.
- Venue discovery.
- Public community.
- Paid WhatsApp automation.
- Multi-client planner workspace.
- Venue digital twin.
- PAN India registry coverage.
- Native mobile apps.

## 7. First MVP Week-Wise Plan

Assumption:

- One founder/lead engineer plus occasional design/product review.
- 2-week agile sprints.
- First usable MVP in 10 to 14 weeks.
- 2-week buffer recommended for real wedding testing and UX cleanup.

### Week 0: Product And Build Setup

Goals:

- Finalize MVP scope.
- Confirm data model.
- Create backlog.
- Define acceptance criteria.
- Decide stack.
- Confirm PWA approach.

Deliverables:

- Product backlog.
- Architecture note.
- Data model draft.
- Sprint plan.

### Week 1: Project Foundation

Build:

- App shell.
- Navigation.
- Local-first storage setup.
- Event template structure.
- Basic design system.
- PWA foundation.

Acceptance:

- App opens on desktop and mobile.
- Data persists locally.
- New wedding can be created.

### Week 2: Wedding Setup And Event Engine

Build:

- Wedding profile.
- Bride/groom/family side fields.
- Event list.
- Multi-day event setup.
- Event timings and meal slots.

Acceptance:

- User can configure a multi-day wedding.
- Events can be added, edited, and ordered.
- Events feed basic Control Room summary.

### Week 3: Guest Master

Build:

- Guest/group list.
- Head count.
- Side.
- City.
- Stay needed.
- Contact/notes.
- Tags.

Acceptance:

- User can add and edit guest groups.
- Total headcount updates automatically.
- Stay-needed count is visible.

### Week 4: Excel Import And Export

Build:

- Import guest list from Excel/CSV-like data.
- Validate common columns.
- Export current guest list.
- Error handling.

Acceptance:

- User can import a realistic guest list.
- Bad rows are flagged clearly.
- Export can be reopened.

### Week 5: Multi-Day Attendance Matrix

Build:

- Guest/group vs event matrix.
- Include/exclude per event.
- Event-wise totals.
- Reception default logic.
- Manual override.

Acceptance:

- User can see who is attending which event.
- Counts update immediately.
- Event-wise total is reliable.

### Week 6: Headcount Engine And Control Room Signals

Build:

- Central headcount calculation service.
- Event totals.
- Stay totals.
- Meal totals foundation.
- Count change detection.
- Control Room alert structure.

Acceptance:

- All modules read from one headcount engine.
- Control Room shows count risks and missing data.

### Week 7: Caterer Board

Build:

- Event-wise meal count board.
- Meal slots.
- Count sent status.
- Count sent date.
- Change-after-sent alert.
- Basic rate estimate.

Acceptance:

- User can prepare daily/event-wise caterer counts.
- App warns if guest count changes after count was sent.

### Week 8: Caterer Handover

Build:

- Caterer brief preview.
- WhatsApp-ready summary.
- Printable/export-ready structure.
- Meal count summary.
- Pending decisions.

Acceptance:

- User can generate a clear caterer handover.
- Handover includes date, event, meal, count, notes, and pending items.

### Week 9: Room Planner Lite

Build:

- Stay-needed guest view.
- Room estimate.
- Family cluster grouping.
- Elder/VIP flags.
- Room notes.

Acceptance:

- User can identify room pressure.
- Stay guests can be grouped.
- Room allocation draft can be produced.

### Week 10: Room Handover And Decorator Brief Lite

Build:

- Room allocation handover.
- Decor theme fields.
- Reference image attachment/local reference support.
- Stage/entry/dining/counter zones.
- Must-have and avoid list.

Acceptance:

- User can produce a room handover.
- User can prepare a useful decorator brief without needing 3D.

### Week 11: Decorator Handover And Control Room Polish

Build:

- Decorator handover preview.
- Control Room readiness cards.
- Missing-information prompts.
- Handover status.
- Better empty states.

Acceptance:

- Control Room clearly shows guest, caterer, room, and decor readiness.
- Decorator handover can be shared manually.

### Week 12: Mobile PWA Quick Actions

Build:

- Mobile-friendly guest updates.
- Mobile Control Room summary.
- Mobile handover view.
- Quick WhatsApp copy actions.
- Basic installability check.

Acceptance:

- App is usable on mobile for quick actions.
- Heavy tables remain more desktop-friendly but not broken.

### Week 13: Private Test And Fixes

Build/Test:

- Use a real wedding dataset.
- Test import/export.
- Test changed guest counts.
- Test caterer count change alerts.
- Test room pressure.
- Test handover outputs.

Acceptance:

- One real wedding can be managed end-to-end through the MVP spine.

### Week 14: MVP Release Candidate

Build/Test:

- UX cleanup.
- Performance cleanup.
- Backup/export safety.
- Basic onboarding.
- Known limitations list.

Acceptance:

- Product is ready for 3 to 5 private family pilots.

## 8. Full Product Roadmap

### Phase 0: Validation And Data Spine

Timeline:

```text
2 to 3 weeks
```

Purpose:

- Validate Durgapur wedding pain points.
- Gather real quote formats.
- Build cost taxonomy.
- Confirm family workflows.
- Confirm MVP data model.

Success gate:

- Families understand the product promise.
- At least 10 to 15 families say guest/headcount/stay/caterer/decor handover would help.
- At least 5 event managers/decorators confirm visual briefs or proposal tools could help close deals.

### Phase 1: Wedding Operations MVP

Timeline:

```text
10 to 14 weeks
```

Purpose:

- Make BiyeFlow usable for a real wedding.
- Connect guest count, caterer count, room pressure, and decor handovers.

Success gate:

- One real wedding can be managed in BiyeFlow.
- Family revisits weekly.
- Caterer handover is useful.
- Decorator handover is useful.
- Guest count changes trigger visible impact.

### Phase 2: Private Beta

Timeline:

```text
4 to 6 weeks
```

Build:

- 3 to 10 real wedding pilots.
- Better onboarding.
- Better import/export.
- Fix confusing flows.
- Add basic registry/legal guide.
- Add basic budget tracker if not already included.

Success gate:

- Families use the app beyond initial curiosity.
- Families generate handovers.
- Families report reduced confusion.

### Phase 3: Fair Cost And Registry Trust Layer

Timeline:

```text
8 to 12 weeks
```

Build:

- Wedding cost calculator.
- Budget leak detector.
- Quote comparison.
- Hidden-cost checklist.
- Durgapur cost ranges.
- West Bengal registry guide.
- Legal/document checklist.

Success gate:

- Users come through free cost/legal tools.
- Users trust BiyeFlow before entering full planning data.

### Phase 4: Decor Layout And 3D Event Preview

Timeline:

```text
8 to 12 weeks
```

Build:

- 2D layout planner.
- Stage/entry/dining/counter zones.
- Lighting mood.
- Semi-3D stage or event preview.
- Decor proposal export.

Success gate:

- Families understand decor better.
- Event managers/decorators see deal-closing value.

### Phase 5: Private Wedding Buzz

Timeline:

```text
4 to 8 weeks
```

Build:

- Friend invite.
- Couple trivia.
- Games.
- Leaderboard.
- Countdown.
- Photo prompts.
- Optional RSVP engagement.

Success gate:

- Guests engage without weakening the serious planning experience.
- Buzz helps organic sharing.

### Phase 6: B2B Proposal Tools

Timeline:

```text
3 to 6 months
```

Build:

- Event manager proposal mode.
- Decorator proposal workspace.
- 3D proposal credits.
- Client approval.
- Quote/brief versioning.
- Multi-client dashboard.

Success gate:

- At least one event manager/decorator pays because BiyeFlow helps close or clarify deals.

### Phase 7: Venue Digital Twin Pilot

Timeline:

```text
3 to 6 months after 3D proof
```

Build:

- One or two Durgapur venue models.
- Reusable stage/dining/counter configurations.
- Venue layout packages.
- Capacity maps.

Success gate:

- Venue or event manager sees clear sales/demo value.

### Phase 8: West Bengal Expansion

Timeline:

```text
6 months after Durgapur proof
```

Build:

- More city cost ranges.
- Bengali wedding templates.
- West Bengal registry depth.
- Partner ecosystem.
- Local content and SEO.

Success gate:

- Product works outside one city without heavy manual support.

### Phase 9: PAN India Platform

Timeline:

```text
12+ months after regional proof
```

Build:

- Regional wedding templates.
- State-wise registry/legal guides.
- Multi-language support.
- City cost intelligence.
- Partner APIs.
- Scalable sync.
- B2B SaaS modules.

Success gate:

- Product can support multiple regions with template/configuration, not custom rebuilding.

## 9. Architecture Roadmap

### Core Architecture Principle

Every module must be independent enough to evolve, but connected enough to feed the Control Room.

Module contract:

```text
Input data
Computed status
Risks
Next actions
Handover/export
Control Room signal
```

### Suggested Technical Stack

```text
Vite + React + TypeScript
Tailwind/shadcn-style component system
Dexie/IndexedDB for local-first storage
PWA manifest + service worker
Cloudflare Pages
Cloudflare Workers later
Cloudflare D1/R2 later
Three.js later for 3D
```

### Core Domain Services

Planned services:

```text
calculateHeadcount()
calculateEventAttendance()
calculateMealCounts()
calculateRoomPressure()
detectGuestCountChanges()
generateCatererHandover()
generateRoomHandover()
generateDecoratorHandover()
calculateVendorReadiness()
calculateBudgetPressure()
generateControlRoomSignals()
```

### Data Models To Design Early

```text
Wedding
Event
MealSlot
GuestGroup
GuestAttendance
StayRequirement
RoomAllocation
CatererBrief
DecorBrief
VendorDeal
BudgetItem
RegistryTask
Handover
ControlSignal
BuzzGame
```

### PWA Strategy

One codebase:

- Desktop for heavy planning.
- Mobile for quick actions.
- Same data.
- Same login later.
- Same modules.
- Responsive flows.

Desktop-heavy:

- Guest tables.
- Budget planning.
- Layout planner.
- 3D event view.
- Excel import/export.

Mobile-friendly:

- RSVP.
- Quick count updates.
- WhatsApp copy.
- Checklist updates.
- Approvals.
- Photo/reference capture.
- Buzz games.

## 10. Agile Operating Model

Cadence:

- 2-week sprints.
- 1-week spikes for uncertain areas.
- Demo every sprint.
- Retrospective every sprint.
- One prioritized backlog.

Each story should include:

```text
User pain
User story
Acceptance criteria
Module impact
Control Room signal
Handover/export impact
Build effort
Run cost
Revenue or trust value
```

Definition of Done:

- Works on desktop.
- Acceptable mobile behavior.
- Persists locally.
- Handles empty state.
- Handles error state.
- Feeds Control Room if relevant.
- Produces handover/export if relevant.
- Cost impact is understood.

## 11. Pricing And Business Roadmap

### Family Layer

Pricing direction:

```text
Free control room: Rs 0
Premium Wedding Pass: Rs 799 to Rs 1,999 one-time
Advanced handover pack: Rs 499 to Rs 1,499
3D decor preview: Rs 1,999 to Rs 7,999
Full 3D venue concept: Rs 7,999 to Rs 24,999
Concierge audit: Rs 4,999 to Rs 19,999
Registry/legal assistance: free guide, paid partner service later
```

Rule:

Do not charge families upfront. Charge only when value is clear: export, audit, 3D, automation, or concierge.

### B2B Layer

Pricing direction:

```text
Event manager starter: Rs 1,999 to Rs 4,999/month
Event manager pro: Rs 7,999 to Rs 24,999/month
3D proposal credit: Rs 499 to Rs 2,999/proposal
Premium 3D proposal: Rs 5,000 to Rs 25,000/proposal
Venue digital twin setup: Rs 25,000 to Rs 1.5 lakh one-time
Venue digital twin SaaS: Rs 3,000 to Rs 25,000/month
Planner pro workspace: Rs 5,000 to Rs 30,000/month
```

### Revenue Principle

BiyeFlow must not become vendor-controlled.

Revenue should be mixed:

- Family premium.
- 3D visualization.
- Event manager tools.
- Venue digital twins.
- Planner pro.
- Legal/hotel/transport/gift/printing partners.
- City cost intelligence later.

## 12. Validation Metrics

### MVP Metrics

- Wedding created.
- Guest list imported.
- Event-wise counts configured.
- Caterer count generated.
- Count sent status used.
- Room pressure checked.
- Decor brief created.
- Handover generated.
- Day-7 revisit.
- Day-30 revisit.

### Trust Metrics

- Cost checker completion later.
- Quote comparison completion later.
- Registry guide started.
- Users say the app reduced confusion.
- Users say the app helped avoid overpaying.

### Buzz Metrics

- Friend invites sent.
- Trivia participation.
- Game completion.
- Leaderboard shares.
- Guest-side repeat visit.

### Business Metrics

- Cost per active wedding.
- Support minutes per wedding.
- Free-to-premium conversion.
- 3D preview conversion.
- Event manager paid pilot.
- Venue digital twin interest.

## 13. Key Risks

### Risk 1: Becoming Another Checklist App

Counter:

Every feature must connect to headcount, handover, risk, cost, or execution.

### Risk 2: Building Too Much Before Validation

Counter:

Build Wedding Operations MVP first. Delay full 3D, public buzz, and B2B portals.

### Risk 3: Vendor Revenue Controlling Trust

Counter:

No hidden paid ranking. No vendor discovery as core. Families can add any vendor manually.

### Risk 4: Mobile Complexity

Counter:

Desktop handles planning. Mobile handles quick actions.

### Risk 5: Free Users Creating Cost

Counter:

Local-first, manual WhatsApp, credit-based AI/3D, no unlimited automation.

### Risk 6: 3D Being Too Expensive

Counter:

Start with 2D layout and template-based semi-3D. Build venue digital twins only after paid proof.

## 14. Final Product Direction

The first product should not be:

```text
Guest tab + room tab + caterer tab + decorator tab
```

It should be:

```text
A multi-day wedding operations control room where guest changes automatically affect food, stay, room pressure, decor handover, and family alerts.
```

The long-term product should become:

```text
The trusted wedding operating system for Indian families, with fair-cost intelligence, visual planning, private engagement, and execution-ready handovers.
```

