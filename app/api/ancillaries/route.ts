import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, ancillaryProducts } from "@/lib/db";
import { eligibleProducts } from "@/lib/ancillaries/pricing";
import { CABIN_CLASSES, type CabinClass } from "@/lib/iata/types";

/**
 * Extras available for a given itinerary.
 *
 * Public: the catalog is a shop window, not user data. Filtered by cabin and
 * whether the route is international, so the client never renders something the
 * booking endpoint would then reject.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const cabinParam = params.get("cabinClass") ?? "economy";
  if (!CABIN_CLASSES.includes(cabinParam as CabinClass)) {
    return NextResponse.json(
      { error: "Unknown cabin class" },
      { status: 400 }
    );
  }
  const cabinClass = cabinParam as CabinClass;
  const isInternational = params.get("international") !== "false";

  const catalog = await db
    .select()
    .from(ancillaryProducts)
    .where(eq(ancillaryProducts.active, true))
    .orderBy(asc(ancillaryProducts.sortOrder));

  const available = eligibleProducts(catalog, { cabinClass, isInternational });

  return NextResponse.json({
    products: available.map((product) => {
      const row = catalog.find((c) => c.code === product.code)!;
      return {
        code: row.code,
        name: row.name,
        nameBn: row.nameBn,
        description: row.description,
        category: row.category,
        unit: row.unit,
        price: row.price,
        currency: row.currency,
        maxQuantity: row.maxQuantity,
      };
    }),
    cabinClass,
    isInternational,
  });
}
