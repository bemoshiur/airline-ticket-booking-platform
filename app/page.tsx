"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Plane, ArrowRightLeft, Users, Calendar, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore, type TripType, type CabinClass } from "@/lib/store/search";
import { airports, getAirport, searchAirports, type Airport } from "@/lib/mock/airports";
import { format, addDays } from "date-fns";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Popular Routes */}
      <PopularRoutesSection />
    </>
  );
}

function HeroSection() {
  const router = useRouter();
  const store = useSearchStore();
  const [departureFocused, setDepartureFocused] = useState(false);
  const [returnFocused, setReturnFocused] = useState(false);
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

  const depDate = store.departureDate ? new Date(store.departureDate) : null;
  const retDate = store.returnDate ? new Date(store.returnDate) : null;

  // Generate next 7 days for quick date selector
  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  return (
    <section className="relative min-h-[520px] flex items-start justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-brand-950">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-[1180px] mx-auto px-4 pt-16 pb-0">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <h1 className="font-sora font-bold text-[44px] leading-[50px] text-white mb-3">
            Fly anywhere, anytime
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            Search and book flights across Bangladesh and the world at the best prices
          </p>
        </motion.div>

        {/* Search Widget */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-surface rounded-xl shadow-e3 p-6 max-w-[1180px] mx-auto -mb-20 relative z-20"
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
                {/* From */}
                <div className="relative col-span-1">
                  <label className="text-label text-ink-400">From</label>
                  <button
                    onClick={() => { setOriginOpen(true); setDestOpen(false); }}
                    className="w-full text-left focus-ring"
                  >
                    {originAirport ? (
                      <>
                        <div className="text-h2 text-ink-700">{originAirport.city}</div>
                        <div className="text-body-sm text-ink-400">{originAirport.code} · {originAirport.name}</div>
                      </>
                    ) : (
                      <div className="text-h2 text-ink-300">Select origin</div>
                    )}
                  </button>

                  {originOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setOriginOpen(false)} />
                      <div className="absolute top-full left-0 mt-1 w-[520px] bg-surface border border-line rounded-lg shadow-e3 z-40 p-4">
                        <div className="relative mb-3">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                          <input
                            type="text"
                            placeholder="City or airport"
                            value={originQuery}
                            onChange={(e) => setOriginQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500 focus-ring"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-0.5">
                          {(originQuery ? originResults : airports.slice(0, 10)).map((a) => (
                            <button
                              key={a.code}
                              onClick={() => {
                                store.setOrigin(a.code);
                                setOriginOpen(false);
                                setOriginQuery("");
                                setTimeout(() => setDestOpen(true), 100);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-brand-50 transition-colors text-left",
                                store.origin === a.code && "bg-brand-50"
                              )}
                            >
                              <div className="w-11 h-11 rounded-md bg-surface-alt flex items-center justify-center text-overline font-semibold text-ink-700 flex-shrink-0">
                                {a.code}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-body font-semibold text-ink-700">{a.city}</div>
                                <div className="text-body-sm text-ink-400 truncate">{a.name}</div>
                              </div>
                              <span className="text-lg">{a.country === "Bangladesh" ? "🇧🇩" : "🌍"}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Swap Button */}
                <div className="hidden md:flex items-end justify-center pb-2 col-span-0">
                  <button
                    onClick={store.swapAirports}
                    className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-all focus-ring"
                    aria-label="Swap origin and destination"
                  >
                    <ArrowRightLeft size={16} />
                  </button>
                </div>

                {/* To */}
                <div className="relative col-span-1">
                  <label className="text-label text-ink-400">To</label>
                  <button
                    onClick={() => { setDestOpen(true); setOriginOpen(false); }}
                    className="w-full text-left focus-ring"
                  >
                    {destAirport ? (
                      <>
                        <div className="text-h2 text-ink-700">{destAirport.city}</div>
                        <div className="text-body-sm text-ink-400">{destAirport.code} · {destAirport.name}</div>
                      </>
                    ) : (
                      <div className="text-h2 text-ink-300">Select destination</div>
                    )}
                  </button>

                  {destOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setDestOpen(false)} />
                      <div className="absolute top-full left-0 mt-1 w-[520px] bg-surface border border-line rounded-lg shadow-e3 z-40 p-4">
                        <div className="relative mb-3">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                          <input
                            type="text"
                            placeholder="City or airport"
                            value={destQuery}
                            onChange={(e) => setDestQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500 focus-ring"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-0.5">
                          {(destQuery ? destResults : airports.slice(10, 20)).map((a) => (
                            <button
                              key={a.code}
                              onClick={() => {
                                if (a.code === store.origin) {
                                  store.setDestination("");
                                  return;
                                }
                                store.setDestination(a.code);
                                setDestOpen(false);
                                setDestQuery("");
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-brand-50 transition-colors text-left",
                                store.destination === a.code && "bg-brand-50"
                              )}
                            >
                              <div className="w-11 h-11 rounded-md bg-surface-alt flex items-center justify-center text-overline font-semibold text-ink-700 flex-shrink-0">
                                {a.code}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-body font-semibold text-ink-700">{a.city}</div>
                                <div className="text-body-sm text-ink-400 truncate">{a.name}</div>
                              </div>
                              <span className="text-lg">{a.country === "Bangladesh" ? "🇧🇩" : "🌍"}</span>
                            </button>
                          ))}
                        </div>
                        {store.origin === store.destination && store.origin && (
                          <p className="text-sm text-danger mt-2">Origin and destination must be different.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Departure Date */}
                <div className="relative col-span-1">
                  <label className="text-label text-ink-400">Departure</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                    <input
                      type="date"
                      value={store.departureDate}
                      onChange={(e) => store.setDepartureDate(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="w-full pl-9 pr-3 py-2.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500 focus-ring text-ink-700"
                    />
                  </div>
                </div>

                {/* Return Date (for Round Trip) */}
                <div className={cn("relative col-span-1", store.tripType === "O" && "opacity-50")}>
                  <label className="text-label text-ink-400">Return</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                    <input
                      type="date"
                      value={store.returnDate}
                      onChange={(e) => {
                        if (store.tripType === "O") {
                          store.setTripType("R");
                        }
                        store.setReturnDate(e.target.value);
                      }}
                      min={store.departureDate || format(new Date(), "yyyy-MM-dd")}
                      className="w-full pl-9 pr-3 py-2.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500 focus-ring text-ink-700"
                      placeholder="Select a date"
                    />
                  </div>
                  {store.tripType === "O" && (
                    <p className="text-xs text-ink-400 mt-0.5">Click to switch to Round Trip</p>
                  )}
                </div>

                {/* Traveller & Class */}
                <div className="relative col-span-1">
                  <label className="text-label text-ink-400">Traveller, Class</label>
                  <button
                    onClick={() => setTravellerOpen(!travellerOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-line text-left focus-ring hover:border-ink-300 transition-colors"
                  >
                    <div>
                      <div className="text-body font-semibold text-ink-700">
                        {store.travellers.adult + store.travellers.child + store.travellers.kid + store.travellers.infant} Traveller{s(store.travellers.adult + store.travellers.child + store.travellers.kid + store.travellers.infant)}
                      </div>
                      <div className="text-body-sm text-ink-400 capitalize">{store.cabinClass.replace("_", " ")}</div>
                    </div>
                    <ChevronDown size={16} className={cn("text-ink-400 transition-transform", travellerOpen && "rotate-180")} />
                  </button>

                  {travellerOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setTravellerOpen(false)} />
                      <div className="absolute top-full right-0 mt-1 w-72 bg-surface border border-line rounded-lg shadow-e3 z-40 p-4">
                        {/* Passenger counters */}
                        {(["adult", "child", "kid", "infant"] as const).map((type) => {
                          const labels: Record<string, { label: string; sub: string }> = {
                            adult: { label: "Adult", sub: "> 12 years" },
                            child: { label: "Child", sub: "5 - 12 years" },
                            kid: { label: "Kid", sub: "2 - 5 years" },
                            infant: { label: "Infant", sub: "< 2 years" },
                          };
                          const l = labels[type];
                          return (
                            <div key={type} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
                              <div>
                                <div className="text-body font-medium text-ink-700">{l.label}</div>
                                <div className="text-body-sm text-ink-400">{l.sub}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => store.setTravellers({ ...store.travellers, [type]: Math.max(0, store.travellers[type] - 1) })}
                                  disabled={store.travellers[type] <= 0}
                                  className="w-7 h-7 rounded-full border border-brand-800 text-brand-800 flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-50 transition-colors focus-ring"
                                  aria-label={`Remove ${l.label}`}
                                >
                                  −
                                </button>
                                <span className="w-6 text-center text-body font-semibold tabular-nums">{store.travellers[type]}</span>
                                <button
                                  onClick={() => {
                                    if (type === "infant" && store.travellers.infant >= store.travellers.adult) return;
                                    if (["adult", "child", "kid"].includes(type) && store.travellers.adult + store.travellers.child + store.travellers.kid >= 9) return;
                                    store.setTravellers({ ...store.travellers, [type]: store.travellers[type] + 1 });
                                  }}
                                  disabled={
                                    (["adult", "child", "kid"].includes(type) && store.travellers.adult + store.travellers.child + store.travellers.kid >= 9) ||
                                    (type === "infant" && store.travellers.infant >= store.travellers.adult)
                                  }
                                  className="w-7 h-7 rounded-full bg-brand-800 text-white flex items-center justify-center text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-700 transition-colors focus-ring"
                                  aria-label={`Add ${l.label}`}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Cabin Class */}
                        <div className="mt-3 pt-3 border-t border-line">
                          <label className="text-label text-ink-500 mb-2 block">Booking Class</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(["economy", "premium_economy", "business", "first"] as CabinClass[]).map((cabin) => {
                              const cabinLabels: Record<CabinClass, string> = {
                                economy: "Economy",
                                premium_economy: "Premium Economy",
                                business: "Business Class",
                                first: "First Class",
                              };
                              return (
                                <button
                                  key={cabin}
                                  onClick={() => store.setCabinClass(cabin)}
                                  className={cn(
                                    "px-3 py-2 rounded-md text-sm font-medium transition-all focus-ring",
                                    store.cabinClass === cabin
                                      ? "bg-brand-500 text-white"
                                      : "bg-surface-alt text-ink-500 hover:bg-brand-50"
                                  )}
                                >
                                  {cabinLabels[cabin]}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Validation */}
                        {store.errors.travellers && (
                          <p className="text-sm text-danger mt-2">{store.errors.travellers}</p>
                        )}

                        <button
                          onClick={() => setTravellerOpen(false)}
                          className="w-full mt-3 py-2.5 rounded-md bg-brand-800 text-white text-sm font-medium hover:bg-brand-700 transition-colors focus-ring"
                        >
                          Apply
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Fare Type */}
              <div className="flex items-center gap-4 mb-4">
                {(["REGULAR", "STUDENT"] as const).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => store.setFareType(ft)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium transition-all focus-ring",
                      store.fareType === ft
                        ? "bg-brand-500 text-white"
                        : "bg-surface-alt text-ink-500 hover:bg-brand-50"
                    )}
                  >
                    {ft === "REGULAR" ? "Regular Fare" : "Student Fare"}
                    {ft === "STUDENT" && (
                      <span className="ml-1 text-ink-300 cursor-help" title="Student fares require a valid student ID at check-in.">ⓘ</span>
                    )}
                  </button>
                ))}

                {/* Preferred Airline chip */}
                <button className="ml-auto px-3 py-1 rounded-full border border-dashed border-brand-300 text-sm text-brand-800 hover:bg-brand-50 transition-colors focus-ring">
                  + Add preferred airline
                </button>
              </div>
            </>
          ) : (
            /* Multi City mode */
            <div className="space-y-3 mb-4">
              {store.multiCitySegments.map((seg, idx) => (
                <div key={seg.id} className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-label text-ink-400">From</label>
                    <input
                      type="text"
                      placeholder="Origin"
                      value={seg.origin}
                      onChange={(e) => store.updateMultiCitySegment(seg.id, { origin: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500 focus-ring"
                    />
                  </div>
                  <div>
                    <label className="text-label text-ink-400">To</label>
                    <input
                      type="text"
                      placeholder="Destination"
                      value={seg.destination}
                      onChange={(e) => store.updateMultiCitySegment(seg.id, { destination: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500 focus-ring"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-label text-ink-400">Date</label>
                      <input
                        type="date"
                        value={seg.date}
                        onChange={(e) => store.updateMultiCitySegment(seg.id, { date: e.target.value })}
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500 focus-ring"
                      />
                    </div>
                    {idx > 0 && (
                      <button
                        onClick={() => store.removeMultiCitySegment(seg.id)}
                        className="p-2 text-ink-400 hover:text-danger transition-colors"
                        aria-label="Remove segment"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {store.multiCitySegments.length < 6 && (
                <button
                  onClick={store.addMultiCitySegment}
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors focus-ring"
                >
                  <Plus size={16} /> Add another flight
                </button>
              )}
            </div>
          )}

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="w-full h-14 rounded-lg bg-brand-500 text-white font-semibold text-base flex items-center justify-center gap-2 hover:bg-brand-600 active:bg-brand-800 transition-colors focus-ring"
          >
            <Search size={20} />
            Search
          </button>
        </motion.div>
      </div>
    </section>
  );
}

function PopularRoutesSection() {
  const popularRoutes = [
    { from: "Dhaka", fromCode: "DAC", to: "Cox's Bazar", toCode: "CXB", price: 4170 },
    { from: "Dhaka", fromCode: "DAC", to: "Chattogram", toCode: "CGP", price: 3800 },
    { from: "Dhaka", fromCode: "DAC", to: "Sylhet", toCode: "ZYL", price: 3900 },
    { from: "Dhaka", fromCode: "DAC", to: "Jashore", toCode: "JSR", price: 3700 },
    { from: "Dhaka", fromCode: "DAC", to: "Saidpur", toCode: "SPD", price: 3700 },
    { from: "Dhaka", fromCode: "DAC", to: "Rajshahi", toCode: "RJH", price: 3600 },
  ];

  return (
    <section className="bg-canvas py-24 px-4">
      <div className="max-w-[1180px] mx-auto">
        <h2 className="font-sora font-bold text-h1 text-ink-800 mb-6">
          Popular routes from Dhaka
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularRoutes.map((r) => (
            <Link
              key={r.toCode}
              href={`/flights?tripType=O&itinerary=${r.fromCode}-${r.toCode}-${format(addDays(new Date(), 14), "yyyy-MM-dd")}&cabinClass=economy&adult=1&child=0&kid=0&infant=0&fareType=REGULAR`}
              className="block p-4 rounded-lg bg-surface border border-line hover:border-brand-300 hover:shadow-e2 transition-all focus-ring"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-overline text-ink-500">{r.fromCode}</span>
                <Plane size={14} className="text-brand-500" />
                <span className="text-overline text-ink-500">{r.toCode}</span>
              </div>
              <div className="text-body font-medium text-ink-700 mb-1">{r.from} → {r.to}</div>
              <div className="text-sm text-ink-400">from <span className="text-fare text-brand-500 tabular-nums font-bold">৳{r.price.toLocaleString()}</span></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function s(n: number) {
  return n !== 1 ? "s" : "";
}
