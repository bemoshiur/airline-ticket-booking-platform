"use client";

import { Luggage, Armchair, UtensilsCrossed, Shield, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyShort } from "@/lib/utils/currency";

interface AddonsStepProps {
  baggage: string;
  seat: string;
  meal: string;
  insurance: boolean;
  onBaggageChange: (baggage: string) => void;
  onSeatChange: (seat: string) => void;
  onMealChange: (meal: string) => void;
  onInsuranceChange: (insurance: boolean) => void;
  onComplete: () => void;
}

const BAGGAGE_OPTIONS = [
  { key: "included", label: "Included (20kg)", price: 0 },
  { key: "+5", label: "Extra +5kg", price: 600 },
  { key: "+10", label: "Extra +10kg", price: 1200 },
  { key: "+20", label: "Extra +20kg", price: 2300 },
];

const SEAT_OPTIONS = [
  { key: "standard", label: "Standard Seat", price: 0 },
  { key: "premium", label: "Premium Seat", price: 300 },
];

const MEAL_OPTIONS = [
  { key: "standard", label: "Standard Meal", price: 0 },
  { key: "vegetarian", label: "Vegetarian Meal", price: 350 },
  { key: "hindu", label: "Hindu Meal", price: 350 },
  { key: "muslim", label: "Muslim Meal", price: 350 },
];

export function AddonsStep({
  baggage,
  seat,
  meal,
  insurance,
  onBaggageChange,
  onSeatChange,
  onMealChange,
  onInsuranceChange,
  onComplete,
}: AddonsStepProps) {
  const baggageCost =
    BAGGAGE_OPTIONS.find((b) => b.key === baggage)?.price || 0;
  const seatCost = seat === "premium" ? 300 : 0;
  const mealCost = MEAL_OPTIONS.find((m) => m.key === meal)?.price || 0;
  const insuranceCost = insurance ? 450 : 0;
  const totalAddons = baggageCost + seatCost + mealCost + insuranceCost;

  return (
    <div className="space-y-6">
      {/* Baggage */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Luggage size={20} className="text-brand-500" />
          <h3 className="text-h3 text-ink-800">Baggage Allowance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BAGGAGE_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => onBaggageChange(option.key)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left",
                baggage === option.key
                  ? "border-brand-500 bg-brand-50"
                  : "border-line hover:border-brand-300"
              )}
            >
              <div className="font-medium text-ink-800">{option.label}</div>
              <div className="text-sm text-ink-400 mt-1">
                {option.price > 0 ? formatCurrencyShort(option.price) : "Included"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Seat */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Armchair size={20} className="text-brand-500" />
          <h3 className="text-h3 text-ink-800">Seat Selection</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SEAT_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => onSeatChange(option.key)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left",
                seat === option.key
                  ? "border-brand-500 bg-brand-50"
                  : "border-line hover:border-brand-300"
              )}
            >
              <div className="font-medium text-ink-800">{option.label}</div>
              <div className="text-sm text-ink-400 mt-1">
                {option.price > 0 ? formatCurrencyShort(option.price) : "Standard pricing applies"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Meal */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UtensilsCrossed size={20} className="text-brand-500" />
          <h3 className="text-h3 text-ink-800">Meal Preference</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MEAL_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => onMealChange(option.key)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left",
                meal === option.key
                  ? "border-brand-500 bg-brand-50"
                  : "border-line hover:border-brand-300"
              )}
            >
              <div className="font-medium text-ink-800">{option.label}</div>
              <div className="text-sm text-ink-400 mt-1">
                {option.price > 0 ? formatCurrencyShort(option.price) : "Included"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Insurance */}
      <div className="border-l-4 border-info-bg bg-info-bg bg-opacity-30 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-info flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={insurance}
                onChange={(e) => onInsuranceChange(e.target.checked)}
                className="w-5 h-5 rounded accent-info"
              />
              <div>
                <div className="font-medium text-ink-800">Travel Insurance</div>
                <div className="text-sm text-ink-500 mt-0.5">
                  Comprehensive coverage for flight delays, cancellations, and more
                </div>
                <div className="text-sm text-info font-medium mt-1">
                  {formatCurrencyShort(450)} per passenger
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <span className="text-body font-medium text-ink-700">Add-ons Total:</span>
          <span className="text-fare text-brand-500">{formatCurrencyShort(totalAddons)}</span>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="w-full py-3 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
      >
        Continue to Payment
      </button>
    </div>
  );
}
