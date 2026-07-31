import { NextRequest, NextResponse } from "next/server";
import { db, bookings, payments, flights, ancillaryProducts } from "@/lib/db";
import { auth } from "@/auth";
import { customAlphabet } from "nanoid";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { priceOffer, toClientError, CABIN_MULTIPLIER } from "@/lib/iata";
import {
  AncillaryError,
  MAX_SELECTIONS,
  priceAncillaries,
} from "@/lib/ancillaries/pricing";
import {
  reserveSeats,
  seatsHeldBy,
  SeatUnavailableError,
} from "@/lib/inventory/seats";

// Excludes look-alike characters so refs survive being read over the phone.
const generateBookingRef = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

const passengerSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  dateOfBirth: z.string().optional(),
  passportNumber: z.string().trim().max(40).optional(),
  nationality: z.string().trim().max(60).optional(),
  type: z.enum(["adult", "child", "infant"]).default("adult"),
});

const bodySchema = z
  .object({
    /** Preferred path: an offer already quoted by a provider. */
    offerId: z.string().trim().min(1).max(200).optional(),
    /** Legacy path: a local schedule row, priced from the flights table. */
    flightId: z.string().uuid().optional(),
    passengers: z.array(passengerSchema).min(1).max(9),
    cabinClass: z
      .enum(["economy", "premium_economy", "business", "first"])
      .default("economy"),
    /**
     * Total the customer saw and agreed to. Required for offer bookings: if the
     * provider reprices above it, we stop rather than silently overcharge.
     */
    acceptedTotal: z.coerce.number().int().nonnegative().optional(),
    promoCode: z.string().trim().max(40).optional(),
    /**
     * Product codes and quantities only. Prices come from the catalog — an
     * earlier version accepted arbitrary objects here and charged nothing
     * for them.
     */
    ancillaries: z
      .array(
        z.object({
          code: z.string().trim().min(1).max(40),
          quantity: z.coerce.number().int().min(1).max(9),
        })
      )
      .max(MAX_SELECTIONS)
      .optional(),
    paymentMethod: z
      .enum(["stripe", "bkash", "nagad", "rocket", "bank_transfer"])
      .optional(),
  })
  .refine((body) => body.offerId || body.flightId, {
    message: "Either offerId or flightId is required",
    path: ["offerId"],
  });

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON" },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid booking request",
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;

  try {
    const quote = body.offerId
      ? await quoteFromOffer(body.offerId, body.acceptedTotal)
      : await quoteFromFlight(body.flightId!, body.cabinClass, body.passengers.length);

    if ("error" in quote) {
      return NextResponse.json(quote.error, { status: quote.status });
    }

    // Extras are priced from the catalog, never from the request.
    const extras = await priceSelectedAncillaries(
      body.ancillaries ?? [],
      quote,
      body.passengers
    );

    // Promo codes are validated server-side only; no client-supplied discount.
    const discount = 0;
    const totalPrice = quote.total + extras.total;
    const finalPrice = totalPrice - discount;

    const seatsNeeded = seatsHeldBy(body.passengers);

    // Seats and booking commit together: if the insert fails, the seats go
    // back; if the seats are gone, no booking is written.
    const booking = await db.transaction(async (tx) => {
      if (quote.flightId) {
        await reserveSeats(tx, quote.flightId, quote.cabinClass, seatsNeeded);
      }

      const rows = await tx
        .insert(bookings)
        .values({
          bookingRef: generateBookingRef(),
          userId: session.user.id,
          flightId: quote.flightId,
          offerSource: quote.source,
          offerId: body.offerId ?? null,
          itinerary: quote.itinerary,
          status: "pending_payment",
          passengers: body.passengers,
          cabinClass: quote.cabinClass,
          totalPrice,
          discount,
          finalPrice,
          currency: quote.currency,
          ancillaries: extras.items,
          ancillariesTotal: extras.total,
          paymentMethod: body.paymentMethod,
        })
        .returning();

      if (!rows[0]) throw new Error("Booking insert returned no row");

      if (body.paymentMethod) {
        await tx.insert(payments).values({
          bookingId: rows[0].id,
          amount: finalPrice,
          currency: quote.currency,
          status: "pending",
          paymentMethod: body.paymentMethod,
        });
      }

      return rows[0];
    });

    return NextResponse.json(
      {
        bookingId: booking.id,
        bookingRef: booking.bookingRef,
        status: booking.status,
        farePrice: quote.total,
        ancillaries: extras.items,
        ancillariesTotal: extras.total,
        totalPrice: finalPrice,
        currency: quote.currency,
        passengers: body.passengers.length,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AncillaryError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    if (error instanceof SeatUnavailableError) {
      // Someone else took the last seats between shopping and booking.
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 409 }
      );
    }
    console.error("Booking creation error:", error);
    const { status, body: errorBody } = toClientError(error);
    return NextResponse.json(errorBody, { status });
  }
}

interface Quote {
  total: number;
  currency: string;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
  source: string;
  flightId: string | null;
  itinerary: unknown;
}

type QuoteResult =
  | Quote
  | { error: Record<string, unknown>; status: number };

/**
 * Re-price through the issuing provider. This is the only price we will charge —
 * the shopping total the client saw is advisory and may be minutes stale.
 */
async function quoteFromOffer(
  offerId: string,
  acceptedTotal: number | undefined
): Promise<QuoteResult> {
  const priced = await priceOffer(offerId);
  const offer = priced.offer;

  if (priced.changed) {
    // A cheaper fare is fine to take; a dearer one needs the customer's consent.
    const consented =
      acceptedTotal !== undefined && offer.price.total <= acceptedTotal;
    if (!consented) {
      return {
        status: 409,
        error: {
          error: "The fare changed before we could confirm it",
          code: "price_changed",
          previousTotal: priced.previousTotal,
          newTotal: offer.price.total,
          currency: offer.price.currency,
        },
      };
    }
  }

  if (offer.seatsAvailable <= 0) {
    return {
      status: 409,
      error: { error: "This fare just sold out", code: "no_availability" },
    };
  }

  return {
    total: offer.price.total,
    currency: offer.price.currency,
    cabinClass: offer.cabinClass,
    source: offer.source,
    // GDS offers carry no local schedule row; database offers encode it in the id.
    flightId: offer.source === "database" ? localFlightId(offer.id) : null,
    itinerary: offer.itineraries,
  };
}

/**
 * Price the selected extras against the live catalog.
 *
 * Context is derived from the itinerary we just quoted, not from the request:
 * segment count drives per-segment products, and whether the route is
 * international decides eligibility.
 */
async function priceSelectedAncillaries(
  selections: { code: string; quantity: number }[],
  quote: Quote,
  passengers: { type: "adult" | "child" | "infant" }[]
) {
  if (selections.length === 0) {
    return { items: [], total: 0, currency: quote.currency };
  }

  const catalog = await db
    .select()
    .from(ancillaryProducts)
    .where(eq(ancillaryProducts.active, true));

  return priceAncillaries(selections, catalog, {
    // Infants have no seat and no baggage allowance of their own.
    passengerCount: passengers.filter((p) => p.type !== "infant").length,
    segmentCount: countSegments(quote.itinerary),
    cabinClass: quote.cabinClass,
    isInternational: isInternational(quote.itinerary),
    currency: quote.currency,
  });
}

interface ItinerarySegment {
  origin?: unknown;
  destination?: unknown;
}

function countSegments(itinerary: unknown): number {
  if (!Array.isArray(itinerary)) return 1;
  const total = itinerary.reduce((sum: number, leg: unknown) => {
    const segments = (leg as { segments?: unknown[] })?.segments;
    return sum + (Array.isArray(segments) ? segments.length : 0);
  }, 0);
  return Math.max(total, 1);
}

/** Bangladesh domestic airports; anything touching another code is international. */
const BD_AIRPORTS = new Set([
  "DAC",
  "CGP",
  "ZYL",
  "CXB",
  "JSR",
  "RJH",
  "SPD",
  "BZL",
]);

function isInternational(itinerary: unknown): boolean {
  if (!Array.isArray(itinerary)) return true;

  const codes: string[] = [];
  for (const leg of itinerary) {
    const segments = (leg as { segments?: ItinerarySegment[] })?.segments ?? [];
    for (const segment of segments) {
      if (typeof segment.origin === "string") codes.push(segment.origin);
      if (typeof segment.destination === "string") codes.push(segment.destination);
    }
  }

  // Default to international when we cannot tell — the stricter of the two,
  // since domestic-only products stay available either way.
  if (codes.length === 0) return true;
  return codes.some((code) => !BD_AIRPORTS.has(code.toUpperCase()));
}

/** Legacy path — price a local schedule row directly. */
async function quoteFromFlight(
  flightId: string,
  cabinClass: Quote["cabinClass"],
  passengerCount: number
): Promise<QuoteResult> {
  const flight = await db
    .select()
    .from(flights)
    .where(eq(flights.id, flightId))
    .limit(1);

  if (!flight[0]) {
    return { status: 404, error: { error: "Flight not found" } };
  }

  const perPassenger = Math.floor(
    flight[0].basePrice * CABIN_MULTIPLIER[cabinClass]
  );

  return {
    total: perPassenger * passengerCount,
    currency: flight[0].currency ?? "BDT",
    cabinClass,
    source: "database",
    flightId,
    itinerary: null,
  };
}

/** `db_<uuid>[_<uuid>]_<cabin>` — the first uuid is the outbound flight. */
function localFlightId(offerId: string): string | null {
  const match = /^db_([0-9a-f-]{36})/i.exec(offerId);
  return match ? match[1] : null;
}
