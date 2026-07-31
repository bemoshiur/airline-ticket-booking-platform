# Platform status

**Last verified:** 2026-08-01 — `npm run build` and `npm run typecheck` pass;
search → price → book → read-back exercised end to end against Neon.

---

## Correction to earlier status

An earlier version of this file claimed the platform was "production ready" and
that the build passed TypeScript checks. That was not true. Verifying it turned
up the following, all now fixed:

| Problem | Effect |
|---|---|
| Session never carried `role` / `orgId` | All 20 RBAC checks compared `undefined`. Every agency, partner, and admin endpoint rejected every caller. |
| Route folders named `%5Bid%5D`, `%5B...nextauth%5D` on disk | `/api/auth/[...nextauth]` did not exist, so **sign-in was impossible**. `/api/bookings/[id]` and `/api/flights/[id]` were static literal paths. |
| 35 TypeScript errors | `npm run build` failed outright. |
| Suspended users could sign in | `authorize` never checked `status`; admin suspension had no effect. |
| `/api/auth/signup` documented but absent | Nothing could create an account. |
| Flight times stored as naive timestamps | Departure times shifted by hours through the server's local zone. |
| Booking price taken from a stale local read | No re-quote before charging. |

Treat unverified status claims in any doc as unverified.

---

## What works, and how it was checked

| Area | Verified by |
|---|---|
| Flight search (local inventory) | `POST /api/flights/search` returned 2 seeded DAC→DXB offers with correct per-passenger pricing |
| Local-date correctness | Same query on the neighbouring UTC day returned 0 — the flight belongs to the next Dhaka day |
| Input validation | Same-airport and 12-passenger queries rejected with field-level errors |
| Cabin pricing | `business` returned 1.5× the economy fare against business seat counts |
| Offer repricing | `POST /api/flights/price` round-tripped an offer; unknown id → `409 offer_expired` |
| Registration | `enduser` created; `superadmin` self-registration rejected; short password rejected |
| Session claims | `/api/auth/session` returned `id`, `role`, `orgId` after a credentials sign-in |
| Booking creation | Booked 2 passengers from an offer, read it back as owner, `401` anonymously |
| RBAC | `/api/admin/analytics` returned `403` for an `enduser` session |
| Rate limiting | 30 searches passed, the rest returned `429` |

Not yet exercised: Stripe payment and webhook (needs live test keys), agency
bulk booking, partner dashboard, admin settlements. These compile and are
type-checked, but have not been run.

---

## Architecture

- **Frontend** — Next.js 16 (App Router), React 19, TailwindCSS 4, Zustand 5
- **API** — Route Handlers, zod-validated at every boundary
- **Data** — PostgreSQL (Neon) via Drizzle ORM, 13 tables
- **Auth** — NextAuth v5, credentials + bcrypt, JWT session carrying role/orgId
- **Distribution** — pluggable provider layer, see [docs/flight-distribution.md](docs/flight-distribution.md)
- **Payments** — Stripe (charged in USD, ledgered in BDT); bKash/Nagad/Rocket pending

## Endpoints

**Shopping and booking**
```
POST /api/flights/search          Search offers (30/min)
GET  /api/flights/:id             Local schedule detail
POST /api/flights/price           Authoritative re-quote (20/min)
POST /api/bookings/create         Book from an offer, repriced server-side
GET  /api/bookings/:id            Booking detail (owner / agency / admin only)
POST /api/payments/process-stripe Payment intent, idempotent per booking+amount
POST /api/webhooks/stripe         Signed payment callbacks
```

**Auth**
```
POST /api/auth/register           Self-service signup (10/hour, no superadmin)
     /api/auth/[...nextauth]      Sign in / out / session / csrf
```

**Agency**  `bulk-book`, `bookings`, `commissions` (GET + payout POST)
**Partner** `dashboard`
**Admin**   `analytics`, `users` (GET + PATCH), `settlements` (GET + POST)

## Security posture

Enforced and, where marked ✓, exercised:

- ✓ Server-side pricing — no client-supplied monetary value is trusted anywhere
- ✓ Fare re-quote before booking; `409` rather than a silent overcharge
- ✓ RBAC actually reaches the handlers (session carries `role`/`orgId`)
- ✓ IDOR returns `404`, never `403`, so ids cannot be enumerated
- ✓ Privilege escalation blocked at registration
- ✓ Rate limits on search, pricing, and signup
- Suspended accounts cannot obtain a session
- Tenant isolation fails closed — a missing `orgId` is `403`, never `""`
- Stripe webhook signatures verified; confirmation guarded on `pending_payment`
- Payment intents idempotent per booking and amount
- `client_secret` never persisted; FX rate persisted for reconciliation
- Admins cannot suspend themselves or other superadmins

## Setup

```bash
npm install
cp .env.example .env.local     # fill in DATABASE_URL, NEXTAUTH_SECRET, Stripe keys
npm run db:migrate             # apply drizzle/ migrations
npm run db:seed                # 14 airlines, 13 airports, 4 sample flights
npm run dev
```

Check before deploying:

- [ ] `NEXTAUTH_SECRET` set (`openssl rand -base64 32`)
- [ ] Real Stripe keys, and the webhook pointed at `/api/webhooks/stripe`
      (`payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`)
- [ ] `FX_RATES_JSON` reviewed — `lib/fx.ts` defaults are static and will drift
- [ ] `npm run build` clean
- [ ] A superadmin provisioned directly in the database (registration cannot create one)

## Known gaps

1. **Payments unexercised** — Stripe flow needs a live test-key run.
2. **Static FX rates** — no live feed; rates drift until `FX_RATES_JSON` is updated.
3. **Seat reservation is advisory** — availability is checked but not locked, so
   concurrent bookings can still oversell. Needs row-level locking.
4. **Rate limiting is per-instance** — the global ceiling scales with instance count.
5. **Round-trip pairing is naive** — the database provider takes a cartesian
   product capped at 40×40 rather than using real fare-combinability rules.
6. **No promo code logic** — `promoCode` is accepted and ignored; discount is always 0.
7. **No tests.** Everything above was verified by hand, once.
8. **English only** — no Bangla localization yet.
9. **Multi-city search** unsupported; one-way and round-trip only.

## Next

- **Phase 2** — fare matrix calendar, price alerts, ancillaries, automated tests
- **Phase 3** — mobile app, white-label partner portals, Bangla localization
