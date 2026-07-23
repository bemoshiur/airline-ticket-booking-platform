"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Plane, ArrowRightLeft, Users, Calendar, ChevronDown, Plus, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore, type TripType, type CabinClass } from "@/lib/store/search";
import { airports, getAirport, searchAirports } from "@/lib/mock/airports";
import { format, addDays } from "date-fns";

export function SearchWidget() {
  const router = useRouter();
  const store = useSearchStore();
  const [travellerOpen, setTravellerOpen] = useState(false);
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");

  const handleSearch = () => {
    if (!store.validate()) return;

    const params = new URLSearchParams();
    params.set("tripType", store.tripType);
    if (store.tripType === "M") {
      const itineraries = store.multiCitySegments.map((s) => `${s.origin}-${s.destination}-${s.date}`).join("|");
      params.set("itinerary", itineraries);
    } else {
      params.set("itinerary", `${store.origin}-${store.destination}-${store.departureDate}`);
      if (store.tripType === "R" && store.returnDate) {
        params.set("returnItinerary", `${store.destination}-${store.origin}-${store.returnDate}`);
      }
    }
    params.set("cabinClass", store.cabinClass);
    params.set("adult", String(store.travellers.adult));
    params.set("child", String(store.travellers.child));
    params.set("kid", String(store.travellers.kid));
    params.set("infant", String(store.travellers.infant));
    params.set("fareType", store.fareType);
    if (store.preferredAirlines.length > 0) {
      params.set("carriers", store.preferredAirlines.join(","));
    }

    router.push(`/flights?${params.toString()}`);
  };

  const originResults = originQuery ? searchAirports(originQuery) : [];
  const destResults = destQuery ? searchAirports(destQuery) : [];

  const originAirport = getAirport(store.origin);
  const destAirport = getAirport(store.destination);

  function s(n: number) {
    return n !== 1 ? "s" : "";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl shadow-e3 p-6 max-w-[1180px] mx-auto -mb-20 relative z-20 border border-white border-opacity-20"
    >
      {/* Trip Type */}
      <div className="flex items-center gap-4 mb-5">
        {(["O", "R", "M"] as TripType[]).map((type) => {
          const labels: Record<TripType, string> = { O: "One Way", R: "Round Trip", M: "Multi City" };
          return (
            <button
              key={type}
              onClick={() => store.setTripType(type)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all focus-ring",
                store.tripType === type
                  ? "bg-brand-500 text-white"
                  : "bg-surface-alt text-ink-500 hover:bg-brand-50"
              )}
            >
              {labels[type]}
            </button>
          );
        })}
      </div>

      {store.tripType !== "M" ? (
        <>
          {/* Field Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {/* From - Autocomplete */}
            <div className="relative col-span-1">
              <label className="text-label text-ink-400">From</label>
              <input
                type="text"
                value={originQuery}
                onChange={(e) => setOriginQuery(e.target.value)}
                onFocus={() => { setOriginOpen(true); setDestOpen(false); }}
                placeholder="Search..."
                className="w-full px-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
              />

              {/* Autocomplete Dropdown */}
              {originOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-line rounded-lg shadow-e3 z-50 max-h-60 overflow-y-auto">
                  {originResults.length > 0 ? (
                    originResults.slice(0, 6).map((airport) => (
                      <button
                        key={airport.code}
                        type="button"
                        onClick={() => {
                          store.setOrigin(airport.code);
                          setOriginQuery("");
                          setOriginOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors border-b border-line last:border-b-0 focus:outline-none"
                      >
                        <div className="font-medium text-ink-800">{airport.city}</div>
                        <div className="text-xs text-ink-400">{airport.code} · {airport.name}</div>
                      </button>
                    ))
                  ) : originQuery ? (
                    <div className="px-4 py-3 text-sm text-ink-400">No airports found</div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-ink-400">Start typing...</div>
                  )}
                </div>
              )}

              {!originOpen && originAirport && (
                <div className="text-body-sm text-ink-600 mt-1">{originAirport.code}</div>
              )}
            </div>

            {/* Swap */}
            <div className="flex items-end justify-center pb-1">
              <button
                onClick={() => {
                  const temp = store.origin;
                  store.setOrigin(store.destination);
                  store.setDestination(temp);
                }}
                className="p-2 rounded-lg hover:bg-brand-50 transition-colors"
              >
                <ArrowRightLeft size={18} className="text-brand-500" />
              </button>
            </div>

            {/* To - Autocomplete */}
            <div className="relative col-span-1">
              <label className="text-label text-ink-400">To</label>
              <input
                type="text"
                value={destQuery}
                onChange={(e) => setDestQuery(e.target.value)}
                onFocus={() => { setDestOpen(true); setOriginOpen(false); }}
                placeholder="Search..."
                className="w-full px-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
              />

              {/* Autocomplete Dropdown */}
              {destOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-line rounded-lg shadow-e3 z-50 max-h-60 overflow-y-auto">
                  {destResults.length > 0 ? (
                    destResults.slice(0, 6).map((airport) => (
                      <button
                        key={airport.code}
                        type="button"
                        onClick={() => {
                          store.setDestination(airport.code);
                          setDestQuery("");
                          setDestOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-brand-50 transition-colors border-b border-line last:border-b-0 focus:outline-none"
                      >
                        <div className="font-medium text-ink-800">{airport.city}</div>
                        <div className="text-xs text-ink-400">{airport.code} · {airport.name}</div>
                      </button>
                    ))
                  ) : destQuery ? (
                    <div className="px-4 py-3 text-sm text-ink-400">No airports found</div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-ink-400">Start typing...</div>
                  )}
                </div>
              )}

              {!destOpen && destAirport && (
                <div className="text-body-sm text-ink-600 mt-1">{destAirport.code}</div>
              )}
            </div>

            {/* Departure Date */}
            <div className="col-span-1">
              <label className="text-label text-ink-400">Departure</label>
              <input
                type="date"
                value={store.departureDate}
                onChange={(e) => store.setDepartureDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Return Date (Round Trip Only) */}
            {store.tripType === "R" && (
              <div className="col-span-1">
                <label className="text-label text-ink-400">Return</label>
                <input
                  type="date"
                  value={store.returnDate || ""}
                  onChange={(e) => store.setReturnDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            )}
          </div>

          {/* Second Row - Travelers & Cabin */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {/* Travelers */}
            <div className="relative">
              <label className="text-label text-ink-400">Travellers</label>
              <button
                onClick={() => setTravellerOpen(!travellerOpen)}
                className="w-full px-3 py-2 rounded-lg border border-line text-sm text-ink-700 hover:bg-surface-alt transition-colors flex items-center justify-between"
              >
                <span>{store.travellers.adult + store.travellers.child} Traveller{s(store.travellers.adult + store.travellers.child)}</span>
                <ChevronDown size={16} className={cn("transition-transform", travellerOpen && "rotate-180")} />
              </button>

              {travellerOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-surface border border-line rounded-lg shadow-e3 z-40 p-3 space-y-2">
                  {["adult", "child", "kid", "infant"].map((type) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-ink-600 capitalize">{type}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            store.setTravellers({
                              ...store.travellers,
                              [type]: Math.max(0, store.travellers[type as keyof typeof store.travellers] - 1),
                            })
                          }
                          className="w-6 h-6 rounded-full hover:bg-brand-50 flex items-center justify-center text-sm"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-4 text-center text-sm font-medium">{store.travellers[type as keyof typeof store.travellers]}</span>
                        <button
                          onClick={() =>
                            store.setTravellers({
                              ...store.travellers,
                              [type]: store.travellers[type as keyof typeof store.travellers] + 1,
                            })
                          }
                          className="w-6 h-6 rounded-full hover:bg-brand-50 flex items-center justify-center text-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cabin Class */}
            <div>
              <label className="text-label text-ink-400">Cabin</label>
              <select
                value={store.cabinClass}
                onChange={(e) => store.setCabinClass(e.target.value as CabinClass)}
                className="w-full px-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="economy">Economy</option>
                <option value="premium">Premium</option>
                <option value="business">Business</option>
              </select>
            </div>

            {/* Fare Type */}
            <div>
              <label className="text-label text-ink-400">Fare</label>
              <select
                value={store.fareType}
                onChange={(e) => store.setFareType(e.target.value as "REGULAR" | "STUDENT")}
                className="w-full px-3 py-2 rounded-lg border border-line text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="REGULAR">Regular</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="w-full py-3 rounded-lg bg-brand-500 text-white font-bold hover:bg-brand-600 transition-colors flex items-center justify-center gap-2"
          >
            <Search size={18} />
            Search Flights
          </button>
        </>
      ) : (
        <div className="text-center text-ink-400 py-6">Multi-city search coming soon</div>
      )}
    </motion.div>
  );
}
