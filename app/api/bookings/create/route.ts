import { NextRequest, NextResponse } from "next/server";
import { db, bookings, payments } from "@/lib/db";
import { auth } from "@/auth";
import { nanoid } from "nanoid";

function generateBookingRef(): string {
  // Generate format: ABC123 (6 alphanumeric chars)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
      totalPrice,
      discount,
      ancillaries,
      paymentMethod,
    } = await req.json();

    if (!flightId || !passengers || !cabinClass || !totalPrice) {
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

    const bookingRef = generateBookingRef();
    const finalPrice = totalPrice - (discount || 0);

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
