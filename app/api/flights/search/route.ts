import { NextRequest, NextResponse } from "next/server";
import { db, flights, airlines, airports } from "@/lib/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const {
      from,
      to,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      cabinClass,
    } = await req.json();

    if (!from || !to || !departureDate) {
      return NextResponse.json(
        { error: "Missing required fields: from, to, departureDate" },
        { status: 400 }
      );
    }

    // Validate airports exist
    const [departureAirport, arrivalAirport] = await Promise.all([
      db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, from.toUpperCase()))
        .limit(1),
      db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, to.toUpperCase()))
        .limit(1),
    ]);

    if (departureAirport.length === 0 || arrivalAirport.length === 0) {
      return NextResponse.json(
        { error: "Invalid airport code" },
        { status: 400 }
      );
    }

    // Parse dates
    const depDate = new Date(departureDate);
    depDate.setHours(0, 0, 0, 0);
    const depDateEnd = new Date(depDate);
    depDateEnd.setHours(23, 59, 59, 999);

    // Search for outbound flights
    const outboundFlights = await db
      .select({
        id: flights.id,
        airlineId: flights.airlineId,
        flightNumber: flights.flightNumber,
        departureTime: flights.departureTime,
        arrivalTime: flights.arrivalTime,
        durationMinutes: flights.durationMinutes,
        stops: flights.stops,
        basePrice: flights.basePrice,
        aircraftType: flights.aircraftType,
        seatsEconomy: flights.seatsEconomy,
        seatsBusiness: flights.seatsBusiness,
        seatsFirst: flights.seatsFirst,
        airline: {
          id: airlines.id,
          iataCode: airlines.iataCode,
          name: airlines.name,
          rating: airlines.rating,
        },
      })
      .from(flights)
      .innerJoin(airlines, eq(flights.airlineId, airlines.id))
      .where(
        and(
          eq(flights.departureAirportId, departureAirport[0].id),
          eq(flights.arrivalAirportId, arrivalAirport[0].id),
          gte(flights.departureTime, depDate),
          lte(flights.departureTime, depDateEnd)
        )
      )
      .orderBy(desc(flights.departureTime));

    // Search for return flights if roundtrip
    let returnFlights = [];
    if (returnDate) {
      const retDate = new Date(returnDate);
      retDate.setHours(0, 0, 0, 0);
      const retDateEnd = new Date(retDate);
      retDateEnd.setHours(23, 59, 59, 999);

      returnFlights = await db
        .select({
          id: flights.id,
          airlineId: flights.airlineId,
          flightNumber: flights.flightNumber,
          departureTime: flights.departureTime,
          arrivalTime: flights.arrivalTime,
          durationMinutes: flights.durationMinutes,
          stops: flights.stops,
          basePrice: flights.basePrice,
          aircraftType: flights.aircraftType,
          seatsEconomy: flights.seatsEconomy,
          seatsBusiness: flights.seatsBusiness,
          seatsFirst: flights.seatsFirst,
          airline: {
            id: airlines.id,
            iataCode: airlines.iataCode,
            name: airlines.name,
            rating: airlines.rating,
          },
        })
        .from(flights)
        .innerJoin(airlines, eq(flights.airlineId, airlines.id))
        .where(
          and(
            eq(flights.departureAirportId, arrivalAirport[0].id),
            eq(flights.arrivalAirportId, departureAirport[0].id),
            gte(flights.departureTime, retDate),
            lte(flights.departureTime, retDateEnd)
          )
        )
        .orderBy(desc(flights.departureTime));
    }

    return NextResponse.json({
      outbound: outboundFlights,
      return: returnFlights,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      departureDate,
      returnDate: returnDate || null,
      passengers: {
        adults: adults || 1,
        children: children || 0,
        infants: infants || 0,
      },
      cabinClass: cabinClass || "economy",
    });
  } catch (error) {
    console.error("Flight search error:", error);
    return NextResponse.json(
      { error: "Failed to search flights" },
      { status: 500 }
    );
  }
}
