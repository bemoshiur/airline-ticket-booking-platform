import { NextRequest, NextResponse } from "next/server";
import { db, bookings, payments, flights, organizations } from "@/lib/db";
import { auth } from "@/auth";
import { customAlphabet } from "nanoid";
import { eq } from "drizzle-orm";

const generateBookingRef = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  12
);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "agency") {
      return NextResponse.json(
        { error: "Only agencies can use bulk booking" },
        { status: 403 }
      );
    }

    const { flightId, passengerBatches, cabinClass } = await req.json();

    if (!flightId || !passengerBatches || !Array.isArray(passengerBatches)) {
      return NextResponse.json(
        {
          error: "Invalid request: flightId and passengerBatches array required",
        },
        { status: 400 }
      );
    }

    // Validate passenger batch count
    if (passengerBatches.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 passenger batches allowed" },
        { status: 400 }
      );
    }

    // Get flight from database
    const flight = await db
      .select()
      .from(flights)
      .where(eq(flights.id, flightId))
      .limit(1);

    if (!flight[0]) {
      return NextResponse.json(
        { error: "Flight not found" },
        { status: 404 }
      );
    }

    // Get agency org from database
    const agency = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, session.user.orgId || ""))
      .limit(1);

    if (!agency[0]) {
      return NextResponse.json(
        { error: "Agency not found" },
        { status: 404 }
      );
    }

    // Calculate cabin price
    let cabinPrice = flight[0].basePrice;
    if (cabinClass === "business") {
      cabinPrice = Math.floor(flight[0].basePrice * 1.5);
    } else if (cabinClass === "first") {
      cabinPrice = Math.floor(flight[0].basePrice * 2.5);
    } else if (cabinClass === "premium_economy") {
      cabinPrice = Math.floor(flight[0].basePrice * 1.25);
    }

    // Apply agency's configured markup (from organization, not client input).
    // commissionRate is a numeric column, so Postgres hands it back as a string.
    const agencyMarkup = Number(agency[0].commissionRate ?? 0);
    if (!Number.isFinite(agencyMarkup) || agencyMarkup < 0 || agencyMarkup > 100) {
      return NextResponse.json(
        { error: "Invalid agency configuration" },
        { status: 400 }
      );
    }
    const priceWithMarkup = Math.floor(cabinPrice * (1 + agencyMarkup / 100));

    // Create bookings in transaction
    const createdBookings = [];
    let totalSeatsNeeded = 0;

    // First pass: validate all batches and count seats
    for (const passengers of passengerBatches) {
      if (!Array.isArray(passengers) || passengers.length === 0) {
        continue;
      }
      if (passengers.length > 500) {
        return NextResponse.json(
          { error: "Maximum 500 passengers per batch" },
          { status: 400 }
        );
      }
      totalSeatsNeeded += passengers.length;
    }

    // Check seat availability
    if (totalSeatsNeeded > (flight[0].seatsAvailable || 0)) {
      return NextResponse.json(
        { error: `Not enough seats available (need ${totalSeatsNeeded}, have ${flight[0].seatsAvailable})` },
        { status: 400 }
      );
    }

    // Second pass: create bookings
    for (const passengers of passengerBatches) {
      if (!Array.isArray(passengers) || passengers.length === 0) {
        continue;
      }

      const totalPrice = priceWithMarkup * passengers.length;
      const bookingRef = generateBookingRef();

      const booking = await db
        .insert(bookings)
        .values({
          bookingRef,
          userId: session.user.id as string,
          orgId: agency[0].id,
          flightId,
          status: "confirmed", // Agency bookings auto-confirmed
          passengers,
          cabinClass,
          totalPrice,
          finalPrice: totalPrice,
        })
        .returning();

      if (booking[0]) {
        createdBookings.push({
          bookingId: booking[0].id,
          bookingRef: booking[0].bookingRef,
          passengers: passengers.length,
          totalPrice,
        });
      }
    }

    return NextResponse.json(
      {
        bookingsCreated: createdBookings.length,
        bookings: createdBookings,
        totalRevenue: createdBookings.reduce((sum, b) => sum + b.totalPrice, 0),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Bulk booking error:", error);
    return NextResponse.json(
      { error: "Failed to create bulk bookings" },
      { status: 500 }
    );
  }
}
