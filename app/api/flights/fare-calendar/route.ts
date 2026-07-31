import { NextRequest, NextResponse } from "next/server";
import { fareCalendar, fareCalendarQuerySchema, toClientError } from "@/lib/iata";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/**
 * Cheapest fare per departure date across a window — the data behind the
 * "pick a cheaper day" calendar.
 *
 * These are browse prices, not quotes. Booking always reprices through
 * `/api/flights/price`.
 */

const CALENDARS_PER_MINUTE = 20;

export async function POST(req: NextRequest) {
  const limit = rateLimit(
    clientKey(req, "fare-calendar"),
    CALENDARS_PER_MINUTE,
    60_000
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests — please slow down", code: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON", code: "invalid_request" },
      { status: 400 }
    );
  }

  const parsed = fareCalendarQuerySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid calendar request",
        code: "invalid_request",
        issues: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  try {
    const result = await fareCalendar(parsed.data, req.signal);

    return NextResponse.json(
      {
        entries: result.entries,
        cheapest: result.cheapest,
        dearest: result.dearest,
        query: result.query,
        source: result.source,
        degraded: result.degraded,
        searchedAt: result.searchedAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Fare calendar failed:", error);
    const { status, body } = toClientError(error);
    return NextResponse.json(body, { status });
  }
}
