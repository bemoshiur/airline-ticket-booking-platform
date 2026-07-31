import { NextRequest, NextResponse } from "next/server";
import { db, partnerReferrals } from "@/lib/db";
import { auth } from "@/auth";
import { eq, count, sum } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "partner") {
      return NextResponse.json(
        { error: "Only partners can access dashboard" },
        { status: 403 }
      );
    }

    // Get all referrals for this partner
    const referrals = await db
      .select({
        id: partnerReferrals.id,
        uniqueLink: partnerReferrals.uniqueLink,
        status: partnerReferrals.status,
        earnedAmount: partnerReferrals.earnedAmount,
        clickedAt: partnerReferrals.clickedAt,
        bookedAt: partnerReferrals.bookedAt,
        paidAt: partnerReferrals.paidAt,
      })
      .from(partnerReferrals)
      .where(eq(partnerReferrals.partnerId, session.user.orgId || ""));

    // Calculate metrics
    const totalClicks = referrals.filter((r) => r.clickedAt).length;
    const totalBookings = referrals.filter((r) => r.bookedAt).length;
    const conversionRate =
      totalClicks > 0 ? Math.round((totalBookings / totalClicks) * 100) : 0;
    const totalEarned = referrals
      .filter((r) => r.status === "earned" || r.status === "paid")
      .reduce((sum, r) => sum + (r.earnedAmount || 0), 0);
    const totalPending = referrals
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + (r.earnedAmount || 0), 0);
    const totalPaid = referrals
      .filter((r) => r.status === "paid")
      .reduce((sum, r) => sum + (r.earnedAmount || 0), 0);

    return NextResponse.json({
      referrals: referrals.slice(-10), // Last 10 referrals
      metrics: {
        totalClicks,
        totalBookings,
        conversionRate: `${conversionRate}%`,
        totalEarned,
        totalPending,
        totalPaid,
        outstandingBalance: totalEarned - totalPaid,
      },
    });
  } catch (error) {
    console.error("Partner dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
