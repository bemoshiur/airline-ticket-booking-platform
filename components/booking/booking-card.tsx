import Link from "next/link";
import { Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Booking, type BookingStatus } from "@/lib/mock/bookings";
import { getAirport } from "@/lib/mock/airports";
import { formatCurrencyShort } from "@/lib/utils/currency";

export function BookingCard({ booking }: { booking: Booking }) {
  const originAirport = getAirport(booking.origin);
  const destAirport = getAirport(booking.destination);

  const statusColors: Record<BookingStatus, string> = {
    "Confirmed": "text-info bg-info-bg",
    "Ticketed": "text-success bg-success-bg",
    "Pending Payment": "text-urgent bg-urgent-bg",
    "On Hold": "text-ink-500 bg-surface-alt",
    "Cancellation Requested": "text-urgent bg-urgent-bg",
    "Cancelled": "text-danger bg-danger-bg",
    "Refund In Progress": "text-info bg-info-bg",
    "Refunded": "text-success bg-success-bg",
    "Expired": "text-ink-400 bg-surface-alt",
  };

  return (
    <Link
      href={`/account/bookings/${booking.reference}`}
      className="block p-4 rounded-lg border border-line hover:border-brand-300 hover:shadow-e2 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            statusColors[booking.status]
          )}>
            {booking.status}
          </span>
          <span className="text-mono text-xs text-ink-400 tracking-wider">{booking.pnr}</span>
        </div>
        <div className="text-fare text-brand-500 font-bold tabular-nums">
          {formatCurrencyShort(booking.totalFare)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-ink-700">{originAirport?.city || booking.origin}</span>
        <Plane size={14} className="text-brand-500" />
        <span className="font-semibold text-ink-700">{destAirport?.city || booking.destination}</span>
        <span className="text-body-sm text-ink-400 ml-2">{booking.departureDate}</span>
        <span className="text-body-sm text-ink-400">{booking.travellers.length} Traveller{booking.travellers.length > 1 ? "s" : ""}</span>
      </div>
      <div className="flex items-center gap-2 mt-1 text-xs text-ink-400">
        <span>{booking.reference}</span>
        <span>·</span>
        <span>{booking.segments.length === 1 ? "One way" : "Round trip"}</span>
        <span className="ml-auto">View details →</span>
      </div>
    </Link>
  );
}
