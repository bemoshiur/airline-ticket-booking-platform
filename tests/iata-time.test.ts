import { describe, expect, it } from "vitest";
import { localDayBoundsUtc, qualifiedFlightNumber } from "@/lib/iata/time";

describe("localDayBoundsUtc", () => {
  it("shifts a Dhaka day back by its +06:00 offset", () => {
    const { start, end } = localDayBoundsUtc("2026-08-02", "Asia/Dhaka");
    expect(start.toISOString()).toBe("2026-08-01T18:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-02T17:59:59.999Z");
  });

  it("covers exactly one day", () => {
    const { start, end } = localDayBoundsUtc("2026-08-02", "Asia/Dhaka");
    expect(end.getTime() - start.getTime()).toBe(86_400_000 - 1);
  });

  it("includes a late-evening local departure that falls on the next UTC day", () => {
    // 23:30 Dhaka on Aug 2 is 17:30Z on Aug 2 — a naive UTC-day query would
    // still catch this one, but the bounds must not exclude it.
    const { start, end } = localDayBoundsUtc("2026-08-02", "Asia/Dhaka");
    const departure = new Date("2026-08-02T17:30:00.000Z");
    expect(departure >= start && departure <= end).toBe(true);
  });

  it("excludes an early-morning local departure that belongs to the previous day", () => {
    // 2026-08-01T21:00Z is 03:00 Aug 2 in Dhaka, so it is NOT part of Aug 1.
    const aug1 = localDayBoundsUtc("2026-08-01", "Asia/Dhaka");
    const departure = new Date("2026-08-01T21:00:00.000Z");
    expect(departure > aug1.end).toBe(true);

    const aug2 = localDayBoundsUtc("2026-08-02", "Asia/Dhaka");
    expect(departure >= aug2.start && departure <= aug2.end).toBe(true);
  });

  it("shifts a western timezone forward", () => {
    const { start } = localDayBoundsUtc("2026-08-02", "America/New_York");
    // EDT in August is UTC-4.
    expect(start.toISOString()).toBe("2026-08-02T04:00:00.000Z");
  });

  it("handles a half-hour offset", () => {
    const { start } = localDayBoundsUtc("2026-08-02", "Asia/Kolkata");
    expect(start.toISOString()).toBe("2026-08-01T18:30:00.000Z");
  });

  it("falls back to a UTC day when the timezone is missing", () => {
    const { start, end } = localDayBoundsUtc("2026-08-02", null);
    expect(start.toISOString()).toBe("2026-08-02T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-02T23:59:59.999Z");
  });

  it("falls back to a UTC day when the timezone is not a real zone", () => {
    const { start } = localDayBoundsUtc("2026-08-02", "Mars/Olympus");
    expect(start.toISOString()).toBe("2026-08-02T00:00:00.000Z");
  });

  it("resolves the day a DST transition starts", () => {
    // US DST begins 2026-03-08. The local day is 23 hours long.
    const { start, end } = localDayBoundsUtc("2026-03-08", "America/New_York");
    expect(start.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(end.getTime() - start.getTime()).toBeLessThan(86_400_000);
  });
});

describe("qualifiedFlightNumber", () => {
  it("prefixes a bare number with the carrier code", () => {
    expect(qualifiedFlightNumber("EK", "570")).toBe("EK570");
  });

  it("does not double a code the number already carries", () => {
    expect(qualifiedFlightNumber("EK", "EK570")).toBe("EK570");
  });

  it("normalizes case", () => {
    expect(qualifiedFlightNumber("ek", "ek570")).toBe("EK570");
  });

  it("trims surrounding whitespace", () => {
    expect(qualifiedFlightNumber("QR", " 627 ")).toBe("QR627");
  });
});
