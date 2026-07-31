import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  convert,
  isSupportedCurrency,
  resetFxCache,
  toBdt,
  toMinorUnits,
  UnsupportedCurrencyError,
} from "@/lib/fx";

describe("fx", () => {
  beforeEach(() => {
    delete process.env.FX_RATES_JSON;
    resetFxCache();
  });

  afterEach(() => {
    delete process.env.FX_RATES_JSON;
    resetFxCache();
  });

  it("treats BDT as the identity currency", () => {
    const result = convert(1000, "BDT", "BDT");
    expect(result.amount).toBe(1000);
    expect(result.rate).toBe(1);
  });

  it("converts BDT to USD below par", () => {
    const result = convert(122_500, "BDT", "USD");
    expect(result.amount).toBeCloseTo(1000, 2);
    expect(result.from).toBe("BDT");
    expect(result.to).toBe("USD");
  });

  it("round-trips a conversion back to the original amount", () => {
    const usd = convert(100_000, "BDT", "USD");
    const back = convert(usd.amount, "USD", "BDT");
    expect(back.amount).toBeCloseTo(100_000, 0);
  });

  it("always reports the rate it used, for the audit trail", () => {
    const result = convert(500, "USD", "BDT");
    expect(result.rate).toBeGreaterThan(0);
    expect(result.amount).toBeCloseTo(500 * result.rate, 2);
  });

  it("is case insensitive on currency codes", () => {
    expect(convert(100, "usd", "bdt").amount).toBe(convert(100, "USD", "BDT").amount);
  });

  it("rejects a currency it has no rate for", () => {
    expect(() => convert(100, "BDT", "ZWL")).toThrow(UnsupportedCurrencyError);
    expect(() => convert(100, "ZWL", "BDT")).toThrow(UnsupportedCurrencyError);
  });

  it("rounds to whole taka when converting into the ledger currency", () => {
    const result = toBdt(1, "USD");
    expect(Number.isInteger(result.amount)).toBe(true);
    expect(result.to).toBe("BDT");
  });

  it("applies FX_RATES_JSON overrides", () => {
    process.env.FX_RATES_JSON = JSON.stringify({ USD: 200 });
    resetFxCache();
    expect(convert(200, "BDT", "USD").amount).toBe(1);
  });

  it("ignores non-positive and unparseable override values", () => {
    process.env.FX_RATES_JSON = JSON.stringify({ USD: -5, EUR: "abc" });
    resetFxCache();
    // Falls back to the built-in rates rather than producing negative money.
    expect(convert(122_500, "BDT", "USD").amount).toBeCloseTo(1000, 2);
    expect(isSupportedCurrency("EUR")).toBe(true);
  });

  it("survives malformed FX_RATES_JSON", () => {
    process.env.FX_RATES_JSON = "{not json";
    resetFxCache();
    expect(() => convert(100, "BDT", "USD")).not.toThrow();
  });

  it("refuses to let an override redefine BDT away from 1", () => {
    process.env.FX_RATES_JSON = JSON.stringify({ BDT: 7 });
    resetFxCache();
    expect(convert(100, "BDT", "BDT").amount).toBe(100);
  });

  describe("toMinorUnits", () => {
    it("scales decimal currencies by 100", () => {
      expect(toMinorUnits(12.34, "USD")).toBe(1234);
    });

    it("leaves zero-decimal currencies unscaled", () => {
      expect(toMinorUnits(1500, "JPY")).toBe(1500);
    });

    it("rounds rather than truncating fractional minor units", () => {
      expect(toMinorUnits(0.005, "USD")).toBe(1);
    });
  });
});
