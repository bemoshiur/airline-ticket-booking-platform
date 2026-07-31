import { NextRequest, NextResponse } from "next/server";
import { expireUnpaidBookings } from "@/lib/inventory/expire";
import { assertCronCaller } from "@/lib/cron-auth";

/**
 * Cancels bookings that never paid and returns their seats to inventory.
 * Runs far more often than the price-alert sweep — every held seat is a seat
 * nobody else can buy.
 */
export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  const denied = assertCronCaller(req);
  if (denied) return denied;

  try {
    const summary = await expireUnpaidBookings();
    if (summary.expired > 0) {
      console.log(
        `Expired ${summary.expired} unpaid bookings, ` +
          `released ${summary.seatsReleased} seats`
      );
    }
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Booking expiry failed:", error);
    return NextResponse.json({ error: "Expiry failed" }, { status: 500 });
  }
}
