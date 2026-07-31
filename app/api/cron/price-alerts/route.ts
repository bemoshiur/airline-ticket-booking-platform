import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sweepPriceAlerts } from "@/lib/alerts/sweep";

/**
 * Cron entry point for the price-alert sweep.
 *
 * There is no user session here, so the caller proves itself with
 * `Authorization: Bearer $CRON_SECRET`. Without that secret set the route
 * refuses to run at all — an open endpoint that fans out shopping calls is a
 * denial-of-wallet vector, not merely an information leak.
 */

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
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set; refusing to run the alert sweep");
    return NextResponse.json(
      { error: "Not available" },
      { status: 503 }
    );
  }

  if (!presentedSecretMatches(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

/** Constant-time compare, so the secret cannot be recovered by timing. */
function presentedSecretMatches(
  header: string | null,
  secret: string
): boolean {
  const presented = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : null;
  if (!presented) return false;

  const a = Buffer.from(presented);
  const b = Buffer.from(secret);
  // timingSafeEqual throws on a length mismatch, which would itself leak length.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
