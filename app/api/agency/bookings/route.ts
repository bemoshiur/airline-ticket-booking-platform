import { NextRequest, NextResponse } from "next/server";
import { db, bookings, flights, airlines } from "@/lib/db";
import { auth } from "@/auth";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "agency") {
      return NextResponse.json(
        { error: "Only agencies can view bookings" },
        { status: 403 }
      );
    }

    // Fail closed: agency must have orgId
    if (!session.user.orgId) {
      return NextResponse.json(
        { error: "Agency not properly configured" },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limitParam = parseInt(searchParams.get("limit") || "50");
    const offsetParam = parseInt(searchParams.get("offset") || "0");

    // Clamp pagination: limit 1-100, offset >= 0
    const limit = Math.min(Math.max(1, limitParam || 50), 100);
    const offset = Math.max(0, offsetParam || 0);

    // Build query
    let whereConditions = eq(bookings.orgId, session.user.orgId);
    if (status) {
      whereConditions = and(
        whereConditions,
        eq(bookings.status, status as any)
      );
    }

    const agencyBookings = await db
      .select({
        id: bookings.id,
        bookingRef: bookings.bookingRef,
        status: bookings.status,
        passengers: bookings.passengers,
        finalPrice: bookings.finalPrice,
        createdAt: bookings.createdAt,
        flight: {
          flightNumber: flights.flightNumber,
          airline: {
            name: airlines.name,
            iataCode: airlines.iataCode,
          },
        },
      })
      .from(bookings)
      .innerJoin(flights, eq(bookings.flightId, flights.id))
      .innerJoin(airlines, eq(flights.airlineId, airlines.id))
      .where(whereConditions)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(bookings.createdAt));

    return NextResponse.json({
      bookings: agencyBookings,
      pagination: {
        limit,
        offset,
        count: agencyBookings.length,
      },
    });
  } catch (error) {
    console.error("Agency bookings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
