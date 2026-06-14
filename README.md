# BiyeFlow

A premium product-style prototype for planning a 3-day Bengali wedding.

## Core idea

BiyeFlow keeps the planning surface small:

- One event header
- Countdown with days remaining
- One control room
- One 3-day checklist: Sangeet, Marriage, Reception
- One guest and accommodation board
- One day-wise 4-course menu board
- One vendor and procurement board
- One theme and decor board
- Autosaved local values

The user should not need to build a spreadsheet before they can start. They open the planner, see what needs attention, check work off, compare vendors, track money, and keep updating the same values.

## Product edge

The USP is a control-first Bengali wedding planner: not a generic checklist, not a spreadsheet, but one calm operating board for the three-day function.

The UI direction is a polished matrimony-style product surface with rose, gold, green, blue, saffron, and white accents, trust-led cards, Mac-style toggles, import-first guest operations, menu controls, and responsive data grids that avoid spreadsheet-style overlap.

## Guests and stay

The Guests & Stay tab is designed for one-side guest operations and large Excel lists. It supports `.xlsx` drop/upload directly, with CSV as a fallback.

- Guest or family name
- People count
- Event day: Sangeet, Marriage, or Reception
- Accommodation toggle
- Calculated stay days
- Estimated rooms needed

Minimum template columns:

- `Name`
- `Count`
- `Event Day`
- `Need Accommodation`

The app has a Copy Template button that copies a blank Excel-friendly table with those columns.

For this prototype, every `.xlsx` or `.csv` upload becomes the current guest list.

Stay days are calculated from the function day through Reception: Sangeet = 5 days, Marriage = 3 days, Reception = 1 day. Rooms are estimated at two people per room when accommodation is needed.

## Menu

The Menu tab keeps catering decisions day-wise:

- Sangeet, Marriage, and Reception dates are generated from the start date
- Each function has four courses: Welcome, Starters, Main Course, Dessert
- Each course has editable menu items, caterer notes, and Draft/Discuss/Locked status

## Theme and decor

The Theme & Decor tab keeps the visual direction consolidated:

- Theme name
- Color palette
- Mood
- Must-have ideas
- Things to avoid
- Vendor notes
- Reference photos

Uploaded photos are stored locally in the browser using IndexedDB. They are not sent to a server in this initial version.

## Minimal inputs

- Event name
- City
- Start date
- Guest count
- Vendor or procurement rows only when needed

## Research board

The Research tab tracks practical details:

- Need
- Name
- Contact
- Estimate
- Advance
- Status
- Owner
- Next step or notes

It also shows total estimate, advance paid, balance, booked count, filters, and a copyable board summary.

## Control room

The Control Room is the first screen:

- Pending task count
- Open vendor count
- Balance
- Next pulse item
- Next actions by function day
- Toggle to reveal completed actions
- Staying guest count
- Menu locked count
- Wedding Pulse queue for dated nudges around vendors, payment, decor, rituals, shopping, family, and guests
- Toggle to reveal completed pulse items

The current version stores pulse items locally and allows the pulse queue to be copied. SMS can be added later as a delivery integration, but the product now treats reminders as wedding operating nudges rather than raw messages.

## Product potential

This can grow into a focused planning product without becoming complicated:

- Shared family planning
- Guest RSVP and accommodation allocation
- Caterer-ready menu approvals
- WhatsApp-ready summaries
- Vendor shortlists by city
- Budget reminders
- Photo and document collection
- Bengali wedding templates first, then other Indian functions later

## Open

Open `index.html` in a browser. The planner saves data locally in the browser.
