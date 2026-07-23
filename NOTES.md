# SkyWing — Airline Ticket Booking Prototype

## Design Decisions

### Brand Name
- **SkyWing** — chosen as a neutral, aviation-inspired brand name that doesn't conflict with Akij Air or FirstTrip.
- Logo uses a plane icon in brand-800 on white, with rounded square background.

### Color Palette
- Brand-800 (#8E191C = Akij maroon) used as the deep brand anchor.
- Brand-500 (#D82128 = FirstTrip red) used for CTAs, prices, and active states.
- Canvas (#F1F4F8) as page background — slightly cooler than Akij's #F7F8FA to match FirstTrip's tone.
- Focus ring uses brand-500 at 22% opacity (matching the e-focus token).

### Session Timer Duration
- Default is 20 minutes (matching Akij Air). The constant is in `lib/store/session.ts`.
- FirstTrip uses 30 minutes, but Akij's 20 is tighter and creates more urgency for the demo.

### Four Passenger Bands
- Followed Akij Air's pattern: Adult (>12), Child (5-12), Kid (2-5), Infant (<2).
- Most OTAs use three bands (Adult/Child/Infant). The four-band approach is specific to this market.

### Search Widget
- Implemented as a floating white card overlapping the hero section, matching Akij Air's layout.
- Trip type buttons, field grid, fare type toggles, and preferred airline chip all in one widget.
- Swap origin/destination button uses a circular brand-500 button straddling the boundary.

### Flight Card
- Signature boarding-pass perforation implemented as `PerforatedDivider` component.
- Two CTAs: "View Prices" when multiple fare families exist, "Select Flight" when one.
- Seats-left badge uses outlined amber pill (urgent text on urgent-bg with 1px border).

### Combo Flights
- Not explicitly implemented yet — will be added when round-trip functionality is built out.
- Flagged with green "Combo Flight" badge on mixed-carrier results.

### Fare Families
- Loaded from `lib/mock/fares.ts` with 7 fare families across economy, premium_economy, and business.
- RBD codes: Q, G, K, V, L, M, Y (matching standard airline codes).
- Fare family modal shows up to 4 options in a horizontal carousel.

### Auth
- No real authentication — any credentials accepted. Shape-only validation.
- This aligns with the spec: "Any credentials are accepted; validation is shape-only."

### Payment
- No real payment data collected. All card fields pre-filled with placeholders.
- "Simulated payment" label shown on card form.
- bKash, Nagad, Rocket, Upay as mobile financial services (Bangladesh-specific).

### Persistence
- Search state persisted to sessionStorage via zustand/persist.
- Booking cart persisted to sessionStorage.
- Session timer persisted to sessionStorage (so it survives page refreshes).
- Only partial state is persisted (not errors, UI state, etc.).

### Typography
- Four fonts loaded via next/font: Inter (body), Sora (headings), IBM Plex Mono (mono), Hind Siliguri (Bengali).
- CSS variables reference these fonts; the actual files are served by next/font.

### Mock Data
- PRNG is Mulberry32 seeded on route+date for deterministic results.
- Domestic price bands carefully tuned to match real BD OTA pricing.
- 60+ airports across domestic BD, India, Middle East, SE Asia, Europe, North America.

### Component Organization
- `/components/ui/` — reusable atomic components (PerforatedDivider, pills, chips)
- `/components/search/` — search widget components
- `/components/results/` — results page components
- `/components/checkout/` — checkout flow components
- `/components/booking/` — booking management components
- `/components/account/` — account page components

### Responsive Strategy
- Desktop-first with three breakpoints: <640 (mobile), 640-1023 (tablet), ≥1024 (desktop).
- Filter rail becomes bottom sheet on mobile.
- Flight card collapses to two-row layout on mobile.
- Touch targets ≥ 44px throughout.

## Open Questions / Future Work
- [ ] Combo Flight implementation for round trips mixing two carriers
- [ ] Multi City flow — full airport autocomplete for each segment
- [ ] Seat map interactive component
- [ ] Processing overlay with animated aircraft
- [ ] Print-optimized e-ticket stylesheet
- [ ] 404 page (aviation-themed)
- [ ] prefers-reduced-motion respected
- [ ] Full keyboard navigability
