"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, MapPin, Users, Plane, ChevronDown, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore, type TripType, type CabinClass } from "@/lib/store/search";
import { airports, getAirport, searchAirports } from "@/lib/mock/airports";
import { format, addDays } from "date-fns";
import { DateRangeField } from "./date-range-field";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-3xl shadow-2xl p-8 max-w-5xl mx-auto -mb-20 relative z-20"
      style={{
        background: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Trip Type Selector */}
      <div className="flex gap-3 mb-8">
        {(["O", "R", "M"] as TripType[]).map((type) => {
          const labels: Record<TripType, string> = { O: "One Way", R: "Round Trip", M: "Multi City" };
          return (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => store.setTripType(type)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200",
                store.tripType === type
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg"
                  : "bg-white text-ink-600 border border-ink-200 hover:border-brand-300"
              )}
            >
              {labels[type]}
            </motion.button>
          );
        })}
      </div>

      {store.tripType !== "M" ? (
        <>
          {/* Search Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
            {/* From */}
            <div className="md:col-span-3 relative">
              <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-2">From</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={20} />
                <input
                  type="text"
                  value={originQuery || (originAirport?.city || "")}
                  onChange={(e) => setOriginQuery(e.target.value)}
                  onFocus={() => { setOriginOpen(true); setDestOpen(false); setTravellerOpen(false); }}
                  placeholder="Departure city"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-ink-200 text-sm font-medium focus:outline-none focus:border-brand-500 focus:bg-blue-50 transition-all"
                />

                {/* Dropdown */}
                {originOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-brand-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto"
                  >
                    {originResults.length > 0 ? (
                      originResults.slice(0, 8).map((airport) => (
                        <motion.button
                          key={airport.code}
                          whileHover={{ backgroundColor: "#f0f9ff" }}
                          onClick={() => {
                            store.setOrigin(airport.code);
                            setOriginQuery("");
                            setOriginOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-ink-100 last:border-b-0"
                        >
                          <div className="font-semibold text-ink-800">{airport.city}</div>
                          <div className="text-xs text-ink-400">{airport.code} • {airport.name}</div>
                        </motion.button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-ink-400">Type to search airports...</div>
                    )}
                  </motion.div>
                )}

                {!originOpen && originAirport && (
                  <div className="text-xs text-ink-400 mt-1">{originAirport.code}</div>
                )}
              </div>
            </div>

            {/* To */}
            <div className="md:col-span-3 relative">
              <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-2">To</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500 rotate-90" size={20} />
                <input
                  type="text"
                  value={destQuery || (destAirport?.city || "")}
                  onChange={(e) => setDestQuery(e.target.value)}
                  onFocus={() => { setDestOpen(true); setOriginOpen(false); setTravellerOpen(false); }}
                  placeholder="Arrival city"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-ink-200 text-sm font-medium focus:outline-none focus:border-brand-500 focus:bg-blue-50 transition-all"
                />

                {/* Dropdown */}
                {destOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-brand-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto"
                  >
                    {destResults.length > 0 ? (
                      destResults.slice(0, 8).map((airport) => (
                        <motion.button
                          key={airport.code}
                          whileHover={{ backgroundColor: "#f0f9ff" }}
                          onClick={() => {
                            store.setDestination(airport.code);
                            setDestQuery("");
                            setDestOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-ink-100 last:border-b-0"
                        >
                          <div className="font-semibold text-ink-800">{airport.city}</div>
                          <div className="text-xs text-ink-400">{airport.code} • {airport.name}</div>
                        </motion.button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-ink-400">Type to search airports...</div>
                    )}
                  </motion.div>
                )}

                {!destOpen && destAirport && (
                  <div className="text-xs text-ink-400 mt-1">{destAirport.code}</div>
                )}
              </div>
            </div>

            {/* Date Range Field (One Way or Round Trip) */}
            <DateRangeField />

            {/* Travellers & Cabin */}
            <div className={cn("relative", store.tripType === "R" ? "md:col-span-2" : "md:col-span-2")}>
              <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-2">Passengers</label>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setTravellerOpen(!travellerOpen)}
                className="w-full px-4 py-3 rounded-xl border-2 border-ink-200 text-sm font-medium text-ink-700 hover:border-brand-300 focus:outline-none focus:border-brand-500 focus:bg-blue-50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-brand-500" />
                  <span>{store.travellers.adult + store.travellers.child}</span>
                </div>
                <ChevronDown size={16} className={cn("transition-transform", travellerOpen && "rotate-180")} />
              </motion.button>

              {travellerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-brand-200 rounded-xl shadow-xl z-50 p-4 space-y-3"
                >
                  {["adult", "child", "kid", "infant"].map((type) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink-700 capitalize">{type}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            store.setTravellers({
                              ...store.travellers,
                              [type]: Math.max(0, store.travellers[type as keyof typeof store.travellers] - 1),
                            })
                          }
                          className="w-7 h-7 rounded-lg bg-ink-100 hover:bg-brand-100 flex items-center justify-center text-ink-600 hover:text-brand-600 transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-ink-800">{store.travellers[type as keyof typeof store.travellers]}</span>
                        <button
                          onClick={() =>
                            store.setTravellers({
                              ...store.travellers,
                              [type]: store.travellers[type as keyof typeof store.travellers] + 1,
                            })
                          }
                          className="w-7 h-7 rounded-lg bg-ink-100 hover:bg-brand-100 flex items-center justify-center text-ink-600 hover:text-brand-600 transition-all"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Cabin Class */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-2">Cabin</label>
              <select
                value={store.cabinClass}
                onChange={(e) => store.setCabinClass(e.target.value as CabinClass)}
                className="w-full px-4 py-3 rounded-xl border-2 border-ink-200 text-sm font-medium focus:outline-none focus:border-brand-500 focus:bg-blue-50 transition-all cursor-pointer"
              >
                <option value="economy">Economy</option>
                <option value="premium">Premium</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(216, 33, 40, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg flex items-center justify-center gap-2 text-lg"
          >
            <Search size={20} />
            Search Flights
          </motion.button>
        </>
      ) : (
        <div className="text-center text-ink-400 py-8 text-lg">Multi-city search coming soon</div>
      )}
    </motion.div>
  );
}
