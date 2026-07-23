"use client";

import { Check } from "lucide-react";

export default function AccountPage() {
  return (
    <div className="bg-surface border border-line rounded-lg p-6">
      <h1 className="font-sora font-bold text-h1 text-ink-800 mb-6">My Account</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center text-2xl font-bold">
          SM
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-ink-700">S M Moshiur Rahman</h2>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-success bg-success-bg">
              <Check size={12} /> Verified
            </span>
          </div>
          <p className="text-sm text-ink-400">Joined July 2026</p>
        </div>
        <button className="ml-auto px-4 py-2 rounded-lg border border-line text-sm text-ink-600 hover:bg-surface-alt transition-colors">
          Change photo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Full Name", value: "S M Moshiur Rahman" },
          { label: "Email", value: "moshiur@example.com", verified: true },
          { label: "Phone", value: "+880 1712-345678", verified: true },
          { label: "Date of Birth", value: "15 May 1990" },
          { label: "Gender", value: "Male" },
          { label: "Address", value: "Dhaka, Bangladesh" },
        ].map((field) => (
          <div key={field.label} className="p-3 rounded-lg bg-surface-alt">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ink-400">{field.label}</span>
              {field.verified && (
                <span className="text-xs text-success flex items-center gap-1">
                  <Check size={10} /> Verified
                </span>
              )}
            </div>
            <div className="text-sm font-medium text-ink-700">{field.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
