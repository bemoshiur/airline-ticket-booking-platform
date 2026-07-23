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
