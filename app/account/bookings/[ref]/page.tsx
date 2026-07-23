"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, Calendar, Luggage, XCircle, RefreshCw, HelpCircle, ChevronRight, Clock, User, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { bookings } from "@/lib/mock/bookings";
import { getAirport } from "@/lib/mock/airports";
import { formatCurrencyShort } from "@/lib/utils/currency";
import { PerforatedDivider } from "@/components/ui/perforated-divider";
import { AirlineLogo } from "@/components/ui/airline-logo";

export default function BookingDetailPage() {
  const params = useParams();
  const booking = bookings.find((b) => b.reference === params.ref);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelled, setCancelled] = useState(false);

  if (!booking) {
    return (
      <div className="text-center py-16">
        <h2 className="font-semibold text-ink-700 mb-2">Booking not found</h2>
        <Link href="/account/bookings" className="text-brand-600 hover:text-brand-800 text-sm">← Back to bookings</Link>
      </div>
    );
  }

  const originAirport = getAirport(booking.origin);
  const destAirport = getAirport(booking.destination);

  const handleCancel = () => {
    setCancelled(true);
    setShowCancel(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-line rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-sora font-bold text-h1 text-ink-800">{booking.reference}</h1>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                booking.status === "Ticketed" ? "text-success bg-success-bg" :
                booking.status === "Cancelled" ? "text-danger bg-danger-bg" :
                booking.status === "Pending Payment" ? "text-urgent bg-urgent-bg" :
                "text-info bg-info-bg"
              )}>
                {booking.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-ink-400">
              <span>PNR: <span className="text-mono tracking-wider">{booking.pnr}</span></span>
              <span>·</span>
              <span>Issued: {booking.issuedAt ? new Date(booking.issuedAt).toLocaleDateString() : "Pending"}</span>
            </div>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-md border border-line text-sm text-ink-600 hover:bg-surface-alt transition-colors">
            <Download size={14} /> Download e-ticket
          </button>
        </div>

        {/* Perforated divider motif */}
        <div className="relative my-4">
          <PerforatedDivider height={1} className="w-full h-px" />
        </div>

        {/* Route card */}
        <div className="flex items-center gap-4 py-3">
          {booking.segments.slice(0, 1).map((seg, idx) => (
            <div key={idx} className="flex items-center gap-4 w-full">
              <AirlineLogo code={seg.airline} size="sm" />
              <div className="text-center">
                <div className="text-xl font-bold text-ink-700 tabular-nums">{seg.departureTime}</div>
                <div className="text-overline text-ink-500">{seg.origin}</div>
                <div className="text-xs text-ink-400">{originAirport?.city}</div>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="text-xs text-ink-400 tabular-nums">{seg.duration}m</div>
                <div className="w-full flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <div className="flex-1 border-t border-dashed border-ink-300" />
                  <PlaneIcon size={12} className="text-brand-500" />
                  <div className="flex-1 border-t border-dashed border-ink-300" />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                </div>
                <div className="text-xs text-ink-400">{seg.flightNumber} · Non-stop</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-ink-700 tabular-nums">{seg.arrivalTime}</div>
                <div className="text-overline text-ink-500">{seg.destination}</div>
                <div className="text-xs text-ink-400">{destAirport?.city}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-line">
          <button onClick={() => setShowCancel(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-danger/30 text-sm text-danger hover:bg-danger-bg transition-colors">
            <XCircle size={14} /> Cancel booking
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-sm text-ink-600 hover:bg-surface-alt transition-colors">
            <Calendar size={14} /> Change date
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-sm text-ink-600 hover:bg-surface-alt transition-colors">
            <Luggage size={14} /> Add baggage
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-sm text-ink-600 hover:bg-surface-alt transition-colors">
            <RefreshCw size={14} /> Request refund
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-line text-sm text-ink-600 hover:bg-surface-alt transition-colors">
            <HelpCircle size={14} /> Raise support ticket
          </button>
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCancel(false)} />
          <div className="relative bg-surface rounded-xl p-6 max-w-md w-full mx-4 shadow-e3">
            <h3 className="font-semibold text-ink-700 mb-4">Cancel Booking</h3>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between py-1"><span className="text-ink-400">Fare paid</span><span className="tabular-nums">{formatCurrencyShort(booking.totalFare)}</span></div>
              <div className="flex justify-between py-1"><span className="text-ink-400">Airline cancellation fee</span><span className="tabular-nums text-danger">−BDT 1,200</span></div>
              <div className="flex justify-between py-1"><span className="text-ink-400">Service charge</span><span className="tabular-nums text-danger">−BDT 500</span></div>
              <div className="border-t border-line pt-2 flex justify-between font-semibold"><span className="text-ink-700">Refund amount</span><span className="text-success tabular-nums">{formatCurrencyShort(booking.totalFare - 1700)}</span></div>
            </div>

            <div className="mb-4">
              <label className="text-label text-ink-500 mb-1 block">Reason for cancellation*</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="">Select a reason</option>
                <option value="Change of plans">Change of plans</option>
                <option value="Found better fare">Found better fare</option>
                <option value="Medical emergency">Medical emergency</option>
                <option value="Flight schedule changed">Flight schedule changed</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCancel(false)} className="px-4 py-2 rounded-md border border-line text-sm text-ink-600 hover:bg-surface-alt transition-colors">
                Keep booking
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium text-white transition-colors",
                  cancelReason ? "bg-danger hover:bg-danger/90" : "bg-ink-300 cursor-not-allowed"
                )}
              >
                Request cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelled && (
        <div className="p-4 rounded-lg bg-success-bg text-success text-sm">
          Cancellation requested. Your refund of {formatCurrencyShort(booking.totalFare - 1700)} will be processed within 5-7 business days.
        </div>
      )}

      {/* Traveller Table */}
      <div className="bg-surface border border-line rounded-lg p-6">
        <h2 className="font-semibold text-ink-700 mb-4">Travellers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2 text-ink-400 font-medium">Name</th>
                <th className="text-left py-2 text-ink-400 font-medium">Type</th>
                <th className="text-left py-2 text-ink-400 font-medium">DOB</th>
                <th className="text-left py-2 text-ink-400 font-medium">Nationality</th>
                <th className="text-left py-2 text-ink-400 font-medium">Passport</th>
                <th className="text-left py-2 text-ink-400 font-medium">Seat</th>
                <th className="text-left py-2 text-ink-400 font-medium">Baggage</th>
              </tr>
            </thead>
            <tbody>
              {booking.travellers.map((t, idx) => (
                <tr key={idx} className="border-b border-line last:border-0">
                  <td className="py-2 text-ink-700">{t.title} {t.firstName} {t.surname}</td>
                  <td className="py-2 text-ink-700 capitalize">{t.type}</td>
                  <td className="py-2 text-ink-700">{t.dob}</td>
                  <td className="py-2 text-ink-700">{t.nationality}</td>
                  <td className="py-2 text-ink-700">{t.passportNumber || "—"}</td>
                  <td className="py-2 text-ink-700">{t.seat || "—"}</td>
                  <td className="py-2 text-ink-700">{t.baggage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Record */}
      <div className="bg-surface border border-line rounded-lg p-6">
        <h2 className="font-semibold text-ink-700 mb-4">Payment Record</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-ink-400">Transaction ID</div>
            <div className="text-ink-700 font-medium">{booking.transactionId}</div>
          </div>
          <div>
            <div className="text-ink-400">Method</div>
            <div className="text-ink-700 font-medium">{booking.paymentMethod}</div>
          </div>
          <div>
            <div className="text-ink-400">Amount</div>
            <div className="text-ink-700 font-medium tabular-nums">{formatCurrencyShort(booking.totalFare)}</div>
          </div>
          <div>
            <div className="text-ink-400">Paid at</div>
            <div className="text-ink-700 font-medium">{booking.paidAt ? new Date(booking.paidAt).toLocaleString() : "—"}</div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-surface border border-line rounded-lg p-6">
        <h2 className="font-semibold text-ink-700 mb-4">Activity Timeline</h2>
        <div className="space-y-0">
          {booking.activities.map((activity, idx) => (
            <div key={idx} className="flex gap-3 pb-4 relative">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-1.5" />
                {idx < booking.activities.length - 1 && <div className="w-px flex-1 bg-line" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink-700">{activity.action}</div>
                {activity.detail && <div className="text-xs text-ink-400">{activity.detail}</div>}
                <div className="text-xs text-ink-400 mt-0.5">
                  {new Date(activity.timestamp).toLocaleString()} · {activity.actor}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaneIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
