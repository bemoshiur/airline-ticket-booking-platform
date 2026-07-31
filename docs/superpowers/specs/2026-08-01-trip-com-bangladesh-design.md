# Trip.com-Like Multi-Stakeholder Flight Booking Platform for Bangladesh

**Document:** Comprehensive System Design  
**Date:** 2026-08-01  
**Status:** Approved for Implementation  
**Timeline:** 3 weeks to MVP (all stakeholders, all features)

---

## 1. EXECUTIVE SUMMARY

Transform airline-ticket-management into a **production-grade, multi-stakeholder flight booking platform** matching Trip.com's capabilities, optimized for Bangladesh market, with real-time inventory (mock data → Phase 1.5 swaps to real IATA APIs).

**Stakeholders in Phase 1:**
- **EndUser (B2C):** Consumer flight search & booking with reviews, loyalty
- **Agency (B2B):** Bulk booking, commission tracking, employee management
- **Partner:** Affiliate/referral dashboard with API integration
- **SuperAdmin:** Platform analytics, user management, settlement

**Core Differentiation:** Multi-tenant SaaS architecture, Bangladesh payment methods (bKash, Nagad), Bangla localization, WhatsApp support.

---

## 2. ARCHITECTURE

### 2.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, TailwindCSS 4, Framer Motion 12 |
| **State** | Zustand (separate stores per stakeholder) |
| **Database** | PostgreSQL (Neon Serverless) + Drizzle ORM 0.30+ |
| **Auth** | NextAuth.js 5 (email, phone, social, Magic Link) |
| **Payments** | Stripe (international), bKash, Nagad, Rocket SDKs |
| **APIs** | Next.js Route Handlers (REST), middleware for RBAC |
| **Hosting** | Vercel (frontend) + Neon Postgres (database) |
| **CDN** | Cloudflare (static assets, image optimization) |
| **Monitoring** | Sentry (errors), PostHog (analytics) |

### 2.2 Architectural Pattern

**Hybrid Modular Approach:**
```
Frontend (Next.js App Router)
  ├── Separate route groups per stakeholder: (consumer), (agency), (partner), (admin)
  ├── Feature flags (role-based rendering)
  ├── Shared API layer (REST endpoints)
  └── Zustand stores: consumer.store, agency.store, admin.store

Backend (API Layer)
  ├── Route handlers: /api/flights, /api/bookings, /api/payments, /api/admin
  ├── Middleware: Authentication (NextAuth), RBAC enforcement
  ├── Server actions: Mutations (create booking, process payment)
  └── Drizzle ORM: Direct Postgres queries

Database (Neon Postgres)
  ├── Multi-tenant schema (org_id isolation)
  ├── 10 core tables (users, flights, bookings, payments, etc.)
  └── Migrations via Drizzle (schema versioning)
```

---

## 3. DATA MODEL (Drizzle Schema)

### Core Tables

```typescript
// Users & Authentication
users {
  id: uuid (PK),
  email: string (UNIQUE),
  phone: string (nullable),
  password_hash: string (nullable, for email auth),
  full_name: string,
  avatar_url: string (nullable),
  role: 'enduser' | 'agency' | 'partner' | 'superadmin',
  org_id: uuid (FK → organizations, nullable for individual endusers),
  status: 'active' | 'suspended' | 'deleted',
  verified_at: timestamp (nullable),
  created_at: timestamp,
  updated_at: timestamp,
  last_login: timestamp (nullable)
}

organizations {
  id: uuid (PK),
  name: string,
  type: 'individual' | 'agency' | 'partner' | 'franchise',
  country: 'BD' (fixed),
  currency: 'BDT' (fixed),
  tier: 'free' | 'premium' | 'enterprise',
  commission_rate: decimal (0-10%, for agencies),
  payment_method: 'bkash' | 'nagad' | 'rocket' | 'bank_transfer',
  payment_account: string (phone/account, encrypted),
  tax_id: string (nullable, for agencies),
  api_key: string (nullable, for partners, hashed),
  created_at: timestamp,
  updated_at: timestamp
}

// Flight Inventory (Mock → Real IATA APIs in Phase 1.5)
airlines {
  id: uuid (PK),
  iata_code: string (UNIQUE, 2-3 chars: BA, SQ, DXB-carrier),
  name: string,
  logo_url: string,
  country: string,
  alliance: string (nullable: OneWorld, SkyTeam, Star Alliance, None),
  rating: decimal (1-5, average from reviews),
  created_at: timestamp
}

airports {
  id: uuid (PK),
  iata_code: string (UNIQUE, 3 chars: DAC, DXB, KUL),
  icao_code: string (4 chars),
  city: string,
  city_bn: string (Bangla),
  country: string,
  country_code: string (2 chars: BD, AE),
  timezone: string (Asia/Dhaka),
  popular: integer (sorting priority),
  domestic: boolean,
  created_at: timestamp
}

flights {
  id: uuid (PK),
  airline_id: uuid (FK → airlines),
  flight_number: string (unique per airline: 123, BA456),
  departure_airport_id: uuid (FK → airports),
  arrival_airport_id: uuid (FK → airports),
  departure_time: timestamp (UTC),
  arrival_time: timestamp (UTC),
  duration_minutes: integer,
  aircraft_type: string (Boeing 737, Airbus A320),
  stops: integer (0, 1, 2+),
  layover_airports: string (nullable, JSON: ["IST", "DEL"]),
  base_price: integer (BDT, in poisha: 500000 = 5000 BDT),
  currency: 'BDT' (fixed),
  seats_available: integer,
  seats_economy: integer,
  seats_business: integer,
  seats_first: integer,
  operating_days: string (SMTWTFS, bit mask for recurring flights),
  iata_data: jsonb (raw IATA response when integrated),
  source: 'mock' | 'sabre' | 'amadeus' | 'travelport',
  created_at: timestamp,
  updated_at: timestamp
}

// Bookings
bookings {
  id: uuid (PK),
  booking_ref: string (UNIQUE, 6 chars: ABC123, alphanumeric),
  user_id: uuid (FK → users),
  org_id: uuid (FK → organizations, for agency bookings),
  flight_id: uuid (FK → flights),
  status: 'pending_payment' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled',
  passengers: jsonb [
    {
      id: uuid,
      name: string,
      email: string,
      phone: string,
      date_of_birth: date,
      passport_number: string (nullable),
      type: 'adult' | 'child' | 'kid' | 'infant',
      seat: string (nullable, E12 format before seat selection)
    }
  ],
  cabin_class: 'economy' | 'premium_economy' | 'business' | 'first',
  total_price: integer (BDT, in poisha),
  discount: integer (BDT, promotional),
  final_price: integer (BDT),
  ancillaries: jsonb [
    {
      type: 'baggage' | 'insurance' | 'meal' | 'seat_selection',
      price: integer,
      details: string
    }
  ],
  payment_id: uuid (FK → payments, nullable until paid),
  payment_method: 'stripe' | 'bkash' | 'nagad' | 'rocket' (set after payment selection),
  cancellation_reason: string (nullable),
  cancelled_at: timestamp (nullable),
  created_at: timestamp,
  updated_at: timestamp
}

payments {
  id: uuid (PK),
  booking_id: uuid (FK → bookings),
  amount: integer (BDT, in poisha),
  currency: 'BDT' (fixed),
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded',
  payment_method: 'stripe' | 'bkash' | 'nagad' | 'rocket' | 'bank_transfer',
  stripe_payment_intent_id: string (nullable, when Stripe used),
  bkash_transaction_id: string (nullable, when bKash used),
  processor_response: jsonb (full response from payment processor),
  error_message: string (nullable, if failed),
  created_at: timestamp,
  updated_at: timestamp,
  completed_at: timestamp (nullable)
}

// Reviews & Ratings
reviews {
  id: uuid (PK),
  booking_id: uuid (FK → bookings),
  user_id: uuid (FK → users),
  airline_id: uuid (FK → airlines),
  route: string (DAC-DXB),
  rating: integer (1-5 stars),
  comment: string (max 500 chars),
  verified_booking: boolean (true if real booking),
  created_at: timestamp
}

// Agency Commission Tracking
agency_commissions {
  id: uuid (PK),
  org_id: uuid (FK → organizations, agency),
  booking_id: uuid (FK → bookings),
  commission_rate: decimal (percent),
  commission_amount: integer (BDT, in poisha),
  status: 'pending' | 'earned' | 'paid',
  invoice_id: uuid (FK → invoices, nullable),
  paid_at: timestamp (nullable),
  created_at: timestamp
}

invoices {
  id: uuid (PK),
  org_id: uuid (FK → organizations),
  invoice_number: string (UNIQUE: INV-2026-0001),
  period_start: date,
  period_end: date,
  total_bookings: integer,
  total_commission: integer (BDT, in poisha),
  status: 'draft' | 'sent' | 'paid',
  payment_method: string (org's payment_method),
  created_at: timestamp,
  paid_at: timestamp (nullable)
}

// Partner Referrals
partner_referrals {
  id: uuid (PK),
  partner_id: uuid (FK → organizations, partner type),
  unique_link: string (UNIQUE: /ref/xyz123abc),
  booking_id: uuid (FK → bookings, nullable until user books),
  commission_rate: decimal (percent, set per partner),
  earned_amount: integer (BDT, in poisha),
  status: 'pending' | 'earned' | 'paid',
  clicked_at: timestamp (when link clicked),
  booked_at: timestamp (nullable, when booking completed),
  paid_at: timestamp (nullable),
  created_at: timestamp
}

// Support & Settings
support_tickets {
  id: uuid (PK),
  user_id: uuid (FK → users),
  booking_id: uuid (FK → bookings, nullable),
  subject: string,
  message: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
  priority: 'low' | 'medium' | 'high',
  created_at: timestamp,
  resolved_at: timestamp (nullable)
}

admin_settings {
  id: uuid (PK),
  key: string (UNIQUE: 'commission_tiers', 'payment_methods'),
  value: jsonb (configuration data),
  updated_at: timestamp
}
```

---

## 4. AUTHENTICATION & AUTHORIZATION

### 4.1 NextAuth Configuration

**Providers:**
- Email (Magic Link or password)
- Phone (SMS OTP via Twilio)
- Google OAuth
- GitHub OAuth

**Session Flow:**
```
/auth/signin 
  → Select role (consumer/agency/partner)
  → Email/phone verification
  → Optional: Organization selection (for agencies)
  → Redirect to role dashboard
```

**Database Session:**
```typescript
session {
  user: {
    id: uuid,
    email: string,
    name: string,
    role: 'enduser' | 'agency' | 'partner' | 'superadmin',
    org_id: uuid (nullable for individual endusers),
    avatar: string
  },
  expires: timestamp
}
```

### 4.2 Role-Based Access Control (RBAC)

**Permission Matrix:**

| Feature | EndUser | Agency | Partner | SuperAdmin |
|---------|---------|--------|---------|-----------|
| Search Flights | ✅ | ✅ | ❌ | ✅ |
| Book Flights | ✅ | ✅ (bulk) | ❌ | ✅ |
| View Own Bookings | ✅ | ✅ | ❌ | ✅ |
| View Agency Bookings | ❌ | ✅ | ❌ | ✅ |
| Commission Tracking | ❌ | ✅ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |
| Payment Settlement | ❌ | ❌ | ❌ | ✅ |
| GDS Integration | ❌ | ❌ | ❌ | ✅ |
| Analytics | ❌ | ✅ (own) | ✅ (own) | ✅ (all) |

**Middleware Enforcement:**
```typescript
// Protect API routes by role
export function withAuth(handler, requiredRoles: string[]) {
  return async (req, res) => {
    const session = await getServerSession();
    if (!session || !requiredRoles.includes(session.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return handler(req, res, session);
  };
}

// Usage: export const GET = withAuth(handler, ['superadmin']);
```

---

## 5. CORE FEATURES BY STAKEHOLDER

### 5.1 EndUser (B2C Consumer) Features

**1. Advanced Search**
- One-way, round-trip, multi-city flights
- From/to airports (autocomplete, popular list)
- Flexible dates (calendar view)
- Passenger count (adult, child, kid, infant)
- Cabin class (economy, premium economy, business, first)
- Filters: Direct only, preferred airlines

**2. Results Page**
- Sortable by: Price (low-high), Duration, Departure time, Airline rating
- Filters: Stops (0, 1, 2+), Airlines (multi-select), Price range, Departure time, Baggage
- Fare matrix: Price grid by date (heatmap)
- Flight card: Airline logo + name, departure/arrival times, duration + stops, price, "Select" button

**3. Booking Flow (4 Steps)**
- Step 1: Passenger details (name, DOB, passport, email, phone per passenger)
- Step 2: Ancillaries (baggage, insurance, meals, extras)
- Step 3: Payment (select method: Stripe, bKash, Nagad, Rocket)
- Step 4: Review & confirm (summary, terms agreement)
- Confirmation: Booking ref (ABC123), email receipt, WhatsApp notification

**4. Seat Selection**
- Real-time seat map (cabin layout, occupied/available/selected)
- Price display per seat (premium seats cost more)
- Row/column selection with keyboard support

**5. Account Dashboard**
- Profile: Name, email, phone, avatar, preferences (language, currency)
- Bookings: Past/upcoming flights, status, download receipt, cancel option
- Payment methods: Saved cards (Stripe), bKash shortcuts
- Loyalty: Points balance, redeemable offers
- Support: Contact history, ticket status

**6. Reviews & Ratings**
- Rate airline (1-5 stars) + comment after flight
- Sort results by rating (shows average per airline)
- Verified booking badge (only those who booked can review)

---

### 5.2 Agency (B2B) Features

**1. Flight Search & Bulk Booking**
- Same search as consumer
- Bulk booking: Upload CSV (name, DOB, email) or manual entry
- Agency margin: Display margin per route (set by superadmin)
- Quick-book: Pre-fill known passenger details

**2. Booking Dashboard**
- Table view: Booking ref, passenger, flight, date, status, price, margin earned
- Filters: Date range, status, airline, route, agent
- Bulk actions: Download receipts, export CSV, resend confirmations
- Search: By booking ref, passenger name, flight number

**3. Commission Tracking**
- Real-time earnings: Total this month, pending payouts, paid
- Commission breakdown: Per booking, per route, per agent
- Charts: Monthly trend, top routes, agent leaderboard

**4. Billing & Invoices**
- Monthly invoice: Total bookings, total commission, settlement date
- Download PDF, email
- Payment status: Pending, paid (show bank transfer details)
- Bank account: Edit payment method (bKash, Nagad, bank account)

**5. Employee Management**
- Add agents: Email, role (agent/manager)
- Track per-agent: Bookings, revenue, commission earned
- Suspend agent if needed

**6. Reports**
- Revenue trend (line chart, monthly)
- Top routes (bar chart, bookings vs revenue)
- Passenger demographics (age, type, repeat)
- Export: CSV, PDF

---

### 5.3 Partner (Affiliate) Features

**1. Referral Dashboard**
- Unique referral link: /ref/xyz123abc (copy/share)
- Click tracking: Total clicks, unique users, conversion rate
- Commission rate: Set by superadmin (e.g., 2%)
- Earnings: Pending, earned, paid total

**2. Marketing Assets**
- Banners (300x250, 728x90) - download PNG
- Social copy: Pre-written posts for Facebook, Instagram
- Landing page template: HTML/CSS (white-label)

**3. Integration**
- API keys: Generate/revoke test and live keys
- Webhook: Booking created event (test in sandbox)
- Documentation: Embed guide, URL parameters

**4. Payouts**
- Earnings: Breakdown by month, booking
- Withdraw: Manual payout request, bank transfer
- History: Past payouts, status, amount

---

### 5.4 SuperAdmin Panel Features

**1. Analytics Dashboard**
- Key metrics: Total revenue (BDT), bookings count, users, conversion rate
- Charts: Revenue trend (line), booking volume (bar), top routes (pie)
- Real-time: Updates every 5 minutes
- Export: PDF report

**2. User Management**
- List: Email, role, organization, status, created date
- Actions: View details, suspend/activate, change role, delete
- Search/filter: By email, role, status
- Bulk actions: Suspend multiple, export CSV

**3. Flight Inventory**
- Manage airlines: Add, edit, disable, set rating override
- Manage airports: Add, edit, set popularity
- Manage routes: View all flights, set commission tiers per route
- GDS settings: Sabre/Amadeus/Travelport credentials (encrypted)

**4. Payment Settlement**
- Pending payouts: List agencies awaiting payment
- Process payment: Mark as paid, record bank transfer ref
- Disputes: Handle payment/refund issues
- Reports: Settlement history, total paid out

**5. Support Tickets**
- Inbox: List open tickets, priority (high/medium/low), age
- Ticket view: Full conversation, attachments
- Assign: To support agent
- Resolve: With ticket summary (email sent to user)

**6. Settings**
- Commission tiers: Adjust agency commission rates
- Payment methods: Enable/disable bKash, Nagad, Rocket
- Compliance: Tax settings, refund policies
- API: Rate limiting, webhook URLs

---

## 6. PAYMENT INTEGRATION

### 6.1 Supported Payment Methods

**International:**
- Stripe: Credit/debit cards (Visa, Mastercard, Amex)

**Local (Bangladesh):**
- bKash: Mobile wallet (phone number based)
- Nagad: Mobile banking (phone/account)
- Rocket: Mobile banking (account)
- Bank transfer: Agency settlement only

### 6.2 Payment Flow

```
Checkout (Step 3: Payment Selection)
  ↓
Select payment method (Stripe/bKash/Nagad/Rocket)
  ↓
Redirect to payment processor
  ↓
Enter payment details (card/phone/account)
  ↓
Processor verifies & authorizes
  ↓
Webhook: Payment completed → Update booking status
  ↓
Send confirmation email + WhatsApp
  ↓
Booking confirmed (Step 4)
```

### 6.3 Webhook Handlers

**Stripe:**
- `payment_intent.succeeded` → Mark booking as confirmed
- `payment_intent.payment_failed` → Update payment status, show retry

**bKash/Nagad/Rocket:**
- Polling-based (query status every 5 seconds for 2 minutes)
- Fallback: User can retry if timed out

### 6.4 Error Handling

- Payment declined → Show error, allow retry
- Network timeout → Queue booking, retry in background
- Invalid card → Show validation error, allow retry

---

## 7. UI/UX: BANGLADESH MARKET ADAPTATION

### 7.1 Bilingual Support (English + Bangla)

**When:**
- Primary language: English
- Toggle: Top-right language switcher
- Bangla strings: All UI labels, flight city names, airport names

**Examples:**
- "From" → "From" (English) / "থেকে" (Bangla)
- "Dhaka" → "Dhaka" / "ঢাকা"
- "Departure" → "Departure" / "প্রস্থান"

**Bangla Numerals (Optional):**
- User preference: "Use Bangla numerals"
- Display: ১২৩ instead of 123
- Used in: Prices, dates, times, seat numbers

### 7.2 Popular Routes (Bangladesh-Centric)

**Top 10 Routes (by traffic):**
1. Dhaka (DAC) ↔ Dubai (DXB) - Business/work
2. Dhaka ↔ Kuala Lumpur (KUL) - Malaysian diaspora
3. Dhaka ↔ Bangkok (BKK) - Tourism/business
4. Dhaka ↔ Singapore (SIN) - Business
5. Dhaka ↔ Istanbul (IST) - Medical tourism, transit
6. Dhaka ↔ Kolkata (CCU) - Regional (India)
7. Dhaka ↔ Chittagong (CGP) - Domestic
8. Dhaka ↔ Sylhet (ZYL) - Domestic
9. Dhaka ↔ Cox's Bazar (CXB) - Tourism
10. Dhaka ↔ Jeddah (JED) - Hajj/religious

**Feature:** Auto-pin top 10 routes in search results (before alphabetical list)

### 7.3 Local Context Features

**Visa Indicators:**
- Show visa requirement per destination
- Icon + text: "Visa-free" / "E-visa available" / "Visa required"
- Link to embassy info (optional)

**Prayer Times (Salah Times):**
- Show prayer times for destination (if Muslim-majority country)
- Display in flight details (for booking planning)
- Example: "Prayer times in Dubai: Fajr 5:30, Dhuhr 12:45, Asr 3:45, Maghrib 6:30, Isha 8:00"

**Holiday Alerts:**
- Highlight Eid holidays (Eid ul-Fitr, Eid ul-Adha)
- Alert: "High demand during Eid — book early"
- Show holiday dates in calendar

**Local Payment Prominence:**
- bKash/Nagad/Rocket as primary payment options (top 3)
- Stripe as secondary (international users)
- Default: Suggest local method if user's country is BD

**WhatsApp Support:**
- Chat button: "Message us on WhatsApp"
- Booking confirmation: Send WhatsApp message (with booking details)
- Support: Link to WhatsApp chat for urgent issues

### 7.4 Design System (Existing)

- **Enterprise polish:** Tabular numerals, optical baseline alignment
- **Colors:** Brand red (#D82128), dark mode support
- **Animations:** 350ms visibility gate for skeletons, staggered list items
- **Typography:** System fonts (SF Pro, Inter)
- **Shadow hierarchy:** e1/e2/e3 elevation tokens
- **Responsive:** Mobile-first, 4-col desktop grid

---

## 8. IMPLEMENTATION TIMELINE

### Week 1: Foundation + Consumer MVP (Days 1-7)

**Days 1-2: Project Setup**
- Drizzle ORM setup (Neon Postgres connection)
- Database schema + migrations
- NextAuth configuration (email, phone providers)
- Zustand stores (consumer.store, auth.store)
- API folder structure

**Days 2-3: Auth System**
- /auth/signin, /auth/signup, /auth/verify pages
- Email/phone verification
- Session management
- Protected routes middleware

**Days 4-5: Flight Search & Results**
- Flight search API (/api/flights/search)
- Mock flight data (50+ airlines, 100+ routes)
- Search page (from/to, dates, passengers)
- Results page (sortable, filterable flights)
- Flight card component

**Days 6-7: Booking Flow (Steps 1-4)**
- Passenger details form (Step 1)
- Ancillaries selection (Step 2)
- Payment method selection (Step 3)
- Review & confirm (Step 4)
- Booking creation API (/api/bookings/create)

**Days 7-8: Payment Integration (Stripe)**
- Stripe setup (test keys)
- Payment form (card entry)
- Payment processing + webhook handler
- Booking confirmation + email

**Deliverable:** Consumer can search, book, and pay for flights (Stripe only)

---

### Week 2: Agency + Admin + Payment Polish (Days 8-14)

**Days 8-9: Agency Dashboard**
- Agency route group setup
- Bulk booking form (CSV upload or manual)
- Bookings table (view, filter, export)
- Commission tracking dashboard

**Days 9-10: SuperAdmin Panel**
- Admin route group setup
- Analytics dashboard (revenue, bookings, users)
- User management (list, suspend, search)
- Flight/airline management

**Days 11-12: Local Payments (bKash, Nagad, Rocket)**
- bKash SDK integration (sandbox)
- Nagad API integration
- Rocket API integration
- Webhook handlers for each

**Days 12-13: Seat Selection + Ancillaries**
- Seat map component (cabin layout)
- Seat selection flow (add to booking)
- Baggage/insurance/meal selection
- Price calculation with ancillaries

**Days 13-14: Polish & Testing**
- Complete Priority #3 (skeleton loaders) integration
- Results page skeletons (match flight card height)
- Booking page skeletons
- 350ms visibility gate for loaders
- Cross-browser testing (Chrome, Safari, Firefox)

**Deliverable:** Agencies can bulk book, admins can manage platform, all payment methods work, UI has professional skeletons

---

### Week 3: Partner + Motion Animations + Localization (Days 15-21)

**Days 15-16: Partner Dashboard**
- Partner route group setup
- Referral link generation (/ref/xyz123abc)
- Click tracking + conversion dashboard
- Commission earnings view
- Payout request form

**Days 16-17: Complete Priority #5 (Motion Animations)**
- Apply motion tokens across:
  - Dropdown animations (airport select, passenger select)
  - Button hover/tap states (scale, shadow transitions)
  - Skeleton crossfade transitions (AnimatePresence)
  - List item stagger animations (max 8 items)
  - Modal entrance/exit (fade + slide)
  - Toast animations (slide + fade)
- Remove ambient hero animations (bouncing planes)

**Days 18-19: Bangla Localization + Local Touches**
- Bilingual UI (English + Bangla strings)
- Bangla numerals option (user preference)
- Visa requirement indicators (per destination)
- Prayer times (display in flight details)
- Holiday alerts (Eid highlights)
- WhatsApp support button

**Days 19-20: Reviews & Ratings System**
- Review form (rate airline, comment)
- Verified booking badge
- Sort results by rating
- Display airline average rating

**Days 20-21: Testing, Bug Fixes, Deployment**
- End-to-end testing (all 4 stakeholder flows)
- Performance optimization (Lighthouse audit)
- Security review (OWASP top 10)
- Production deployment (Vercel + Neon)
- Setup monitoring (Sentry, PostHog)

**Deliverable:** Production-ready multi-stakeholder platform (all features, all stakeholders, full localization, enterprise animations)

---

## 9. TESTING STRATEGY

### 9.1 Unit Tests
- Auth: Login, signup, token refresh
- Payment processing: Stripe, bKash, Nagad
- RBAC: Permission checks per role
- Stores: State mutations, hydration
- Utilities: Price calculation, date formatting

### 9.2 Integration Tests
- Search → Book → Payment flow (all stakeholders)
- Agency bulk booking + commission calculation
- Partner referral tracking + earnings
- Admin user management + analytics

### 9.3 E2E Tests (Playwright)
- Consumer: Search → Results → Book → Pay → Confirmation
- Agency: Login → Bulk book → View commissions → Request payout
- Partner: Login → Generate link → Share → Track clicks → Payout
- Admin: Login → View analytics → Manage user → Settle payment

### 9.4 Manual Testing
- Mobile responsiveness (iOS + Android)
- Payment flows (test mode for all methods)
- Visual regression (screenshots per page, all roles)
- Accessibility (keyboard navigation, screen readers)

### 9.5 Load Testing
- Target: 100 concurrent searches
- Tool: k6 or Apache JMeter
- Success: <2s response time, <5% error rate

---

## 10. DEPLOYMENT & MONITORING

### 10.1 Staging Environment
- Vercel (staging branch, auto-deploy on PR)
- Neon (staging database, separate schema)
- Stripe test keys (full testing)
- bKash/Nagad sandbox (full testing)

### 10.2 Production Deployment
- Vercel main branch (auto-deploy)
- Neon production database (backed up daily)
- Stripe production keys (enable after testing)
- bKash/Nagad production (requires approval from provider)
- Cloudflare CDN (static assets, image optimization)

### 10.3 Monitoring & Observability

**Error Tracking (Sentry):**
- Capture all unhandled errors
- Alert on critical errors (payment failures, auth issues)
- Source map upload (debug production issues)

**Analytics (PostHog):**
- Event tracking: Search, book, pay (per stakeholder)
- Funnel analysis: Search → Results → Checkout → Payment
- User retention: Repeat bookings
- Feature usage: Which features used most

**Database Monitoring (Neon Dashboard):**
- Query performance (slow query log)
- Connection count (detect leaks)
- Storage usage (growth trend)

**Uptime Monitoring:**
- UptimeRobot or similar (ping every 5 minutes)
- Alert on >5 minutes downtime
- Dashboard: Uptime percentage per month

---

## 11. SECURITY CONSIDERATIONS

### 11.1 Authentication
- Passwords hashed (bcrypt, salt rounds ≥12)
- Session tokens: Signed, HTTP-only, secure cookies
- Magic links: Expire after 15 minutes
- SMS OTP: Expire after 10 minutes, max 3 attempts

### 11.2 Authorization
- RBAC middleware on all protected endpoints
- Row-level security: Agents see only own bookings, not other agencies
- API key hashing: Store bcrypt hash, never plaintext

### 11.3 Payment Security
- PCI compliance: Never store full card numbers (Stripe handles)
- HTTPS enforced (production)
- Webhook signature verification (Stripe, bKash signatures)
- Encryption: Sensitive fields (bank accounts, API keys) encrypted at rest

### 11.4 Data Protection
- GDPR-ready: User data export, deletion
- Rate limiting: 100 requests/min per IP (login), 1000 per user (API)
- SQL injection prevention: Drizzle parameterized queries
- XSS prevention: React auto-escaping

### 11.5 Third-Party Integrations
- API key rotation (quarterly)
- Webhook signature validation
- Timeout limits (30s for external API calls)

---

## 12. DEPLOYMENT CHECKLIST (Before Launch)

- [ ] Database migrations (all tables created)
- [ ] NextAuth configured (email, SMS, social)
- [ ] Stripe account (production keys obtained)
- [ ] bKash, Nagad, Rocket (production accounts, testing passed)
- [ ] Neon backup automated (daily)
- [ ] Sentry project created (error tracking)
- [ ] PostHog project created (analytics)
- [ ] Email service configured (SendGrid or similar)
- [ ] WhatsApp business account (for notifications)
- [ ] Domain SSL certificate (HTTPS)
- [ ] robots.txt + sitemap.xml
- [ ] Privacy policy + terms of service
- [ ] Contact support flow (email or WhatsApp)
- [ ] Admin onboarding (superadmin account created)
- [ ] Load test passed (100 concurrent users)
- [ ] Security audit (OWASP top 10 review)
- [ ] Legal review (payment compliance, data privacy)

---

## 13. FUTURE PHASES (Post-MVP)

### Phase 1.5 (Week 4): Database Migration + Real IATA APIs
- Migrate mock flight data → Real Sabre/Amadeus API
- Replace mock airlines/airports → Real IATA database
- Update pricing to real-time rates
- Inventory management (live seat counts)

### Phase 2 (Weeks 5-6): Advanced Features
- Fare matrix (price heatmap by date)
- Price alerts (user subscribes to route, get email when price drops)
- Loyalty program (points for bookings, redeem for discounts)
- Hotel + car rental (ancillary services)

### Phase 3 (Weeks 7-8): White-Label & Scale
- Partner white-label portal (custom branding)
- Franchise model (individual agencies with own branding)
- Multi-language support (beyond Bangla)
- Mobile app (native iOS/Android)

---

## 14. ASSUMPTIONS & CONSTRAINTS

### Assumptions
- Neon Postgres available (✓ confirmed)
- Stripe/bKash/Nagad SDKs are production-ready (✓ confirmed)
- NextAuth.js stable for multi-tenant auth (✓ confirmed)
- Mock flight data sufficient for MVP (✓ will use real IATA in Phase 1.5)
- Vercel handles traffic spike (✓ auto-scales)
- Users have WhatsApp (standard in BD) (✓ ~70% smartphone penetration)

### Constraints
- **Timeline:** 3 weeks to MVP (aggressive, but achievable with focused scope)
- **Budget:** Stripe transaction fees (2.9% + $0.30), Neon free tier + paid tier
- **Regulatory:** Bangladesh Securities & Exchange Commission (for payment settlement)
- **Payment Compliance:** PCI DSS (Stripe handles), local payment provider regulations

---

## 15. SUCCESS CRITERIA (MVP Launch)

- ✅ All 4 stakeholder roles can login and access dashboard
- ✅ Consumer can search, book, and pay (Stripe + local methods)
- ✅ Agency can bulk book and track commissions
- ✅ Partner can generate referral links and track earnings
- ✅ Admin can view analytics and manage users
- ✅ All pages have skeleton loaders + smooth animations
- ✅ Bilingual UI (English + Bangla)
- ✅ Mobile responsive (iOS + Android)
- ✅ <2s page load time (Lighthouse)
- ✅ 0 critical security vulnerabilities
- ✅ Production deployment (Vercel + Neon)
- ✅ Monitoring active (Sentry, PostHog)

---

**Status:** ✅ APPROVED FOR IMPLEMENTATION  
**Next Step:** Invoke writing-plans skill → Create detailed implementation plan  
**Target Launch:** 2026-08-22 (3 weeks from 2026-08-01)
