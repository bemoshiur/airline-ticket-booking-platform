import { NextRequest, NextResponse } from "next/server";
import { sweepPriceAlerts } from "@/lib/alerts/sweep";
import { assertCronCaller } from "@/lib/cron-auth";

/** Cron entry point for the price-alert sweep. See lib/cron-auth.ts. */

const DEFAULT_BATCH = 100;
const MAX_BATCH = 500;

/**
 * Vercel Cron invokes scheduled paths with GET and supplies
 * `Authorization: Bearer $CRON_SECRET` itself. POST is kept so the sweep can
 * also be kicked off by hand.
 */
export async function GET(req: NextRequest) {
  return runSweep(req);
}

export async function POST(req: NextRequest) {
  return runSweep(req);
}

async function runSweep(req: NextRequest) {
  const denied = assertCronCaller(req);
  if (denied) return denied;

  // An absent param must fall through to the default. `Number(null)` is 0,
  // which would otherwise clamp to a batch of one alert per run.
  const raw = req.nextUrl.searchParams.get("batch");
  const requested = raw === null ? Number.NaN : Number(raw);
  const batchSize = Number.isFinite(requested)
    ? Math.min(Math.max(1, Math.floor(requested)), MAX_BATCH)
    : DEFAULT_BATCH;

  try {
    const summary = await sweepPriceAlerts(batchSize, req.signal);
    console.log(
      `Price alert sweep: checked ${summary.checked}, ` +
        `notified ${summary.notified}, failed ${summary.failed}`
    );
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Price alert sweep failed:", error);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}
