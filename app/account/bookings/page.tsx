"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookingsStore } from "@/lib/store/bookings";
import { type BookingStatus } from "@/lib/mock/bookings";
import { getAirport } from "@/lib/mock/airports";
import { formatCurrencyShort } from "@/lib/utils/currency";
import { format } from "date-fns";
import { BookingCard } from "@/components/booking/booking-card";

export default function BookingsPage() {
  const bookingsStore = useBookingsStore();
  const [tab, setTab] = useState<"current" | "previous">("current");
  const [filters, setFilters] = useState({
    reference: "", pnr: "", name: "", transactionId: "", status: "", flightDate: "",
  });

  const filtered = bookingsStore.bookings.filter((b) => {
    const currentStatuses: BookingStatus[] = ["Confirmed", "Ticketed", "Pending Payment", "On Hold"];
    const previousStatuses: BookingStatus[] = ["Cancellation Requested", "Cancelled", "Refund In Progress", "Refunded", "Expired"];

    if (tab === "current" && !currentStatuses.includes(b.status)) return false;
    if (tab === "previous" && !previousStatuses.includes(b.status)) return false;

    if (filters.reference && !b.reference.toLowerCase().includes(filters.reference.toLowerCase())) return false;
    if (filters.pnr && !b.pnr.toLowerCase().includes(filters.pnr.toLowerCase())) return false;
    if (filters.name) {
      const names = b.travellers.map((t) => `${t.firstName} ${t.surname}`.toLowerCase());
      if (!names.some((n) => n.includes(filters.name.toLowerCase()))) return false;
    }
    if (filters.transactionId && !b.transactionId.toLowerCase().includes(filters.transactionId.toLowerCase())) return false;
    if (filters.status && b.status !== filters.status) return false;
    if (filters.flightDate && b.departureDate !== filters.flightDate) return false;

    return true;
  });

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

  const statusOptions: BookingStatus[] = [
    "Confirmed", "Ticketed", "Pending Payment", "On Hold",
    "Cancellation Requested", "Cancelled", "Refund In Progress", "Refunded", "Expired",
  ];

  return (
    <div className="bg-surface border border-line rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-sora font-bold text-h1 text-ink-800">My Bookings</h1>
        <span className="text-sm text-ink-400">{filtered.length} Booking{filtered.length !== 1 ? "s" : ""} Found</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-line pb-3">
        {(["current", "previous"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
              tab === t ? "bg-brand-500 text-white" : "text-ink-500 hover:bg-surface-alt"
            )}
          >
            {t} Bookings ({bookingsStore.bookings.filter((b) => {
              if (t === "current") return ["Confirmed", "Ticketed", "Pending Payment", "On Hold"].includes(b.status);
              return ["Cancellation Requested", "Cancelled", "Refund In Progress", "Refunded", "Expired"].includes(b.status);
            }).length})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 p-4 bg-surface-alt rounded-lg">
        {(["reference", "pnr", "name", "transactionId", "status", "flightDate"] as const).map((key) => (
          <div key={key}>
            <label className="text-label text-ink-400 mb-1 block capitalize">
              {key === "reference" ? "Reference Id" : key === "pnr" ? "PNR" : key === "name" ? "Traveller Name" : key === "transactionId" ? "Transaction Id" : key === "status" ? "Booking Status" : "Flight Date"}
            </label>
            {key === "status" ? (
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-2 py-1.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="">All</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <input
                type={key === "flightDate" ? "date" : "text"}
                value={filters[key]}
                onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                placeholder={key === "name" ? "Traveller name" : key === "reference" ? "AKJ-..." : key === "pnr" ? "PNR" : key === "transactionId" ? "TXN..." : ""}
                className="w-full px-2 py-1.5 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
              />
            )}
          </div>
        ))}
        <div className="flex items-end gap-2">
          <button className="px-3 py-1.5 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
            <Search size={14} className="inline mr-1" /> Apply Filter
          </button>
          <button
            onClick={() => setFilters({ reference: "", pnr: "", name: "", transactionId: "", status: "", flightDate: "" })}
            className="px-3 py-1.5 rounded-md border border-line text-sm text-ink-500 hover:bg-surface-alt transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-semibold text-ink-700 mb-1">No bookings found</h3>
          <p className="text-sm text-ink-400 mb-4">Search a flight to see your trips here.</p>
          <Link href="/" className="inline-flex px-5 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
            Search flights
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <BookingCard key={booking.reference} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
