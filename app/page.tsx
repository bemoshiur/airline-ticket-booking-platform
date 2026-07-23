"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Plane, ArrowRightLeft, Users, Calendar, ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchWidget } from "@/components/search/search-widget";
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
        <SearchWidget />
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


