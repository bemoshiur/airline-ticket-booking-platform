/**
 * Ancillary pricing.
 *
 * Kept free of database and network access: this is where extras turn into
 * money, so every rule is directly testable. The caller loads the catalog and
 * hands it in.
 *
 * The client only ever sends a product code and a quantity. Prices, units, and
 * eligibility all come from the catalog — a client-supplied price is never
 * accepted, and an unknown code is rejected rather than silently dropped.
 */

import type { CabinClass } from "@/lib/iata/types";

export type AncillaryUnit = "per_passenger" | "per_booking" | "per_segment";

export interface CatalogProduct {
  code: string;
  name: string;
  category: string;
  unit: AncillaryUnit;
  price: number;
  currency: string;
  maxQuantity: number;
  /** Null or empty means every cabin. */
  cabinClasses: string | null;
  internationalOnly: boolean;
  active: boolean;
}

export interface AncillarySelection {
  code: string;
  quantity: number;
}

export interface BookingContext {
  /** Passengers who can hold an extra — infants have no seat or bag allowance. */
  passengerCount: number;
  /** Flown segments across every itinerary, for per-segment products. */
  segmentCount: number;
  cabinClass: CabinClass;
  isInternational: boolean;
  currency: string;
}

export interface AncillaryLineItem {
  code: string;
  name: string;
  category: string;
  unit: AncillaryUnit;
  quantity: number;
  unitPrice: number;
  /** How many times the unit price was applied. */
  multiplier: number;
  total: number;
  currency: string;
}

export interface PricedAncillaries {
  items: AncillaryLineItem[];
  total: number;
  currency: string;
}

export class AncillaryError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "AncillaryError";
  }
}

/** More distinct extras than this on one booking is a malformed request. */
export const MAX_SELECTIONS = 20;

export function priceAncillaries(
  selections: AncillarySelection[],
  catalog: CatalogProduct[],
  context: BookingContext
): PricedAncillaries {
  if (selections.length === 0) {
    return { items: [], total: 0, currency: context.currency };
  }

  if (selections.length > MAX_SELECTIONS) {
    throw new AncillaryError(
      "too_many_selections",
      `At most ${MAX_SELECTIONS} extras per booking`
    );
  }

  const byCode = new Map(catalog.map((product) => [product.code, product]));
  const seen = new Set<string>();
  const items: AncillaryLineItem[] = [];

  for (const selection of selections) {
    if (seen.has(selection.code)) {
      // Merging duplicates could quietly exceed maxQuantity.
      throw new AncillaryError(
        "duplicate_selection",
        `${selection.code} was selected more than once`
      );
    }
    seen.add(selection.code);

    const product = byCode.get(selection.code);
    if (!product || !product.active) {
      throw new AncillaryError(
        "unknown_product",
        `${selection.code} is not available`
      );
    }

    if (!Number.isInteger(selection.quantity) || selection.quantity < 1) {
      throw new AncillaryError(
        "invalid_quantity",
        `Quantity for ${product.code} must be a positive whole number`
      );
    }

    if (selection.quantity > product.maxQuantity) {
      throw new AncillaryError(
        "quantity_exceeded",
        `At most ${product.maxQuantity} of ${product.name} per booking`
      );
    }

    if (!isEligible(product, context)) {
      throw new AncillaryError(
        "not_eligible",
        `${product.name} is not available on this itinerary`
      );
    }

    if (product.currency !== context.currency) {
      // Converting here would hide a catalog misconfiguration behind an FX
      // rate. Fail loudly instead.
      throw new AncillaryError(
        "currency_mismatch",
        `${product.name} is priced in ${product.currency}, not ${context.currency}`
      );
    }

    const multiplier = multiplierFor(product, selection.quantity, context);
    items.push({
      code: product.code,
      name: product.name,
      category: product.category,
      unit: product.unit,
      quantity: selection.quantity,
      unitPrice: product.price,
      multiplier,
      total: product.price * multiplier,
      currency: product.currency,
    });
  }

  return {
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
    currency: context.currency,
  };
}

/**
 * How many times the unit price applies.
 *
 * `per_passenger` — quantity is how many passengers are covered, capped at the
 * party size. Buying three extra bags for a party of two is a client bug.
 * `per_booking`  — once, whatever the quantity implies.
 * `per_segment`  — quantity passengers across every flown segment.
 */
function multiplierFor(
  product: CatalogProduct,
  quantity: number,
  context: BookingContext
): number {
  switch (product.unit) {
    case "per_booking":
      return 1;
    case "per_passenger":
      return Math.min(quantity, context.passengerCount);
    case "per_segment":
      return Math.min(quantity, context.passengerCount) * context.segmentCount;
  }
}

function isEligible(
  product: CatalogProduct,
  context: BookingContext
): boolean {
  if (product.internationalOnly && !context.isInternational) return false;

  const allowed = parseCabins(product.cabinClasses);
  if (allowed.length > 0 && !allowed.includes(context.cabinClass)) return false;

  return true;
}

function parseCabins(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((cabin) => cabin.trim().toLowerCase())
    .filter(Boolean);
}

/** Products a given itinerary is allowed to buy, for the catalog endpoint. */
export function eligibleProducts(
  catalog: CatalogProduct[],
  context: Pick<BookingContext, "cabinClass" | "isInternational">
): CatalogProduct[] {
  return catalog.filter(
    (product) =>
      product.active &&
      isEligible(product, {
        ...context,
        passengerCount: 1,
        segmentCount: 1,
        currency: product.currency,
      })
  );
}
