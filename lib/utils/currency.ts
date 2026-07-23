export type Currency = "BDT" | "USD";

let _currency: Currency = "BDT";

export function getCurrency(): Currency {
  return _currency;
}

export function setCurrency(c: Currency) {
  _currency = c;
}

export function formatCurrency(amount: number, currency?: Currency): string {
  const c = currency ?? _currency;
  if (c === "BDT") {
    return `BDT ${amount.toLocaleString("en-BD")}`;
  }
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatCurrencyShort(amount: number, currency?: Currency): string {
  const c = currency ?? _currency;
  if (c === "BDT") {
    return `৳${amount.toLocaleString("en-BD")}`;
  }
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatFareCompact(amount: number, currency?: Currency): string {
  const c = currency ?? _currency;
  const symbol = c === "BDT" ? "৳" : "$";
  const trim = (n: number) => (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1));
  if (amount >= 100000) return `${symbol}${trim(amount / 100000)}L`;
  if (amount >= 1000) return `${symbol}${trim(amount / 1000)}k`;
  return `${symbol}${amount}`;
}
