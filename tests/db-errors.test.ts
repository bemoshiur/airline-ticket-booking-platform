import { describe, expect, it } from "vitest";
import {
  isForeignKeyViolation,
  isUniqueViolation,
  pgErrorCode,
  PG_UNIQUE_VIOLATION,
} from "@/lib/db/errors";

/** Mirrors how Drizzle wraps a driver error: the pg error lands on `cause`. */
function wrapped(code: string, depth = 1): Error {
  let error: unknown = Object.assign(new Error("driver error"), { code });
  for (let i = 0; i < depth; i++) {
    error = new Error("Failed query", { cause: error });
  }
  return error as Error;
}

describe("pgErrorCode", () => {
  it("reads a code from the error itself", () => {
    const error = Object.assign(new Error("boom"), { code: "23505" });
    expect(pgErrorCode(error)).toBe("23505");
  });

  it("reads a code from a wrapped cause — how Drizzle throws", () => {
    expect(pgErrorCode(wrapped("23505"))).toBe("23505");
  });

  it("walks several levels of wrapping", () => {
    expect(pgErrorCode(wrapped("23503", 3))).toBe("23503");
  });

  it("returns null for an error with no code anywhere", () => {
    expect(pgErrorCode(new Error("plain"))).toBeNull();
  });

  it("returns null for a non-error value", () => {
    expect(pgErrorCode("just a string")).toBeNull();
    expect(pgErrorCode(null)).toBeNull();
    expect(pgErrorCode(undefined)).toBeNull();
  });

  it("ignores a non-string code", () => {
    const error = Object.assign(new Error("boom"), { code: 23505 });
    expect(pgErrorCode(error)).toBeNull();
  });

  it("terminates on a cyclic cause chain", () => {
    const error: Record<string, unknown> = { message: "loop" };
    error.cause = error;
    expect(pgErrorCode(error)).toBeNull();
  });

  it("gives up past the depth bound rather than scanning forever", () => {
    expect(pgErrorCode(wrapped("23505", 10))).toBeNull();
  });
});

describe("violation helpers", () => {
  it("recognises a wrapped unique violation", () => {
    expect(isUniqueViolation(wrapped(PG_UNIQUE_VIOLATION))).toBe(true);
  });

  it("does not confuse a foreign-key violation for a unique one", () => {
    expect(isUniqueViolation(wrapped("23503"))).toBe(false);
    expect(isForeignKeyViolation(wrapped("23503"))).toBe(true);
  });

  it("reports false for an unrelated error", () => {
    expect(isUniqueViolation(new Error("network down"))).toBe(false);
  });
});
