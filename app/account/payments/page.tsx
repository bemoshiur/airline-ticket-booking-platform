"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { bookings } from "@/lib/mock/bookings";
import { formatCurrencyShort } from "@/lib/utils/currency";

export default function PaymentsPage() {
  const [tab, setTab] = useState<"online" | "manual">("online");

  const payments = bookings
    .filter((b) => b.transactionId && b.paidAt)
    .map((b) => ({
      id: b.transactionId,
      ref: b.reference,
      method: b.paymentMethod,
      amount: b.totalFare,
      status: b.paidAt ? "Completed" : "Pending",
      date: b.paidAt ? new Date(b.paidAt).toLocaleDateString() : "—",
    }));

  return (
    <div className="bg-surface border border-line rounded-lg p-6">
      <h1 className="font-sora font-bold text-h1 text-ink-800 mb-6">Payments</h1>

      <div className="flex gap-2 mb-6">
        {(["online", "manual"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
              tab === t ? "bg-brand-500 text-white" : "bg-surface-alt text-ink-500 hover:bg-brand-50"
            )}
          >
            {t} Payments ({payments.length})
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left py-2 text-ink-400 font-medium">Transaction ID</th>
              <th className="text-left py-2 text-ink-400 font-medium">Booking Ref</th>
              <th className="text-left py-2 text-ink-400 font-medium">Method</th>
              <th className="text-right py-2 text-ink-400 font-medium">Amount</th>
              <th className="text-left py-2 text-ink-400 font-medium">Status</th>
              <th className="text-left py-2 text-ink-400 font-medium">Date</th>
              <th className="text-left py-2 text-ink-400 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="py-3 text-mono text-xs text-ink-700 tracking-wider">{p.id}</td>
                <td className="py-3 text-mono text-xs text-ink-700 tracking-wider">{p.ref}</td>
                <td className="py-3 text-ink-700">{p.method}</td>
                <td className="py-3 text-right tabular-nums text-ink-700">{formatCurrencyShort(p.amount)}</td>
                <td className="py-3"><span className="px-2 py-0.5 rounded-full text-xs text-success bg-success-bg">{p.status}</span></td>
                <td className="py-3 text-ink-400">{p.date}</td>
                <td className="py-3"><button className="text-xs text-brand-600 hover:text-brand-800">Download</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payments.length === 0 && (
        <div className="text-center py-12 text-ink-400 text-sm">No payments found.</div>
      )}
    </div>
  );
}
