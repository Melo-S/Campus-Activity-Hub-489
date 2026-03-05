# Campus-Activity-Hub-489
 
A web app where students can see campus activity/busyness (Library/Rec/Dining) and create activities (study/workout/dinner) to invite friends, track RSVPs, and check in.

## The Problem

- "Is the library packed right now?"
- "Anyone want to grab dinner at 6?"
- "Is the rec center busy?"

Students waste time walking to crowded facilities or struggle to coordinate simple activities with friends.

## The Solution

**Campus Activity Hub** combines:
1. **Live Facility Dashboard** - Crowdsourced "busy levels" for library, rec center, dining halls
2. **Activity Planning** - Create activities, invite friends, RSVP, and check-in

No campus API needed. "Live" data comes from:
- Student-submitted status updates (with auto-expiration)
- Verified organizer/staff updates
- Activity RSVPs and check-ins as crowd signals

## Mid Deliverable (UI Mockups & Mapping)

- Entry point: `index.html` (open in browser). Contains hero/summary and use case ↔ screen mapping table.
- Theme: Bootstrap 5.3 + custom tokens in `assets/css/styles.css` for colors, spacing, typography (Inter).
- Screens: 23 total in `/screens` (Student S01–S14, Organizer O01–O05, Admin A01–A04). Shared header/footer/navigation for consistency.
- Package: `CampusActivityHub-mockups.zip` in repo root (includes index.html, assets/, screens/).
- Mapping: Use case ↔ screen mapping is visible in `index.html` under the “Use Case ↔ Screen Mapping” section.

### Open locally
- Windows: double-click `index.html` or run `start index.html`.
- Mac/Linux: `open index.html` (macOS) or `xdg-open index.html` (Linux).

### Suggested next tasks (for team pick-up)
1) Upgrade remaining wireframes to full mockups: SCR-S11 (My Schedule), SCR-S12 (Friends), SCR-S13 (Invites), SCR-S14 (Report), SCR-O04 (Manage Facility), SCR-O05 (Organizer Analytics).
2) Add explicit error/empty/success states per use case (e.g., rate limit UC-S05, duplicate vote UC-S06, invite-only/full UC-S08/11, already reported UC-S12, invalid hours UC-O03, not authorized UC-O02, duplicate facility UC-A03).
3) Accessibility pass: ARIA labels, focus order, contrast check on primary color, descriptive button text.
4) Responsive polish: tighten mobile layouts (card stacking, tab spacing, nav collapse spacing).
5) Sample data/storyboard: realistic content (names, timestamps, counts) to narrate flows for demo.
6) Demo prep (Deliverable 3): slide deck with screenshots and callouts mapping use cases to screens.
7) Optional: cross-link screens with hrefs to simulate navigation for a click-through demo.

## Team
Kaleb Kebede  
Melvin Sanare  
Modeste Houenou
