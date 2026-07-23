import { format, addDays } from "date-fns";
import { Plane, Star, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FlightResult, type FareOption } from "@/lib/mock/generator";
import { getAirline } from "@/lib/mock/airlines";
import { getAirport } from "@/lib/mock/airports";
import { getFareFamily } from "@/lib/mock/fares";
import { formatDuration } from "@/lib/utils/duration";
import { AirlineLogo } from "@/components/ui/airline-logo";
import { PerforatedDivider } from "@/components/ui/perforated-divider";
import { RefundPill } from "@/components/ui/refund-pill";
import { SeatsLeftPill } from "@/components/ui/seats-left-pill";
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
    <div
      className={cn(
        "bg-surface border border-line rounded-lg transition-all overflow-hidden",
        "hover:shadow-e2 hover:border-brand-300 hover:-translate-y-0.5",
        "focus-visible:shadow-focus"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Main row */}
      <div className="flex min-h-[132px]">
        {/* Left block - ~72% */}
        <div className="flex-1 p-4">
          {/* Badges row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <RefundPill refundable={flight.refundable} />
            <SeatsLeftPill seats={flight.seatsLeft} />
            {flight.recommended && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label text-success bg-success-bg">
                <Star size={12} /> Recommended
              </span>
            )}
          </div>

          {/* Airline info */}
          <div className="flex items-center gap-3 mb-1">
            <AirlineLogo code={seg.airline} />
            <div>
              <div className="text-body font-semibold text-ink-700">{airline?.name || seg.airline}</div>
              <div className="text-mono text-ink-400 tracking-wider">{seg.flightNumber}</div>
            </div>
          </div>

          {/* Route line */}
          <div className="flex items-center gap-4 mt-2">
            {/* Departure */}
            <div className="text-center">
              <div className="text-time tabular-nums text-ink-700 font-semibold">{seg.departureTime}</div>
              <div className="text-overline text-ink-500">{seg.origin}</div>
              <div className="text-body-sm text-ink-400">{depDay}</div>
            </div>

            {/* Duration / Route */}
            <div className="flex-1 flex flex-col items-center px-2">
              <div className="text-body-sm text-ink-400 tabular-nums">{formatDuration(seg.duration)}</div>
              <div className="flex items-center gap-1 w-full">
                <div className="w-2 h-2 rounded-full bg-brand-500" />
                <div className="flex-1 border-t border-dashed border-ink-300" />
                <Plane size={14} className="text-brand-500" />
                <div className="flex-1 border-t border-dashed border-ink-300" />
                <div className="w-2 h-2 rounded-full bg-brand-500" />
              </div>
              <div className="text-body-sm text-ink-400">
                {seg.stops === 0 ? "Non-stop" : `${seg.stops} stop${seg.stops > 1 ? "s" : ""}`}
              </div>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-time tabular-nums text-ink-700 font-semibold">{seg.arrivalTime}</div>
              <div className="text-overline text-ink-500">{seg.destination}</div>
              <div className="text-body-sm text-ink-400">{depDay}</div>
            </div>
          </div>
        </div>

        {/* Perforated Divider */}
        <PerforatedDivider height={132} />

        {/* Right block - ~28% */}
        <div className="w-[200px] p-4 flex flex-col items-center justify-center">
          {flight.promoCode && (
            <div className="mb-1">
              <PromoChip code={flight.promoCode} />
            </div>
          )}

          {bestFare && (
            <>
              <div className="text-fare text-brand-500 font-bold tabular-nums">
                ৳{(bestFare.totalFare * totalPax).toLocaleString()}
              </div>
              {originalFare && originalFare.totalFare > bestFare.totalFare && (
                <div className="text-fare-sm text-ink-400 line-through tabular-nums">
                  ৳{(originalFare.totalFare * totalPax).toLocaleString()}
                </div>
              )}
              <div className="text-body-sm text-ink-400 mt-0.5">
                {bestFare.rbd} · {totalPax} Traveller{totalPax > 1 ? "s" : ""}
              </div>
            </>
          )}

          {/* CTA */}
          <div className="flex gap-2 mt-2">
            {hasMultipleFares ? (
              <button
                onClick={onViewPrices}
                className="px-3 py-1.5 rounded-md bg-brand-100 text-brand-800 text-sm font-medium border border-brand-300 hover:bg-brand-200 transition-colors"
              >
                View Prices
              </button>
            ) : null}
            {bestFare && (
              <button
                onClick={() => onSelect(bestFare)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium text-white transition-colors",
                  hasMultipleFares ? "bg-brand-500 hover:bg-brand-600" : "bg-brand-500 hover:bg-brand-600 w-full"
                )}
              >
                {hasMultipleFares ? "Select" : "Select Flight"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-line">
        {flight.recommended && (
          <span className="flex items-center gap-1 text-xs text-success">
            <Star size={12} /> Best price-to-duration ratio
          </span>
        )}
        <span className="text-xs text-ink-400">{seg.aircraftName}</span>
        <span className="text-xs text-ink-400">·</span>
        <span className="text-xs text-ink-400">{bestFare && getFareFamily(bestFare.fareFamilyId)?.checkinBaggage ? `${getFareFamily(bestFare.fareFamilyId)?.checkinBaggage} Kg` : "20 Kg"} baggage</span>
        <button
          onClick={onToggleExpand}
          className="ml-auto flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 transition-colors"
        >
          View Details {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
    </div>
  );
}
