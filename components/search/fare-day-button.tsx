"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatFareCompact } from "@/lib/utils/currency";
import { useFareCalendarContext } from "./fare-calendar";
import type { DayButtonProps } from "react-day-picker";

export function FareDayButton(props: DayButtonProps) {
  const { day, modifiers, className, ...buttonProps } = props;
  const { fareMap } = useFareCalendarContext();

  const fare = fareMap?.get(format(day.date, "yyyy-MM-dd"));
  const isDisabled = modifiers.disabled;
  const isSelected = modifiers.selected;
  const isRangeStart = modifiers.range_start;
  const isRangeEnd = modifiers.range_end;
  const isRangeMiddle = modifiers.range_middle;
  const isOutside = modifiers.outside;

  return (
    <button
      {...buttonProps}
      className={cn(
        "relative h-20 px-1.5 py-1.5 rounded-md text-center transition-all focus:outline-none focus-ring",
        // Disabled past dates
        isDisabled && "text-ink-300 cursor-not-allowed",
        // Outside month (lighter)
        isOutside && !isDisabled && "text-ink-300",
        // Range start/end (selected endpoints)
        (isRangeStart || isRangeEnd) && !isDisabled && "bg-brand-500 text-white font-semibold",
        // Range middle (in between selected dates)
        isRangeMiddle && !isDisabled && "bg-brand-100 text-ink-900",
        // Single selection (one-way mode)
        isSelected && !isRangeStart && !isRangeEnd && !isRangeMiddle && !isDisabled && "bg-brand-500 text-white font-semibold",
        // Hover (if not disabled)
        !isDisabled && !isSelected && !isRangeStart && !isRangeEnd && "hover:bg-surface-alt",
        // Today highlight (subtle border if not already styled)
        modifiers.today && !isSelected && !isRangeStart && !isRangeEnd && "border border-brand-300"
      )}
    >
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-[13px] font-semibold leading-tight">
          {day.date.getDate()}
        </div>
        {!isDisabled && !isOutside && fare !== undefined && (
          <div className="text-[11px] font-mono text-opacity-80 mt-0.5 leading-tight">
            {formatFareCompact(fare)}
          </div>
        )}
      </div>
    </button>
  );
}
