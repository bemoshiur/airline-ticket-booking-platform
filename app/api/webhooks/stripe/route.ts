import { NextRequest, NextResponse } from "next/server";
import { db, bookings, payments } from "@/lib/db";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;

        if (!bookingId) {
          console.warn("Payment intent missing bookingId metadata");
          break;
        }

        // Update payment status
        await db
          .update(payments)
          .set({
            status: "completed",
            updatedAt: new Date(),
            completedAt: new Date(),
          })
          .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

        // Update booking status to confirmed
        await db
          .update(bookings)
          .set({
            status: "confirmed",
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, bookingId));

        console.log(`✓ Booking ${bookingId} confirmed via Stripe webhook`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;

        if (!bookingId) {
          console.warn("Payment intent missing bookingId metadata");
          break;
        }

        // Update payment status to failed
        await db
          .update(payments)
          .set({
            status: "failed",
            updatedAt: new Date(),
            errorMessage: paymentIntent.last_payment_error?.message,
            processorResponse: {
              id: paymentIntent.id,
              status: paymentIntent.status,
              error: paymentIntent.last_payment_error,
            },
          })
          .where(eq(payments.stripePaymentIntentId, paymentIntent.id));

        console.log(
          `✗ Payment failed for booking ${bookingId}: ${paymentIntent.last_payment_error?.message}`
        );
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        console.log(`Charge refunded: ${charge.id}`);
        // TODO: Handle refund - update booking status to cancelled, recalculate commissions
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
