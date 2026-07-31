/**
 * Database provider — our own schedule and negotiated-fare inventory.
 *
 * Serves two roles:
 *   1. Development/demo inventory before GDS credentials exist.
 *   2. Fallback when the primary provider is down, so search degrades instead
 *      of failing. Degraded results are flagged in the response.
 *
 * Unlike a GDS, this source is authoritative locally, so `priceOffer` recomputes
 * straight from the flights table rather than calling anything out of process.
 */

import { and, eq, gte, lte } from "drizzle-orm";
import { db, flights, airlines, airports } from "@/lib/db";
import { ProviderError } from "../errors";
import { offerVault } from "../cache";
import type { FlightProvider } from "../provider";
import { localDayBoundsUtc, qualifiedFlightNumber } from "../time";
import {
  CABIN_MULTIPLIER,
  seatCount,
  type CabinClass,
  type FlightOffer,
  type Itinerary,
  type PriceBreakdown,
  type PricedOffer,
  type SearchQuery,
} from "../types";

const PROVIDER = "database" as const;
const OFFER_TTL_MS = 15 * 60 * 1000;

/**
 * Stored fares are all-in per-adult totals. We split out taxes and fees for
 * display using the shares below; swap for real tax records once we file them.
 */
const TAX_SHARE = 0.18;
const FEE_SHARE = 0.04;

/** Fare share by passenger type — IATA-conventional discounts. */
const PASSENGER_FARE_SHARE = { adult: 1, child: 0.75, infant: 0.1 } as const;

/** Round-trip pairing is quadratic; keep the fan-out bounded. */
const MAX_LEG_CANDIDATES = 40;

type FlightRow = typeof flights.$inferSelect;
type AirlineRow = typeof airlines.$inferSelect;

interface LegRow {
  flight: FlightRow;
  airline: AirlineRow;
  originCode: string;
  destinationCode: string;
}

export class DatabaseProvider implements FlightProvider {
  readonly name = PROVIDER;

  isConfigured(): boolean {
    return Boolean(process.env.DATABASE_URL);
  }

  async searchOffers(query: SearchQuery): Promise<FlightOffer[]> {
    const [origin, destination] = await Promise.all([
      airportByCode(query.from),
      airportByCode(query.to),
    ]);

    if (!origin || !destination) {
      throw new ProviderError(
        "invalid_request",
        PROVIDER,
        "We do not serve one of those airports yet"
      );
    }

    const outbound = await legsFor(
      origin,
      destination,
      query.departureDate,
      query
    );

    if (!query.returnDate) {
      return outbound
        .slice(0, query.maxResults)
        .map((leg) => buildOffer([leg], query));
    }

    const inbound = await legsFor(
      destination,
      origin,
      query.returnDate,
      query
    );

    const offers: FlightOffer[] = [];
    for (const out of outbound.slice(0, MAX_LEG_CANDIDATES)) {
      for (const back of inbound.slice(0, MAX_LEG_CANDIDATES)) {
        offers.push(buildOffer([out, back], query));
      }
    }

    return offers
      .sort((a, b) => a.price.total - b.price.total)
      .slice(0, query.maxResults);
  }

  async priceOffer(offerId: string): Promise<PricedOffer> {
    const stored = offerVault.get(offerId);
    if (!stored || stored.provider !== PROVIDER) {
      throw new ProviderError(
        "offer_expired",
        PROVIDER,
        "This fare is no longer held — please search again"
      );
    }

    const { flightIds } = stored.raw as { flightIds: string[] };
    const query = stored.query;

    // Re-read the flights so a price or inventory change since shopping wins.
    const legs: LegRow[] = [];
    for (const flightId of flightIds) {
      const leg = await legById(flightId);
      if (!leg) {
        throw new ProviderError(
          "no_availability",
          PROVIDER,
          "This flight is no longer scheduled"
        );
      }
      legs.push(leg);
    }

    const needed = seatCount(query);
    for (const leg of legs) {
      if (cabinSeats(leg.flight, query.cabinClass) < needed) {
        throw new ProviderError(
          "no_availability",
          PROVIDER,
          "Not enough seats remain at this fare"
        );
      }
    }

    const offer = buildOffer(legs, query, offerId);
    return {
      offer,
      changed: offer.price.total !== stored.total,
      previousTotal: stored.total,
    };
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

async function airportByCode(code: string) {
  const rows = await db
    .select({
      id: airports.id,
      iataCode: airports.iataCode,
      timezone: airports.timezone,
    })
    .from(airports)
    .where(eq(airports.iataCode, code))
    .limit(1);
  return rows[0] ?? null;
}

type AirportRef = NonNullable<Awaited<ReturnType<typeof airportByCode>>>;

async function legsFor(
  origin: AirportRef,
  destination: AirportRef,
  date: string,
  query: SearchQuery
): Promise<LegRow[]> {
  // The requested date is the local departure date at the origin airport.
  const { start, end } = localDayBoundsUtc(date, origin.timezone);

  const rows = await db
    .select({ flight: flights, airline: airlines })
    .from(flights)
    .innerJoin(airlines, eq(flights.airlineId, airlines.id))
    .where(
      and(
        eq(flights.departureAirportId, origin.id),
        eq(flights.arrivalAirportId, destination.id),
        gte(flights.departureTime, start),
        lte(flights.departureTime, end)
      )
    );

  const needed = seatCount(query);
  return rows
    .filter((row) => cabinSeats(row.flight, query.cabinClass) >= needed)
    .filter((row) => !query.nonStop || (row.flight.stops ?? 0) === 0)
    .map((row) => ({
      flight: row.flight,
      airline: row.airline,
      originCode: origin.iataCode,
      destinationCode: destination.iataCode,
    }))
    .sort(
      (a, b) =>
        a.flight.departureTime.getTime() - b.flight.departureTime.getTime()
    );
}

async function legById(flightId: string): Promise<LegRow | null> {
  const rows = await db
    .select({
      flight: flights,
      airline: airlines,
      origin: airports.iataCode,
    })
    .from(flights)
    .innerJoin(airlines, eq(flights.airlineId, airlines.id))
    .innerJoin(airports, eq(flights.departureAirportId, airports.id))
    .where(eq(flights.id, flightId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const destination = await db
    .select({ iataCode: airports.iataCode })
    .from(airports)
    .where(eq(airports.id, row.flight.arrivalAirportId))
    .limit(1);

  return {
    flight: row.flight,
    airline: row.airline,
    originCode: row.origin,
    destinationCode: destination[0]?.iataCode ?? "",
  };
}

// ---------------------------------------------------------------------------
// Offer construction
// ---------------------------------------------------------------------------

function cabinSeats(flight: FlightRow, cabin: CabinClass): number {
  switch (cabin) {
    case "business":
      return flight.seatsBusiness ?? 0;
    case "first":
      return flight.seatsFirst ?? 0;
    // Premium economy shares the economy cabin in our current schedule data.
    case "premium_economy":
    case "economy":
      return flight.seatsEconomy ?? 0;
  }
}

function buildOffer(
  legs: LegRow[],
  query: SearchQuery,
  reuseId?: string
): FlightOffer {
  const id =
    reuseId ?? `db_${legs.map((leg) => leg.flight.id).join("_")}_${query.cabinClass}`;

  const itineraries = legs.map((leg) => buildItinerary(leg, query.cabinClass));
  const price = buildPrice(legs, query);
  const seatsAvailable = Math.min(
    ...legs.map((leg) => cabinSeats(leg.flight, query.cabinClass))
  );

  const offer: FlightOffer = {
    id,
    source: PROVIDER,
    itineraries,
    price,
    validatingCarrier: {
      iataCode: legs[0].airline.iataCode,
      name: legs[0].airline.name,
    },
    cabinClass: query.cabinClass,
    seatsAvailable,
    refundable: false,
    changeable: false,
    baggage: baggageFor(query.cabinClass),
    expiresAt: new Date(Date.now() + OFFER_TTL_MS).toISOString(),
    lastTicketingDate: null,
  };

  offerVault.set(
    id,
    {
      provider: PROVIDER,
      raw: { flightIds: legs.map((leg) => leg.flight.id) },
      total: price.total,
      currency: price.currency,
      query,
    },
    OFFER_TTL_MS
  );

  return offer;
}

function buildItinerary(leg: LegRow, cabin: CabinClass): Itinerary {
  const { flight, airline } = leg;
  const layovers = (flight.layoverAirports ?? "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);

  return {
    durationMinutes: flight.durationMinutes,
    stops: flight.stops ?? 0,
    layovers,
    // Our schedule table stores a whole journey per row, so a leg is one
    // segment even when it has technical stops.
    segments: [
      {
        origin: leg.originCode,
        destination: leg.destinationCode,
        departureTime: flight.departureTime.toISOString(),
        arrivalTime: flight.arrivalTime.toISOString(),
        durationMinutes: flight.durationMinutes,
        marketingCarrier: {
          iataCode: airline.iataCode,
          name: airline.name,
        },
        operatingCarrier: null,
        flightNumber: qualifiedFlightNumber(
          airline.iataCode,
          flight.flightNumber
        ),
        aircraftType: flight.aircraftType,
        cabinClass: cabin,
        bookingClass: null,
      },
    ],
  };
}

function buildPrice(legs: LegRow[], query: SearchQuery): PriceBreakdown {
  const multiplier = CABIN_MULTIPLIER[query.cabinClass];
  const adultFare = legs.reduce(
    (sum, leg) => sum + Math.round(leg.flight.basePrice * multiplier),
    0
  );

  const perPassengerType: Record<string, number> = {
    adult: adultFare,
  };
  if (query.children > 0) {
    perPassengerType.child = Math.round(
      adultFare * PASSENGER_FARE_SHARE.child
    );
  }
  if (query.infants > 0) {
    perPassengerType.infant = Math.round(
      adultFare * PASSENGER_FARE_SHARE.infant
    );
  }

  const total =
    adultFare * query.adults +
    (perPassengerType.child ?? 0) * query.children +
    (perPassengerType.infant ?? 0) * query.infants;

  const taxes = Math.round(total * TAX_SHARE);
  const fees = Math.round(total * FEE_SHARE);

  return {
    currency: legs[0].flight.currency ?? "BDT",
    baseFare: total - taxes - fees,
    taxes,
    fees,
    total,
    perPassengerType,
  };
}

function baggageFor(cabin: CabinClass) {
  switch (cabin) {
    case "first":
      return { cabinKg: 14, checkedKg: 50, checkedPieces: 2 };
    case "business":
      return { cabinKg: 12, checkedKg: 40, checkedPieces: 2 };
    case "premium_economy":
      return { cabinKg: 10, checkedKg: 30, checkedPieces: 1 };
    case "economy":
      return { cabinKg: 7, checkedKg: 20, checkedPieces: 1 };
  }
}
