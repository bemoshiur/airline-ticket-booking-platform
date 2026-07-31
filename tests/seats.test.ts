import { describe, expect, it } from "vitest";
import { seatsHeldBy, SeatUnavailableError } from "@/lib/inventory/seats";

/**
 * `reserveSeats` and `releaseSeats` are single SQL statements whose whole point
 * is Postgres row-locking semantics — they are covered by the concurrency check
 * recorded in docs/seat-inventory.md, not here. What follows is the pure logic
 * that decides how many seats a booking holds.
 */

describe("seatsHeldBy", () => {
  it("counts adults", () => {
    expect(seatsHeldBy([{ type: "adult" }, { type: "adult" }])).toBe(2);
  });

  it("counts children — they occupy a seat", () => {
    expect(seatsHeldBy([{ type: "adult" }, { type: "child" }])).toBe(2);
  });

  it("excludes infants — they travel on a lap", () => {
    expect(
      seatsHeldBy([{ type: "adult" }, { type: "infant" }])
    ).toBe(1);
  });

  it("handles a mixed party", () => {
    expect(
      seatsHeldBy([
        { type: "adult" },
        { type: "adult" },
        { type: "child" },
        { type: "infant" },
        { type: "infant" },
      ])
    ).toBe(3);
  });

  it("treats an untyped passenger as seated", () => {
    // The booking schema defaults `type` to "adult"; an absent value must not
    // silently produce a free seat.
    expect(seatsHeldBy([{}, {}])).toBe(2);
  });

  it("returns zero for an empty party", () => {
    expect(seatsHeldBy([])).toBe(0);
  });

  it("returns zero for an all-infant party", () => {
    expect(seatsHeldBy([{ type: "infant" }])).toBe(0);
  });
});

describe("SeatUnavailableError", () => {
  it("carries a machine-readable code the route maps to 409", () => {
    const error = new SeatUnavailableError("flight-1", 3);
    expect(error.code).toBe("no_availability");
    expect(error.flightId).toBe("flight-1");
    expect(error.requested).toBe(3);
  });

  it("is an Error, so it survives a throw across an async boundary", () => {
    expect(new SeatUnavailableError("f", 1)).toBeInstanceOf(Error);
  });
});
