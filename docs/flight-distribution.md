# Flight distribution layer (Phase 1.5)

Flight inventory comes from a pluggable provider rather than direct table
reads, so the app can move from local schedule data to a real GDS without
touching the booking or payment code.

## Shape

```
app/api/flights/search  ─┐
app/api/flights/price   ─┤
app/api/bookings/create ─┘──> lib/iata (registry)
                                 ├── providers/amadeus.ts    Amadeus Self-Service
                                 └── providers/database.ts   local inventory + fallback
```

Every provider returns the normalized types in `lib/iata/types.ts`
(`FlightOffer`, `Itinerary`, `PriceBreakdown`). Nothing outside `lib/iata`
sees a GDS-specific payload.

## Shopping vs. pricing

These are separate on purpose.

| | Shopping (`/api/flights/search`) | Pricing (`/api/flights/price`) |
|---|---|---|
| Purpose | Browse options | Authoritative quote |
| Cached | Yes, 3 min | Never |
| Safe to charge? | **No** | Yes |

`POST /api/bookings/create` always reprices through the issuing provider before
it writes a booking. If the fare moved up, it returns `409 price_changed` with
the old and new totals; the client must resend with `acceptedTotal` to confirm.
A fare that moved *down* is taken without asking.

Amadeus reprices from the entire original offer object, not an id, so raw
payloads live in `lib/iata/cache.ts` (`offerVault`, 15-minute TTL) and clients
only ever see an opaque id. A cold serverless instance re-shops; an offer past
its TTL returns `409 offer_expired`.

## Configuration

```bash
FLIGHT_PROVIDER=database          # or "amadeus"
AMADEUS_BASE_URL=https://test.api.amadeus.com
AMADEUS_CLIENT_ID=...
AMADEUS_CLIENT_SECRET=...
AMADEUS_CURRENCY=USD              # Amadeus cannot quote BDT
FX_RATES_JSON={"USD":122.5}       # BDT per unit; overrides lib/fx.ts defaults
```

With `FLIGHT_PROVIDER=amadeus`, a retryable failure (auth, rate limit, timeout,
upstream 5xx) falls back to local inventory and flags `degraded: true` in the
response. Degraded results are not cached, so the next request retries Amadeus.
Non-retryable failures (an invalid route, say) surface as errors.

## Currency

Fares are stored and charged in BDT. Amadeus quotes in `AMADEUS_CURRENCY` and
`lib/fx.ts` converts. Stripe cannot settle BDT, so cards are charged in USD,
with the BDT amount and the FX rate persisted on the payment record for
reconciliation. Rates are static until a live feed replaces `lib/fx.ts`.

## Local dates

Travellers search by the local departure date at the origin airport.
`lib/iata/time.ts` translates that calendar day into UTC bounds using the
airport's timezone — a DAC→DXB flight leaving 23:30 Dhaka time is 17:30Z and a
naive UTC-day query would miss it.

## Rate limits

In-process and per-instance (`lib/rate-limit.ts`); the effective ceiling scales
with instance count. Deliberately conservative rather than exact — move to
Redis when a precise global limit matters.

| Endpoint | Limit |
|---|---|
| `/api/flights/search` | 30/min |
| `/api/flights/price` | 20/min |
| `/api/auth/register` | 10/hour |

## Adding a provider

1. Implement `FlightProvider` (`lib/iata/provider.ts`) in `lib/iata/providers/`.
2. Map the upstream payload to `FlightOffer`; store the raw payload in
   `offerVault` if repricing needs it.
3. Register it in the `providers` map in `lib/iata/index.ts` and add the name to
   `ProviderName` in `types.ts`.

Throw `ProviderError` with a `retryable` code so the registry knows whether
falling back is safe.

## Fare calendar

`POST /api/flights/fare-calendar` returns the cheapest total per departure date
across a window (max 62 days), plus the cheapest and dearest priced days for
colouring the UI. Days with no inventory come back with `total: null` rather
than being omitted, so the calendar has no holes.

These are browse prices. Booking still reprices through `/api/flights/price`.

`fareCalendar` is **optional** on `FlightProvider`. A provider without a cheap
bulk-pricing endpoint should omit it rather than fan out one shopping call per
day against a metered API; the registry then serves local inventory and flags
`degraded: true`. The database provider implements it with a single query over
the whole window, bucketed by local date at the origin airport.

Amadeus does not implement it yet — its Flight Cheapest Date Search covers only
a subset of routes, so calendars currently come from local inventory even when
`FLIGHT_PROVIDER=amadeus`. That is reported honestly as `degraded: true`.

## Testing

```bash
npm test              # vitest, 119 tests
npm run test:watch
```

Tests run with `TZ=UTC` pinned — flight times are timezone-sensitive and a
developer's local zone must not change what the suite asserts.

Covered: FX conversion and overrides, local-day bounds across DST and
half-hour offsets, TTL cache eviction, rate-limit windows, search and calendar
query validation, and the registry's fallback policy (which failures may
degrade to local inventory and which must surface).

`ProviderError` is identified by a `Symbol.for` brand, not `instanceof` — Next
bundles server code more than once, and a duplicated module graph would
otherwise make the fallback check silently return false.
