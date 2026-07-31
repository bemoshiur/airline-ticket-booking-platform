import { describe, expect, it } from "vitest";
import {
  AncillaryError,
  eligibleProducts,
  MAX_SELECTIONS,
  priceAncillaries,
  type BookingContext,
  type CatalogProduct,
} from "@/lib/ancillaries/pricing";

function product(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    code: "BAG20",
    name: "Extra 20kg bag",
    category: "baggage",
    unit: "per_passenger",
    price: 2500,
    currency: "BDT",
    maxQuantity: 3,
    cabinClasses: null,
    internationalOnly: false,
    active: true,
    ...overrides,
  };
}

function context(overrides: Partial<BookingContext> = {}): BookingContext {
  return {
    passengerCount: 2,
    segmentCount: 1,
    cabinClass: "economy",
    isInternational: true,
    currency: "BDT",
    ...overrides,
  };
}

describe("priceAncillaries", () => {
  it("prices nothing when nothing is selected", () => {
    const result = priceAncillaries([], [product()], context());
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  describe("per_passenger", () => {
    it("charges once per covered passenger", () => {
      const result = priceAncillaries(
        [{ code: "BAG20", quantity: 2 }],
        [product()],
        context({ passengerCount: 2 })
      );
      expect(result.items[0].multiplier).toBe(2);
      expect(result.total).toBe(5000);
    });

    it("covers fewer passengers than the party when asked", () => {
      const result = priceAncillaries(
        [{ code: "BAG20", quantity: 1 }],
        [product()],
        context({ passengerCount: 3 })
      );
      expect(result.total).toBe(2500);
    });

    it("caps the charge at the party size", () => {
      // Three bags for a party of two is a client bug; charge for two.
      const result = priceAncillaries(
        [{ code: "BAG20", quantity: 3 }],
        [product({ maxQuantity: 5 })],
        context({ passengerCount: 2 })
      );
      expect(result.items[0].multiplier).toBe(2);
      expect(result.total).toBe(5000);
    });

    it("ignores segment count", () => {
      const result = priceAncillaries(
        [{ code: "BAG20", quantity: 1 }],
        [product()],
        context({ passengerCount: 1, segmentCount: 4 })
      );
      expect(result.total).toBe(2500);
    });
  });

  describe("per_booking", () => {
    it("charges once regardless of party size", () => {
      const result = priceAncillaries(
        [{ code: "SMS", quantity: 1 }],
        [product({ code: "SMS", unit: "per_booking", price: 300 })],
        context({ passengerCount: 6 })
      );
      expect(result.items[0].multiplier).toBe(1);
      expect(result.total).toBe(300);
    });

    it("charges once even when a larger quantity is requested", () => {
      const result = priceAncillaries(
        [{ code: "SMS", quantity: 4 }],
        [product({ code: "SMS", unit: "per_booking", price: 300, maxQuantity: 9 })],
        context({ passengerCount: 6 })
      );
      expect(result.total).toBe(300);
    });
  });

  describe("per_segment", () => {
    it("multiplies passengers by segments", () => {
      const result = priceAncillaries(
        [{ code: "SEAT", quantity: 2 }],
        [product({ code: "SEAT", unit: "per_segment", price: 600, maxQuantity: 9 })],
        context({ passengerCount: 2, segmentCount: 3 })
      );
      expect(result.items[0].multiplier).toBe(6);
      expect(result.total).toBe(3600);
    });

    it("caps passengers at the party size before multiplying", () => {
      const result = priceAncillaries(
        [{ code: "SEAT", quantity: 9 }],
        [product({ code: "SEAT", unit: "per_segment", price: 600, maxQuantity: 9 })],
        context({ passengerCount: 2, segmentCount: 2 })
      );
      expect(result.items[0].multiplier).toBe(4);
    });
  });

  describe("rejections", () => {
    it("rejects an unknown product code rather than dropping it", () => {
      expect(() =>
        priceAncillaries([{ code: "NOPE", quantity: 1 }], [product()], context())
      ).toThrow(AncillaryError);
    });

    it("rejects an inactive product", () => {
      expect(() =>
        priceAncillaries(
          [{ code: "BAG20", quantity: 1 }],
          [product({ active: false })],
          context()
        )
      ).toThrow(/not available/);
    });

    it("rejects a quantity above the product ceiling", () => {
      expect(() =>
        priceAncillaries(
          [{ code: "BAG20", quantity: 4 }],
          [product({ maxQuantity: 3 })],
          context()
        )
      ).toThrow(/At most 3/);
    });

    it.each([0, -1, 1.5, Number.NaN])("rejects a quantity of %s", (quantity) => {
      expect(() =>
        priceAncillaries(
          [{ code: "BAG20", quantity }],
          [product()],
          context()
        )
      ).toThrow(AncillaryError);
    });

    it("rejects the same product selected twice", () => {
      // Merging them could quietly exceed maxQuantity.
      expect(() =>
        priceAncillaries(
          [
            { code: "BAG20", quantity: 2 },
            { code: "BAG20", quantity: 2 },
          ],
          [product({ maxQuantity: 3 })],
          context()
        )
      ).toThrow(/more than once/);
    });

    it("rejects more distinct selections than the cap", () => {
      const many = Array.from({ length: MAX_SELECTIONS + 1 }, (_, i) => ({
        code: `P${i}`,
        quantity: 1,
      }));
      expect(() => priceAncillaries(many, [], context())).toThrow(
        /At most 20 extras/
      );
    });

    it("rejects a catalog price in another currency instead of converting", () => {
      // Converting would hide a catalog misconfiguration behind an FX rate.
      expect(() =>
        priceAncillaries(
          [{ code: "BAG20", quantity: 1 }],
          [product({ currency: "USD" })],
          context({ currency: "BDT" })
        )
      ).toThrow(/priced in USD/);
    });
  });

  describe("eligibility", () => {
    it("rejects an international-only product on a domestic route", () => {
      expect(() =>
        priceAncillaries(
          [{ code: "BAG20", quantity: 1 }],
          [product({ internationalOnly: true })],
          context({ isInternational: false })
        )
      ).toThrow(/not available on this itinerary/);
    });

    it("allows an international-only product on an international route", () => {
      const result = priceAncillaries(
        [{ code: "BAG20", quantity: 1 }],
        [product({ internationalOnly: true })],
        context({ isInternational: true, passengerCount: 1 })
      );
      expect(result.total).toBe(2500);
    });

    it("rejects a product not sold in the booked cabin", () => {
      expect(() =>
        priceAncillaries(
          [{ code: "BAG20", quantity: 1 }],
          [product({ cabinClasses: "business,first" })],
          context({ cabinClass: "economy" })
        )
      ).toThrow(/not available on this itinerary/);
    });

    it("allows a product sold in the booked cabin", () => {
      const result = priceAncillaries(
        [{ code: "BAG20", quantity: 1 }],
        [product({ cabinClasses: "economy, premium_economy" })],
        context({ cabinClass: "economy", passengerCount: 1 })
      );
      expect(result.total).toBe(2500);
    });

    it("treats an empty cabin list as every cabin", () => {
      const result = priceAncillaries(
        [{ code: "BAG20", quantity: 1 }],
        [product({ cabinClasses: "" })],
        context({ cabinClass: "first", passengerCount: 1 })
      );
      expect(result.total).toBe(2500);
    });
  });

  describe("totals", () => {
    it("sums several products", () => {
      const result = priceAncillaries(
        [
          { code: "BAG20", quantity: 2 },
          { code: "SEAT", quantity: 2 },
          { code: "SMS", quantity: 1 },
        ],
        [
          product(),
          product({ code: "SEAT", unit: "per_segment", price: 600, maxQuantity: 9 }),
          product({ code: "SMS", unit: "per_booking", price: 300 }),
        ],
        context({ passengerCount: 2, segmentCount: 2 })
      );
      // 2500x2 + 600x2x2 + 300
      expect(result.total).toBe(5000 + 2400 + 300);
      expect(result.items).toHaveLength(3);
    });

    it("records the unit price it charged, for the audit trail", () => {
      const result = priceAncillaries(
        [{ code: "BAG20", quantity: 1 }],
        [product()],
        context({ passengerCount: 1 })
      );
      expect(result.items[0]).toMatchObject({
        unitPrice: 2500,
        multiplier: 1,
        total: 2500,
        currency: "BDT",
      });
    });
  });
});

describe("eligibleProducts", () => {
  const catalog = [
    product({ code: "A" }),
    product({ code: "B", active: false }),
    product({ code: "C", internationalOnly: true }),
    product({ code: "D", cabinClasses: "business" }),
  ];

  it("hides inactive products", () => {
    const codes = eligibleProducts(catalog, {
      cabinClass: "economy",
      isInternational: true,
    }).map((p) => p.code);
    expect(codes).not.toContain("B");
  });

  it("hides international-only products on a domestic route", () => {
    const codes = eligibleProducts(catalog, {
      cabinClass: "economy",
      isInternational: false,
    }).map((p) => p.code);
    expect(codes).toEqual(["A"]);
  });

  it("hides products for other cabins", () => {
    const codes = eligibleProducts(catalog, {
      cabinClass: "economy",
      isInternational: true,
    }).map((p) => p.code);
    expect(codes).toEqual(["A", "C"]);
  });

  it("shows cabin-restricted products in their own cabin", () => {
    const codes = eligibleProducts(catalog, {
      cabinClass: "business",
      isInternational: true,
    }).map((p) => p.code);
    expect(codes).toContain("D");
  });
});
