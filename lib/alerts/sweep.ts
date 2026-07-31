/**
 * Background sweep: re-shop each active alert, record what it costs now, and
 * notify when the rules in `evaluate.ts` say to.
 *
 * Runs from a cron-triggered route. Alerts are processed oldest-checked-first
 * and capped per run, so a growing alert table lengthens the cycle rather than
 * blowing a single invocation's time budget.
 */

import { and, eq, sql } from "drizzle-orm";
import { db, priceAlerts, users } from "@/lib/db";
import { searchFlights } from "@/lib/iata";
import { isProviderError } from "@/lib/iata/errors";
import type { SearchQuery } from "@/lib/iata/types";
import { sendEmail } from "@/lib/notify";
import { evaluateAlert, type AlertOutcome } from "./evaluate";

/** An alert that fails this many sweeps running is retired, not retried forever. */
const MAX_CONSECUTIVE_FAILURES = 5;

export interface SweepSummary {
  checked: number;
  notified: number;
  failed: number;
  expired: number;
  outcomes: Partial<Record<AlertOutcome, number>>;
}

export async function sweepPriceAlerts(
  batchSize: number,
  signal?: AbortSignal
): Promise<SweepSummary> {
  const due = await db
    .select()
    .from(priceAlerts)
    .where(eq(priceAlerts.status, "active"))
    // Least recently checked first, so every alert gets a turn. The null
    // ordering belongs after ASC — written as one expression because
    // asc(sql`... NULLS FIRST`) emits "NULLS FIRST asc", which is not valid SQL.
    .orderBy(sql`${priceAlerts.lastCheckedAt} ASC NULLS FIRST`)
    .limit(batchSize);

  const summary: SweepSummary = {
    checked: 0,
    notified: 0,
    failed: 0,
    expired: 0,
    outcomes: {},
  };

  for (const alert of due) {
    if (signal?.aborted) break;

    try {
      const price = await cheapestTotal(alert, signal);
      const evaluation = evaluateAlert(
        {
          targetPrice: alert.targetPrice,
          lastSeenPrice: alert.lastSeenPrice,
          lowestSeenPrice: alert.lowestSeenPrice,
          lastNotifiedAt: alert.lastNotifiedAt,
          departureDate: alert.departureDate,
        },
        price,
        new Date()
      );

      summary.checked++;
      summary.outcomes[evaluation.outcome] =
        (summary.outcomes[evaluation.outcome] ?? 0) + 1;
      if (evaluation.status === "expired") summary.expired++;

      let notifiedAt = alert.lastNotifiedAt;
      if (evaluation.shouldNotify && price !== null) {
        const delivered = await notify(alert, price, evaluation.lowestSeenPrice);
        if (delivered) {
          notifiedAt = new Date();
          summary.notified++;
        }
      }

      // A notification that never went out must not start the cooldown, and
      // must not flip the alert to `triggered` — the user was not told.
      const undelivered = evaluation.shouldNotify && notifiedAt === alert.lastNotifiedAt;

      await db
        .update(priceAlerts)
        .set({
          lastSeenPrice: evaluation.lastSeenPrice,
          lowestSeenPrice: evaluation.lowestSeenPrice,
          status: undelivered ? "active" : evaluation.status,
          lastNotifiedAt: notifiedAt,
          lastCheckedAt: new Date(),
          failureCount: 0,
          updatedAt: new Date(),
        })
        .where(eq(priceAlerts.id, alert.id));
    } catch (error) {
      summary.failed++;
      const reason = isProviderError(error) ? error.code : "unknown";
      console.error(`Price alert ${alert.id} sweep failed (${reason})`);

      const failures = alert.failureCount + 1;
      await db
        .update(priceAlerts)
        .set({
          failureCount: failures,
          // Give up on an alert that cannot be priced — a retired route, say.
          status: failures >= MAX_CONSECUTIVE_FAILURES ? "paused" : "active",
          lastCheckedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(priceAlerts.id, alert.id));
    }
  }

  return summary;
}

type AlertRow = typeof priceAlerts.$inferSelect;

/** Cheapest total for the watched party, or null when nothing is available. */
async function cheapestTotal(
  alert: AlertRow,
  signal?: AbortSignal
): Promise<number | null> {
  const query: SearchQuery = {
    from: alert.origin,
    to: alert.destination,
    departureDate: alert.departureDate,
    returnDate: alert.returnDate,
    adults: alert.adults,
    children: alert.children,
    infants: alert.infants,
    cabinClass: alert.cabinClass,
    currency: alert.currency,
    nonStop: false,
    maxResults: 50,
  };

  const result = await searchFlights(query, signal);
  if (result.offers.length === 0) return null;

  return result.offers.reduce(
    (cheapest, offer) => Math.min(cheapest, offer.price.total),
    Number.POSITIVE_INFINITY
  );
}

/** Returns whether the message actually went out. */
async function notify(
  alert: AlertRow,
  price: number,
  lowest: number | null
): Promise<boolean> {
  const recipient = await db
    .select({ email: users.email, fullName: users.fullName })
    .from(users)
    .where(and(eq(users.id, alert.userId), eq(users.status, "active")))
    .limit(1);

  if (!recipient[0]) return false;

  const route = `${alert.origin} → ${alert.destination}`;
  const money = (value: number) => `${alert.currency} ${value.toLocaleString("en-BD")}`;
  const trip = alert.returnDate
    ? `${alert.departureDate} – ${alert.returnDate}`
    : alert.departureDate;

  const lines = [
    `Hi ${recipient[0].fullName},`,
    "",
    `${route} on ${trip} is now ${money(price)} for your party.`,
  ];
  if (alert.targetPrice !== null) {
    lines.push(`That is at or below the ${money(alert.targetPrice)} you asked to watch for.`);
  } else if (lowest !== null && lowest < price) {
    lines.push(`The lowest we have seen is ${money(lowest)}.`);
  }
  lines.push("", "Fares change constantly — the price is confirmed at checkout.");

  const result = await sendEmail({
    to: recipient[0].email,
    subject: `${route} dropped to ${money(price)}`,
    text: lines.join("\n"),
  });

  return result.delivered;
}
