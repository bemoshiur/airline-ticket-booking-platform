"use client";

import { useState, useRef, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { motion, AnimatePresence } from "framer-motion";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPopularAirports, searchAirports, type Airport } from "@/lib/mock/airports";
import { dropdownVariants } from "@/lib/motion";

interface AirportSelectProps {
  label: string;
  value: string;
  onSelect: (code: string) => void;
  placeholder: string;
  variant: "depart" | "arrive";
  excludeCode?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colSpanClassName?: string;
}

export function AirportSelect({
  label,
  value,
  onSelect,
  placeholder,
  variant,
  excludeCode,
  open,
  onOpenChange,
  colSpanClassName,
}: AirportSelectProps) {
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = query ? searchAirports(query) : getPopularAirports(excludeCode);
  const filtered = results.filter((a) => a.code !== excludeCode);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filtered.length, query]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightedIndex]) {
          onSelect(filtered[highlightedIndex].code);
          setQuery("");
          onOpenChange(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        onOpenChange(false);
        break;
    }
  };

  const handleSelect = (code: string) => {
    onSelect(code);
    setQuery("");
    onOpenChange(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor asChild>
        <div className={cn("relative", colSpanClassName)}>
          <label className="text-xs font-bold text-ink-500 uppercase tracking-wider block mb-2">
            {label}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => onOpenChange(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl border-2 border-ink-200 text-sm font-medium text-ink-700 focus:outline-none focus:border-brand-500 focus:bg-blue-50 transition-all pl-12"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-activedescendant={filtered[highlightedIndex] ? `airport-${filtered[highlightedIndex].code}` : ""}
          />
          <Plane
            size={20}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 text-brand-500",
              variant === "depart" ? "-rotate-45" : "rotate-45"
            )}
          />
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[320px] max-w-[92vw] max-h-[70vh] overflow-y-auto rounded-xl bg-white border-2 border-brand-200 shadow-xl p-0"
          sideOffset={12}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                role="listbox"
              >
                {/* Popular label (when no query) */}
                {!query && (
                  <div className="px-4 py-2 text-xs font-semibold text-ink-400 uppercase tracking-wider bg-surface-alt sticky top-0 z-10">
                    Popular Airports
                  </div>
                )}

                {/* List */}
                <div ref={listRef}>
                  {filtered.length > 0 ? (
                    filtered.map((airport, idx) => (
                      <motion.button
                        key={airport.code}
                        data-index={idx}
                        id={`airport-${airport.code}`}
                        role="option"
                        aria-selected={idx === highlightedIndex}
                        whileHover={{ backgroundColor: "rgb(240, 249, 255)" }}
                        onClick={() => handleSelect(airport.code)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-line transition-colors",
                          idx === highlightedIndex ? "bg-brand-50" : "hover:bg-blue-50"
                        )}
                      >
                        <Plane size={16} className="text-brand-500 -rotate-45 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold text-ink-800 truncate">
                              {airport.city}{" "}
                              <span className="text-ink-400 font-normal">- {airport.country}</span>
                            </span>
                            <span className="text-xs font-bold text-brand-600 tabular-nums flex-shrink-0">
                              {airport.code}
                            </span>
                          </div>
                          <div className="text-xs text-ink-400 truncate mt-0.5">{airport.name}</div>
                        </div>
                      </motion.button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-ink-400">No airports found</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
