/**
 * Ancillary catalog seed.
 *
 * Prices are in BDT and reflect what Bangladeshi carriers and consolidators
 * typically charge. They are starting values — the catalog is editable in the
 * database precisely so they can be tuned without a deploy.
 */

import { db, ancillaryProducts, type InsertAncillaryProduct } from "@/lib/db";

const CATALOG: InsertAncillaryProduct[] = [
  // --- Baggage -------------------------------------------------------------
  {
    code: "BAG_10KG",
    name: "Extra 10kg checked baggage",
    nameBn: "অতিরিক্ত ১০ কেজি লাগেজ",
    description: "One additional 10kg checked bag per passenger.",
    category: "baggage",
    unit: "per_passenger",
    price: 3500,
    maxQuantity: 4,
    sortOrder: 10,
  },
  {
    code: "BAG_20KG",
    name: "Extra 20kg checked baggage",
    nameBn: "অতিরিক্ত ২০ কেজি লাগেজ",
    description: "One additional 20kg checked bag per passenger.",
    category: "baggage",
    unit: "per_passenger",
    price: 6200,
    maxQuantity: 4,
    sortOrder: 11,
  },
  {
    code: "BAG_SPORTS",
    name: "Sports or oversized equipment",
    description: "Golf bags, bicycles, and similar oversized items.",
    category: "baggage",
    unit: "per_passenger",
    price: 5500,
    maxQuantity: 2,
    sortOrder: 12,
  },

  // --- Seating -------------------------------------------------------------
  {
    code: "SEAT_STANDARD",
    name: "Seat selection",
    nameBn: "আসন নির্বাচন",
    description: "Choose your seat in advance, charged per flight.",
    category: "seat",
    unit: "per_segment",
    price: 700,
    maxQuantity: 9,
    sortOrder: 20,
  },
  {
    code: "SEAT_EXTRA_LEGROOM",
    name: "Extra legroom seat",
    description: "Exit row or bulkhead seating, charged per flight.",
    category: "seat",
    unit: "per_segment",
    price: 2200,
    maxQuantity: 9,
    // Premium cabins already seat you generously.
    cabinClasses: "economy,premium_economy",
    sortOrder: 21,
  },

  // --- Meals ---------------------------------------------------------------
  {
    code: "MEAL_HALAL",
    name: "Halal meal",
    nameBn: "হালাল খাবার",
    description: "Guaranteed halal-certified hot meal.",
    category: "meal",
    unit: "per_segment",
    price: 900,
    maxQuantity: 9,
    sortOrder: 30,
  },
  {
    code: "MEAL_VEGETARIAN",
    name: "Vegetarian meal",
    description: "Vegetarian hot meal, no onion or garlic on request.",
    category: "meal",
    unit: "per_segment",
    price: 850,
    maxQuantity: 9,
    sortOrder: 31,
  },

  // --- Insurance -----------------------------------------------------------
  {
    code: "INS_TRAVEL",
    name: "Travel insurance",
    nameBn: "ভ্রমণ বীমা",
    description:
      "Medical cover, trip cancellation, and lost baggage for the whole journey.",
    category: "insurance",
    unit: "per_passenger",
    price: 1800,
    maxQuantity: 9,
    internationalOnly: true,
    sortOrder: 40,
  },
  {
    code: "INS_CANCEL_ANY",
    name: "Cancel for any reason",
    description: "Refund up to 75% of the fare when cancelling 24h before departure.",
    category: "insurance",
    unit: "per_passenger",
    price: 3200,
    maxQuantity: 9,
    sortOrder: 41,
  },

  // --- Airport services ----------------------------------------------------
  {
    code: "LOUNGE_DAC",
    name: "Dhaka airport lounge access",
    nameBn: "ঢাকা বিমানবন্দর লাউঞ্জ",
    description: "Three hours in the departure lounge at Hazrat Shahjalal.",
    category: "lounge",
    unit: "per_passenger",
    price: 2800,
    maxQuantity: 9,
    // Business and first already include lounge access.
    cabinClasses: "economy,premium_economy",
    sortOrder: 50,
  },
  {
    code: "PRIORITY_CHECKIN",
    name: "Priority check-in and boarding",
    description: "Dedicated check-in desk and priority boarding.",
    category: "priority",
    unit: "per_passenger",
    price: 1200,
    maxQuantity: 9,
    cabinClasses: "economy,premium_economy",
    sortOrder: 51,
  },
  {
    code: "VISA_SUPPORT",
    name: "Visa documentation support",
    nameBn: "ভিসা সহায়তা",
    description: "Assistance preparing visa paperwork for your destination.",
    category: "other",
    unit: "per_passenger",
    price: 2500,
    maxQuantity: 9,
    internationalOnly: true,
    sortOrder: 60,
  },
  {
    code: "SMS_UPDATES",
    name: "SMS flight updates",
    nameBn: "এসএমএস আপডেট",
    description: "Schedule change and gate alerts by SMS for the whole booking.",
    category: "other",
    unit: "per_booking",
    price: 250,
    maxQuantity: 1,
    sortOrder: 61,
  },
];

async function seed() {
  console.log(`Seeding ${CATALOG.length} ancillary products...`);

  for (const item of CATALOG) {
    // Re-runnable: refresh the details of a product we already know.
    await db
      .insert(ancillaryProducts)
      .values(item)
      .onConflictDoUpdate({
        target: ancillaryProducts.code,
        set: {
          name: item.name,
          nameBn: item.nameBn ?? null,
          description: item.description ?? null,
          category: item.category,
          unit: item.unit,
          price: item.price,
          maxQuantity: item.maxQuantity ?? 1,
          cabinClasses: item.cabinClasses ?? null,
          internationalOnly: item.internationalOnly ?? false,
          sortOrder: item.sortOrder ?? 0,
          updatedAt: new Date(),
        },
      });
    console.log(`  ✓ ${item.code.padEnd(20)} BDT ${item.price}`);
  }

  console.log("Ancillary catalog seeded.");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Ancillary seed failed:", error);
  process.exit(1);
});
