import { NextRequest, NextResponse } from "next/server";
import { db, bookings, payments } from "@/lib/db";
import { auth } from "@/auth";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";
import { convert, toMinorUnits } from "@/lib/fx";

// No apiVersion override: pinning a string the installed SDK does not know
// breaks the build on every upgrade. The SDK defaults to its own version.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** Stripe cannot settle BDT, so cards are charged in this currency. */
const SETTLEMENT_CURRENCY = "USD";
/** Stripe's floor for a card charge, in settlement-currency minor units. */
const MIN_CHARGE_MINOR_UNITS = 50;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await req.json();

    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking[0]) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking[0].userId !== session.user.id) {
      // 404, not 403 — a 403 confirms the booking id exists.
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Prevent double-payment: only a booking awaiting payment can be charged.
    if (booking[0].status !== "pending_payment") {
      return NextResponse.json(
        { error: `Cannot pay for booking with status: ${booking[0].status}` },
        { status: 400 }
      );
    }

    const amountBDT = booking[0].finalPrice;

    // Idempotency: a retried checkout must reuse the existing intent rather
    // than stack up authorizations against the same booking.
    const existing = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.bookingId, bookingId),
          eq(payments.status, "processing")
        )
      )
      .limit(1);

    if (existing[0]?.stripePaymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(
        existing[0].stripePaymentIntentId
      );
      if (intent.status !== "canceled") {
        return NextResponse.json({
          clientSecret: intent.client_secret,
          paymentIntentId: intent.id,
          amount: amountBDT,
          currency: "BDT",
          bookingRef: booking[0].bookingRef,
          status: "pending",
          reused: true,
        });
      }
    }

    const settlement = convert(amountBDT, "BDT", SETTLEMENT_CURRENCY);
    const chargeMinorUnits = toMinorUnits(
      settlement.amount,
      SETTLEMENT_CURRENCY
    );

    if (chargeMinorUnits < MIN_CHARGE_MINOR_UNITS) {
      return NextResponse.json(
        { error: "Booking amount is below the card processing minimum" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: chargeMinorUnits,
        currency: SETTLEMENT_CURRENCY.toLowerCase(),
        metadata: {
          bookingId,
          bookingRef: booking[0].bookingRef,
          amountBDT: String(amountBDT),
          fxRate: String(settlement.rate),
        },
      },
      // Stripe-side guard against duplicate intents from a double-submit.
      { idempotencyKey: `booking:${bookingId}:${amountBDT}` }
    );

    // Persist only non-sensitive fields — never the client_secret — plus the
    // FX rate, so the charge can be reconciled against the BDT ledger later.
    await db.insert(payments).values({
      bookingId,
      amount: amountBDT,
      currency: "BDT",
      status: "processing",
      paymentMethod: "stripe",
      stripePaymentIntentId: paymentIntent.id,
      processorResponse: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        settlementCurrency: SETTLEMENT_CURRENCY,
        settlementAmount: settlement.amount,
        amountBDT,
        fxRate: settlement.rate,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountBDT,
      currency: "BDT",
      settlement: {
        currency: SETTLEMENT_CURRENCY,
        amount: settlement.amount,
        rate: settlement.rate,
      },
      bookingRef: booking[0].bookingRef,
      status: "pending",
    });
  } catch (error) {
    console.error("Stripe payment error:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
