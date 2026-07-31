/**
 * Query-string values destined for a SQL enum comparison.
 *
 * Casting an arbitrary string with `as any` and handing it to Drizzle lets
 * Postgres do the rejecting — as a thrown error, which surfaces to the caller
 * as a 500. Validating here turns it into the 400 it always was.
 */

/** Distinguishes "not supplied" (null) from "supplied but not valid". */
export const INVALID = Symbol("invalid-enum-param");

export function parseEnumParam<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[]
): T | null | typeof INVALID {
  if (value === null || value === undefined || value === "") return null;
  return allowed.includes(value as T) ? (value as T) : INVALID;
}
