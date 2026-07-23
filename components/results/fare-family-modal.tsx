import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FlightResult, type FareOption } from "@/lib/mock/generator";
import { getFareFamily } from "@/lib/mock/fares";

export function FareFamilyModal({
  flight,
  totalPax,
  onClose,
  onSelect,
}: {
  flight: FlightResult;
  totalPax: number;
  onClose: () => void;
  onSelect: (fare: FareOption) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const seg = flight.segments[0];
  if (!seg) return null;

  const selectedFare = flight.fareOptions[selectedIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface rounded-xl shadow-e3 w-[960px] max-w-[95vw] max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface z-10 border-b border-line px-6 py-4 flex items-center justify-between">
          <h2 className="font-sora font-semibold text-h2 text-ink-800">
            <span className="text-brand-500">{flight.fareOptions.length}</span> Fare Options available for your One way trip.
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-alt transition-colors" aria-label="Close">
            <X size={20} className="text-ink-400" />
          </button>
        </div>

        {/* Carousel */}
        <div className="px-6 py-6">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {flight.fareOptions.map((fare, idx) => {
              const ff = getFareFamily(fare.fareFamilyId);
              if (!ff) return null;
              return (
                <button
                  key={fare.id}
                  onClick={() => { setSelectedIdx(idx); }}
                  className={cn(
                    "flex-shrink-0 w-[280px] p-4 rounded-lg border-2 text-left transition-all",
                    selectedIdx === idx ? "border-brand-500" : "border-line hover:border-brand-300"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      selectedIdx === idx ? "border-brand-500" : "border-ink-300"
                    )}>
                      {selectedIdx === idx && <div className="w-2 h-2 rounded-full bg-brand-500" />}
                    </div>
                    <span className="text-fare text-brand-500 font-bold tabular-nums">৳{fare.totalFare.toLocaleString()}</span>
                  </div>
                  <div className="text-body font-semibold text-ink-700 mb-1">{ff.name}</div>
                  <div className="inline-flex px-2 py-0.5 rounded text-xs bg-brand-100 text-brand-800 mb-2">
                    {seg.origin} - {seg.destination}
                  </div>

                  <div className="space-y-1 mt-3">
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Baggage</p>
                    <div className="flex items-center gap-1 text-sm text-ink-700">
                      <span className="text-success">✓</span> {ff.cabinBaggage} Kg Cabin
                    </div>
                    <div className="flex items-center gap-1 text-sm text-ink-700">
                      <span className="text-success">✓</span> {ff.checkinBaggage} Kg Check-in
                    </div>
                  </div>

                  <div className="space-y-1 mt-2">
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Flexibility</p>
                    <div className="flex items-center gap-1 text-sm text-ink-700">
                      <span className={ff.dateChangeable ? "text-success" : "text-danger"}>{ff.dateChangeable ? "✓" : "✕"}</span> Date change
                    </div>
                    <div className="flex items-center gap-1 text-sm text-ink-700">
                      <span className={ff.refundable ? "text-success" : "text-danger"}>{ff.refundable ? "✓" : "✕"}</span> Refundable
                    </div>
                    <div className="flex items-center gap-1 text-sm text-ink-700">
                      <span className={ff.seatSelection ? "text-success" : "text-danger"}>{ff.seatSelection ? "✓" : "✕"}</span> Seat selection
                    </div>
                    <div className="flex items-center gap-1 text-sm text-ink-700">
                      <span className={ff.mealIncluded ? "text-success" : "text-danger"}>{ff.mealIncluded ? "✓" : "✕"}</span> Meal included
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sticky Footer */}
        {selectedFare && (
          <div className="sticky bottom-0 bg-surface border-t border-line px-6 py-4 flex items-center justify-between">
            <div className="text-fare text-brand-500 font-bold tabular-nums">
              ৳{(selectedFare.totalFare * totalPax).toLocaleString()} <span className="text-body-sm text-ink-400 font-normal">Total for {totalPax} traveller{totalPax > 1 ? "s" : ""}</span>
            </div>
            <button
              onClick={() => onSelect(selectedFare)}
              className="px-8 py-2.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
            >
              CONTINUE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
