"use client";

import { useState } from "react";
import { Plus, MessageSquare, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const tickets = [
  { id: "TKT-001", subject: "Need to change flight date", category: "Booking Change", status: "Open", priority: "Medium", date: "22 Jul 2026" },
  { id: "TKT-002", subject: "Refund status inquiry", category: "Refund", status: "In Progress", priority: "High", date: "20 Jul 2026" },
];

export default function SupportPage() {
  const [showNew, setShowNew] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  return (
    <div className="bg-surface border border-line rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-sora font-bold text-h1 text-ink-800">Support Tickets</h1>
        <button
          onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {/* New Ticket Form */}
      {showNew && (
        <div className="mb-6 p-4 rounded-lg border-2 border-brand-300 bg-brand-50">
          <h3 className="font-semibold text-ink-700 mb-3">New Support Ticket</h3>
          <div className="space-y-3">
            <div>
              <label className="text-label text-ink-500 block mb-1">Subject</label>
              <input type="text" className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500" placeholder="Brief description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label text-ink-500 block mb-1">Category</label>
                <select className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500">
                  <option>Booking Change</option><option>Cancellation</option><option>Refund</option><option>Payment</option><option>Technical</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-label text-ink-500 block mb-1">Priority</label>
                <select className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500">
                  <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-label text-ink-500 block mb-1">Message</label>
              <textarea rows={3} className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500" placeholder="Describe your issue" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-md border border-line text-sm text-ink-600 hover:bg-surface-alt">Cancel</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600">Submit</button>
          </div>
        </div>
      )}

      {/* Ticket List */}
      {selectedTicket ? (
        <div>
          <button onClick={() => setSelectedTicket(null)} className="text-sm text-brand-600 hover:text-brand-800 mb-4 flex items-center gap-1">
            ← Back to tickets
          </button>
          {(() => {
            const t = tickets.find((t) => t.id === selectedTicket);
            if (!t) return null;
            return (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-semibold text-ink-700">{t.subject}</h2>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", t.status === "Open" ? "text-info bg-info-bg" : "text-urgent bg-urgent-bg")}>{t.status}</span>
                </div>
                <p className="text-sm text-ink-400 mb-2">Ticket ID: {t.id} · Category: {t.category} · Priority: {t.priority}</p>
                <div className="space-y-3 mt-4">
                  <div className="p-3 rounded-lg bg-surface-alt">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-ink-700">You</span>
                      <span className="text-xs text-ink-400">{t.date}</span>
                    </div>
                    <p className="text-sm text-ink-600">I would like to inquire about the status of my request. Please update me.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-info-bg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-info">Support Team</span>
                      <span className="text-xs text-ink-400">{t.date}</span>
                    </div>
                    <p className="text-sm text-ink-600">Thank you for reaching out. We are reviewing your request and will get back to you within 24 hours.</p>
                  </div>
                </div>
                <div className="mt-4">
                  <textarea rows={2} className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500" placeholder="Type your reply..." />
                  <div className="flex justify-end mt-2">
                    <button className="px-4 py-2 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600">Send</button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTicket(t.id)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-line hover:border-brand-300 transition-all text-left"
            >
              <div>
                <div className="font-medium text-ink-700">{t.subject}</div>
                <div className="text-xs text-ink-400">{t.id} · {t.category} · {t.date}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", t.status === "Open" ? "text-info bg-info-bg" : "text-urgent bg-urgent-bg")}>{t.status}</span>
                <ChevronRight size={14} className="text-ink-400" />
              </div>
            </button>
          ))}
          {tickets.length === 0 && <div className="text-center py-12 text-ink-400 text-sm">No tickets yet.</div>}
        </div>
      )}
    </div>
  );
}
