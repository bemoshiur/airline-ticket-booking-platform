"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [currency, setCurrency] = useState("BDT");
  const [language, setLanguage] = useState("English");
  const [notifications, setNotifications] = useState({ email: true, sms: false, whatsapp: true });

  return (
    <div className="bg-surface border border-line rounded-lg p-6">
      <h1 className="font-sora font-bold text-h1 text-ink-800 mb-6">Settings</h1>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-ink-700 mb-3">Currency</h3>
          <div className="flex gap-2">
            {["BDT", "USD"].map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currency === c ? "bg-brand-500 text-white" : "bg-surface-alt text-ink-500 hover:bg-brand-50"}`}
              >
                {c === "BDT" ? "৳ BDT" : "$ USD"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-ink-700 mb-3">Language</h3>
          <div className="flex gap-2">
            {["English", "বাংলা"].map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${language === l ? "bg-brand-500 text-white" : "bg-surface-alt text-ink-500 hover:bg-brand-50"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-ink-700 mb-3">Notifications</h3>
          <div className="space-y-3">
            {[
              { key: "email", label: "Email notifications" },
              { key: "sms", label: "SMS notifications" },
              { key: "whatsapp", label: "WhatsApp notifications" },
            ].map((n) => (
              <label key={n.key} className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[n.key as keyof typeof notifications]}
                  onChange={() => setNotifications({ ...notifications, [n.key]: !notifications[n.key as keyof typeof notifications] })}
                  className="accent-brand-500"
                />
                {n.label}
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-line">
          <button className="px-6 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
