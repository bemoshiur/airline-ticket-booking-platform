"use client";

import { useState, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { motion, AnimatePresence } from "framer-motion";
import { format, parse, startOfToday, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useSearchStore, type TripType } from "@/lib/store/search";
import { FareCalendar } from "./fare-calendar";
import type { DateRange } from "react-day-picker";

export function DateRangeField() {
  const store = useSearchStore();
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfToday());
  const [pendingDate, setPendingDate] = useState<Date | undefined>();
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>();

  // Parse stored dates into Date objects when opening
  useEffect(() => {
    if (open) {
      const depDate = store.departureDate ? parse(store.departureDate, "yyyy-MM-dd", new Date()) : undefined;
      const retDate = store.returnDate ? parse(store.returnDate, "yyyy-MM-dd", new Date()) : undefined;

      if (store.tripType === "R" && depDate && retDate) {
        setPendingRange({ from: depDate, to: retDate });
        setVisibleMonth(depDate);
      } else if (depDate) {
        setPendingDate(depDate);
        setVisibleMonth(depDate);
      } else {
        setVisibleMonth(startOfToday());
      }
    }
  }, [open, store.departureDate, store.returnDate, store.tripType]);

  const handleSelectDate = (date: Date) => {
    setPendingDate(date);
    const isoDate = format(date, "yyyy-MM-dd");
    store.setDepartureDate(isoDate);
    setTimeout(() => setOpen(false), 150);
  };

  const handleSelectRange = (range: DateRange) => {
    setPendingRange(range);
    if (range.from && range.to) {
      store.setDepartureDate(format(range.from, "yyyy-MM-dd"));
      store.setReturnDate(format(range.to, "yyyy-MM-dd"));
      setTimeout(() => setOpen(false), 150);
    }
  };

  const handleClear = () => {
    setPendingDate(undefined);
    setPendingRange(undefined);
    store.setDepartureDate("");
    if (store.tripType === "R") {
      store.setReturnDate("");
    }
  };

  const handleDone = () => {
    if (store.tripType === "R" && pendingRange?.from && pendingRange?.to) {
      store.setDepartureDate(format(pendingRange.from, "yyyy-MM-dd"));
      store.setReturnDate(format(pendingRange.to, "yyyy-MM-dd"));
    } else if (store.tripType !== "R" && pendingDate) {
      store.setDepartureDate(format(pendingDate, "yyyy-MM-dd"));
    }
    setTimeout(() => setOpen(false), 150);
  };

  const isRangeComplete = store.tripType === "R" ? pendingRange?.from && pendingRange?.to : pendingDate !== undefined;
  const depDate = store.departureDate ? parse(store.departureDate, "yyyy-MM-dd", new Date()) : null;
  const retDate = store.returnDate ? parse(store.returnDate, "yyyy-MM-dd", new Date()) : null;

  if (store.tripType === "R") {
    // Round trip: two adjacent date fields
    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <div className="flex items-center md:col-span-4 gap-0">
          <Popover.Trigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="flex-1 px-4 py-3 rounded-l-xl border-2 border-ink-200 text-sm font-medium text-ink-700 hover:border-brand-300 focus:outline-none focus:border-brand-500 focus:bg-blue-50 transition-all text-left"
            >
              <div className="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-0.5">Departure</div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-brand-500 flex-shrink-0" />
                {depDate ? format(depDate, "d MMM, EEE") : "Select date"}
              </div>
            </motion.button>
          </Popover.Trigger>

          <Popover.Trigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="flex-1 px-4 py-3 rounded-r-xl border-2 border-l-0 border-ink-200 text-sm font-medium text-ink-700 hover:border-brand-300 focus:outline-none focus:border-brand-500 focus:bg-blue-50 transition-all text-left"
            >
              <div className="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-0.5">Return</div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-brand-500 flex-shrink-0" />
                {retDate ? format(retDate, "d MMM, EEE") : "Select date"}
              </div>
            </motion.button>
          </Popover.Trigger>
        </div>

        <Popover.Portal>
          <Popover.Content
            className="z-50 rounded-xl bg-white border-2 border-brand-200 shadow-xl overflow-hidden"
            sideOffset={12}
          >
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <FareCalendar
                    mode="range"
                    selectedRange={pendingRange}
                    onSelectRange={handleSelectRange}
                    origin={store.origin}
                    destination={store.destination}
                    month={visibleMonth}
                    onMonthChange={setVisibleMonth}
                    minDate={startOfToday()}
                  />

                  <div className="border-t border-line px-4 py-3 flex items-center justify-between gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClear}
                      className="px-3 py-1.5 rounded-md text-sm font-medium text-ink-600 hover:bg-surface-alt transition-colors"
                    >
                      Clear
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDone}
                      disabled={!isRangeComplete}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                        isRangeComplete
                          ? "bg-brand-500 text-white hover:bg-brand-600"
                          : "bg-surface-alt text-ink-300 cursor-not-allowed"
                      )}
                    >
                      Done
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  // One way: single date field
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="md:col-span-2 px-4 py-3 rounded-xl border-2 border-ink-200 text-sm font-medium text-ink-700 hover:border-brand-300 focus:outline-none focus:border-brand-500 focus:bg-blue-50 transition-all text-left w-full"
        >
          <div className="text-xs text-ink-500 font-semibold uppercase tracking-wider mb-0.5">Departure</div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-brand-500 flex-shrink-0" />
            {depDate ? format(depDate, "d MMM, EEE") : "Select date"}
          </div>
        </motion.button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 rounded-xl bg-white border-2 border-brand-200 shadow-xl overflow-hidden"
          sideOffset={12}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <FareCalendar
                  mode="single"
                  selectedDate={pendingDate}
                  onSelectDate={handleSelectDate}
                  origin={store.origin}
                  destination={store.destination}
                  month={visibleMonth}
                  onMonthChange={setVisibleMonth}
                  minDate={startOfToday()}
                />

                <div className="border-t border-line px-4 py-3 flex items-center justify-between gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClear}
                    className="px-3 py-1.5 rounded-md text-sm font-medium text-ink-600 hover:bg-surface-alt transition-colors"
                  >
                    Clear
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDone}
                    disabled={!pendingDate}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                      pendingDate
                        ? "bg-brand-500 text-white hover:bg-brand-600"
                        : "bg-surface-alt text-ink-300 cursor-not-allowed"
                    )}
                  >
                    Done
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
