export interface FareFamily {
  id: string;
  name: string;
  cabin: "economy" | "premium_economy" | "business" | "first";
  rbd: string; // Res Booking Designator
  cabinBaggage: number; // kg
  checkinBaggage: number; // kg
  refundable: boolean;
  dateChangeable: boolean;
  seatSelection: boolean;
  mealIncluded: boolean;
  multiplier: number; // price multiplier against base
}

export const fareFamilies: FareFamily[] = [
  // Economy
  { id: "econ_x", name: "Economy X", cabin: "economy", rbd: "Q", cabinBaggage: 7, checkinBaggage: 10, refundable: false, dateChangeable: false, seatSelection: false, mealIncluded: false, multiplier: 0.75 },
  { id: "econ_saver", name: "Economy Saver", cabin: "economy", rbd: "G", cabinBaggage: 7, checkinBaggage: 15, refundable: false, dateChangeable: true, seatSelection: false, mealIncluded: false, multiplier: 0.85 },
  { id: "econ_std", name: "Economy", cabin: "economy", rbd: "K", cabinBaggage: 7, checkinBaggage: 20, refundable: false, dateChangeable: true, seatSelection: true, mealIncluded: true, multiplier: 1.0 },
  { id: "econ_flex", name: "Economy Flexi", cabin: "economy", rbd: "V", cabinBaggage: 7, checkinBaggage: 25, refundable: true, dateChangeable: true, seatSelection: true, mealIncluded: true, multiplier: 1.2 },
  // Premium Economy
  { id: "prem_std", name: "Premium Economy", cabin: "premium_economy", rbd: "L", cabinBaggage: 10, checkinBaggage: 30, refundable: true, dateChangeable: true, seatSelection: true, mealIncluded: true, multiplier: 1.6 },
  // Business
  { id: "biz_saver", name: "Business Saver", cabin: "business", rbd: "M", cabinBaggage: 14, checkinBaggage: 40, refundable: true, dateChangeable: true, seatSelection: true, mealIncluded: true, multiplier: 2.5 },
  { id: "biz_flex", name: "Business Flexi", cabin: "business", rbd: "Y", cabinBaggage: 14, checkinBaggage: 50, refundable: true, dateChangeable: true, seatSelection: true, mealIncluded: true, multiplier: 3.0 },
];

export const fareFamilyMap = new Map<string, FareFamily>();
fareFamilies.forEach((f) => fareFamilyMap.set(f.id, f));

export function getFareFamily(id: string): FareFamily | undefined {
  return fareFamilyMap.get(id);
}

export interface FareRule {
  type: string;
  airlineFee: number;
  otaFee: number;
  description: string;
}

export const fareRules: Record<string, FareRule[]> = {
  economy: [
    { type: "Cancellation", airlineFee: 1200, otaFee: 500, description: "Non-refundable except statutory taxes" },
    { type: "Date change", airlineFee: 800, otaFee: 300, description: "Before departure only" },
    { type: "No-show", airlineFee: 2000, otaFee: 500, description: "Full fare forfeited" },
  ],
  premium_economy: [
    { type: "Cancellation", airlineFee: 800, otaFee: 500, description: "Partial refund after fees" },
    { type: "Date change", airlineFee: 500, otaFee: 300, description: "Free if done 24h before" },
    { type: "No-show", airlineFee: 1500, otaFee: 500, description: "Partial credit available" },
  ],
  business: [
    { type: "Cancellation", airlineFee: 500, otaFee: 300, description: "Fully refundable minus fees" },
    { type: "Date change", airlineFee: 0, otaFee: 300, description: "Free changes" },
    { type: "No-show", airlineFee: 1000, otaFee: 500, description: "Partial refund available" },
  ],
};
