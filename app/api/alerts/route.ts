import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, priceAlerts } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/errors";
import { auth } from "@/auth";
import { CABIN_CLASSES } from "@/lib/iata/types";

/** Each alert costs a shopping call per sweep, so cap what one user can queue. */
const MAX_ALERTS_PER_USER = 20;
/** Watching a departure further out than this is not useful; fares are not loaded. */
const MAX_DAYS_AHEAD = 365;

const iataCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Must be a 3-letter IATA code");

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be an ISO date (YYYY-MM-DD)");

const createSchema = z
  .object({
    origin: iataCode,
    destination: iataCode,
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
    /** Omit to be told whenever the fare hits a new low. */
    targetPrice: z.coerce.number().int().positive().max(100_000_000).nullish(),
  })
  .refine((a) => a.origin !== a.destination, {
    message: "Origin and destination must differ",
    path: ["destination"],
  })
  .refine((a) => !a.returnDate || a.returnDate >= a.departureDate, {
    message: "Return date must be on or after departure date",
    path: ["returnDate"],
  })
  .refine((a) => a.infants <= a.adults, {
    message: "Each infant must be accompanied by an adult",
    path: ["infants"],
  })
  .refine((a) => a.adults + a.children + a.infants <= 9, {
    message: "Maximum 9 passengers per booking",
    path: ["adults"],
  });

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.userId, session.user.id))
    .orderBy(desc(priceAlerts.createdAt));

  return NextResponse.json({ alerts, count: alerts.length });
}

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

  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid alert",
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const alert = parsed.data;

  const departure = Date.parse(`${alert.departureDate}T23:59:59.999Z`);
  if (!Number.isFinite(departure) || departure < Date.now()) {
    return NextResponse.json(
      { error: "Departure date is in the past" },
      { status: 400 }
    );
  }
  if (departure > Date.now() + MAX_DAYS_AHEAD * 86_400_000) {
    return NextResponse.json(
      { error: `Departure date is more than ${MAX_DAYS_AHEAD} days away` },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({ total: count() })
    .from(priceAlerts)
    .where(
      and(
        eq(priceAlerts.userId, session.user.id),
        eq(priceAlerts.status, "active")
      )
    );

  if (existing.total >= MAX_ALERTS_PER_USER) {
    return NextResponse.json(
      {
        error: `You can watch at most ${MAX_ALERTS_PER_USER} routes at a time`,
        code: "alert_limit_reached",
      },
      { status: 409 }
    );
  }

  try {
    const created = await db
      .insert(priceAlerts)
      .values({
        userId: session.user.id,
        origin: alert.origin,
        destination: alert.destination,
        departureDate: alert.departureDate,
        returnDate: alert.returnDate ?? null,
        adults: alert.adults,
        children: alert.children,
        infants: alert.infants,
        cabinClass: alert.cabinClass,
        currency: alert.currency,
        targetPrice: alert.targetPrice ?? null,
      })
      .returning();

    return NextResponse.json(created[0], { status: 201 });
  } catch (error) {
    // The unique index rejects a duplicate watch on the same itinerary.
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "You are already watching this route", code: "duplicate_alert" },
        { status: 409 }
      );
    }
    console.error("Alert creation failed:", error);
    return NextResponse.json(
      { error: "Could not create the alert" },
      { status: 500 }
    );
  }
}

