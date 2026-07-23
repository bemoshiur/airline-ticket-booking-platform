import { format, addDays } from "date-fns";
import { Plane, Star, ChevronUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type FlightResult, type FareOption } from "@/lib/mock/generator";
import { getAirline } from "@/lib/mock/airlines";
import { getAirport } from "@/lib/mock/airports";
import { getFareFamily } from "@/lib/mock/fares";
import { formatDuration } from "@/lib/utils/duration";
import { AirlineLogo } from "@/components/ui/airline-logo";
import { PerforationNotch } from "@/components/ui/perforated-divider";
import { PromoChip } from "@/components/ui/promo-chip";

export function FlightCard({
  flight,
  index,
  totalPax,
  expanded,
  onToggleExpand,
  onSelect,
  onViewPrices,
}: {
  flight: FlightResult;
  index: number;
  totalPax: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onSelect: (fare: FareOption) => void;
  onViewPrices: () => void;
}) {
  const seg = flight.segments[0];
  if (!seg) return null;

  const airline = getAirline(seg.airline);
  const bestFare = flight.fareOptions[0];
  const originalFare = flight.fareOptions.length > 1 ? flight.fareOptions[flight.fareOptions.length - 1] : undefined;
  const hasMultipleFares = flight.fareOptions.length > 1;

  const depDay = format(addDays(new Date(), index), "EEE, d MMM");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative overflow-hidden bg-surface border border-line rounded-[14px] transition-all",
        "shadow-e1 hover:shadow-e2 hover:border-brand-300",
        "focus-visible:shadow-focus"
      )}
    >
      {/* Header: Airline + Badges */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3 mb-2">
          <AirlineLogo code={seg.airline} />
          <div className="flex-1 min-w-0">
            <div className="text-body font-semibold text-ink-500">{airline?.name || seg.airline}</div>
            <div className="text-mono text-ink-300 tracking-wider text-sm">{seg.flightNumber}</div>
          </div>
          {flight.recommended && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label text-success bg-success-bg">
              <Star size={12} /> Best
            </span>
          )}
        </div>
      </div>

      {/* Hairline divider */}
      <div className="px-4 h-px bg-line" />

      {/* Baseline Row: Times + Duration + Stops */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Departure */}
          <div className="text-center flex-1">
            <div className="font-mono text-[20px] font-semibold leading-none text-ink-900 tabular-nums">
              {seg.departureTime}
            </div>
            <div className="text-overline text-ink-500 mt-1">{seg.origin}</div>
            <div className="text-body-sm text-ink-400">{depDay}</div>
          </div>

          {/* Duration & Stops */}
          <div className="flex flex-col items-center px-2 flex-1">
            <div className="text-body-sm text-ink-400 tabular-nums mb-1.5">
              {formatDuration(seg.duration)}
            </div>
            <div className="flex items-center gap-1 w-full">
              <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
              <div className="flex-1 border-t border-dashed border-ink-300" />
              <Plane size={14} className="text-brand-500 flex-shrink-0" />
              <div className="flex-1 border-t border-dashed border-ink-300" />
              <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
            </div>
            <div className="text-body-sm text-ink-400 mt-1.5">
              {seg.stops === 0 ? "Non-stop" : `${seg.stops} stop${seg.stops > 1 ? "s" : ""}`}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center flex-1">
            <div className="font-mono text-[20px] font-semibold leading-none text-ink-900 tabular-nums">
              {seg.arrivalTime}
            </div>
            <div className="text-overline text-ink-500 mt-1">{seg.destination}</div>
            <div className="text-body-sm text-ink-400">{depDay}</div>
          </div>
        </div>
      </div>

      {/* Hairline divider */}
      <div className="px-4 h-px bg-line" />

      {/* Price Section */}
      <div className="p-4">
        {flight.promoCode && (
          <div className="mb-2">
            <PromoChip code={flight.promoCode} />
          </div>
        )}

        {bestFare && (
          <>
            <div className="text-fare text-ink-900 font-bold tabular-nums">
              ৳{(bestFare.totalFare * totalPax).toLocaleString()}
            </div>
            {originalFare && originalFare.totalFare > bestFare.totalFare && (
              <div className="text-fare-sm text-ink-400 line-through tabular-nums">
                ৳{(originalFare.totalFare * totalPax).toLocaleString()}
              </div>
            )}
            <div className="text-body-sm text-ink-400 mt-0.5">
              Total · {totalPax} Traveller{totalPax > 1 ? "s" : ""} · {bestFare.rbd}
            </div>
          </>
        )}

        {/* View Fares Link + Select CTA */}
        <div className="flex items-center gap-2 mt-3">
          {hasMultipleFares && (
            <button
              onClick={onViewPrices}
              className="text-sm text-brand-600 font-medium hover:text-brand-800 transition-colors flex-1"
            >
              View {flight.fareOptions.length} fares from ৳{bestFare?.totalFare.toLocaleString()}
            </button>
          )}
          <button
            onClick={() => bestFare && onSelect(bestFare)}
            className="px-4 py-2 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors whitespace-nowrap flex-shrink-0"
          >
            Select
          </button>
        </div>
      </div>

      {/* Expanded Details Section (currently hidden, ready for expansion) */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="border-t border-line"
        >
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-body-sm">
              <span className="text-ink-400">Aircraft</span>
              <span className="text-ink-700 font-medium">{seg.aircraftName}</span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-ink-400">Baggage</span>
              <span className="text-ink-700 font-medium">
                {bestFare && getFareFamily(bestFare.fareFamilyId)?.checkinBaggage
                  ? `${getFareFamily(bestFare.fareFamilyId)?.checkinBaggage} kg`
                  : "20 kg"}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom action bar */}
      <div className="px-4 py-2 border-t border-line flex items-center justify-between bg-surface-alt">
        <div className="text-xs text-ink-400">
          {seg.aircraftName} · {bestFare && getFareFamily(bestFare.fareFamilyId)?.checkinBaggage ? `${getFareFamily(bestFare.fareFamilyId)?.checkinBaggage} kg` : "20 kg"}
        </div>
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 transition-colors"
        >
          Details {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Perforation notch */}
      <PerforationNotch />
    </motion.div>
  );
}
