/**
 * Alert evaluation, kept free of database and network access so the rules that
 * decide whether to email someone can be tested directly.
 */

export type AlertOutcome =
  | "notify_target_met"
  | "notify_new_low"
  | "record_only"
  | "no_inventory"
  | "expired";

export interface AlertState {
  targetPrice: number | null;
  lastSeenPrice: number | null;
  lowestSeenPrice: number | null;
  lastNotifiedAt: Date | null;
  departureDate: string;
}

export interface Evaluation {
  outcome: AlertOutcome;
  /** True when the caller should send a notification. */
  shouldNotify: boolean;
  lastSeenPrice: number | null;
  lowestSeenPrice: number | null;
  /** Drop against the previous observation, or null on the first sweep. */
  dropFromLastSeen: number | null;
  status: "active" | "triggered" | "expired";
}

/**
 * Don't email the same person about the same route more than once a day, even
 * if the fare keeps ticking down.
 */
export const NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Ignore drops smaller than this. Fares wobble by a few taka constantly, and an
 * alert that fires on noise gets muted by the user.
 */
export const MIN_MEANINGFUL_DROP = 500;

export function evaluateAlert(
  state: AlertState,
  currentPrice: number | null,
  now: Date
): Evaluation {
  // A departure date in the past can never improve.
  if (isPast(state.departureDate, now)) {
    return {
      outcome: "expired",
      shouldNotify: false,
      lastSeenPrice: state.lastSeenPrice,
      lowestSeenPrice: state.lowestSeenPrice,
      dropFromLastSeen: null,
      status: "expired",
    };
  }

  if (currentPrice === null) {
    // Nothing available today. Keep watching; inventory reappears.
    return {
      outcome: "no_inventory",
      shouldNotify: false,
      lastSeenPrice: state.lastSeenPrice,
      lowestSeenPrice: state.lowestSeenPrice,
      dropFromLastSeen: null,
      status: "active",
    };
  }

  const lowest =
    state.lowestSeenPrice === null
      ? currentPrice
      : Math.min(state.lowestSeenPrice, currentPrice);

  const dropFromLastSeen =
    state.lastSeenPrice === null ? null : state.lastSeenPrice - currentPrice;

  const base = {
    lastSeenPrice: currentPrice,
    lowestSeenPrice: lowest,
    dropFromLastSeen,
  };

  if (inCooldown(state.lastNotifiedAt, now)) {
    return { ...base, outcome: "record_only", shouldNotify: false, status: "active" };
  }

  if (state.targetPrice !== null) {
    if (currentPrice <= state.targetPrice) {
      return {
        ...base,
        outcome: "notify_target_met",
        shouldNotify: true,
        // The user asked to hear when it hit a price. It has; stop watching.
        status: "triggered",
      };
    }
    return { ...base, outcome: "record_only", shouldNotify: false, status: "active" };
  }

  // No target: notify on a meaningful new low. The first sweep only
  // establishes a baseline — there is nothing to compare against yet.
  const isNewLow =
    state.lowestSeenPrice !== null &&
    state.lowestSeenPrice - currentPrice >= MIN_MEANINGFUL_DROP;

  if (isNewLow) {
    return {
      ...base,
      outcome: "notify_new_low",
      shouldNotify: true,
      // Open-ended watch: keep going, the fare may fall further.
      status: "active",
    };
  }

  return { ...base, outcome: "record_only", shouldNotify: false, status: "active" };
}

function inCooldown(lastNotifiedAt: Date | null, now: Date): boolean {
  if (!lastNotifiedAt) return false;
  return now.getTime() - lastNotifiedAt.getTime() < NOTIFY_COOLDOWN_MS;
}

/** True once the departure date's local day is behind us, in UTC terms. */
function isPast(departureDate: string, now: Date): boolean {
  const departure = Date.parse(`${departureDate}T23:59:59.999Z`);
  return Number.isFinite(departure) && departure < now.getTime();
}
