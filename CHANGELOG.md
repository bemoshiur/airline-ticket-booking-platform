# Changelog

Notable changes, newest first. Dates are the day the work landed on `main`.

## [0.3.0] — 2026-08-01

### Fixed — seat overselling

Every booking path read the seat count and compared it, then never decremented
it. A flight seeded with 200 seats could be sold two hundred times.

- Reservation is a single conditional `UPDATE ... WHERE seats >= n`, so
  concurrent transactions serialize on the row lock and the loser gets a 409.
  A read-then-write pair could not have fixed this.
- Booking creation and agency bulk booking now run in a transaction. Bulk
  booking previously wrote in a bare loop and could leave partial results.
- `/api/cron/expire-bookings` (every 10 min) cancels unpaid bookings after 30
  minutes and returns their seats, guarded on status inside the transaction.

Verified by racing 10 concurrent bookings against 5 seats: exactly 5 succeeded.

### Added

- **Ancillary services** — catalog-backed extras (baggage, seats, meals,
  insurance, lounge, visa support). Closes a hole where `ancillaries` was
  accepted as `z.array(z.unknown())`, stored verbatim, and charged nothing.
- **Price alerts** — save a route, cron sweep re-shops it, email on a drop.
  Notification rules isolated from I/O in `lib/alerts/evaluate.ts`.
- **Fare calendar** — cheapest fare per departure date across a 62-day window,
  one query per calendar rather than one per day.
- **Test suite** — 191 tests over FX, timezone bounds, caching, rate limits,
  query validation, provider fallback, alert rules, and ancillary pricing.

### Changed

- Enum query parameters are validated instead of cast with `as any`. An
  unrecognised value reaching a SQL enum comparison made Postgres throw, which
  surfaced to the caller as a 500 rather than the 400 it always was.
- `ProviderError` is identified by a `Symbol.for` brand, not `instanceof`. Next
  bundles server code more than once, and a duplicated module graph would make
  the registry's fallback check silently return false.

## [0.2.0] — 2026-08-01

### Added — pluggable flight distribution

Inventory now comes from a provider interface rather than direct table reads,
so the app can move to a real GDS without touching booking or payment code.

- Amadeus Self-Service provider (OAuth2, flight-offers-search, pricing).
- Database provider serving local inventory, doubling as fallback when a
  retryable upstream failure occurs — flagged `degraded`, never cached.
- `POST /api/flights/price` for authoritative re-quotes. Booking reprices
  through the issuing provider and returns `409 price_changed` rather than
  silently charging a moved fare.

### Fixed — defects found while verifying the above

The previous status document claimed the platform was production ready and that
the build passed. Neither was true.

- **Sessions never carried `role` or `orgId`**, so all 20 RBAC checks compared
  `undefined`. Every agency, partner, and admin endpoint rejected every caller.
- **Route folders were literally named `%5Bid%5D` and `%5B...nextauth%5D`**, so
  `/api/auth/[...nextauth]` did not exist and sign-in was impossible.
- **35 TypeScript errors** — `npm run build` failed outright.
- Suspended accounts could still obtain a session.
- `/api/auth/signup` was documented but did not exist; added
  `/api/auth/register`, which cannot create a superadmin.
- Flight times were naive timestamps and shifted by hours through the server's
  local zone. Now `timestamptz`, with search bounds derived from the origin
  airport's timezone.
- Stripe payment intents are idempotent per booking and amount; webhook
  confirmation is guarded on `pending_payment`.
- FX centralised in `lib/fx.ts`, replacing a hardcoded BDT/USD rate that was
  roughly 16% stale, and persisting the rate used for reconciliation.

## [0.1.0]

Initial platform: multi-stakeholder schema, auth, flight search, booking,
Stripe payments, agency and partner surfaces, admin analytics.

See `PRODUCTION_READY.md` for what is verified and what is still a known gap.
