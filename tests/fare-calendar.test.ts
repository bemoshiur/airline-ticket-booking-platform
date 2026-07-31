import { describe, expect, it } from "vitest";
import {
  enumerateDates,
  fareCalendarQuerySchema,
  MAX_CALENDAR_DAYS,
} from "@/lib/iata/types";

const base = {
  from: "DAC",
  to: "DXB",
  startDate: "2026-08-01",
  endDate: "2026-08-31",
};

function parse(overrides: Record<string, unknown> = {}) {
  return fareCalendarQuerySchema.safeParse({ ...base, ...overrides });
}

describe("enumerateDates", () => {
  it("includes both endpoints", () => {
    expect(enumerateDates("2026-08-01", "2026-08-03")).toEqual([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
    ]);
  });

  it("returns a single date when the range is one day", () => {
    expect(enumerateDates("2026-08-01", "2026-08-01")).toEqual(["2026-08-01"]);
  });

  it("returns nothing when the range is inverted", () => {
    expect(enumerateDates("2026-08-03", "2026-08-01")).toEqual([]);
  });

  it("crosses a month boundary", () => {
    const dates = enumerateDates("2026-08-30", "2026-09-02");
    expect(dates).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
    ]);
  });

  it("crosses a year boundary", () => {
    expect(enumerateDates("2026-12-31", "2027-01-01")).toEqual([
      "2026-12-31",
      "2027-01-01",
    ]);
  });

  it("includes the leap day in a leap year", () => {
    const dates = enumerateDates("2028-02-27", "2028-03-01");
    expect(dates).toContain("2028-02-29");
    expect(dates).toHaveLength(4);
  });

  it("skips a non-existent leap day in a common year", () => {
    const dates = enumerateDates("2027-02-27", "2027-03-01");
    expect(dates).not.toContain("2027-02-29");
    expect(dates).toEqual(["2027-02-27", "2027-02-28", "2027-03-01"]);
  });

  it("produces a full 31-day month without gaps or repeats", () => {
    const dates = enumerateDates("2026-08-01", "2026-08-31");
    expect(dates).toHaveLength(31);
    expect(new Set(dates).size).toBe(31);
  });
});

describe("fareCalendarQuerySchema", () => {
  it("accepts a month-long window", () => {
    expect(parse().success).toBe(true);
  });

  it("defaults to one adult in economy priced in BDT", () => {
    const result = parse();
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      adults: 1,
      children: 0,
      infants: 0,
      cabinClass: "economy",
      currency: "BDT",
    });
  });

  it("accepts a single-day window", () => {
    expect(parse({ endDate: base.startDate }).success).toBe(true);
  });

  it("rejects an inverted range", () => {
    expect(parse({ endDate: "2026-07-01" }).success).toBe(false);
  });

  it(`accepts a window of exactly ${MAX_CALENDAR_DAYS} days`, () => {
    // 2026-08-01 plus 61 days inclusive is 2026-10-01.
    expect(parse({ endDate: "2026-10-01" }).success).toBe(true);
  });

  it("rejects a window wider than the cap", () => {
    const result = parse({ endDate: "2026-12-31" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((i) => i.path[0] === "endDate")).toBe(true);
  });

  it("rejects an origin equal to the destination", () => {
    expect(parse({ to: "DAC" }).success).toBe(false);
  });

  it("rejects more infants than adults", () => {
    expect(parse({ adults: 1, infants: 2 }).success).toBe(false);
  });

  it("rejects a malformed date", () => {
    expect(parse({ startDate: "1 Aug 2026" }).success).toBe(false);
  });

  it("upper-cases airport codes", () => {
    const result = parse({ from: "dac" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.from).toBe("DAC");
  });
});
