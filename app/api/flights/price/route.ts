import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { priceOffer, toClientError } from "@/lib/iata";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/**
 * Authoritative re-quote for a shopped offer.
 *
 * The client calls this on the review screen, before payment. A `changed: true`
 * response means the fare moved and the customer must accept the new total —
 * never charge the shopping price.
 */

const bodySchema = z.object({
  offerId: z.string().trim().min(1).max(200),
});

const PRICING_PER_MINUTE = 20;

export async function POST(req: NextRequest) {
  const limit = rateLimit(
    clientKey(req, "flight-price"),
    PRICING_PER_MINUTE,
    60_000
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many pricing requests", code: "rate_limited" },
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

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "offerId is required", code: "invalid_request" },
      { status: 400 }
    );
  }

  try {
    const priced = await priceOffer(parsed.data.offerId, req.signal);

    return NextResponse.json(
      {
        offer: priced.offer,
        changed: priced.changed,
        previousTotal: priced.previousTotal,
        newTotal: priced.offer.price.total,
        currency: priced.offer.price.currency,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Offer pricing failed:", error);
    const { status, body } = toClientError(error);
    return NextResponse.json(body, { status });
  }
}
