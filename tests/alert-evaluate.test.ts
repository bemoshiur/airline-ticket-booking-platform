import { describe, expect, it } from "vitest";
import {
  evaluateAlert,
  MIN_MEANINGFUL_DROP,
  NOTIFY_COOLDOWN_MS,
  type AlertState,
} from "@/lib/alerts/evaluate";

const NOW = new Date("2026-08-01T12:00:00.000Z");
const FUTURE = "2026-09-15";

function state(overrides: Partial<AlertState> = {}): AlertState {
  return {
    targetPrice: null,
    lastSeenPrice: null,
    lowestSeenPrice: null,
    lastNotifiedAt: null,
    departureDate: FUTURE,
    ...overrides,
  };
}

describe("evaluateAlert", () => {
  describe("expiry", () => {
    it("expires an alert whose departure date has passed", () => {
      const result = evaluateAlert(
        state({ departureDate: "2026-07-31" }),
        50_000,
        NOW
      );
      expect(result.outcome).toBe("expired");
      expect(result.status).toBe("expired");
      expect(result.shouldNotify).toBe(false);
    });

    it("keeps an alert departing later today", () => {
      const result = evaluateAlert(
        state({ departureDate: "2026-08-01" }),
        50_000,
        NOW
      );
      expect(result.status).toBe("active");
    });
  });

  describe("no inventory", () => {
    it("keeps watching when nothing is available", () => {
      const result = evaluateAlert(state(), null, NOW);
      expect(result.outcome).toBe("no_inventory");
      expect(result.status).toBe("active");
      expect(result.shouldNotify).toBe(false);
    });

    it("does not discard the price history", () => {
      const result = evaluateAlert(
        state({ lastSeenPrice: 60_000, lowestSeenPrice: 55_000 }),
        null,
        NOW
      );
      expect(result.lastSeenPrice).toBe(60_000);
      expect(result.lowestSeenPrice).toBe(55_000);
    });
  });

  describe("first sweep", () => {
    it("records a baseline without notifying", () => {
      const result = evaluateAlert(state(), 60_000, NOW);
      expect(result.outcome).toBe("record_only");
      expect(result.shouldNotify).toBe(false);
      expect(result.lowestSeenPrice).toBe(60_000);
      expect(result.dropFromLastSeen).toBeNull();
    });

    it("still fires immediately if the price is already at the target", () => {
      const result = evaluateAlert(state({ targetPrice: 65_000 }), 60_000, NOW);
      expect(result.outcome).toBe("notify_target_met");
      expect(result.shouldNotify).toBe(true);
    });
  });

  describe("with a target price", () => {
    it("notifies and stops watching once the target is met", () => {
      const result = evaluateAlert(
        state({ targetPrice: 50_000, lastSeenPrice: 60_000, lowestSeenPrice: 60_000 }),
        49_000,
        NOW
      );
      expect(result.outcome).toBe("notify_target_met");
      expect(result.shouldNotify).toBe(true);
      expect(result.status).toBe("triggered");
    });

    it("treats exactly the target as met", () => {
      const result = evaluateAlert(state({ targetPrice: 50_000 }), 50_000, NOW);
      expect(result.shouldNotify).toBe(true);
    });

    it("stays quiet while the price is above the target", () => {
      const result = evaluateAlert(
        state({ targetPrice: 50_000, lastSeenPrice: 60_000, lowestSeenPrice: 60_000 }),
        55_000,
        NOW
      );
      expect(result.outcome).toBe("record_only");
      expect(result.shouldNotify).toBe(false);
      expect(result.status).toBe("active");
    });

    it("does not fire on a big drop that misses the target", () => {
      const result = evaluateAlert(
        state({ targetPrice: 30_000, lastSeenPrice: 90_000, lowestSeenPrice: 90_000 }),
        40_000,
        NOW
      );
      expect(result.shouldNotify).toBe(false);
    });
  });

  describe("without a target price", () => {
    it("notifies on a meaningful new low", () => {
      const result = evaluateAlert(
        state({ lastSeenPrice: 60_000, lowestSeenPrice: 60_000 }),
        55_000,
        NOW
      );
      expect(result.outcome).toBe("notify_new_low");
      expect(result.shouldNotify).toBe(true);
    });

    it("keeps watching after a new low — the fare may fall further", () => {
      const result = evaluateAlert(
        state({ lastSeenPrice: 60_000, lowestSeenPrice: 60_000 }),
        55_000,
        NOW
      );
      expect(result.status).toBe("active");
    });

    it("ignores a drop smaller than the noise floor", () => {
      const result = evaluateAlert(
        state({ lastSeenPrice: 60_000, lowestSeenPrice: 60_000 }),
        60_000 - (MIN_MEANINGFUL_DROP - 1),
        NOW
      );
      expect(result.outcome).toBe("record_only");
      expect(result.shouldNotify).toBe(false);
    });

    it("fires on a drop exactly at the noise floor", () => {
      const result = evaluateAlert(
        state({ lastSeenPrice: 60_000, lowestSeenPrice: 60_000 }),
        60_000 - MIN_MEANINGFUL_DROP,
        NOW
      );
      expect(result.shouldNotify).toBe(true);
    });

    it("measures a new low against the lowest ever seen, not the last seen", () => {
      // Price fell to 50k, bounced to 70k, now 69k. That is a drop against
      // last-seen but nowhere near the 50k low, so it must stay quiet.
      const result = evaluateAlert(
        state({ lastSeenPrice: 70_000, lowestSeenPrice: 50_000 }),
        69_000,
        NOW
      );
      expect(result.shouldNotify).toBe(false);
      expect(result.lowestSeenPrice).toBe(50_000);
    });

    it("stays quiet when the price rises", () => {
      const result = evaluateAlert(
        state({ lastSeenPrice: 60_000, lowestSeenPrice: 60_000 }),
        70_000,
        NOW
      );
      expect(result.outcome).toBe("record_only");
      expect(result.lowestSeenPrice).toBe(60_000);
      expect(result.dropFromLastSeen).toBe(-10_000);
    });
  });

  describe("cooldown", () => {
    it("suppresses a second notification within the window", () => {
      const result = evaluateAlert(
        state({
          lastSeenPrice: 60_000,
          lowestSeenPrice: 60_000,
          lastNotifiedAt: new Date(NOW.getTime() - 1000),
        }),
        40_000,
        NOW
      );
      expect(result.shouldNotify).toBe(false);
      expect(result.outcome).toBe("record_only");
    });

    it("still records the new low while suppressed", () => {
      const result = evaluateAlert(
        state({
          lastSeenPrice: 60_000,
          lowestSeenPrice: 60_000,
          lastNotifiedAt: new Date(NOW.getTime() - 1000),
        }),
        40_000,
        NOW
      );
      expect(result.lowestSeenPrice).toBe(40_000);
    });

    it("suppresses a target hit too, rather than re-emailing", () => {
      const result = evaluateAlert(
        state({
          targetPrice: 50_000,
          lastNotifiedAt: new Date(NOW.getTime() - 1000),
        }),
        40_000,
        NOW
      );
      expect(result.shouldNotify).toBe(false);
    });

    it("allows a notification once the window elapses", () => {
      const result = evaluateAlert(
        state({
          lastSeenPrice: 60_000,
          lowestSeenPrice: 60_000,
          lastNotifiedAt: new Date(NOW.getTime() - NOTIFY_COOLDOWN_MS - 1),
        }),
        40_000,
        NOW
      );
      expect(result.shouldNotify).toBe(true);
    });
  });

  describe("price history", () => {
    it("tracks the running minimum", () => {
      const result = evaluateAlert(
        state({ lastSeenPrice: 60_000, lowestSeenPrice: 45_000 }),
        70_000,
        NOW
      );
      expect(result.lowestSeenPrice).toBe(45_000);
      expect(result.lastSeenPrice).toBe(70_000);
    });

    it("reports the drop against the previous observation", () => {
      const result = evaluateAlert(
        state({ lastSeenPrice: 60_000, lowestSeenPrice: 60_000 }),
        58_000,
        NOW
      );
      expect(result.dropFromLastSeen).toBe(2_000);
    });
  });
});
