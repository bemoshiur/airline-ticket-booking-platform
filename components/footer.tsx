"use client";

import Link from "next/link";
import { Plane, Phone, Mail } from "lucide-react";

const paymentMethods = [
  "bKash", "Nagad", "Rocket", "Upay",
  "Visa", "Mastercard", "Amex",
  "DBBL", "City Bank", "EMI",
];

const certifications = [
  "IATA", "MoCAT", "DBID", "BASIS", "e-CAB", "PCI-DSS",
];

export function Footer() {
  return (
    <footer className="bg-ink-800 text-white mt-auto">
      <div className="max-w-[1360px] mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center">
                <Plane size={18} className="text-white" />
              </div>
              <span className="font-sora font-bold text-lg">SkyWing</span>
            </div>
            <p className="text-sm text-ink-300 leading-relaxed mb-4">
              Bangladesh&apos;s trusted online travel agency. Book flights at the best prices
              with 24/7 customer support.
            </p>
            <div className="space-y-2 text-sm text-ink-300">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-brand-300" />
                <span>+880 9613-227788 (24/7 Hotline)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-brand-300" />
                <span>support@skywing.com</span>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-inter font-semibold text-sm uppercase tracking-wider mb-4 text-ink-300">
              Company
            </h3>
            <ul className="space-y-2.5">
              {["About", "Contact", "Terms", "Privacy", "Refund Policy", "Baggage Information", "EMI"].map(
                (item) => (
                  <li key={item}>
                    <span className="text-sm text-ink-300 hover:text-white transition-colors cursor-default">
                      {item}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Trust & Payments */}
          <div>
            <h3 className="font-inter font-semibold text-sm uppercase tracking-wider mb-4 text-ink-300">
              Certifications
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {certifications.map((cert) => (
                <span
                  key={cert}
                  className="px-3 py-1.5 rounded-md bg-white/10 text-xs font-medium text-ink-300"
                >
                  {cert}
                </span>
              ))}
            </div>

            <h3 className="font-inter font-semibold text-sm uppercase tracking-wider mb-3 text-ink-300">
              Payment Methods
            </h3>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((pm) => (
                <span
                  key={pm}
                  className="px-3 py-1.5 rounded-md bg-white/5 text-xs text-ink-300 border border-white/10"
                >
                  {pm}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1360px] mx-auto px-4 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-400">
          <span>© 2026 SkyWing. All rights reserved.</span>
          <span className="text-urgent">Prototype — simulated data</span>
        </div>
      </div>
    </footer>
  );
}
