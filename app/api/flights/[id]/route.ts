import { NextRequest, NextResponse } from "next/server";
import { db, flights, airlines, airports } from "@/lib/db";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// Both ends of the route come from the airports table, so each needs an alias.
const departureAirport = alias(airports, "departure_airport");
const arrivalAirport = alias(airports, "arrival_airport");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        currency: flights.currency,
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
          code: departureAirport.iataCode,
          city: departureAirport.city,
          country: departureAirport.country,
          timezone: departureAirport.timezone,
        },
        arrival: {
          code: arrivalAirport.iataCode,
          city: arrivalAirport.city,
          country: arrivalAirport.country,
          timezone: arrivalAirport.timezone,
        },
      })
      .from(flights)
      .innerJoin(airlines, eq(flights.airlineId, airlines.id))
      .innerJoin(
        departureAirport,
        eq(flights.departureAirportId, departureAirport.id)
      )
      .innerJoin(
        arrivalAirport,
        eq(flights.arrivalAirportId, arrivalAirport.id)
      )
      .where(eq(flights.id, id))
      .limit(1);

    if (!flight[0]) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
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
