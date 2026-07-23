"use client";

import { CreditCard, Trash2, Star } from "lucide-react";

const savedCards = [
  { id: "1", brand: "Visa", last4: "4242", expiry: "09/28", default: true },
  { id: "2", brand: "Mastercard", last4: "8888", expiry: "12/27", default: false },
];

export default function CardsPage() {
  return (
    <div className="bg-surface border border-line rounded-lg p-6">
      <h1 className="font-sora font-bold text-h1 text-ink-800 mb-6">Saved Cards</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedCards.map((card) => (
          <div key={card.id} className="relative p-4 rounded-lg border border-line hover:border-brand-300 transition-all">
            {card.default && (
              <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-urgent bg-urgent-bg">
                <Star size={10} /> Default
              </span>
            )}
            <div className="flex items-center gap-3 mb-3">
              <CreditCard size={24} className="text-brand-500" />
              <div>
                <div className="font-medium text-ink-700">{card.brand}</div>
                <div className="text-mono text-sm text-ink-400 tracking-wider">•••• {card.last4}</div>
              </div>
            </div>
            <div className="text-xs text-ink-400">Expires {card.expiry}</div>
            <div className="flex gap-2 mt-3">
              {!card.default && (
                <button className="text-xs text-brand-600 hover:text-brand-800 transition-colors">Set as default</button>
              )}
              <button className="text-xs text-danger hover:text-danger/80 transition-colors flex items-center gap-1">
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
