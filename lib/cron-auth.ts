import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

/**
 * Shared guard for cron-triggered routes.
 *
 * There is no user session on these, so the caller proves itself with
 * `Authorization: Bearer $CRON_SECRET`. Vercel Cron sets that header itself
 * when `CRON_SECRET` is in the environment.
 *
 * Returns a response to send when the caller is rejected, or null to proceed.
 */
export function assertCronCaller(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    // Refuse rather than run open. These jobs fan out metered shopping calls
    // and mutate inventory — an unauthenticated trigger is a real weapon.
    console.error("CRON_SECRET is not set; refusing to run a cron job");
    return NextResponse.json({ error: "Not available" }, { status: 503 });
  }

  if (!presentedSecretMatches(req.headers.get("authorization"), secret)) {
    // 404 rather than 401: an unauthenticated caller learns nothing about
    // which paths exist.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return null;
}

/** Constant-time compare, so the secret cannot be recovered by timing. */
function presentedSecretMatches(header: string | null, secret: string): boolean {
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
