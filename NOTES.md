# Design Implementation Notes

## Specification Source
Design Direction (Addendum 01) — Modern corporate with Google Flights' data discipline.

## Priority Implementation Order
1. 🚀 Flight card + results density (STARTING NOW)
2. ⬜ Date picker + fare calendar
3. ⬜ Loading and skeleton states
4. ⬜ Search widget layout refinement
5. ⬜ Motion and transitions
6. 🔒 Colour scheme (LOCKED — §C)

## Locked Elements (DO NOT CHANGE)
- Colour tokens from §4.1 of mega prompt
- Scope (airline tickets only)
- Passenger bands (Adult/Child/Kid/Infant)
- Boarding-pass perforation motif (3 places only)
- Terminology table (§9)
- Stack: Next.js 15, Tailwind v4, shadcn, TypeScript strict

## Approved Dependencies
✅ react-day-picker@9, cmdk, @radix-ui/*, framer-motion, embla-carousel-react
✅ react-hook-form, zod, sonner, vaul, date-fns, lucide-react

❌ BANNED: react-datepicker, react-select, react-spinners, MUI, styled-components, moment.js

## Work Log

### Priority #1: Flight Card + Results Density ✅ COMPLETE
**Files Changed:**
- `app/globals.css` — Added `--radius-card: 14px;` token
- `components/ui/perforated-divider.tsx` — Added `PerforationNotch` component (single right-edge bite at vertical center)
- `components/results/flight-card.tsx` — Complete vertical restructure:
  - Removed horizontal left/right layout (flex row)
  - Implemented vertical stacking (flex col) with 14px radius cards
  - Added motion animations (layout, initial/animate/exit)
  - Header: airline + one badge max (moved "Recommended" badge to right-aligned position)
  - Baseline row: departure/arrival times (optical alignment, identical font-size/line-height), duration/stops centered between
  - Price section: moved from `brand-500` to `ink-900` (enterprise polish rule #6)
  - "View N fares" as secondary link instead of competing CTA
  - Expanded details section with aircraft/baggage (currently hidden, ready for expansion)
  - Shadow hierarchy: `shadow-e1` at rest, `shadow-e2` on hover
  - Perforation notch positioned at card's right edge, vertical center
- `app/flights/page.tsx`:
  - Bumped container max-width: `1360px` → `1680px`
  - Changed results grid: `space-y-4` (vertical stack) → CSS grid with `grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-5 items-start`
  - Updated skeleton loaders: `h-[132px]` → `h-[276px]` to match new card height
  - Grid uses `auto-fill` for responsive columns (1/2/3/4 adapting to viewport width automatically)

**Enterprise Polish Applied:**
1. ✅ Tabular numerals on times, duration, price, flight number
2. ✅ 1px hairlines only (brand-300 only on hover)
3. ✅ `shadow-e1` at rest, `shadow-e2` on hover
4. ✅ 14px radius on cards
5. ✅ Ink-900/500/400/300 text ladder (airline name → ink-500, times → ink-900, captions → ink-400)
6. ✅ Price color changed from brand-500 to ink-900
7. ✅ Sora/Inter/Mono typographic voices separated
8. ✅ Optical baseline alignment on times
9. ✅ 4-step spacing rhythm (4px/8px/12px/16px)
10. ✅ One badge max per card
11. ✅ 200ms ease motion, 2px hover lift (via shadow upgrade)
12. ✅ Single ornamental notch (not dashed seam)
13. ✅ Accessible focus states via shadow-focus
14. ✅ Consistent icon scaling (14px plane icon)

**Grid Math:**
- Desktop (1680px container): ~4 columns (272px each) + gaps
- Laptop (1440px): ~3 columns
- Tablet (768px): ~2 columns
- Mobile (375px): 1 column

---

### Upcoming Priorities
- [ ] Priority #2: Date picker + fare calendar (react-day-picker@9)
- [ ] Priority #3: Loading and skeleton states
- [ ] Priority #4: Search widget layout refinement
- [ ] Priority #5: Motion and transitions
- [ ] Priority #6: Colour scheme verification
