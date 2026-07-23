import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyShort } from "@/lib/utils/currency";
import { AirlineLogo } from "@/components/ui/airline-logo";
import { format } from "date-fns";

export function FareSummary({
  remainingSeconds,
  airlineCode,
  airlineName,
  flightKey,
  baseFare,
  taxes,
  computedAddonsTotal,
  baggageCost,
  seatCost,
  selectedSeat,
  selectedMeal,
  mealCost,
  insuranceCost,
  promoDiscount,
  promoApplied,
  youPay,
}: {
  remainingSeconds: number;
  airlineCode: string;
  airlineName: string | undefined;
  flightKey: string;
  baseFare: number;
  taxes: number;
  computedAddonsTotal: number;
  baggageCost: number;
  seatCost: number;
  selectedSeat: string;
  selectedMeal: string;
  mealCost: number;
  insuranceCost: number;
  promoDiscount: number;
  promoApplied: string;
  youPay: number;
}) {
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const baseTotal = baseFare + taxes; // Assuming 1 pax here for simplicity, modify if pax count needed

  return (
    <div className="hidden lg:block w-[380px] flex-shrink-0">
      <div className="sticky top-20 bg-surface border border-line rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className={cn(remainingSeconds <= 300 ? "text-brand-500" : "text-ink-400")} />
          <span className={cn("text-sm tabular-nums font-medium", remainingSeconds <= 300 && "text-brand-500 animate-pulse")}>
            Time Remaining {formatTime(remainingSeconds)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-line">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(remainingSeconds / (20 * 60)) * 100}%` }} />
        </div>

        <div className="border-t border-line pt-4">
          <h4 className="font-semibold text-ink-700 mb-3">Fare Summary</h4>
          <div className="flex items-center gap-2 mb-3">
            <AirlineLogo code={airlineCode} size="sm" />
            <div>
              <div className="font-medium text-sm text-ink-700">{airlineName} • {flightKey}</div>
              <div className="text-xs text-ink-400">One way · {format(new Date(), "d MMM")}</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Base Fare (1 × {formatCurrencyShort(baseFare)})</span>
              <span className="tabular-nums">{formatCurrencyShort(baseFare)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Taxes & Fees (1 × {formatCurrencyShort(taxes)})</span>
              <span className="tabular-nums">{formatCurrencyShort(taxes)}</span>
            </div>

            {computedAddonsTotal > 0 && (
              <>
                <div className="border-t border-dashed border-line pt-2">
                  <p className="text-xs font-medium text-ink-400 mb-1">Add-ons</p>
                  {baggageCost > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-400">Extra baggage</span>
                      <span className="tabular-nums">{formatCurrencyShort(baggageCost)}</span>
                    </div>
                  )}
                  {seatCost > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-400">Seat {selectedSeat}</span>
                      <span className="tabular-nums">{formatCurrencyShort(seatCost)}</span>
                    </div>
                  )}
                  {mealCost > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-400 capitalize">{selectedMeal} meal</span>
                      <span className="tabular-nums">{formatCurrencyShort(mealCost)}</span>
                    </div>
                  )}
                  {insuranceCost > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-400">Travel insurance</span>
                      <span className="tabular-nums">{formatCurrencyShort(insuranceCost)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-line mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-ink-700">Sub Total</span>
              <span className="tabular-nums font-medium">{formatCurrencyShort(baseTotal + computedAddonsTotal)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Offer {promoApplied}</span>
                <span className="tabular-nums">−{formatCurrencyShort(promoDiscount)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-line mt-3 pt-3">
            <div className="flex justify-between text-lg">
              <span className="font-semibold text-ink-800">You Pay</span>
              <span className="font-bold text-brand-500 tabular-nums">{formatCurrencyShort(youPay)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="mt-2 p-2 rounded bg-success-bg text-success text-xs text-center">
                You save {formatCurrencyShort(promoDiscount)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
