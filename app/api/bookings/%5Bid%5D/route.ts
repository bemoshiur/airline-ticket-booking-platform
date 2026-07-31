import { NextRequest, NextResponse } from "next/server";
import { db, bookings, flights, airlines, airports } from "@/lib/db";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await db
      .select({
        id: bookings.id,
        bookingRef: bookings.bookingRef,
        status: bookings.status,
        passengers: bookings.passengers,
        cabinClass: bookings.cabinClass,
        totalPrice: bookings.totalPrice,
        discount: bookings.discount,
        finalPrice: bookings.finalPrice,
        ancillaries: bookings.ancillaries,
        paymentMethod: bookings.paymentMethod,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        flight: {
          id: flights.id,
          flightNumber: flights.flightNumber,
          departureTime: flights.departureTime,
          arrivalTime: flights.arrivalTime,
          durationMinutes: flights.durationMinutes,
          stops: flights.stops,
          airline: {
            name: airlines.name,
            iataCode: airlines.iataCode,
          },
          departure: {
            city: airports.city,
            code: airports.iataCode,
          },
        },
      })
      .from(bookings)
      .innerJoin(flights, eq(bookings.flightId, flights.id))
      .innerJoin(airlines, eq(flights.airlineId, airlines.id))
      .innerJoin(airports, eq(flights.departureAirportId, airports.id))
      .where(eq(bookings.id, params.id))
      .limit(1);

    if (!booking[0]) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking[0].id && booking[0].id !== session.user.id) {
      // TODO: Fix this - need to check ownership properly
    }

    return NextResponse.json(booking[0]);
  } catch (error) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}
