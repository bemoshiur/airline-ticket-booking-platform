import { NextRequest, NextResponse } from "next/server";
import { db, agencyCommissions, bookings, airlines } from "@/lib/db";
import { auth } from "@/auth";
import { eq, and, sum, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "agency") {
      return NextResponse.json(
        { error: "Only agencies can view commissions" },
        { status: 403 }
      );
    }

    // Calculate commissions for this agency
    const commissions = await db
      .select({
        id: agencyCommissions.id,
        bookingId: agencyCommissions.bookingId,
        commissionAmount: agencyCommissions.commissionAmount,
        status: agencyCommissions.status,
        createdAt: agencyCommissions.createdAt,
      })
      .from(agencyCommissions)
      .where(eq(agencyCommissions.orgId, session.user.orgId || ""))
      .orderBy((col) => sql`${col.createdAt} DESC`);

    // Calculate totals
    const totalEarned = commissions.reduce((sum, c) => {
      if (c.status === "earned" || c.status === "paid") {
        return sum + c.commissionAmount;
      }
      return sum;
    }, 0);

    const totalPending = commissions.reduce((sum, c) => {
      if (c.status === "pending") {
        return sum + c.commissionAmount;
      }
      return sum;
    }, 0);

    const totalPaid = commissions.reduce((sum, c) => {
      if (c.status === "paid") {
        return sum + c.commissionAmount;
      }
      return sum;
    }, 0);

    return NextResponse.json({
      commissions,
      summary: {
        totalEarned,
        totalPending,
        totalPaid,
        outstandingBalance: totalEarned - totalPaid,
      },
    });
  } catch (error) {
    console.error("Commission fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch commissions" },
      { status: 500 }
    );
  }
}

// POST to request payout
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "agency") {
      return NextResponse.json(
        { error: "Only agencies can request payouts" },
        { status: 403 }
      );
    }

    // TODO: Create payout request
    // For now, just return success

    return NextResponse.json(
      {
        message: "Payout request submitted",
        status: "pending_review",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payout request error:", error);
    return NextResponse.json(
      { error: "Failed to request payout" },
      { status: 500 }
    );
  }
}
