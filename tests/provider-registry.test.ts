import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderError } from "@/lib/iata/errors";
import { searchCacheKey } from "@/lib/iata/provider";
import type { FlightOffer, SearchQuery } from "@/lib/iata/types";

/**
 * The registry decides when a failing GDS may be swapped for local inventory.
 * Both providers are stubbed so these tests describe that policy alone, with no
 * network or database involved.
 */

const amadeusSearch = vi.fn();
const amadeusPrice = vi.fn();
const amadeusConfigured = vi.fn(() => true);
const databaseSearch = vi.fn();
const databasePrice = vi.fn();

vi.mock("@/lib/iata/providers/amadeus", () => ({
  AmadeusProvider: class {
    name = "amadeus" as const;
    isConfigured = amadeusConfigured;
    searchOffers = amadeusSearch;
    priceOffer = amadeusPrice;
  },
}));

vi.mock("@/lib/iata/providers/database", () => ({
  DatabaseProvider: class {
    name = "database" as const;
    isConfigured = () => true;
    searchOffers = databaseSearch;
    priceOffer = databasePrice;
  },
}));

const query: SearchQuery = {
  from: "DAC",
  to: "DXB",
  departureDate: "2026-08-02",
  returnDate: null,
  adults: 1,
  children: 0,
  infants: 0,
  cabinClass: "economy",
  currency: "BDT",
  nonStop: false,
  maxResults: 50,
};

function offer(id: string, source: "amadeus" | "database"): FlightOffer {
  return {
    id,
    source,
    itineraries: [],
    price: {
      currency: "BDT",
      baseFare: 100,
      taxes: 0,
      fees: 0,
      total: 100,
      perPassengerType: {},
    },
    validatingCarrier: { iataCode: "EK", name: "Emirates" },
    cabinClass: "economy",
    seatsAvailable: 9,
    refundable: false,
    changeable: false,
    baggage: {},
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

/** Fresh module per test — the registry holds provider and cache state. */
async function loadRegistry() {
  vi.resetModules();
  return import("@/lib/iata/index");
}

describe("provider registry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    amadeusConfigured.mockReturnValue(true);
    process.env.FLIGHT_PROVIDER = "amadeus";
    databaseSearch.mockResolvedValue([offer("db_1", "database")]);
    amadeusSearch.mockResolvedValue([offer("am_1", "amadeus")]);
  });

  afterEach(() => {
    delete process.env.FLIGHT_PROVIDER;
  });

  it("serves the configured primary provider", async () => {
    const { searchFlights } = await loadRegistry();
    const result = await searchFlights(query);

    expect(result.source).toBe("amadeus");
    expect(result.degraded).toBe(false);
    expect(databaseSearch).not.toHaveBeenCalled();
  });

  it("defaults to the database provider when none is configured", async () => {
    delete process.env.FLIGHT_PROVIDER;
    const { searchFlights, activeProviderName } = await loadRegistry();

    expect(activeProviderName()).toBe("database");
    expect((await searchFlights(query)).source).toBe("database");
  });

  it("falls back to local inventory on a retryable upstream failure", async () => {
    amadeusSearch.mockRejectedValue(
      new ProviderError("upstream_error", "amadeus", "Amadeus is down")
    );
    const { searchFlights } = await loadRegistry();
    const result = await searchFlights(query);

    expect(result.source).toBe("database");
    expect(result.degraded).toBe(true);
    expect(result.offers[0].id).toBe("db_1");
  });

  it.each(["auth_failed", "rate_limited", "timeout", "not_configured"] as const)(
    "falls back on a %s failure",
    async (code) => {
      amadeusSearch.mockRejectedValue(new ProviderError(code, "amadeus", "x"));
      const { searchFlights } = await loadRegistry();
      expect((await searchFlights(query)).degraded).toBe(true);
    }
  );

  it("does not mask a caller error behind a fallback", async () => {
    // A bad route is the caller's problem; silently serving different
    // inventory would hide it.
    amadeusSearch.mockRejectedValue(
      new ProviderError("invalid_request", "amadeus", "Unknown airport")
    );
    const { searchFlights } = await loadRegistry();

    await expect(searchFlights(query)).rejects.toThrow(ProviderError);
    expect(databaseSearch).not.toHaveBeenCalled();
  });

  it("falls back when the primary is unconfigured, without calling it", async () => {
    amadeusConfigured.mockReturnValue(false);
    const { searchFlights } = await loadRegistry();
    const result = await searchFlights(query);

    expect(amadeusSearch).not.toHaveBeenCalled();
    expect(result.degraded).toBe(true);
  });

  it("caches a healthy result instead of re-shopping", async () => {
    const { searchFlights } = await loadRegistry();
    await searchFlights(query);
    await searchFlights(query);

    expect(amadeusSearch).toHaveBeenCalledTimes(1);
  });

  it("does not cache a degraded result, so the next request retries", async () => {
    amadeusSearch.mockRejectedValue(
      new ProviderError("timeout", "amadeus", "slow")
    );
    const { searchFlights } = await loadRegistry();
    await searchFlights(query);
    await searchFlights(query);

    expect(amadeusSearch).toHaveBeenCalledTimes(2);
  });

  it("treats a different query as a separate cache entry", async () => {
    const { searchFlights } = await loadRegistry();
    await searchFlights(query);
    await searchFlights({ ...query, cabinClass: "business" });

    expect(amadeusSearch).toHaveBeenCalledTimes(2);
  });

  it("rejects pricing for an offer it never issued", async () => {
    const { priceOffer } = await loadRegistry();
    await expect(priceOffer("never-seen")).rejects.toMatchObject({
      code: "offer_expired",
    });
  });

  it("stamps the result with the time it was searched", async () => {
    const { searchFlights } = await loadRegistry();
    const result = await searchFlights(query);
    expect(Date.parse(result.searchedAt)).not.toBeNaN();
  });
});

describe("searchCacheKey", () => {
  it("is stable for an identical query", () => {
    expect(searchCacheKey(query)).toBe(searchCacheKey({ ...query }));
  });

  it.each([
    ["from", "CGP"],
    ["to", "BKK"],
    ["departureDate", "2026-08-03"],
    ["returnDate", "2026-08-09"],
    ["adults", 2],
    ["children", 1],
    ["infants", 1],
    ["cabinClass", "business"],
    ["currency", "USD"],
    ["nonStop", true],
    ["maxResults", 10],
  ])("changes when %s changes", (field, value) => {
    expect(searchCacheKey({ ...query, [field]: value } as SearchQuery)).not.toBe(
      searchCacheKey(query)
    );
  });
});
