/**
 * Normalized flight-shopping domain model.
 *
 * Every distribution channel we talk to (Amadeus Self-Service, Sabre, a local
 * DB of negotiated fares) speaks its own dialect. Providers translate into the
 * types below so the rest of the app never learns a GDS-specific shape.
 */

import { z } from "zod";

export const CABIN_CLASSES = [
  "economy",
  "premium_economy",
  "business",
  "first",
] as const;

export type CabinClass = (typeof CABIN_CLASSES)[number];

export type ProviderName = "amadeus" | "database";

/** Multipliers applied to a base fare when a provider only quotes economy. */
export const CABIN_MULTIPLIER: Record<CabinClass, number> = {
  economy: 1,
  premium_economy: 1.25,
  business: 1.5,
  first: 2.5,
};

// ---------------------------------------------------------------------------
// Search query
// ---------------------------------------------------------------------------

const iataCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Must be a 3-letter IATA code");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be an ISO date (YYYY-MM-DD)");

export const searchQuerySchema = z
  .object({
    from: iataCode,
    to: iataCode,
    departureDate: isoDate,
    returnDate: isoDate.nullish(),
    adults: z.coerce.number().int().min(1).max(9).default(1),
    children: z.coerce.number().int().min(0).max(8).default(0),
    infants: z.coerce.number().int().min(0).max(8).default(0),
    cabinClass: z.enum(CABIN_CLASSES).default("economy"),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/)
      .default("BDT"),
    nonStop: z.boolean().default(false),
    maxResults: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine((q) => q.from !== q.to, {
    message: "Origin and destination must differ",
    path: ["to"],
  })
  .refine((q) => q.infants <= q.adults, {
    message: "Each infant must be accompanied by an adult",
    path: ["infants"],
  })
  .refine((q) => q.adults + q.children + q.infants <= 9, {
    message: "Maximum 9 passengers per booking",
    path: ["adults"],
  })
  .refine((q) => !q.returnDate || q.returnDate >= q.departureDate, {
    message: "Return date must be on or after departure date",
    path: ["returnDate"],
  });

export type SearchQuery = z.output<typeof searchQuerySchema>;

/** Seats needed for inventory checks — infants travel as lap children. */
export function seatCount(q: Pick<SearchQuery, "adults" | "children">): number {
  return q.adults + q.children;
}

/** Passengers that are charged a fare (infants are priced, but not seated). */
export function payingPassengerCount(
  q: Pick<SearchQuery, "adults" | "children" | "infants">
): number {
  return q.adults + q.children + q.infants;
}

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

export interface Carrier {
  iataCode: string;
  name: string;
  logoUrl?: string | null;
}

export interface FlightSegment {
  origin: string;
  destination: string;
  /** ISO 8601 local departure time at the origin airport. */
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  marketingCarrier: Carrier;
  operatingCarrier?: Carrier | null;
  flightNumber: string;
  aircraftType?: string | null;
  cabinClass: CabinClass;
  /** Fare basis / booking class letter, when the provider exposes it. */
  bookingClass?: string | null;
}

export interface Itinerary {
  durationMinutes: number;
  stops: number;
  /** Layover airport codes, in order. Empty for non-stop. */
  layovers: string[];
  segments: FlightSegment[];
}

export interface PriceBreakdown {
  currency: string;
  /** Whole currency units (BDT has no minor unit in common use). */
  baseFare: number;
  taxes: number;
  fees: number;
  total: number;
  /** Per-passenger totals, e.g. `{ adult: 42000, child: 31500 }`. */
  perPassengerType: Record<string, number>;
}

export interface BaggageAllowance {
  cabinKg?: number | null;
  checkedKg?: number | null;
  checkedPieces?: number | null;
}

export interface FlightOffer {
  /** Opaque, provider-scoped id. Only meaningful to the issuing provider. */
  id: string;
  source: ProviderName;
  /** `[outbound]` or `[outbound, inbound]`. */
  itineraries: Itinerary[];
  price: PriceBreakdown;
  validatingCarrier: Carrier;
  cabinClass: CabinClass;
  seatsAvailable: number;
  refundable: boolean;
  changeable: boolean;
  baggage: BaggageAllowance;
  /** ISO timestamp after which the fare must be re-priced before ticketing. */
  expiresAt: string;
  lastTicketingDate?: string | null;
}

/**
 * A repriced offer. `changed` is true when the provider came back with a
 * different total than the shopping response — the user must re-confirm.
 */
export interface PricedOffer {
  offer: FlightOffer;
  changed: boolean;
  previousTotal: number;
}

// ---------------------------------------------------------------------------
// Fare calendar
// ---------------------------------------------------------------------------

/** A calendar wider than this is a scraping vector, not a shopping session. */
export const MAX_CALENDAR_DAYS = 62;

export const fareCalendarQuerySchema = z
  .object({
    from: iataCode,
    to: iataCode,
    /** First departure date to price, inclusive. */
    startDate: isoDate,
    /** Last departure date to price, inclusive. */
    endDate: isoDate,
    adults: z.coerce.number().int().min(1).max(9).default(1),
    children: z.coerce.number().int().min(0).max(8).default(0),
    infants: z.coerce.number().int().min(0).max(8).default(0),
    cabinClass: z.enum(CABIN_CLASSES).default("economy"),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/)
      .default("BDT"),
  })
  .refine((q) => q.from !== q.to, {
    message: "Origin and destination must differ",
    path: ["to"],
  })
  .refine((q) => q.endDate >= q.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })
  .refine((q) => daysBetween(q.startDate, q.endDate) <= MAX_CALENDAR_DAYS, {
    message: `Date range cannot exceed ${MAX_CALENDAR_DAYS} days`,
    path: ["endDate"],
  })
  .refine((q) => q.infants <= q.adults, {
    message: "Each infant must be accompanied by an adult",
    path: ["infants"],
  });

export type FareCalendarQuery = z.output<typeof fareCalendarQuerySchema>;

export interface FareCalendarEntry {
  /** Local departure date at the origin airport, `YYYY-MM-DD`. */
  date: string;
  /** Cheapest total for the whole party, or null when nothing flies that day. */
  total: number | null;
  currency: string;
  /** Cheapest single-adult fare, for "from ৳X" labels. */
  perAdult: number | null;
  flightCount: number;
}

export interface FareCalendarResult {
  entries: FareCalendarEntry[];
  query: FareCalendarQuery;
  source: ProviderName;
  degraded: boolean;
  /** Cheapest and dearest priced days, for colouring the calendar. */
  cheapest: FareCalendarEntry | null;
  dearest: FareCalendarEntry | null;
  searchedAt: string;
}

function daysBetween(start: string, end: string): number {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

/** Every `YYYY-MM-DD` from `start` to `end`, inclusive. */
export function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);

  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export interface SearchResult {
  offers: FlightOffer[];
  query: SearchQuery;
  /** Provider that actually served the result (may differ after fallback). */
  source: ProviderName;
  /** True when the primary provider failed and we served degraded inventory. */
  degraded: boolean;
  searchedAt: string;
}
