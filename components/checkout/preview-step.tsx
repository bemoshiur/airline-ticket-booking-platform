"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyShort } from "@/lib/utils/currency";
import { Traveller } from "./traveller-step";

interface PreviewStepProps {
  airline: string;
  flightNum: string;
  departure: { code: string; time: string; date: string };
  arrival: { code: string; time: string };
  travellers: Traveller[];
  contact: { phoneCode: string; phone: string; email: string };
  baggage: string;
  seat: string;
  meal: string;
  insurance: boolean;
  totalFare: number;
  isProcessing: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

const STEP_LABELS = {
  traveller: "Traveller Info",
  addons: "Add-ons",
  payment: "Payment",
  preview: "Preview",
};

export function PreviewStep({
  airline,
  flightNum,
  departure,
  arrival,
  travellers,
  contact,
  baggage,
  seat,
  meal,
  insurance,
  totalFare,
  isProcessing,
  onConfirm,
  onBack,
}: PreviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Flight Summary */}
      <div className="bg-surface border border-line rounded-lg p-6">
        <h3 className="text-h3 text-ink-800 mb-4">Flight Summary</h3>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-label text-ink-500 mb-1">Departure</div>
              <div className="text-h2 text-ink-800">{departure.code}</div>
              <div className="text-body text-ink-600 mt-1">{departure.date}</div>
              <div className="text-fare text-ink-700 mt-1">{departure.time}</div>
            </div>
            <div className="text-center flex-1 max-w-xs">
              <div className="text-label text-ink-400 mb-2">
                {airline} {flightNum}
              </div>
              <div className="border-t-2 border-line relative h-2">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand-500"></div>
              </div>
              <div className="text-xs text-ink-400 mt-2">Direct flight</div>
            </div>
            <div className="text-right">
              <div className="text-label text-ink-500 mb-1">Arrival</div>
              <div className="text-h2 text-ink-800">{arrival.code}</div>
              <div className="text-body text-ink-600 mt-1">Same day</div>
              <div className="text-fare text-ink-700 mt-1">{arrival.time}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Travellers */}
      <div className="bg-surface border border-line rounded-lg p-6">
        <h3 className="text-h3 text-ink-800 mb-4">Travellers</h3>
        <div className="space-y-3">
          {travellers.map((t, idx) => (
            <div
              key={t.id}
              className="p-3 rounded-lg bg-surface-alt flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-ink-800">
                  {t.title} {t.firstName} {t.surname}
                </div>
                <div className="text-sm text-ink-500 mt-1">
                  {t.nationality} • {t.gender} • {t.dob}
                </div>
                {t.passportNumber && (
                  <div className="text-xs text-ink-400 mt-1">
                    Passport: {t.passportNumber}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-surface border border-line rounded-lg p-6">
        <h3 className="text-h3 text-ink-800 mb-4">Contact Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-body text-ink-600">Phone:</span>
            <span className="text-body font-medium text-ink-800">
              {contact.phoneCode} {contact.phone}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-ink-600">Email:</span>
            <span className="text-body font-medium text-ink-800">{contact.email}</span>
          </div>
        </div>
      </div>

      {/* Add-ons Summary */}
      <div className="bg-surface border border-line rounded-lg p-6">
        <h3 className="text-h3 text-ink-800 mb-4">Selected Add-ons</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-body text-ink-600">Baggage:</span>
            <span className="text-body font-medium text-ink-800">{baggage}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-ink-600">Seat:</span>
            <span className="text-body font-medium text-ink-800">
              {seat === "premium" ? "Premium Seat" : "Standard Seat"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-body text-ink-600">Meal:</span>
            <span className="text-body font-medium text-ink-800 capitalize">{meal}</span>
          </div>
          {insurance && (
            <div className="flex justify-between">
              <span className="text-body text-ink-600">Insurance:</span>
              <span className="text-body font-medium text-success">Included</span>
            </div>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-brand-50 border border-brand-300 rounded-lg p-6">
        <h3 className="text-h3 text-ink-800 mb-4">Price Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-body text-ink-600">Base Fare (1 pax):</span>
            <span className="text-body text-ink-800 font-medium">
              {formatCurrencyShort(totalFare)}
            </span>
          </div>
          <div className="border-t border-brand-200 pt-3 flex justify-between">
            <span className="text-h3 text-ink-800">Total to Pay:</span>
            <span className="text-fare text-brand-600">
              {formatCurrencyShort(totalFare)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1 py-3 rounded-lg border border-line text-ink-700 font-medium hover:bg-surface-alt transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className={cn(
            "flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
            isProcessing
              ? "bg-surface-alt text-ink-400 cursor-not-allowed"
              : "bg-brand-500 text-white hover:bg-brand-600"
          )}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              Processing...
            </>
          ) : (
            <>
              <Check size={18} />
              Confirm & Pay
            </>
          )}
        </button>
      </div>
    </div>
  );
}
