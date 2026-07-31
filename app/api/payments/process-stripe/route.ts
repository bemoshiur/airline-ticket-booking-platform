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
    const amount = booking[0].finalPrice;
    const currency = booking[0].currency || "BDT";

    // Create Stripe payment intent
    // Note: Stripe doesn't support BDT; in production, convert BDT to USD at current rate
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in smallest unit (poisha for BDT equivalent)
      currency: "usd", // Stripe limitation; convert BDT → USD in production
      metadata: {
        bookingId,
        bookingRef: booking[0].bookingRef,
      },
    });

    // Update payment record in DB
    await db
      .insert(payments)
      .values({
        bookingId,
        amount,
        currency: "BDT",
        status: "processing",
        paymentMethod: "stripe",
        stripePaymentIntentId: paymentIntent.id,
        processorResponse: paymentIntent as any,
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
