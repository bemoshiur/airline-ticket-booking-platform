import { NextRequest, NextResponse } from "next/server";
import { db, bookings, flights, airlines, airports } from "@/lib/db";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// The airports table is joined twice — once per end of the route — so each
// side needs its own alias.
const departureAirport = alias(airports, "departure_airport");
const arrivalAirport = alias(airports, "arrival_airport");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        orgId: bookings.orgId,
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
          airlineName: airlines.name,
          airlineCode: airlines.iataCode,
          departureCity: departureAirport.city,
          departureCode: departureAirport.iataCode,
          arrivalCity: arrivalAirport.city,
          arrivalCode: arrivalAirport.iataCode,
        },
      })
      .from(bookings)
      .innerJoin(flights, eq(bookings.flightId, flights.id))
      .innerJoin(airlines, eq(flights.airlineId, airlines.id))
      .innerJoin(
        departureAirport,
        eq(flights.departureAirportId, departureAirport.id)
      )
      .innerJoin(
        arrivalAirport,
        eq(flights.arrivalAirportId, arrivalAirport.id)
      )
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking[0]) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Authorization check: user owns booking, agency owns booking, or superadmin
    const isOwner = booking[0].userId === session.user.id;
    const isAgencyOwner =
      session.user.role === "agency" &&
      booking[0].orgId === session.user.orgId;
    const isAdmin = session.user.role === "superadmin";

    if (!isOwner && !isAgencyOwner && !isAdmin) {
      // Return 404 to avoid revealing booking existence
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Return booking (exclude sensitive internal fields)
    const { userId, orgId, ...safeBooking } = booking[0];
    return NextResponse.json(safeBooking);
  } catch (error) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}
