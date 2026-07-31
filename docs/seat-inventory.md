# Seat inventory

## The bug this fixed

Every booking path *read* the seat count and compared it, then never
decremented it. `/api/bookings/create` checked `offer.seatsAvailable <= 0` and
`/api/agency/bulk-book` checked `totalSeatsNeeded > flight.seatsAvailable`, but
neither wrote anything back. A flight seeded with 200 seats could be sold two
hundred times, or two thousand — the count never moved.

Worse, a read-then-write pair would not have fixed it either. Two concurrent
bookings both read 1 seat remaining, both conclude they fit, and both write.

## How reservation works

One conditional UPDATE, in `lib/inventory/seats.ts`:

```sql
UPDATE flights
   SET seats_economy = seats_economy - $n,
       seats_available = seats_available - $n
 WHERE id = $id AND seats_economy >= $n AND seats_available >= $n
```

Postgres holds a row lock for the duration of the statement, so concurrent
transactions serialize on it. The loser's `>= n` predicate is re-evaluated
against the winner's committed value, matches zero rows, and `reserveSeats`
throws `SeatUnavailableError` → **409**. No seat is ever double-sold and no
read-then-write window exists.

The reservation runs inside the same transaction as the booking insert, so a
failed insert returns the seats and a failed reservation writes no booking.

## Verified under concurrency

A flight was reduced to exactly 5 economy seats, then 10 single-passenger
bookings were fired concurrently:

```
201 201 201 201 201 409 409 409 409 409
seats_economy: 0    bookings created: 5
```

Five succeeded, five were rejected, inventory landed exactly at zero.

## Releasing seats

Reserving is only half the job. Without a release path, one abandoned checkout
holds its seats forever and the flight quietly sells out to nobody.

`/api/cron/expire-bookings` runs every 10 minutes and cancels bookings still in
`pending_payment` after 30 minutes (`PAYMENT_WINDOW_MS`), returning their seats.
The window is long enough for a card payment including a 3-D Secure detour.

The cancel is guarded on `status = 'pending_payment'` inside the transaction, so
a payment landing at the same moment as the sweep is safe: whichever commits
first wins, and the loser updates zero rows and releases nothing.

Verified: with 5 unpaid bookings holding all 5 seats, 3 were aged past the
window. The sweep reported `{"expired":3,"seatsReleased":3}`, seats went 0 → 3,
2 bookings stayed pending, and a second run reported `{"expired":0}` — it is
idempotent.

## What this does not cover

- **GDS bookings hold no local inventory.** Amadeus-sourced bookings have a null
  `flightId` and are skipped; the airline holds the seat, not us.
- **Infants hold no seat** (`seatsHeldBy`), matching how they are priced.
- **Premium economy shares the economy cabin** in the current schedule data.
- **Cancellation by a user** does not yet return seats — only expiry does. A
  cancel endpoint must call `releaseSeats` under the same status guard.
