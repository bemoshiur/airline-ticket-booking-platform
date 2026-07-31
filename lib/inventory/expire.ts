/**
 * Release seats held by bookings that never paid.
 *
 * Reserving at booking time is only half the job: without this, one abandoned
 * checkout holds its seats forever and the flight slowly sells out to nobody.
 */

import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db, bookings } from "@/lib/db";
import { releaseSeats, seatsHeldBy } from "./seats";

/**
 * How long a booking may sit unpaid before its seats go back. Long enough to
 * finish a card payment including a 3-D Secure detour, short enough that a
 * popular flight is not held hostage.
 */
export const PAYMENT_WINDOW_MS = 30 * 60 * 1000;

export interface ExpirySummary {
  expired: number;
  seatsReleased: number;
}

export async function expireUnpaidBookings(
  batchSize = 200
): Promise<ExpirySummary> {
  const cutoff = new Date(Date.now() - PAYMENT_WINDOW_MS);

  const stale = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "pending_payment"),
        lt(bookings.createdAt, cutoff),
        // GDS-sourced bookings hold no local inventory to give back.
        isNotNull(bookings.flightId)
      )
    )
    .limit(batchSize);

  const summary: ExpirySummary = { expired: 0, seatsReleased: 0 };

  for (const booking of stale) {
    const passengers = Array.isArray(booking.passengers)
      ? (booking.passengers as { type?: string }[])
      : [];
    const seats = seatsHeldBy(passengers);

    try {
      await db.transaction(async (tx) => {
        // The status guard is what makes this safe to run concurrently with a
        // payment landing: whichever transaction commits first wins, and the
        // loser updates zero rows and releases nothing.
        const cancelled = await tx
          .update(bookings)
          .set({
            status: "cancelled",
            cancellationReason: "Payment not completed in time",
            cancelledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(bookings.id, booking.id),
              eq(bookings.status, "pending_payment")
            )
          )
          .returning({ id: bookings.id });

        if (cancelled.length === 0) return;

        await releaseSeats(tx, booking.flightId!, booking.cabinClass, seats);
        summary.expired++;
        summary.seatsReleased += seats;
      });
    } catch (error) {
      console.error(`Failed to expire booking ${booking.id}:`, error);
    }
  }

  return summary;
}
