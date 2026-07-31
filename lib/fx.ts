/**
 * Server-side foreign exchange.
 *
 * Rates are expressed against BDT (our ledger currency): `RATES[X]` is how many
 * BDT one unit of X buys. Override at deploy time with `FX_RATES_JSON`, e.g.
 * `{"USD":122.5,"EUR":133.0}` — until a live rate feed replaces this module.
 *
 * Every conversion returns the rate alongside the amount so callers can persist
 * it. A financial record without the rate that produced it is unauditable.
 */

const DEFAULT_RATES_TO_BDT: Record<string, number> = {
  BDT: 1,
  USD: 122.5,
  EUR: 133.0,
  GBP: 156.0,
  AED: 33.35,
  SAR: 32.65,
  INR: 1.44,
  MYR: 27.6,
  THB: 3.55,
  SGD: 91.0,
};

let cachedRates: Record<string, number> | null = null;

function rates(): Record<string, number> {
  if (cachedRates) return cachedRates;

  cachedRates = { ...DEFAULT_RATES_TO_BDT };
  const override = process.env.FX_RATES_JSON;
  if (override) {
    try {
      const parsed = JSON.parse(override) as Record<string, unknown>;
      for (const [code, value] of Object.entries(parsed)) {
        const rate = Number(value);
        if (Number.isFinite(rate) && rate > 0) {
          cachedRates[code.toUpperCase()] = rate;
        }
      }
    } catch {
      console.error("FX_RATES_JSON is not valid JSON; using default rates");
    }
  }
  cachedRates.BDT = 1;
  return cachedRates;
}

export class UnsupportedCurrencyError extends Error {
  constructor(readonly currency: string) {
    super(`No exchange rate configured for ${currency}`);
    this.name = "UnsupportedCurrencyError";
  }
}

export function isSupportedCurrency(code: string): boolean {
  return code.toUpperCase() in rates();
}

export interface Converted {
  amount: number;
  from: string;
  to: string;
  /** Units of `to` per unit of `from`, rounded to 6 dp for the audit trail. */
  rate: number;
}

/**
 * Convert between currencies. Amounts are whole units (BDT and most fares here
 * are quoted without a minor unit); the result is rounded to the nearest unit,
 * except sub-unit currencies handled by the caller.
 */
export function convert(amount: number, from: string, to: string): Converted {
  const table = rates();
  const src = from.toUpperCase();
  const dst = to.toUpperCase();

  if (!(src in table)) throw new UnsupportedCurrencyError(src);
  if (!(dst in table)) throw new UnsupportedCurrencyError(dst);

  const rate = table[src] / table[dst];
  return {
    amount: Math.round(amount * rate * 100) / 100,
    from: src,
    to: dst,
    rate: Math.round(rate * 1e6) / 1e6,
  };
}

/** Convert to BDT and round to whole taka — the unit our ledger stores. */
export function toBdt(amount: number, from: string): Converted {
  const result = convert(amount, from, "BDT");
  return { ...result, amount: Math.round(result.amount) };
}

/** Smallest currency unit for a Stripe charge (cents for USD, paisa for BDT). */
export function toMinorUnits(amount: number, currency: string): number {
  const zeroDecimal = new Set(["JPY", "KRW", "VND", "CLP", "ISK"]);
  if (zeroDecimal.has(currency.toUpperCase())) return Math.round(amount);
  return Math.round(amount * 100);
}

/** Test seam — forces the next call to re-read `FX_RATES_JSON`. */
export function resetFxCache(): void {
  cachedRates = null;
}
