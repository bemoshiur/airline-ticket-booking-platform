import { NextRequest, NextResponse } from "next/server";
import { db, bookings, payments, flights } from "@/lib/db";
import { auth } from "@/auth";
import { customAlphabet } from "nanoid";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { priceOffer, toClientError, CABIN_MULTIPLIER } from "@/lib/iata";

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
    ancillaries: z.array(z.unknown()).max(20).optional(),
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

    // Promo codes are validated server-side only; no client-supplied discount.
    const discount = 0;
    const finalPrice = quote.total - discount;

    const booking = await db
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
        totalPrice: quote.total,
        discount,
        finalPrice,
        currency: quote.currency,
        ancillaries: body.ancillaries ?? [],
        paymentMethod: body.paymentMethod,
      })
      .returning();

    if (!booking[0]) {
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    if (body.paymentMethod) {
      await db.insert(payments).values({
        bookingId: booking[0].id,
        amount: finalPrice,
        currency: quote.currency,
        status: "pending",
        paymentMethod: body.paymentMethod,
      });
    }

    return NextResponse.json(
      {
        bookingId: booking[0].id,
        bookingRef: booking[0].bookingRef,
        status: booking[0].status,
        totalPrice: finalPrice,
        currency: quote.currency,
        passengers: body.passengers.length,
      },
      { status: 201 }
    );
  } catch (error) {
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
