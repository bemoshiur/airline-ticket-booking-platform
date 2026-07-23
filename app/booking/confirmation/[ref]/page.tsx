"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Download, Mail, Calendar, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerforatedDivider } from "@/components/ui/perforated-divider";
import { AirlineLogo } from "@/components/ui/airline-logo";
import { formatCurrencyShort } from "@/lib/utils/currency";

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const ref = params.ref as string;
  const pnr = searchParams.get("pnr") || "X4TR9B";
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedPNR, setCopiedPNR] = useState(false);

  const handleCopy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="max-w-[860px] mx-auto px-4 py-12">
      {/* Success crest */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-success" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeDasharray="20" strokeDashoffset="20" style={{ animation: "draw-check 400ms ease-out forwards" }} />
          </svg>
        </div>
        <h1 className="font-sora font-bold text-display-lg text-ink-800 mb-2">Booking confirmed</h1>
        <p className="text-body text-ink-400">Your e-ticket has been issued. Check your email for the receipt.</p>
      </div>

      {/* Reference block */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <div className="text-center">
          <div className="text-label text-ink-400 mb-1">Booking Reference</div>
          <div className="flex items-center gap-2">
            <span className="text-mono text-ink-700 tracking-wider">{ref}</span>
            <button
              onClick={() => handleCopy(ref, setCopiedRef)}
              className="p-1.5 rounded-md hover:bg-surface-alt transition-colors"
              aria-label="Copy booking reference"
            >
              {copiedRef ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-ink-400" />}
            </button>
          </div>
          {copiedRef && <span className="text-xs text-success">Copied!</span>}
        </div>
        <div className="text-center">
          <div className="text-label text-ink-400 mb-1">PNR</div>
          <div className="flex items-center gap-2">
            <span className="text-mono text-ink-700 tracking-wider">{pnr}</span>
            <button
              onClick={() => handleCopy(pnr, setCopiedPNR)}
              className="p-1.5 rounded-md hover:bg-surface-alt transition-colors"
              aria-label="Copy PNR"
            >
              {copiedPNR ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-ink-400" />}
            </button>
          </div>
          {copiedPNR && <span className="text-xs text-success">Copied!</span>}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-center gap-3 mb-8 text-sm">
        <span className="flex items-center gap-1 text-success"><span className="w-2 h-2 rounded-full bg-success" /> Booked</span>
        <ChevronRight size={14} className="text-ink-300" />
        <span className="flex items-center gap-1 text-success"><span className="w-2 h-2 rounded-full bg-success" /> Ticketed</span>
        <ChevronRight size={14} className="text-ink-300" />
        <span className="flex items-center gap-1 text-ink-400"><span className="w-2 h-2 rounded-full border-2 border-ink-300" /> Check-in opens 24 Jul</span>
        <ChevronRight size={14} className="text-ink-300" />
        <span className="flex items-center gap-1 text-ink-400"><span className="w-2 h-2 rounded-full border-2 border-ink-300" /> Departure</span>
      </div>

      {/* E-Ticket Card */}
      <div className="relative bg-surface border border-line rounded-lg mb-8 overflow-hidden">
        {/* Perforated header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <AirlineLogo code="BS" />
            <div className="text-right">
              <div className="text-label text-ink-400">E-Ticket</div>
              <div className="text-mono text-ink-700 tracking-wider">{ref}</div>
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-4 mb-6">
            {/* Departure */}
            <div className="text-center">
              <div className="text-2xl font-bold text-ink-700 tabular-nums">19:00</div>
              <div className="text-overline text-ink-500">DAC</div>
              <div className="text-body-sm text-ink-400">Dhaka</div>
              <div className="text-body-sm text-ink-400">30 Jul 2026</div>
            </div>

            {/* Route line */}
            <div className="flex-1 flex flex-col items-center px-4">
              <div className="text-body-sm text-ink-400 tabular-nums">1h 05m</div>
              <div className="flex items-center gap-1 w-full">
                <div className="w-2 h-2 rounded-full bg-brand-500" />
                <div className="flex-1 border-t border-dashed border-ink-300" />
                <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-500">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </div>
                <div className="flex-1 border-t border-dashed border-ink-300" />
                <div className="w-2 h-2 rounded-full bg-brand-500" />
              </div>
              <div className="text-body-sm text-ink-400">Non-stop · BS-159</div>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-2xl font-bold text-ink-700 tabular-nums">20:05</div>
              <div className="text-overline text-ink-500">CXB</div>
              <div className="text-body-sm text-ink-400">Cox's Bazar</div>
              <div className="text-body-sm text-ink-400">30 Jul 2026</div>
            </div>
          </div>
        </div>

        {/* Perforation */}
        <div className="relative mx-6">
          <PerforatedDivider height={1} className="w-full h-px" />
        </div>

        {/* Traveller info */}
        <div className="p-6">
          <h3 className="font-semibold text-ink-700 mb-3">Traveller Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-ink-400">Name:</span> <span className="text-ink-700">S M Moshiur Rahman</span></div>
            <div><span className="text-ink-400">Seat:</span> <span className="text-ink-700">12A</span></div>
            <div><span className="text-ink-400">Baggage:</span> <span className="text-ink-700">7 Kg Cabin · 20 Kg Check-in</span></div>
            <div><span className="text-ink-400">Meal:</span> <span className="text-ink-700">Standard</span></div>
          </div>
        </div>

        {/* Mock barcode */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-[3px] h-12 justify-center">
            {[2, 4, 1, 3, 5, 2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 5, 1, 2, 4, 3, 5, 2, 1, 4, 3, 2, 5, 1, 4, 2, 3, 5, 2, 1, 4, 3, 2, 5, 1, 4].map((w, i) => (
              <div key={i} className="bg-ink-700 rounded-sm" style={{ width: w, height: `${12 + w * 6}px` }} />
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <div className="text-body-sm text-ink-400">Fare paid</div>
          <div className="text-fare-lg font-bold text-brand-500 tabular-nums">{formatCurrencyShort(5089)}</div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Download size={16} /> Download e-ticket (PDF)
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-line text-sm font-medium text-ink-700 hover:bg-surface-alt transition-colors">
          <Mail size={16} /> Email e-ticket
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-line text-sm font-medium text-ink-700 hover:bg-surface-alt transition-colors">
          <Calendar size={16} /> Add to calendar
        </button>
        <Link
          href="/account/bookings"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-line text-sm font-medium text-ink-700 hover:bg-surface-alt transition-colors"
        >
          <ExternalLink size={16} /> Manage booking
        </Link>
      </div>

      {/* Info banner */}
      <div className="p-4 rounded-lg bg-info-bg border border-info/20 text-sm text-info">
        <p>Check in online 24 hours before departure. Carry the same ID used at booking.</p>
      </div>
    </div>
  );
}
