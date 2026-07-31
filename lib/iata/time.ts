/**
 * Travellers search by the *local* departure date at the origin airport. A
 * DAC→DXB flight leaving 2026-08-01 23:30 Dhaka time is 17:30Z — searching a
 * naive UTC day would miss it. These helpers translate a local calendar day
 * into the absolute instants that bound it.
 */

/** Minutes that `timeZone` is ahead of UTC at the given instant. */
function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const field = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  // Reading the wall clock in `timeZone` as if it were UTC gives the offset.
  const asUtc = Date.UTC(
    field("year"),
    field("month") - 1,
    field("day"),
    field("hour") % 24,
    field("minute"),
    field("second")
  );

  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/**
 * UTC instants bounding the local calendar day `date` (YYYY-MM-DD) in
 * `timeZone`. Falls back to a UTC day when the zone is unknown.
 */
export function localDayBoundsUtc(
  date: string,
  timeZone?: string | null
): { start: Date; end: Date } {
  const startUtcGuess = new Date(`${date}T00:00:00.000Z`);
  const endUtcGuess = new Date(`${date}T23:59:59.999Z`);

  if (!timeZone || !isValidTimeZone(timeZone)) {
    return { start: startUtcGuess, end: endUtcGuess };
  }

  // Offsets are computed against the guessed instants, then applied. Resolving
  // twice settles days that contain a DST transition.
  const start = applyOffset(startUtcGuess, timeZone);
  const end = applyOffset(endUtcGuess, timeZone);
  return { start, end };
}

function applyOffset(guess: Date, timeZone: string): Date {
  let result = new Date(guess.getTime() - offsetMinutes(guess, timeZone) * 60_000);
  result = new Date(guess.getTime() - offsetMinutes(result, timeZone) * 60_000);
  return result;
}

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Join a carrier code to a flight number without doubling it — schedule data
 * stores "EK570" in some feeds and "570" in others.
 */
export function qualifiedFlightNumber(
  carrierCode: string,
  flightNumber: string
): string {
  const code = carrierCode.toUpperCase();
  const number = flightNumber.trim().toUpperCase();
  return number.startsWith(code) ? number : `${code}${number}`;
}
