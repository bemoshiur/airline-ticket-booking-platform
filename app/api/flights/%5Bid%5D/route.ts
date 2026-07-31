import { NextRequest, NextResponse } from "next/server";
import { db, flights, airlines, airports } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flight = await db
      .select({
        id: flights.id,
        flightNumber: flights.flightNumber,
        departureTime: flights.departureTime,
        arrivalTime: flights.arrivalTime,
        durationMinutes: flights.durationMinutes,
        stops: flights.stops,
        aircraftType: flights.aircraftType,
        basePrice: flights.basePrice,
        seatsAvailable: flights.seatsAvailable,
        seatsEconomy: flights.seatsEconomy,
        seatsBusiness: flights.seatsBusiness,
        seatsFirst: flights.seatsFirst,
        operatingDays: flights.operatingDays,
        airline: {
          id: airlines.id,
          name: airlines.name,
          iataCode: airlines.iataCode,
          rating: airlines.rating,
          alliance: airlines.alliance,
        },
        departure: {
          code: airports.iataCode,
          city: airports.city,
          country: airports.country,
          timezone: airports.timezone,
        },
      })
      .from(flights)
      .innerJoin(airlines, eq(flights.airlineId, airlines.id))
      .innerJoin(airports, eq(flights.departureAirportId, airports.id))
      .where(eq(flights.id, params.id))
      .limit(1);

    if (!flight[0]) {
      return NextResponse.json(
        { error: "Flight not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(flight[0]);
  } catch (error) {
    console.error("Flight fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch flight" },
      { status: 500 }
    );
  }
}
