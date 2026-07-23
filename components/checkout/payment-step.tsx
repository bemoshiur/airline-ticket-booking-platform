"use client";

import { useState } from "react";
import { CreditCard, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrencyShort } from "@/lib/utils/currency";
import { PromoChip } from "@/components/ui/promo-chip";

interface PaymentStepProps {
  method: string;
  promoCode: string;
  promoDiscount: number;
  promoApplied: string;
  promoError: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
  saveCard: boolean;
  acceptedTerms: boolean;
  totalFare: number;
  onMethodChange: (method: string) => void;
  onPromoCodeChange: (code: string) => void;
  onPromoApply: (code: string) => void;
  onCardChange: (field: string, value: string) => void;
  onSaveCardChange: (save: boolean) => void;
  onTermsChange: (accepted: boolean) => void;
  onComplete: () => void;
}

const PAYMENT_METHODS = ["credit_card", "debit_card", "mobile_banking", "bank_transfer"];

export function PaymentStep({
  method,
  promoCode,
  promoDiscount,
  promoApplied,
  promoError,
  cardNumber,
  cardName,
  cardExpiry,
  cardCvv,
  saveCard,
  acceptedTerms,
  totalFare,
  onMethodChange,
  onPromoCodeChange,
  onPromoApply,
  onCardChange,
  onSaveCardChange,
  onTermsChange,
  onComplete,
}: PaymentStepProps) {
  const isValid =
    method &&
    acceptedTerms &&
    (method !== "credit_card" ||
      (cardNumber.replace(/\s/g, "").length === 16 &&
        cardName &&
        cardExpiry &&
        cardCvv));

  const discountedFare = Math.max(0, totalFare - promoDiscount);

  return (
    <div className="space-y-6">
      {/* Promo Code */}
      <div className="bg-surface-cool border border-line rounded-lg p-4">
        <label className="text-label text-ink-500 block mb-2">Promo / Coupon Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => onPromoCodeChange(e.target.value)}
            placeholder="Enter code"
            className="flex-1 px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={() => onPromoApply(promoCode)}
            className="px-4 py-2 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors whitespace-nowrap"
          >
            Apply
          </button>
        </div>
        {promoApplied && (
          <div className="mt-2">
            <PromoChip code={promoApplied} />
          </div>
        )}
        {promoError && <div className="text-sm text-danger mt-2">{promoError}</div>}
      </div>

      {/* Payment Method */}
      <div>
        <label className="text-label text-ink-500 block mb-3">Payment Method</label>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((m) => (
            <label key={m} className="flex items-center gap-3 p-3 rounded-lg border border-line cursor-pointer hover:bg-surface-alt transition-colors">
              <input
                type="radio"
                name="payment_method"
                value={m}
                checked={method === m}
                onChange={(e) => onMethodChange(e.target.value)}
                className="w-4 h-4 accent-brand-500"
              />
              <span className="text-sm font-medium text-ink-700 capitalize">
                {m === "credit_card"
                  ? "Credit Card"
                  : m === "debit_card"
                  ? "Debit Card"
                  : m === "mobile_banking"
                  ? "Mobile Banking"
                  : "Bank Transfer"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Card Details */}
      {method === "credit_card" && (
        <div className="bg-surface-alt border border-line rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={20} className="text-brand-500" />
            <h3 className="text-h3 text-ink-800">Card Details</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-label text-ink-500 block mb-1">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\s/g, "")
                    .replace(/(\d{4})/g, "$1 ")
                    .trim();
                  onCardChange("cardNumber", value);
                }}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-label text-ink-500 block mb-1">Cardholder Name</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => onCardChange("cardName", e.target.value)}
                placeholder="Name on card"
                className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label text-ink-500 block mb-1">Expiry Date</label>
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + "/" + value.slice(2, 4);
                    }
                    onCardChange("cardExpiry", value);
                  }}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-label text-ink-500 block mb-1">CVV</label>
                <input
                  type="text"
                  value={cardCvv}
                  onChange={(e) =>
                    onCardChange("cardCvv", e.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                  placeholder="123"
                  maxLength={3}
                  className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => onSaveCardChange(e.target.checked)}
                className="w-4 h-4 rounded accent-brand-500"
              />
              <span className="text-sm text-ink-600">Save this card for future bookings</span>
            </label>
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      <div className="bg-info-bg bg-opacity-20 border border-info-bg rounded-lg p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => onTermsChange(e.target.checked)}
            className="w-5 h-5 rounded accent-brand-500 mt-0.5"
          />
          <span className="text-sm text-ink-700">
            I agree to the <span className="font-medium">Terms and Conditions</span>,{" "}
            <span className="font-medium">Privacy Policy</span>, and{" "}
            <span className="font-medium">Baggage Policy</span>
          </span>
        </label>
      </div>

      {/* Fare Summary */}
      <div className="border-t border-line pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-body text-ink-600">Base Fare:</span>
          <span className="text-body text-ink-800 font-medium">
            {formatCurrencyShort(totalFare + promoDiscount)}
          </span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-success">
            <span className="text-body">Discount ({promoApplied}):</span>
            <span className="text-body font-medium">
              -{formatCurrencyShort(promoDiscount)}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-2">
          <span className="text-h3 text-ink-800">Total to Pay:</span>
          <span className="text-fare text-brand-500">{formatCurrencyShort(discountedFare)}</span>
        </div>
      </div>

      <button
        onClick={onComplete}
        disabled={!isValid}
        className={cn(
          "w-full py-3 rounded-lg font-medium transition-colors",
          isValid
            ? "bg-brand-500 text-white hover:bg-brand-600"
            : "bg-surface-alt text-ink-400 cursor-not-allowed"
        )}
      >
        Review Booking
      </button>
    </div>
  );
}
