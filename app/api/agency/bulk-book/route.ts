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

    const { flightId, passengerBatches, cabinClass, orgMarkup = 0 } =
      await req.json();

    if (!flightId || !passengerBatches || !Array.isArray(passengerBatches)) {
      return NextResponse.json(
        {
          error: "Invalid request: flightId and passengerBatches array required",
        },
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

    // Apply agency markup
    const priceWithMarkup = Math.floor(cabinPrice * (1 + orgMarkup / 100));

    // Create bookings in transaction
    const createdBookings = [];

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
