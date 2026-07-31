/**
 * Postgres error inspection.
 *
 * Drizzle wraps driver errors in a `DrizzleQueryError`, so the pg error — and
 * with it the SQLSTATE code — sits on `cause` rather than the thrown object.
 * Checking only the top level silently misses every constraint violation and
 * turns a 409 into a 500.
 */

/** https://www.postgresql.org/docs/current/errcodes-appendix.html */
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_FOREIGN_KEY_VIOLATION = "23503";
export const PG_CHECK_VIOLATION = "23514";
export const PG_NOT_NULL_VIOLATION = "23502";

/** The SQLSTATE code of `error` or any error it wraps, if there is one. */
export function pgErrorCode(error: unknown): string | null {
  let current = error;

  // Bounded, in case a driver ever produces a cyclic cause chain.
  for (let depth = 0; depth < 5 && current; depth++) {
    if (typeof current === "object" && "code" in current) {
      const code = (current as { code: unknown }).code;
      if (typeof code === "string") return code;
    }
    current =
      typeof current === "object" && current !== null && "cause" in current
        ? (current as { cause: unknown }).cause
        : null;
  }

  return null;
}

export function isUniqueViolation(error: unknown): boolean {
  return pgErrorCode(error) === PG_UNIQUE_VIOLATION;
}

export function isForeignKeyViolation(error: unknown): boolean {
  return pgErrorCode(error) === PG_FOREIGN_KEY_VIOLATION;
}
