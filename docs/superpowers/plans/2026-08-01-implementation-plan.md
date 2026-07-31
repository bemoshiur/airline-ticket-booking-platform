# Implementation Plan: Trip.com-Like Flight Booking Platform

**Timeline:** 3 weeks (2026-08-01 to 2026-08-22)  
**Status:** Ready for execution  
**Architecture:** Hybrid modular (Next.js 15 + Zustand + Drizzle + Neon Postgres)

---

## WEEK 1: Foundation + Consumer MVP (Days 1-7)

### Day 1-2: Project Setup & Database (8 hours)

**Prerequisites:** Neon connection string available ✅

**Tasks:**
1. **Drizzle ORM Setup** (2h)
   - Install: `npm install drizzle-orm pg`
   - Create `lib/db/index.ts` with Neon connection
   - Create `lib/db/schema.ts` with all 10 tables
   - Run: `drizzle-kit generate:pg`

2. **Database Migrations** (2h)
   - Create migration: `npm run db:generate`
   - Review generated migration files
   - Apply to Neon: `npm run db:push`
   - Verify tables in Neon dashboard

3. **Zustand Store Setup** (2h)
   - Create `lib/store/consumer.ts` (auth, search, booking state)
   - Create `lib/store/auth.ts` (user session)
   - Setup persist middleware + localStorage
   - Setup hydration wrapper

4. **NextAuth Configuration** (2h)
   - Install: `npm install next-auth`
   - Create `app/api/auth/[...nextauth]/route.ts`
   - Configure email + phone providers
   - Create `lib/auth.ts` utils
   - Setup session callback

**Deliverable:** Project initialized, database connected, auth skeleton ready

**Files Created:**
- `lib/db/index.ts`
- `lib/db/schema.ts`
- `lib/store/consumer.ts`, `lib/store/auth.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `drizzle.config.ts`
- Database migrations (auto-generated)

---

### Day 2-3: Authentication System (6 hours)

**Prerequisites:** NextAuth configured ✅

**Tasks:**
1. **Auth Pages** (3h)
   - Create `app/(auth)/signin/page.tsx` (email/phone form)
   - Create `app/(auth)/signup/page.tsx` (role selector: consumer/agency/partner)
   - Create `app/(auth)/verify/page.tsx` (OTP/email verification)
   - Create `app/(auth)/reset-password/page.tsx`
   - Add animations (Framer Motion entrance)

2. **Auth Logic** (2h)
   - Implement email verification (NextAuth EmailProvider)
   - Implement phone OTP (Twilio integration)
   - Setup session middleware
   - Protected routes wrapper

3. **Styling** (1h)
   - Use existing design tokens (colors, typography)
   - Mobile-responsive forms
   - Error states + loading states

**Deliverable:** Users can sign up and verify (email/phone), login, reset password

**Files Created:**
- `app/(auth)/signin/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/(auth)/verify/page.tsx`
- `lib/auth/verify.ts`
- `lib/auth/otp.ts`

**API Routes Created:**
- `POST /api/auth/send-verification`
- `POST /api/auth/verify-email`
- `POST /api/auth/verify-phone`

---

### Day 4-5: Flight Search & Results (8 hours)

**Prerequisites:** Auth system working ✅, Database connected ✅

**Tasks:**
1. **Mock Flight Data** (2h)
   - Create `lib/mock/flights.ts` with 50+ airlines, 100+ routes
   - Create `lib/mock/seed.ts` database seeder
   - Run seeder: insert mock flights into Neon
   - Verify data in Neon

2. **Search API** (2h)
   - Create `POST /api/flights/search` endpoint
   - Query params: from, to, depart_date, return_date, passengers, cabin_class
   - Return: Array of matching flights with pricing
   - Add filtering logic (exact match on dates/airports)

3. **Search Page UI** (2h)
   - Create `app/(consumer)/search/page.tsx`
   - Layout: Glass-morphism card (existing design)
   - From/to airport selects (use existing AirportSelect)
   - Date range fields (existing DateRangeField)
   - Passenger + cabin class selector (existing PassengerClassSelect)
   - Search button → `router.push(/results?...)`

4. **Results Page UI** (2h)
   - Create `app/(consumer)/results/page.tsx`
   - Display flight cards (use existing FlightCard)
   - Sorting: Price, duration, departure time
   - Filtering sidebar: Airlines, stops, price range, departure time
   - Empty state when no results
   - Loading state with SkeletonLoader (Priority #3)

**Deliverable:** User can search flights and view results with sorting/filtering

**Files Created:**
- `lib/mock/flights.ts`
- `lib/mock/seed.ts`
- `app/(consumer)/search/page.tsx`
- `app/(consumer)/results/page.tsx`

**API Routes:**
- `POST /api/flights/search`
- `GET /api/flights/:id` (single flight details)

**Database:**
- Seed mock data into `flights`, `airlines`, `airports` tables

---

### Day 5-6: Booking Flow (6 hours)

**Prerequisites:** Results page complete ✅

**Tasks:**
1. **Booking Page Layout** (1h)
   - Create `app/(consumer)/booking/[flight_id]/page.tsx`
   - 4-step stepper component
   - Step state management (Zustand)

2. **Step 1: Passenger Details** (2h)
   - Form fields per passenger: name, DOB, email, phone
   - Auto-populate from session if available
   - Validation: Name (min 3 chars), DOB (valid date), Email (valid), Phone (digits)
   - "Next" button → move to Step 2

3. **Step 2: Ancillaries** (1h)
   - Checkboxes: Baggage (+ price), Insurance (+ price), Meal (+ price)
   - Total price display (base + ancillaries)
   - "Next" button → move to Step 3

4. **Step 3: Payment Method** (1h)
   - Radio buttons: Stripe, bKash, Nagad, Rocket
   - Display available methods (based on Neon settings)
   - "Continue" → redirect to payment processor

5. **Step 4: Review & Confirm** (1h)
   - Display: Flight details, passengers, ancillaries, total price
   - "Confirm booking" button → Create booking in DB

**Deliverable:** User can complete 4-step booking flow (no payment yet)

**Files Created:**
- `app/(consumer)/booking/[flight_id]/page.tsx`
- `components/booking/stepper.tsx`
- `components/booking/step-1-passengers.tsx`
- `components/booking/step-2-ancillaries.tsx`
- `components/booking/step-3-payment-method.tsx`
- `components/booking/step-4-review.tsx`

**API Routes:**
- `POST /api/bookings/create` (create booking, return booking_id)

**Database:**
- Insert bookings + ancillaries into `bookings`, `booking_ancillaries` tables

---

### Day 6-7: Payment Integration (Stripe) (6 hours)

**Prerequisites:** Booking flow complete ✅

**Tasks:**
1. **Stripe Setup** (1h)
   - Create Stripe account (test keys)
   - Install: `npm install @stripe/react-stripe-js stripe`
   - Add keys to `.env.local`

2. **Payment Form Component** (2h)
   - Create `components/payment/stripe-form.tsx`
   - CardElement from Stripe
   - Handle card errors + validation
   - "Pay BDT [amount]" button

3. **Payment Processing** (2h)
   - Create `POST /api/payments/process-stripe` endpoint
   - Create PaymentIntent from Stripe
   - Return client_secret to frontend
   - Frontend confirms payment (confirmCardPayment)
   - On success: Update booking status → confirmed
   - On failure: Update booking status → failed, return error

4. **Webhook Handler** (1h)
   - Create `POST /api/webhooks/stripe` endpoint
   - Listen for: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Update booking status accordingly
   - Send confirmation email

**Deliverable:** Users can pay via Stripe (test mode), bookings confirmed

**Files Created:**
- `components/payment/stripe-form.tsx`
- `components/payment/payment-status.tsx`
- `lib/stripe.ts` (utilities)

**API Routes:**
- `POST /api/payments/process-stripe`
- `POST /api/webhooks/stripe`

**Database:**
- Insert/update `payments` table on payment completion

---

### Day 7-8: Confirmation & Polish (4 hours)

**Prerequisites:** Payment working ✅

**Tasks:**
1. **Confirmation Page** (2h)
   - Create `app/(consumer)/booking/[booking_id]/confirmation/page.tsx`
   - Display: Booking ref (ABC123), flight details, passengers, total price
   - "Download receipt" (PDF generation with jsPDF)
   - "View my bookings" link → account page
   - Email sent confirmation

2. **Email Notifications** (1h)
   - Setup SendGrid (or similar)
   - Send confirmation email on booking completion
   - Template: Booking ref, flight details, download link

3. **Priority #3 Integration: Skeletons** (1h)
   - Add FlightCardSkeleton to results page (during loading)
   - Wire useMinimumVisible hook (350ms floor)
   - Crossfade animation (AnimatePresence)
   - Test on throttled network

**Deliverable:** Complete consumer MVP (search → book → pay → confirmation)

**Files Created:**
- `app/(consumer)/booking/[booking_id]/confirmation/page.tsx`
- `lib/email.ts` (sendgrid)

---

## WEEK 2: Agency + Admin + Local Payments (Days 8-14)

### Days 8-9: Agency Dashboard Setup (6 hours)

**Tasks:**
1. Create `app/(agency)/layout.tsx` (agency dashboard shell)
2. Create `app/(agency)/dashboard/page.tsx` (main agency page)
3. Bookings table (view all agency bookings, filter by status/date/airline)
4. Commission tracker (total earned this month, breakdown by route)
5. Auth: Redirect non-agencies to consumer dashboard

**Deliverable:** Agencies can login and view their bookings + commissions

---

### Days 9-10: SuperAdmin Panel (6 hours)

**Tasks:**
1. Create `app/(admin)/layout.tsx`
2. Create `app/(admin)/analytics/page.tsx` (revenue, bookings, users, conversion)
3. Create `app/(admin)/users/page.tsx` (user list, search, suspend)
4. Create `app/(admin)/flights/page.tsx` (airline/airport management)
5. Charts: Revenue trend, booking volume, top routes

**Deliverable:** Admins can view analytics and manage users

---

### Days 11-12: Local Payments (bKash, Nagad, Rocket) (6 hours)

**Tasks:**
1. Integrate bKash API (sandbox):
   - Create `POST /api/payments/process-bkash`
   - Handle polling for payment status
   - Webhook: Update booking on completion

2. Integrate Nagad API (sandbox):
   - Create `POST /api/payments/process-nagad`
   - Similar to bKash

3. Integrate Rocket API (sandbox):
   - Create `POST /api/payments/process-rocket`
   - Similar to bKash

4. Update payment form: Show all 4 methods
5. Handle payment method fallback (Stripe if local methods fail)

**Deliverable:** Users can pay via bKash, Nagad, Rocket (test mode)

---

### Days 12-13: Seat Selection + Ancillaries (4 hours)

**Tasks:**
1. Create seat map component (cabin layout visualization)
2. Add to booking flow (after Step 2)
3. Show available/occupied/selected seats
4. Price display per seat (premium seats cost more)
5. Store seat selection in booking

**Deliverable:** Users can select seats during booking

---

### Days 13-14: Priority #3 Complete (Skeletons Integration) (4 hours)

**Tasks:**
1. Create `BookingCardSkeleton` (matches BookingCard anatomy)
2. Create `CheckoutSkeleton` (matches checkout form)
3. Integrate into booking page (before content loads)
4. Wire useMinimumVisible hook on all pages
5. Test on throttled network (2G/3G)
6. Verify no layout shift (CLS = 0)

**Deliverable:** All pages have professional skeleton loaders, Priority #3 complete

---

## WEEK 3: Partner + Motion Animations + Localization (Days 15-21)

### Days 15-16: Partner Dashboard (4 hours)

**Tasks:**
1. Create `app/(partner)/layout.tsx`
2. Generate referral links (`/ref/xyz123abc`)
3. Click tracking dashboard
4. Commission earnings view
5. Payout request form

**Deliverable:** Partners can generate links, track clicks, view earnings

---

### Days 16-18: Priority #5 Complete (Motion Animations) (6 hours)

**Tasks:**
1. Apply dropdownVariants (airport select, passenger select, payment methods)
2. Implement hover effects (cards: shadow e1→e2, scale 1.02)
3. Skeleton crossfade (AnimatePresence, mode="wait")
4. List stagger (max 8 items capped, staggerDelay helper)
5. Modal entrance/exit (fade + slide)
6. Toast animations (slide + fade)
7. Button transitions (all buttons: whileHover, whileTap)
8. Remove ambient animations (bouncing planes from hero)

**Deliverable:** Full motion polish across platform, Priority #5 complete

---

### Days 18-20: Bangla Localization + Local Features (6 hours)

**Tasks:**
1. Extract UI strings to `i18n` module
2. Bilingual toggle (top-right language switcher)
3. Bangla numerals option (user preference)
4. Visa indicators (per destination)
5. Prayer times (display in flight details)
6. Holiday alerts (Eid highlights)
7. WhatsApp support button
8. Test bilingual on all pages

**Deliverable:** Full Bangla UI, local market features

---

### Days 20-21: Testing + Deployment (4 hours)

**Tasks:**
1. E2E testing (all 4 stakeholder flows)
2. Mobile testing (iOS + Android)
3. Performance audit (Lighthouse)
4. Security review (OWASP)
5. Deploy to production (Vercel + Neon)
6. Setup monitoring (Sentry, PostHog)
7. Final QA + bug fixes

**Deliverable:** Production-ready platform, all features working, monitoring active

---

## IMPLEMENTATION DEPENDENCIES

```
Week 1:
  Day 1-2: Database setup
    ↓
  Day 2-3: Auth system
    ↓
  Day 4-5: Search + Results
    ↓
  Day 5-6: Booking flow (4 steps)
    ↓
  Day 6-7: Stripe payment
    ↓
  Day 7-8: Confirmation + Priority #3 skeletons

Week 2:
  Day 8-10: Agency + Admin setup (parallel with Week 1 Day 7-8)
  Day 11-12: Local payments (depends on payment infrastructure from Week 1)
  Day 12-13: Seat selection + ancillaries
  Day 13-14: Priority #3 polish

Week 3:
  Day 15-16: Partner dashboard (parallel with earlier tasks)
  Day 16-18: Priority #5 motion (depends on all components existing)
  Day 18-20: Localization (depends on all text frozen)
  Day 20-21: Testing + deployment
```

---

## BLOCKERS & MITIGATIONS

| Blocker | Impact | Mitigation |
|---------|--------|-----------|
| Neon connection fails | CRITICAL | Test connection string immediately (Day 1 morning) |
| Stripe API down | HIGH | Test Stripe test mode works (Day 6 morning) |
| bKash/Nagad sandbox unavailable | HIGH | Skip to Stripe-only MVP, add local payments in Phase 1.5 |
| Email service down | MEDIUM | Mock emails in dev, use SendGrid (robust) in prod |
| Payment webhook delays | MEDIUM | Add polling fallback (query payment status every 5s) |
| Neon storage limit exceeded | LOW | Monitor schema size daily, cleanup mock data if needed |
| NextAuth session issues | MEDIUM | Use simple JWT if NextAuth unreliable, migrate later |

---

## FILE STRUCTURE (Post-Implementation)

```
app/
├── (auth)/                          # Auth pages
│   ├── signin/page.tsx
│   ├── signup/page.tsx
│   ├── verify/page.tsx
│   └── reset-password/page.tsx
├── (consumer)/                      # Consumer routes
│   ├── search/page.tsx
│   ├── results/page.tsx
│   ├── booking/[flight_id]/page.tsx
│   ├── booking/[booking_id]/confirmation/page.tsx
│   ├── account/page.tsx
│   └── layout.tsx
├── (agency)/                        # Agency B2B
│   ├── dashboard/page.tsx
│   ├── bookings/page.tsx
│   ├── billing/page.tsx
│   └── layout.tsx
├── (partner)/                       # Partner affiliate
│   ├── dashboard/page.tsx
│   ├── earnings/page.tsx
│   └── layout.tsx
├── (admin)/                         # SuperAdmin
│   ├── analytics/page.tsx
│   ├── users/page.tsx
│   ├── flights/page.tsx
│   ├── payments/page.tsx
│   └── layout.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── flights/search/route.ts
│   ├── flights/[id]/route.ts
│   ├── bookings/create/route.ts
│   ├── bookings/[id]/route.ts
│   ├── payments/process-stripe/route.ts
│   ├── payments/process-bkash/route.ts
│   ├── payments/process-nagad/route.ts
│   ├── payments/process-rocket/route.ts
│   └── webhooks/stripe/route.ts
├── layout.tsx                       # Root layout
└── page.tsx                         # Homepage

lib/
├── db/
│   ├── index.ts                     # Neon connection
│   └── schema.ts                    # Drizzle tables
├── store/
│   ├── consumer.ts
│   ├── auth.ts
│   ├── agency.ts
│   ├── admin.ts
│   └── partner.ts
├── mock/
│   ├── flights.ts
│   ├── airlines.ts
│   ├── airports.ts
│   └── seed.ts
├── auth/
│   ├── verify.ts
│   └── otp.ts
├── payment/
│   ├── stripe.ts
│   ├── bkash.ts
│   └── nagad.ts
├── email.ts
└── i18n/                            # Bangla localization
    ├── en.json
    └── bn.json

components/
├── auth/
│   ├── signin-form.tsx
│   └── signup-form.tsx
├── search/
│   ├── search-widget.tsx
│   ├── airport-select.tsx           # Existing
│   ├── passenger-class-select.tsx   # Existing
│   └── date-range-field.tsx         # Existing
├── results/
│   ├── flight-card.tsx              # Existing
│   ├── flight-card-skeleton.tsx     # Existing
│   ├── results-list.tsx
│   └── filters-sidebar.tsx
├── booking/
│   ├── stepper.tsx
│   ├── step-1-passengers.tsx
│   ├── step-2-ancillaries.tsx
│   ├── step-3-payment-method.tsx
│   └── step-4-review.tsx
├── payment/
│   ├── stripe-form.tsx
│   ├── bkash-form.tsx
│   ├── nagad-form.tsx
│   └── payment-status.tsx
├── dashboard/
│   ├── agency-bookings-table.tsx
│   ├── admin-analytics.tsx
│   └── partner-earnings.tsx
└── ui/
    ├── skeleton.tsx                 # Existing
    ├── perforated-divider.tsx       # Existing
    └── ...

docs/superpowers/
├── specs/
│   └── 2026-08-01-trip-com-bangladesh-design.md
└── plans/
    └── 2026-08-01-implementation-plan.md
```

---

## TESTING CHECKLIST

- [ ] Unit tests: Auth, payment, RBAC (min 20 tests)
- [ ] E2E tests: All 4 stakeholder flows (Playwright, 4+ scenarios)
- [ ] Mobile: iOS Safari, Android Chrome (responsive)
- [ ] Performance: Lighthouse score ≥90 (all pages)
- [ ] Security: OWASP top 10 review, no critical vulns
- [ ] Load test: 100 concurrent searches (<2s response)
- [ ] Accessibility: Keyboard nav, screen reader (axe-core)

---

**READY TO EXECUTE** ✅

Start with Day 1-2 (Database + NextAuth setup). Estimated velocity: 3-4 tasks per day across weeks 1-2, tapering to final push in week 3.
