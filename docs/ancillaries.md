# Ancillary services

Extras sold alongside a fare: baggage, seats, meals, insurance, lounge access,
visa support, SMS updates.

## The hole this closed

`POST /api/bookings/create` previously accepted `ancillaries` as
`z.array(z.unknown()).max(20)` and stored it verbatim. Whatever the client sent
was persisted and **charged nothing**. A booking could carry extras it had not
paid for, and the stored shape was whatever the client felt like sending.

The client now sends only a product code and a quantity. Everything that
determines money — price, unit, eligibility, ceilings — comes from the catalog.

## Catalog

`ancillary_products`, seeded by `npm run db:seed:ancillaries`. Prices live in the
database so they can be changed without a deploy, and a booking snapshots the
line items it was priced with.

`GET /api/ancillaries?cabinClass=economy&international=true` returns what a
given itinerary may buy, so the client never renders something the booking
endpoint would reject.

Two eligibility axes:

- **Cabin** — `cabinClasses` is a comma list, null meaning every cabin. Lounge
  access, extra legroom, and priority check-in are economy and premium economy
  only; business and first already include them.
- **Route** — `internationalOnly` hides travel insurance and visa support on
  domestic sectors.

## Pricing units

In `lib/ancillaries/pricing.ts`, free of database and network access — this is
where extras turn into money, so every rule is directly testable.

| Unit | Charged | Example |
| --- | --- | --- |
| `per_passenger` | Once per covered passenger, capped at party size | Extra bag |
| `per_booking` | Once, whatever the quantity implies | SMS updates |
| `per_segment` | Covered passengers × flown segments | Seat selection |

For `per_passenger` and `per_segment`, `quantity` means *how many passengers are
covered* — buying three bags for a party of two charges for two, not three.

Infants are excluded from `passengerCount`: they have no seat and no baggage
allowance of their own.

## Rejections

Every one is a 400 with a machine-readable code, never a silent drop:

| Code | Cause |
| --- | --- |
| `unknown_product` | Code not in the catalog, or inactive |
| `quantity_exceeded` | Above the product's `maxQuantity` |
| `duplicate_selection` | Same code twice — merging could quietly exceed the cap |
| `not_eligible` | Wrong cabin, or international-only on a domestic route |
| `currency_mismatch` | Catalog price in another currency |
| `too_many_selections` | More than 20 distinct extras |

`currency_mismatch` fails loudly rather than converting. Converting would hide a
catalog misconfiguration behind an FX rate.

## On the booking

`ancillariesTotal` is stored separately from the fare so refunds and reporting
can tell them apart, and `ancillaries` holds the priced line items with the unit
price and multiplier that produced each total — the audit trail for a charge.

Verified live: a 2-passenger DAC→DXB booking with 2×20kg bags (per passenger),
seat selection (per segment), and SMS updates priced as 12,400 + 1,400 + 250 =
14,050 on top of a 170,000 fare. A request carrying `"price": 1` alongside the
code was charged the catalog's 6,200.
