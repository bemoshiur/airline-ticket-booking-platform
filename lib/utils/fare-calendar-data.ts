import { startOfMonth, endOfMonth, addMonths, differenceInCalendarDays } from "date-fns";
import { format } from "date-fns";
import { generateFareCalendar } from "@/lib/mock/generator";

export function buildFareMap(
  origin: string,
  destination: string,
  visibleMonth: Date
): Map<string, number> {
  const start = startOfMonth(visibleMonth);
  const end = endOfMonth(addMonths(visibleMonth, 1));
  const days = differenceInCalendarDays(end, start) + 1;

  const rows = generateFareCalendar(
    origin,
    destination,
    format(start, "yyyy-MM-dd"),
    days
  );

  return new Map(rows.map((r) => [r.date, r.minFare]));
}
