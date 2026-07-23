export interface PromoCode {
  code: string;
  type: "percentage" | "flat";
  value: number;
  maxDiscount: number;
  minBooking: number;
  description: string;
  applicableAirlines?: string[];
  applicableRoutes?: string[]; // origin-destination pairs
}

export const promoCodes: PromoCode[] = [
  {
    code: "FTEBLDOM07",
    type: "percentage",
    value: 12,
    maxDiscount: 1200,
    minBooking: 2000,
    description: "12% off domestic flights (max ৳1,200)",
    applicableRoutes: ["DAC-CXB", "DAC-ZYL", "DAC-CGP", "DAC-JSR", "CXB-DAC", "ZYL-DAC", "CGP-DAC", "JSR-DAC"],
  },
  {
    code: "FLYBD500",
    type: "flat",
    value: 500,
    maxDiscount: 500,
    minBooking: 3000,
    description: "Flat ৳500 off on all flights",
  },
  {
    code: "EBLCARD10",
    type: "percentage",
    value: 10,
    maxDiscount: 800,
    minBooking: 4000,
    description: "10% off with EBL Cards (max ৳800)",
  },
  {
    code: "FLY2025",
    type: "percentage",
    value: 8,
    maxDiscount: 600,
    minBooking: 2500,
    description: "8% off summer sale (max ৳600)",
  },
];

export const promoMap = new Map<string, PromoCode>();
promoCodes.forEach((p) => promoMap.set(p.code, p));

export function getPromo(code: string): PromoCode | undefined {
  return promoMap.get(code);
}

export function calculateDiscount(
  promoCode: PromoCode,
  baseFare: number,
  origin?: string,
  destination?: string
): number {
  // Check route restriction
  if (promoCode.applicableRoutes && origin && destination) {
    const route = `${origin}-${destination}`;
    const reverse = `${destination}-${origin}`;
    if (!promoCode.applicableRoutes.includes(route) && !promoCode.applicableRoutes.includes(reverse)) {
      return 0;
    }
  }

  if (baseFare < promoCode.minBooking) return 0;

  let discount = 0;
  if (promoCode.type === "percentage") {
    discount = Math.round(baseFare * (promoCode.value / 100));
  } else {
    discount = promoCode.value;
  }

  return Math.min(discount, promoCode.maxDiscount);
}
