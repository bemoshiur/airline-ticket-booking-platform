import { NextRequest, NextResponse } from "next/server";
import { db, bookings, payments, flights } from "@/lib/db";
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

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      flightId,
      passengers,
      cabinClass,
      promoCode,
      ancillaries,
      paymentMethod,
    } = await req.json();

    if (!flightId || !passengers || !cabinClass) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(passengers) || passengers.length === 0) {
      return NextResponse.json(
        { error: "At least one passenger required" },
        { status: 400 }
      );
    }

    // Look up flight from database to get authoritative pricing
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

    // Calculate price server-side from flight base price
    let cabinPrice = flight[0].basePrice;
    if (cabinClass === "business") {
      cabinPrice = Math.floor(flight[0].basePrice * 1.5);
    } else if (cabinClass === "first") {
      cabinPrice = Math.floor(flight[0].basePrice * 2.5);
    } else if (cabinClass === "premium_economy") {
      cabinPrice = Math.floor(flight[0].basePrice * 1.25);
    }

    const totalPrice = cabinPrice * passengers.length;

    // Server-side discount validation (placeholder - expand with promo code logic)
    let discount = 0;
    if (promoCode) {
      // TODO: Validate promoCode from database, calculate discount
      // For now, no discount
    }

    const finalPrice = totalPrice - discount;

    const bookingRef = generateBookingRef();

    // Create booking
    const booking = await db
      .insert(bookings)
      .values({
        bookingRef,
        userId: session.user.id as string,
        flightId,
        status: "pending_payment",
        passengers,
        cabinClass,
        totalPrice,
        discount: discount || 0,
        finalPrice,
        ancillaries: ancillaries || [],
        paymentMethod: paymentMethod || undefined,
      })
      .returning();

    if (!booking[0]) {
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    // If payment method provided, also create payment record
    if (paymentMethod) {
      await db.insert(payments).values({
        bookingId: booking[0].id,
        amount: finalPrice,
        currency: "BDT",
        status: "pending",
        paymentMethod,
      });
    }

    return NextResponse.json(
      {
        bookingId: booking[0].id,
        bookingRef: booking[0].bookingRef,
        status: booking[0].status,
        totalPrice: finalPrice,
        passengers: passengers.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
