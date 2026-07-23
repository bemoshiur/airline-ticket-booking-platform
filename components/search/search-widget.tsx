"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore, type TripType } from "@/lib/store/search";
import { format, addDays } from "date-fns";
import { DateRangeField } from "./date-range-field";
import { AirportSelect } from "./airport-select";
import { PassengerClassSelect } from "./passenger-class-select";

export function SearchWidget() {
  const router = useRouter();
  const store = useSearchStore();
  const [openField, setOpenField] = useState<"origin" | "destination" | "travellers" | null>(null);

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
            <AirportSelect
              label="From"
              value={store.origin}
              onSelect={store.setOrigin}
              placeholder="Departure city"
              variant="depart"
              excludeCode={store.destination}
              open={openField === "origin"}
              onOpenChange={(open) => setOpenField(open ? "origin" : null)}
              colSpanClassName="md:col-span-3"
            />

            {/* To */}
            <AirportSelect
              label="To"
              value={store.destination}
              onSelect={store.setDestination}
              placeholder="Arrival city"
              variant="arrive"
              excludeCode={store.origin}
              open={openField === "destination"}
              onOpenChange={(open) => setOpenField(open ? "destination" : null)}
              colSpanClassName="md:col-span-3"
            />

            {/* Date Range Field (One Way or Round Trip) */}
            <DateRangeField />

            {/* Passengers & Class */}
            <PassengerClassSelect
              open={openField === "travellers"}
              onOpenChange={(open) => setOpenField(open ? "travellers" : null)}
            />
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
