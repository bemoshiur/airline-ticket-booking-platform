import { NextRequest, NextResponse } from "next/server";
import { searchFlights, searchQuerySchema, toClientError } from "@/lib/iata";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/** Shopping calls are metered upstream, so cap them per client. */
const SEARCHES_PER_MINUTE = 30;

export async function POST(req: NextRequest) {
  const limit = rateLimit(
    clientKey(req, "flight-search"),
    SEARCHES_PER_MINUTE,
    60_000
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many searches — please slow down", code: "rate_limited" },
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

  const parsed = searchQuerySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid search request",
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
    const result = await searchFlights(parsed.data, req.signal);

    return NextResponse.json(
      {
        offers: result.offers,
        query: result.query,
        source: result.source,
        degraded: result.degraded,
        searchedAt: result.searchedAt,
        count: result.offers.length,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Flight search failed:", error);
    const { status, body } = toClientError(error);
    return NextResponse.json(body, { status });
  }
}
