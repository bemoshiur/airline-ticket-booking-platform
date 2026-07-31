import { NextRequest, NextResponse } from "next/server";
import { db, bookings, payments, users } from "@/lib/db";
import { auth } from "@/auth";
import { eq, count, sum } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Only superadmins can access analytics" },
        { status: 403 }
      );
    }

    // Calculate key metrics
    const totalBookings = await db
      .select({ count: count() })
      .from(bookings);

    const totalRevenue = await db
      .select({ total: sum(bookings.finalPrice) })
      .from(bookings)
      .where(eq(bookings.status, "confirmed"));

    const totalUsers = await db
      .select({ count: count() })
      .from(users);

    const completedPayments = await db
      .select({ count: count() })
      .from(payments)
      .where(eq(payments.status, "completed"));

    const conversionRate =
      totalBookings[0].count > 0
        ? Math.round(
            ((totalBookings[0].count || 0) / (totalUsers[0].count || 1)) * 100
          )
        : 0;

    // Bookings by status breakdown
    const bookingsByStatus = await db
      .select({
        status: bookings.status,
        count: count(),
      })
      .from(bookings)
      .groupBy(bookings.status);

    // Postgres returns SUM() as a string to preserve precision.
    const revenue = Number(totalRevenue[0].total ?? 0);
    const bookingCount = totalBookings[0].count;

    return NextResponse.json({
      metrics: {
        totalRevenue: revenue,
        totalBookings: bookingCount,
        totalUsers: totalUsers[0].count || 0,
        completedPayments: completedPayments[0].count || 0,
        conversionRate: `${conversionRate}%`,
        averageOrderValue:
          bookingCount > 0 ? Math.floor(revenue / bookingCount) : 0,
      },
      bookingsByStatus,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
