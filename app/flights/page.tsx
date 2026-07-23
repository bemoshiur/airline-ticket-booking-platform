"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, ArrowLeft, ArrowRight, Clock, ChevronDown, ChevronUp, Plane, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { searchFlights, generateFareCalendar, type FlightResult, type FareOption, type FlightSegment } from "@/lib/mock/generator";
import { getAirline } from "@/lib/mock/airlines";
import { getAirport } from "@/lib/mock/airports";
import { getFareFamily } from "@/lib/mock/fares";
import { formatCurrencyShort } from "@/lib/utils/currency";
import { formatDuration } from "@/lib/utils/duration";
import { fakeLatency } from "@/lib/utils/fakeLatency";
import { useFiltersStore } from "@/lib/store/filters";
import { useSessionStore } from "@/lib/store/session";
import { AirlineLogo } from "@/components/ui/airline-logo";
import { PerforatedDivider } from "@/components/ui/perforated-divider";
import { RefundPill } from "@/components/ui/refund-pill";
import { SeatsLeftPill } from "@/components/ui/seats-left-pill";
import { PromoChip } from "@/components/ui/promo-chip";
import { addDays, format } from "date-fns";

function FlightsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = useSessionStore();
  const filters = useFiltersStore();

  const [results, setResults] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<"cheapest" | "fastest" | "earliest">("cheapest");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [showFareModal, setShowFareModal] = useState<FlightResult | null>(null);
  const [calendarOffset, setCalendarOffset] = useState(0);

  // Parse search params
  const tripType = searchParams.get("tripType") || "O";
  const itinerary = searchParams.get("itinerary") || "";
  const cabinClass = searchParams.get("cabinClass") || "economy";
  const adult = parseInt(searchParams.get("adult") || "1");
  const child = parseInt(searchParams.get("child") || "0");
  const kid = parseInt(searchParams.get("kid") || "0");
  const infant = parseInt(searchParams.get("infant") || "0");
  const fareType = searchParams.get("fareType") || "REGULAR";
  const carriers = searchParams.get("carriers");

  const [origin, dest, dateStr] = itinerary.split("-");
  const totalPax = adult + child + kid + infant;

  // Fare calendar data
  const calendarData = useMemo(() => {
    if (!origin || !dest) return [];
    return generateFareCalendar(origin, dest, dateStr || format(new Date(), "yyyy-MM-dd"), 7);
  }, [origin, dest, dateStr]);

  // Load results
  useEffect(() => {
    if (!origin || !dest || !dateStr) return;

    const loadResults = async () => {
      setLoading(true);
      await fakeLatency(600, 1200);

      const flights = searchFlights({
        origin,
        destination: dest,
        date: dateStr,
        tripType: tripType as "O" | "R" | "M",
        adult,
        child,
        kid,
        infant,
        cabinClass,
        fareType: fareType as "REGULAR" | "STUDENT",
        carriers: carriers ? carriers.split(",") : undefined,
      });

      setResults(flights);
      setLoading(false);
      session.start(20 * 60);
    };

    loadResults();
  }, [origin, dest, dateStr, tripType, adult, child, kid, infant, cabinClass, fareType, carriers, session.start]);

  // Apply filters and sorting
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Price range
    if (filters.filters.priceMin > 0) {
      filtered = filtered.filter((r) => (r.fareOptions[0]?.totalFare ?? 0) >= filters.filters.priceMin);
    }
    if (filters.filters.priceMax < 99999) {
      filtered = filtered.filter((r) => (r.fareOptions[0]?.totalFare ?? 0) <= filters.filters.priceMax);
    }

    // Stops
    if (filters.filters.stops.length > 0) {
      filtered = filtered.filter((r) => {
        const stopCount = r.segments[0]?.stops ?? 0;
        return filters.filters.stops.some((s) => {
          if (s === "0") return stopCount === 0;
          if (s === "1") return stopCount === 1;
          if (s === "2+") return stopCount >= 2;
          return false;
        });
      });
    }

    // Airlines
    if (filters.filters.airlines.length > 0) {
      filtered = filtered.filter((r) => filters.filters.airlines.includes(r.segments[0]?.airline ?? ""));
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortMode === "cheapest") {
        return (a.fareOptions[0]?.totalFare ?? 0) - (b.fareOptions[0]?.totalFare ?? 0);
      }
      if (sortMode === "fastest") {
        return a.totalDuration - b.totalDuration;
      }
      // Earliest
      const aTime = a.segments[0]?.departureTime ?? "00:00";
      const bTime = b.segments[0]?.departureTime ?? "00:00";
      return aTime.localeCompare(bTime);
    });

    return filtered;
  }, [results, filters.filters, sortMode]);

  // Get unique airlines in results
  const airlinesInResults = useMemo(() => {
    const codes = new Set(results.map((r) => r.segments[0]?.airline).filter(Boolean));
    return Array.from(codes);
  }, [results]);

  // Session timer
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const interval = setInterval(() => session.tick(), 1000);
    return () => clearInterval(interval);
  }, [session.tick]);

  // Handle flight selection with random fare change (1 in 8)
  const handleSelectFlight = (flight: FlightResult, fare: FareOption) => {
    const roll = Math.random();
    if (roll < 0.125) {
      // Fare changed
      const newFare = Math.round(fare.totalFare * (1 + Math.random() * 0.1));
      if (confirm(`The fare for this flight changed from ${formatCurrencyShort(fare.totalFare)} to ${formatCurrencyShort(newFare)}. Continue at new fare?`)) {
        proceedToCheckout(flight, fare);
      }
    } else {
      proceedToCheckout(flight, fare);
    }
  };

  const proceedToCheckout = (flight: FlightResult, fare: FareOption) => {
    const searchId = crypto.randomUUID?.() || Math.random().toString(36);
    const flightKey = `${flight.segments[0]?.airline}-${flight.segments[0]?.flightNumber}`;
    const fareKey = fare.fareFamilyId;
    router.push(`/booking/checkout?searchId=${searchId}&flightKey=${flightKey}&fareKey=${fareKey}`);
  };

  if (!origin || !dest) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 py-20 text-center">
        <h1 className="text-h1 font-sora font-bold text-ink-800 mb-4">No search parameters found</h1>
        <p className="text-body text-ink-400 mb-6">Please search for flights first.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors">
          Search flights
        </Link>
      </div>
    );
  }

  const originAirport = getAirport(origin);
  const destAirport = getAirport(dest);

  return (
    <div className="max-w-[1360px] mx-auto px-4 lg:px-8 py-6">
      {/* Collapsed search bar */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-surface border border-line rounded-lg shadow-e1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-ink-700">{originAirport?.city || origin}</span>
            <span className="text-overline text-ink-400">{origin}</span>
          </div>
          <Plane size={14} className="text-brand-500 flex-shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-ink-700">{destAirport?.city || dest}</span>
            <span className="text-overline text-ink-400">{dest}</span>
          </div>
          <span className="text-body-sm text-ink-400 ml-2">
            {dateStr} · {totalPax} Traveller{totalPax !== 1 ? "s" : ""} · {cabinClass.replace("_", " ")}
          </span>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-md bg-brand-100 text-brand-800 text-sm font-medium border border-brand-300 hover:bg-brand-200 transition-colors flex-shrink-0"
        >
          Modify Search
        </Link>
      </div>

      {/* Session Timer */}
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className={cn(session.remainingSeconds <= 300 ? "text-brand-500" : "text-ink-400")} />
        <span
          className={cn(
            "text-sm tabular-nums font-medium",
            session.remainingSeconds <= 300
              ? "text-brand-500 animate-pulse"
              : "text-ink-500"
          )}
        >
          {formatTime(session.remainingSeconds)}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-line max-w-[120px]">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${(session.remainingSeconds / (20 * 60)) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filter Rail - Desktop */}
        <aside className="hidden lg:block w-[280px] flex-shrink-0">
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-700">Filters</h2>
              {filters.activeFilterCount > 0 && (
                <button
                  onClick={filters.resetFilters}
                  className="text-sm text-brand-600 hover:text-brand-800 transition-colors"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-ink-700 mb-2">Price Range</h3>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.filters.priceMin || ""}
                  onChange={(e) => filters.setFilter("priceMin", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                />
                <span className="text-ink-400">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.filters.priceMax >= 99999 ? "" : filters.filters.priceMax}
                  onChange={(e) => filters.setFilter("priceMax", parseInt(e.target.value) || 99999)}
                  className="w-full px-3 py-1.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Stops */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-ink-700 mb-2">Stops</h3>
              {["0", "1", "2+"].map((stop) => {
                const count = results.filter((r) => {
                  if (stop === "0") return (r.segments[0]?.stops ?? 0) === 0;
                  if (stop === "1") return (r.segments[0]?.stops ?? 0) === 1;
                  return (r.segments[0]?.stops ?? 0) >= 2;
                }).length;
                return (
                  <label key={stop} className={cn("flex items-center gap-2 py-1.5 cursor-pointer", count === 0 && "opacity-40 cursor-not-allowed")}>
                    <input
                      type="checkbox"
                      checked={filters.filters.stops.includes(stop)}
                      onChange={() => {
                        const next = filters.filters.stops.includes(stop)
                          ? filters.filters.stops.filter((s) => s !== stop)
                          : [...filters.filters.stops, stop];
                        filters.setFilter("stops", next);
                      }}
                      className="accent-brand-500"
                      disabled={count === 0}
                    />
                    <span className="text-sm text-ink-700">
                      {stop === "0" ? "Non-stop" : stop === "1" ? "1 stop" : "2+ stops"}
                    </span>
                    <span className="text-xs text-ink-400 ml-auto">({count})</span>
                  </label>
                );
              })}
            </div>

            {/* Airlines */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-ink-700 mb-2">Airlines</h3>
              {airlinesInResults.map((code) => {
                const airline = getAirline(code);
                const count = results.filter((r) => r.segments[0]?.airline === code).length;
                const minFare = Math.min(
                  ...results.filter((r) => r.segments[0]?.airline === code).map((r) => r.fareOptions[0]?.totalFare ?? 0)
                );
                return (
                  <label key={code} className="flex items-center gap-2 py-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.filters.airlines.includes(code)}
                      onChange={() => {
                        const next = filters.filters.airlines.includes(code)
                          ? filters.filters.airlines.filter((a) => a !== code)
                          : [...filters.filters.airlines, code];
                        filters.setFilter("airlines", next);
                      }}
                      className="accent-brand-500"
                    />
                    <AirlineLogo code={code} size="sm" />
                    <span className="text-sm text-ink-700 flex-1">{airline?.name || code}</span>
                    <span className="text-xs text-ink-400">({count})</span>
                    {minFare > 0 && (
                      <span className="text-xs text-brand-500 tabular-nums font-medium">৳{minFare.toLocaleString()}</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Mobile Filter Button */}
        <button
          className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-full bg-ink-800 text-white text-sm font-medium shadow-e3 flex items-center gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} />
          Filters {filters.activeFilterCount > 0 && `(${filters.activeFilterCount})`}
        </button>

        {/* Results Column */}
        <div className="flex-1 min-w-0">
          {/* Fare Calendar Strip */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setCalendarOffset(Math.max(0, calendarOffset - 1))}
              className="p-1.5 rounded-md hover:bg-surface-alt transition-colors flex-shrink-0"
              aria-label="Previous dates"
            >
              <ArrowLeft size={16} className="text-ink-400" />
            </button>
            {calendarData.slice(calendarOffset, calendarOffset + 7).map((day, idx) => {
              const d = new Date(day.date);
              const active = day.date === dateStr;
              return (
                <button
                  key={day.date}
                  className={cn(
                    "flex-shrink-0 px-3 py-2 rounded-lg text-center transition-all min-w-[80px]",
                    active
                      ? "border-b-3 border-brand-500"
                      : "hover:bg-surface-alt"
                  )}
                >
                  <div className="text-xs text-ink-400">{format(d, "d MMM")}</div>
                  <div className={cn("text-sm font-semibold tabular-nums", active ? "text-brand-500" : "text-ink-700")}>
                    ৳{day.minFare.toLocaleString()}
                  </div>
                </button>
              );
            })}
            <button
              onClick={() => setCalendarOffset(Math.min(calendarData.length - 7, calendarOffset + 1))}
              className="p-1.5 rounded-md hover:bg-surface-alt transition-colors flex-shrink-0"
              aria-label="Next dates"
            >
              <ArrowRight size={16} className="text-ink-400" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-surface-alt transition-colors ml-auto flex-shrink-0" aria-label="Pricing table">
              <span className="text-sm text-brand-600 font-medium">▦ Pricing Table</span>
            </button>
          </div>

          {/* Sort Bar */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto">
            {([["cheapest", `Cheapest ৳${filteredResults[0]?.fareOptions[0]?.totalFare.toLocaleString() || "—"}`],
              ["fastest", `Fastest ${formatDuration(filteredResults.reduce((min, r) => Math.min(min, r.totalDuration), Infinity))}`],
              ["earliest", `Earliest ${filteredResults.reduce((earliest, r) => {
                const t = r.segments[0]?.departureTime ?? "23:59";
                return t < earliest ? t : earliest;
              }, "23:59")}`],
            ] as [string, string][]).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode as typeof sortMode)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                  sortMode === mode
                    ? "bg-brand-100 text-brand-800 border border-brand-500"
                    : "bg-surface-alt text-ink-500 hover:bg-brand-50"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Result count */}
          <p className="text-body-sm text-ink-400 mb-4">
            Showing {filteredResults.length} flight{filteredResults.length !== 1 ? "s" : ""} across {airlinesInResults.length} airline{airlinesInResults.length !== 1 ? "s" : ""}
          </p>

          {/* Airline Matrix */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {airlinesInResults.map((code) => {
              const airline = getAirline(code);
              const count = results.filter((r) => r.segments[0]?.airline === code).length;
              const minFare = Math.min(
                ...results.filter((r) => r.segments[0]?.airline === code).map((r) => r.fareOptions[0]?.totalFare ?? 0)
              );
              const active = filters.filters.airlines.includes(code);
              return (
                <button
                  key={code}
                  onClick={() => {
                    const next = active
                      ? filters.filters.airlines.filter((a) => a !== code)
                      : [code];
                    filters.setFilter("airlines", next);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                    active
                      ? "bg-brand-100 border-brand-300 text-brand-800"
                      : "bg-surface-alt border-line text-ink-500 hover:border-brand-300"
                  )}
                >
                  <span className="text-xs">{airline?.logo || code}</span>
                  <span>({count})</span>
                  <span className="tabular-nums">৳{minFare.toLocaleString()}</span>
                </button>
              );
            })}
          </div>

          {/* Results */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[132px] rounded-lg bg-surface border border-line animate-shimmer" />
              ))}
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="font-sora font-semibold text-h2 text-ink-700 mb-2">No flights match your filters.</h3>
              <p className="text-body text-ink-400 mb-4">Try adjusting your search criteria.</p>
              <button
                onClick={filters.resetFilters}
                className="px-6 py-2.5 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <motion.div className="space-y-4" layout>
              <AnimatePresence mode="popLayout">
              {filteredResults.map((flight, idx) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  index={idx}
                  totalPax={totalPax}
                  expanded={expandedCards.has(flight.id)}
                  onToggleExpand={() => {
                    const next = new Set(expandedCards);
                    if (next.has(flight.id)) next.delete(flight.id);
                    else next.add(flight.id);
                    setExpandedCards(next);
                  }}
                  onSelect={(fare) => handleSelectFlight(flight, fare)}
                  onViewPrices={() => setShowFareModal(flight)}
                />
              ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Fare Family Modal */}
      {showFareModal && (
        <FareFamilyModal
          flight={showFareModal}
          totalPax={totalPax}
          onClose={() => setShowFareModal(null)}
          onSelect={(fare) => {
            setShowFareModal(null);
            handleSelectFlight(showFareModal, fare);
          }}
        />
      )}
    </div>
  );
}

export default function FlightsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1360px] mx-auto px-4 lg:px-8 py-6">
        <div className="animate-shimmer h-12 rounded-lg mb-6" />
        <div className="flex gap-6">
          <div className="hidden lg:block w-[280px]">
            <div className="animate-shimmer h-[500px] rounded-lg" />
          </div>
          <div className="flex-1">
            <div className="animate-shimmer h-[200px] rounded-lg mb-4" />
            <div className="animate-shimmer h-[132px] rounded-lg mb-4" />
            <div className="animate-shimmer h-[132px] rounded-lg mb-4" />
            <div className="animate-shimmer h-[132px] rounded-lg" />
          </div>
        </div>
      </div>
    }>
      <FlightsContent />
    </Suspense>
  );
}

// Flight Card Component
function FlightCard({
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
  const originAirport = getAirport(seg.origin);
  const destAirport = getAirport(seg.destination);
  const bestFare = flight.fareOptions[0];
  const originalFare = flight.fareOptions.length > 1 ? flight.fareOptions[flight.fareOptions.length - 1] : undefined;
  const hasMultipleFares = flight.fareOptions.length > 1;

  // Parse times
  const [depH, depM] = seg.departureTime.split(":").map(Number);
  const [arrH, arrM] = seg.arrivalTime.split(":").map(Number);
  const depDate = new Date(2026, 6, 30, depH, depM);
  const arrDate = new Date(2026, 6, 30, arrH, arrM);

  const dateStr = format(new Date(), "d MMM");
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

// Fare Family Modal
function FareFamilyModal({
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
  const [carouselOffset, setCarouselOffset] = useState(0);

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
