/**
 * Seat inventory.
 *
 * Every booking path previously *read* the seat count and compared it, but
 * never decremented it — a flight could be sold an unlimited number of times.
 *
 * The reservation below is a single conditional UPDATE:
 *
 *   UPDATE flights SET seats_economy = seats_economy - n
 *   WHERE id = ? AND seats_economy >= n
 *
 * Postgres takes a row lock for the duration of the statement, so concurrent
 * transactions serialize on it. The loser's `>= n` predicate is re-evaluated
 * against the winner's committed value and matches zero rows — which is how we
 * detect the shortfall. A read-then-write pair cannot do this: both callers
 * would read the same count and both would think they fit.
 */

import { eq, sql } from "drizzle-orm";
import { flights } from "@/lib/db/schema";
import type { CabinClass } from "@/lib/iata/types";

/** Accepts a transaction or the base client — reservations belong in a tx. */
type Database = {
  update: (typeof import("@/lib/db"))["db"]["update"];
  select: (typeof import("@/lib/db"))["db"]["select"];
};

export class SeatUnavailableError extends Error {
  readonly code = "no_availability";

  constructor(
    readonly flightId: string,
    readonly requested: number
  ) {
    super("Not enough seats remain on this flight");
    this.name = "SeatUnavailableError";
  }
}

/** Premium economy shares the economy cabin in our current schedule data. */
function cabinColumn(cabin: CabinClass) {
  switch (cabin) {
    case "business":
      return flights.seatsBusiness;
    case "first":
      return flights.seatsFirst;
    case "premium_economy":
    case "economy":
      return flights.seatsEconomy;
  }
}

/**
 * Atomically take `count` seats. Throws `SeatUnavailableError` when the flight
 * cannot cover it, leaving inventory untouched.
 *
 * Call inside a transaction alongside the booking insert, so a failure to write
 * the booking gives the seats back.
 */
export async function reserveSeats(
  tx: Database,
  flightId: string,
  cabin: CabinClass,
  count: number
): Promise<void> {
  if (count <= 0) return;

  const column = cabinColumn(cabin);

  const updated = await tx
    .update(flights)
    .set({
      [columnKey(cabin)]: sql`${column} - ${count}`,
      seatsAvailable: sql`${flights.seatsAvailable} - ${count}`,
      updatedAt: new Date(),
    })
    .where(
      sql`${flights.id} = ${flightId}
          AND ${column} >= ${count}
          AND ${flights.seatsAvailable} >= ${count}`
    )
    .returning({ id: flights.id });

  if (updated.length === 0) {
    throw new SeatUnavailableError(flightId, count);
  }
}

/**
 * Give seats back — a cancelled booking, or one that never paid.
 *
 * Deliberately unconditional: releasing must not fail. Over-releasing is
 * prevented by only ever calling this for a booking that actually held seats,
 * guarded by a status transition that can happen once.
 */
export async function releaseSeats(
  tx: Database,
  flightId: string,
  cabin: CabinClass,
  count: number
): Promise<void> {
  if (count <= 0) return;

  const column = cabinColumn(cabin);

  await tx
    .update(flights)
    .set({
      [columnKey(cabin)]: sql`${column} + ${count}`,
      seatsAvailable: sql`${flights.seatsAvailable} + ${count}`,
      updatedAt: new Date(),
    })
    .where(eq(flights.id, flightId));
}

/** Drizzle needs the property name for `.set()`, not the column reference. */
function columnKey(cabin: CabinClass): string {
  switch (cabin) {
    case "business":
      return "seatsBusiness";
    case "first":
      return "seatsFirst";
    case "premium_economy":
    case "economy":
      return "seatsEconomy";
  }
}

/**
 * Seats a booking occupies. Infants travel as lap children and hold none.
 */
export function seatsHeldBy(
  passengers: { type?: string }[]
): number {
  return passengers.filter((p) => p.type !== "infant").length;
}
