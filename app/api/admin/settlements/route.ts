import { NextRequest, NextResponse } from "next/server";
import { db, agencyCommissions, organizations } from "@/lib/db";
import { auth } from "@/auth";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Only superadmins can access settlements" },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "pending";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get pending commissions by agency
    const pendingSettlements = await db
      .select({
        id: agencyCommissions.id,
        orgId: agencyCommissions.orgId,
        totalAmount: agencyCommissions.commissionAmount,
        status: agencyCommissions.status,
        count: agencyCommissions.id,
      })
      .from(agencyCommissions)
      .where(eq(agencyCommissions.status, status as any))
      .limit(limit);

    return NextResponse.json({
      settlements: pendingSettlements,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Settlements fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settlements" },
      { status: 500 }
    );
  }
}

// Process settlement payment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "superadmin") {
      return NextResponse.json(
        { error: "Only superadmins can process settlements" },
        { status: 403 }
      );
    }

    const { settlementIds, bankTransferRef } = await req.json();

    if (!Array.isArray(settlementIds) || settlementIds.length === 0) {
      return NextResponse.json(
        { error: "Settlement IDs required" },
        { status: 400 }
      );
    }

    // Update commissions to paid
    for (const id of settlementIds) {
      await db
        .update(agencyCommissions)
        .set({
          status: "paid",
          paidAt: new Date(),
        })
        .where(eq(agencyCommissions.id, id));
    }

    return NextResponse.json(
      {
        message: `${settlementIds.length} settlements processed`,
        bankTransferRef,
        paidAt: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Settlement processing error:", error);
    return NextResponse.json(
      { error: "Failed to process settlement" },
      { status: 500 }
    );
  }
}
