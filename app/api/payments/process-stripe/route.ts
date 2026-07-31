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

    const { bookingId, amount, currency = "BDT" } = await req.json();

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: "Missing bookingId or amount" },
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

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in poisha (smallest unit, 100 poisha = 1 BDT)
      currency: "usd", // Stripe uses USD for international, but we'll convert from BDT
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
