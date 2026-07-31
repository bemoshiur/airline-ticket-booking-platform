import { describe, expect, it } from "vitest";
import {
  CABIN_MULTIPLIER,
  payingPassengerCount,
  searchQuerySchema,
  seatCount,
} from "@/lib/iata/types";

const base = { from: "DAC", to: "DXB", departureDate: "2026-08-02" };

function parse(overrides: Record<string, unknown> = {}) {
  return searchQuerySchema.safeParse({ ...base, ...overrides });
}

describe("searchQuerySchema", () => {
  it("accepts a minimal one-way query and applies defaults", () => {
    const result = parse();
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      adults: 1,
      children: 0,
      infants: 0,
      cabinClass: "economy",
      currency: "BDT",
      nonStop: false,
      maxResults: 50,
    });
  });

  it("upper-cases airport codes and currency", () => {
    const result = parse({ from: "dac", to: "dxb", currency: "usd" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.from).toBe("DAC");
    expect(result.data.to).toBe("DXB");
    expect(result.data.currency).toBe("USD");
  });

  it("trims surrounding whitespace on codes", () => {
    const result = parse({ from: " dac " });
    expect(result.success).toBe(true);
  });

  it.each([["DA"], ["DACX"], ["D4C"], [""]])(
    "rejects %s as an airport code",
    (code) => {
      expect(parse({ from: code }).success).toBe(false);
    }
  );

  it("rejects a non-ISO departure date", () => {
    expect(parse({ departureDate: "02/08/2026" }).success).toBe(false);
  });

  it("rejects an origin equal to the destination", () => {
    const result = parse({ to: "DAC" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path[0] === "to")).toBe(true);
  });

  it("rejects a return date before departure", () => {
    expect(parse({ returnDate: "2026-08-01" }).success).toBe(false);
  });

  it("accepts a same-day return", () => {
    expect(parse({ returnDate: "2026-08-02" }).success).toBe(true);
  });

  it("rejects more infants than adults", () => {
    expect(parse({ adults: 1, infants: 2 }).success).toBe(false);
  });

  it("accepts one infant per adult", () => {
    expect(parse({ adults: 2, infants: 2 }).success).toBe(true);
  });

  it("rejects a party larger than nine", () => {
    expect(parse({ adults: 5, children: 4, infants: 1 }).success).toBe(false);
  });

  it("rejects zero adults", () => {
    expect(parse({ adults: 0 }).success).toBe(false);
  });

  it("rejects a fractional passenger count", () => {
    expect(parse({ adults: 1.5 }).success).toBe(false);
  });

  it("rejects a negative passenger count", () => {
    expect(parse({ children: -1 }).success).toBe(false);
  });

  it("clamps maxResults to a sane ceiling", () => {
    expect(parse({ maxResults: 10_000 }).success).toBe(false);
    expect(parse({ maxResults: 0 }).success).toBe(false);
  });

  it("rejects an unknown cabin class", () => {
    expect(parse({ cabinClass: "luxury" }).success).toBe(false);
  });

  it("accepts a null return date for a one-way trip", () => {
    expect(parse({ returnDate: null }).success).toBe(true);
  });

  it("reports every violated rule at once", () => {
    const result = parse({ to: "DAC", adults: 12 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.length).toBeGreaterThan(1);
  });
});

describe("passenger counting", () => {
  const party = { adults: 2, children: 1, infants: 1 };

  it("excludes infants from the seat count — they travel as lap children", () => {
    expect(seatCount(party)).toBe(3);
  });

  it("includes infants in the fare-paying count", () => {
    expect(payingPassengerCount(party)).toBe(4);
  });
});

describe("CABIN_MULTIPLIER", () => {
  it("leaves economy at par", () => {
    expect(CABIN_MULTIPLIER.economy).toBe(1);
  });

  it("increases monotonically with cabin", () => {
    expect(CABIN_MULTIPLIER.premium_economy).toBeGreaterThan(
      CABIN_MULTIPLIER.economy
    );
    expect(CABIN_MULTIPLIER.business).toBeGreaterThan(
      CABIN_MULTIPLIER.premium_economy
    );
    expect(CABIN_MULTIPLIER.first).toBeGreaterThan(CABIN_MULTIPLIER.business);
  });
});
