import { NextRequest, NextResponse } from "next/server";
import { db, bookings, payments } from "@/lib/db";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
    }

    // Get booking
    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking[0]) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking[0].userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Prevent double-payment: only allow payment for pending_payment status
    if (booking[0].status !== "pending_payment") {
      return NextResponse.json(
        {
          error: `Cannot pay for booking with status: ${booking[0].status}`,
        },
        { status: 400 }
      );
    }

    // Use booking's authoritative finalPrice and currency
    const amountBDT = booking[0].finalPrice;
    const currency = booking[0].currency || "BDT";

    // For MVP: Use a fixed exchange rate (1 BDT ≈ 0.0095 USD)
    // In production: Fetch real-time rate from currency API
    const BDT_TO_USD_RATE = 0.0095;
    const amountUSD = Math.round(amountBDT * BDT_TO_USD_RATE * 100); // Convert to USD cents for Stripe

    // Safeguard: minimum charge (e.g., $0.50)
    if (amountUSD < 50) {
      return NextResponse.json(
        { error: "Booking amount too low for card processing (min ~500 BDT)" },
        { status: 400 }
      );
    }

    // Create Stripe payment intent in USD (Stripe doesn't support BDT)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountUSD, // Amount in USD cents (smallest Stripe unit)
      currency: "usd",
      metadata: {
        bookingId,
        bookingRef: booking[0].bookingRef,
        amountBDT,
      },
    });

    // Store payment record with BOTH original and converted amounts
    // Do NOT store sensitive fields like client_secret
    const safeProcessorData = {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amountUSD,
      amountBDT,
      fxRate: BDT_TO_USD_RATE,
    };

    await db.insert(payments).values({
      bookingId,
      amount: amountBDT, // Store in booking currency
      currency: "BDT",
      status: "processing",
      paymentMethod: "stripe",
      stripePaymentIntentId: paymentIntent.id,
      processorResponse: safeProcessorData, // Only safe, non-sensitive fields
    });

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
        bookingRef: booking[0].bookingRef,
        status: "pending",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Stripe payment error:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
