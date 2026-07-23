"use client";

import { createContext, useContext, useMemo } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { format, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { buildFareMap } from "@/lib/utils/fare-calendar-data";
import { FareDayButton } from "./fare-day-button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FareCalendarContextType {
  fareMap?: Map<string, number>;
}

const FareCalendarContext = createContext<FareCalendarContextType>({});

export function useFareCalendarContext() {
  return useContext(FareCalendarContext);
}

interface FareCalendarProps {
  mode: "single" | "range";
  selectedDate?: Date;
  selectedRange?: DateRange;
  onSelectDate?: (date: Date) => void;
  onSelectRange?: (range: DateRange) => void;
  origin: string;
  destination: string;
  month: Date;
  onMonthChange: (date: Date) => void;
  minDate?: Date;
}

export function FareCalendar({
  mode,
  selectedDate,
  selectedRange,
  onSelectDate,
  onSelectRange,
  origin,
  destination,
  month,
  onMonthChange,
  minDate,
}: FareCalendarProps) {
  const fareMap = useMemo(() => {
    if (!origin || !destination) return new Map();
    return buildFareMap(origin, destination, month);
  }, [origin, destination, format(month, "yyyy-MM")]);

  const minDateToUse = minDate || startOfToday();

  const dayPickerProps = {
    month,
    onMonthChange,
    numberOfMonths: 2,
    showOutsideDays: false,
    disabled: { before: minDateToUse },
    components: {
      DayButton: FareDayButton as any,
      Chevron: ({ ...props }: any) => (
        <span className="inline-flex">
          {props.orientation === "left" ? (
            <ChevronLeft size={20} className="text-ink-500" />
          ) : (
            <ChevronRight size={20} className="text-ink-500" />
          )}
        </span>
      ),
    },
    classNames: {
      months: "flex gap-6 justify-center",
      month: "w-full",
      month_grid: "w-full",
      caption: "flex justify-between items-center mb-4 px-2",
      caption_label: "text-base font-semibold text-ink-900",
      nav_button_previous: "p-1.5 rounded-md hover:bg-surface-alt transition-colors",
      nav_button_next: "p-1.5 rounded-md hover:bg-surface-alt transition-colors",
      head_row: "flex gap-1 mb-2",
      head_cell: "w-full text-center text-xs font-semibold text-ink-500 uppercase py-2",
      row: "flex gap-1",
      cell: "w-full",
    } as any,
    onSelect: (value: any) => {
      if (mode === "single" && onSelectDate && value instanceof Date) {
        onSelectDate(value);
      } else if (mode === "range" && onSelectRange && value && typeof value === "object" && "from" in value) {
        onSelectRange(value as DateRange);
      }
    },
  };

  return (
    <FareCalendarContext.Provider value={{ fareMap }}>
      <div className="p-4 space-y-4">
        {mode === "single" && (
          <DayPicker
            mode="single"
            selected={selectedDate}
            {...dayPickerProps}
          />
        )}
        {mode === "range" && (
          <DayPicker
            mode="range"
            selected={selectedRange}
            required
            {...dayPickerProps}
          />
        )}
      </div>
    </FareCalendarContext.Provider>
  );
}
