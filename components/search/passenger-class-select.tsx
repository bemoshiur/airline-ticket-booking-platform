"use client";

import { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Users } from "lucide-react";
import { User, Baby } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore, type CabinClass } from "@/lib/store/search";
import { dropdownVariants } from "@/lib/motion";

const PASSENGER_TYPES = [
  { key: "adult", label: "Adult", ageRange: "> 12 years", icon: User },
  { key: "child", label: "Child", ageRange: "5 - 12 years", icon: User },
  { key: "kid", label: "Kid", ageRange: "2 - 5 years", icon: User },
  { key: "infant", label: "Infant", ageRange: "< 2 years", icon: Baby },
] as const;

const CABIN_CLASSES = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium Economy" },
  { value: "business", label: "Business Class" },
  { value: "first", label: "First Class" },
] as const;

interface PassengerClassSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PassengerClassSelect({ open, onOpenChange }: PassengerClassSelectProps) {
  const store = useSearchStore();
  const [pendingTravellers, setPendingTravellers] = useState(store.travellers);
  const [pendingCabinClass, setPendingCabinClass] = useState<CabinClass>(store.cabinClass);

  // Resync from store when opening
  useEffect(() => {
    if (open) {
      setPendingTravellers(store.travellers);
      setPendingCabinClass(store.cabinClass);
    }
  }, [open, store.travellers, store.cabinClass]);

  const handleAddPassenger = (type: keyof typeof store.travellers) => {
    setPendingTravellers((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
  };

  const handleRemovePassenger = (type: keyof typeof store.travellers) => {
    const newCount = Math.max(0, pendingTravellers[type] - 1);

    // Enforce constraint: can't remove adult if infant would exceed them
    if (type === "adult" && newCount < pendingTravellers.infant) {
      return;
    }

    setPendingTravellers((prev) => ({
      ...prev,
      [type]: newCount,
    }));
  };

  const canRemoveAdult = pendingTravellers.adult > 1 && pendingTravellers.adult - 1 >= pendingTravellers.infant;
  const totalPassengers = pendingTravellers.adult + pendingTravellers.child + pendingTravellers.kid;

  const handleApply = () => {
    store.setTravellers(pendingTravellers);
    store.setCabinClass(pendingCabinClass);
    onOpenChange(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="md:col-span-2 px-4 py-3 rounded-xl border-2 border-ink-200 text-sm font-medium text-ink-700 hover:border-brand-300 focus:outline-none focus:border-brand-500 focus:bg-blue-50 transition-all text-left w-full"
        >
          <div className="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-0.5">Passenger & Class</div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-brand-500" />
            {totalPassengers} Passenger{totalPassengers !== 1 ? "s" : ""} · {pendingCabinClass === "premium_economy" ? "Premium" : pendingCabinClass.charAt(0).toUpperCase() + pendingCabinClass.slice(1)}
          </div>
        </motion.button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-[380px] max-w-[92vw] max-h-[80vh] overflow-y-auto rounded-xl bg-white border-2 border-brand-200 shadow-xl p-4"
          sideOffset={12}
        >
          <AnimatePresence>
            {open && (
              <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
                {/* Header */}
                <div>
                  <h3 className="text-h3 text-ink-800 mb-1">Passenger & Class</h3>
                  <p className="text-sm text-ink-500">
                    {totalPassengers} Passenger{totalPassengers !== 1 ? "s" : ""} · {pendingCabinClass === "premium_economy" ? "Premium Economy" : pendingCabinClass.charAt(0).toUpperCase() + pendingCabinClass.slice(1)}
                  </p>
                </div>

                {/* Passenger Types */}
                <div className="space-y-3 pb-4 border-b border-line">
                  {PASSENGER_TYPES.map(({ key, label, ageRange, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
                          <Icon size={18} className="text-brand-500" />
                        </div>
                        <div>
                          <div className="font-medium text-ink-800">{label}</div>
                          <div className="text-xs text-ink-400">{ageRange}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemovePassenger(key)}
                          disabled={key === "adult" ? !canRemoveAdult : pendingTravellers[key] === 0}
                          className={cn(
                            "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors",
                            key === "adult" && !canRemoveAdult
                              ? "border-ink-200 text-ink-300 cursor-not-allowed"
                              : "border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white"
                          )}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center text-time font-semibold text-ink-900">
                          {pendingTravellers[key]}
                        </span>
                        <button
                          onClick={() => handleAddPassenger(key)}
                          className="w-9 h-9 rounded-full border-2 border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Booking Class */}
                <div>
                  <label className="text-label text-ink-500 block mb-3">Booking Class</label>
                  <div className="space-y-2">
                    {CABIN_CLASSES.map(({ value, label }) => (
                      <label
                        key={value}
                        className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: pendingCabinClass === value ? "#D82128" : "#E5E7EB",
                          backgroundColor: pendingCabinClass === value ? "#FDF6F6" : "transparent",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: "#D82128" }}>
                            {pendingCabinClass === value && (
                              <div className="w-2 h-2 rounded-full bg-brand-500 mx-auto mt-0.5" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-ink-800">{label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApply}
                  className="w-full py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
                >
                  Apply
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
