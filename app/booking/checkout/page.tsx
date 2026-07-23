"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, ChevronLeft, Clock, Shield, CreditCard, Plane, Check, X,
  Luggage, UtensilsCrossed, ArmchairIcon, Ban, Minus, Plus, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAirline } from "@/lib/mock/airlines";
import { getAirport } from "@/lib/mock/airports";
import { getFareFamily, fareRules } from "@/lib/mock/fares";
import { getPromo, calculateDiscount } from "@/lib/mock/promos";
import { searchFlights } from "@/lib/mock/generator";
import { fakeLatency } from "@/lib/utils/fakeLatency";
import { formatCurrencyShort } from "@/lib/utils/currency";
import { formatDuration } from "@/lib/utils/duration";
import { useSessionStore } from "@/lib/store/session";
import { useBookingStore } from "@/lib/store/booking";
import { AirlineLogo } from "@/components/ui/airline-logo";
import { PerforatedDivider } from "@/components/ui/perforated-divider";
import { PromoChip } from "@/components/ui/promo-chip";
import { format, addDays } from "date-fns";

const STEPS = [
  { num: 1, label: "Traveller Info", key: "traveller" },
  { num: 2, label: "Add-ons", key: "addons" },
  { num: 3, label: "Payment", key: "payment" },
  { num: 4, label: "Preview", key: "preview" },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = useSessionStore();
  const booking = useBookingStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock flight details from params
  const searchId = searchParams.get("searchId") || "mock-search-id";
  const flightKey = searchParams.get("flightKey") || "BS-159";
  const fareKey = searchParams.get("fareKey") || "econ_std";

  const [airlineCode, flightNum] = flightKey.split("-");
  const airline = getAirline(airlineCode);
  const fareFamily = getFareFamily(fareKey);

  // Mock pricing
  const baseFare = 3031;
  const taxes = 1139;
  const totalPax = 1;
  const baseTotal = (baseFare + taxes) * totalPax;
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState("");
  const [promoError, setPromoError] = useState("");
  const [addonsTotal, setAddonsTotal] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");

  // Traveller form state
  const [travellers, setTravellers] = useState([
    { id: "1", title: "Mr.", firstName: "", surname: "", dob: "", nationality: "Bangladeshi", gender: "Male", passportNumber: "", passportExpiry: "", singleName: false, seat: "", baggage: "", meal: "" }
  ]);
  const [contact, setContact] = useState({ phoneCode: "+880", phone: "", email: "", whatsapp: false });

  // Add-ons state
  const [selectedBaggage, setSelectedBaggage] = useState("included");
  const [selectedSeat, setSelectedSeat] = useState("");
  const [selectedMeal, setSelectedMeal] = useState("standard");
  const [insuranceOpted, setInsuranceOpted] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [cardName, setCardName] = useState("S M Moshiur Rahman");
  const [cardExpiry, setCardExpiry] = useState("09/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [saveCard, setSaveCard] = useState(false);

  // Session timer
  useEffect(() => {
    session.start(20 * 60);
    const interval = setInterval(() => session.tick(), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Computed totals
  const baggageCost = selectedBaggage === "+5" ? 600 : selectedBaggage === "+10" ? 1200 : selectedBaggage === "+20" ? 2300 : 0;
  const seatCost = selectedSeat ? 300 : 0;
  const mealCost = selectedMeal !== "standard" ? 350 : 0;
  const insuranceCost = insuranceOpted ? 450 : 0;
  const computedAddonsTotal = baggageCost + seatCost + mealCost + insuranceCost;
  const subtotal = baseTotal + computedAddonsTotal - promoDiscount;
  const youPay = subtotal;

  const handlePromoApply = () => {
    const promo = getPromo(promoCode.toUpperCase());
    if (!promo) {
      setPromoError("This code is not valid for this booking.");
      return;
    }
    const discount = calculateDiscount(promo, baseFare);
    if (discount <= 0) {
      setPromoError("This code is not valid for this booking.");
      return;
    }
    setPromoDiscount(discount);
    setPromoApplied(promoCode.toUpperCase());
    setPromoError("");
    setPromoCode("");
  };

  const handleContinue = () => {
    if (currentStep < 3) {
      if (currentStep === 2 && !acceptedTerms) return;
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      handleConfirm();
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    await fakeLatency(4000, 6000);
    const ref = `AKJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const pnr = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/booking/confirmation/${ref}?pnr=${pnr}`);
  };

  const goToStep = (step: number) => {
    if (completedSteps.includes(step) || step <= currentStep) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 lg:px-8 py-6">
      {/* Checkout Stepper */}
      <div className="flex items-center mb-6 rounded-lg overflow-hidden">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === idx;
          const isCompleted = completedSteps.includes(idx);
          const isClickable = isCompleted || idx <= currentStep;
          return (
            <button
              key={step.key}
              onClick={() => isClickable && goToStep(idx)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative",
                "clip-path-chevron",
                isActive ? "bg-brand-800 text-white" : isCompleted ? "bg-brand-700 text-white/80" : "bg-ink-300 text-white/50 cursor-not-allowed",
                idx < STEPS.length - 1 && "mr-[-12px]"
              )}
              style={{
                clipPath: idx < STEPS.length - 1
                  ? "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)"
                  : "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
              }}
            >
              {isCompleted ? (
                <Check size={16} />
              ) : (
                <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">
                  {step.num}
                </span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          );
        })}

        {/* Session Timer */}
        <div className="ml-auto flex items-center gap-2 px-4 py-3 bg-surface border border-line rounded-r-lg">
          <Clock size={16} className={cn(session.remainingSeconds <= 300 ? "text-brand-500" : "text-ink-400")} />
          <span className={cn("text-sm tabular-nums font-medium", session.remainingSeconds <= 300 && "text-brand-500 animate-pulse")}>
            {formatTime(session.remainingSeconds)}
          </span>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Step 0: Traveller Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Flight Details Tabs */}
              <div className="bg-surface border border-line rounded-lg p-4">
                <h3 className="font-semibold text-ink-700 mb-3">Flight Details</h3>
                <div className="flex items-center gap-4 p-3 bg-surface-alt rounded-lg">
                  <AirlineLogo code={airlineCode} />
                  <div>
                    <div className="font-semibold text-ink-700">{airline?.name} • {flightKey}</div>
                    <div className="text-sm text-ink-400">{format(new Date(), "d MMM yyyy")} • {formatDuration(65)} • {fareFamily?.name || "Economy"}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="font-semibold tabular-nums">{formatCurrencyShort(baseTotal)}</div>
                    <div className="text-xs text-ink-400">{totalPax} Traveller</div>
                  </div>
                </div>
              </div>

              {/* Traveller Form */}
              {travellers.map((trav, idx) => (
                <div key={trav.id} className="bg-surface border border-line rounded-lg p-6">
                  <h3 className="font-semibold text-ink-700 mb-4">Traveller {idx + 1} · Adult · {idx === 0 ? "Primary Traveller" : "Additional Traveller"}</h3>
                  <p className="text-sm text-ink-400 mb-4">As mentioned on your passport or government approved ID</p>

                  {/* Title */}
                  <div className="flex gap-2 mb-4">
                    {["Mr.", "Mrs.", "Ms."].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          const next = [...travellers];
                          next[idx] = { ...next[idx], title: t };
                          setTravellers(next);
                        }}
                        className={cn(
                          "px-4 py-2 rounded-md text-sm font-medium transition-all",
                          trav.title === t ? "bg-brand-500 text-white" : "bg-surface-alt text-ink-500 hover:bg-brand-50"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Single name checkbox */}
                  <label className="flex items-center gap-2 mb-4 text-sm text-ink-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trav.singleName}
                      onChange={() => {
                        const next = [...travellers];
                        next[idx] = { ...next[idx], singleName: !trav.singleName };
                        setTravellers(next);
                      }}
                      className="accent-brand-500"
                    />
                    I have only a single name in my passport
                  </label>

                  {/* Name fields */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-label text-ink-500 mb-1 block">{trav.singleName ? "Name*" : "Given Name / First Name*"}</label>
                      <input
                        type="text"
                        value={trav.firstName}
                        onChange={(e) => {
                          const next = [...travellers];
                          next[idx] = { ...next[idx], firstName: e.target.value.toUpperCase() };
                          setTravellers(next);
                        }}
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                        placeholder="e.g. S M MOSHIUR"
                      />
                    </div>
                    {!trav.singleName && (
                      <div>
                        <label className="text-label text-ink-500 mb-1 block">Surname*</label>
                        <input
                          type="text"
                          value={trav.surname}
                          onChange={(e) => {
                            const next = [...travellers];
                            next[idx] = { ...next[idx], surname: e.target.value.toUpperCase() };
                            setTravellers(next);
                          }}
                          className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                          placeholder="e.g. RAHMAN"
                        />
                      </div>
                    )}
                  </div>

                  {/* DOB */}
                  <div className="mb-4">
                    <label className="text-label text-ink-500 mb-1 block">Date of Birth*</label>
                    <input
                      type="date"
                      value={trav.dob}
                      onChange={(e) => {
                        const next = [...travellers];
                        next[idx] = { ...next[idx], dob: e.target.value };
                        setTravellers(next);
                      }}
                      className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Nationality & Gender */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-label text-ink-500 mb-1 block">Nationality*</label>
                      <select
                        value={trav.nationality}
                        onChange={(e) => {
                          const next = [...travellers];
                          next[idx] = { ...next[idx], nationality: e.target.value };
                          setTravellers(next);
                        }}
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                      >
                        {["Bangladeshi", "Indian", "Pakistani", "Nepalese", "Sri Lankan", "Maldivian", "British", "American", "Other"].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-label text-ink-500 mb-1 block">Gender</label>
                      <div className="flex gap-2">
                        {["Male", "Female"].map((g) => (
                          <button
                            key={g}
                            onClick={() => {
                              const next = [...travellers];
                              next[idx] = { ...next[idx], gender: g as "Male" | "Female" };
                              setTravellers(next);
                            }}
                            className={cn(
                              "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all",
                              trav.gender === g ? "bg-brand-500 text-white" : "bg-surface-alt text-ink-500 hover:bg-brand-50"
                            )}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Passport */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-label text-ink-500 mb-1 block">Passport Number</label>
                      <input
                        type="text"
                        value={trav.passportNumber}
                        onChange={(e) => {
                          const next = [...travellers];
                          next[idx] = { ...next[idx], passportNumber: e.target.value.toUpperCase() };
                          setTravellers(next);
                        }}
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                        placeholder="BP1234567"
                      />
                    </div>
                    <div>
                      <label className="text-label text-ink-500 mb-1 block">Passport Expiry</label>
                      <input
                        type="date"
                        value={trav.passportExpiry}
                        onChange={(e) => {
                          const next = [...travellers];
                          next[idx] = { ...next[idx], passportExpiry: e.target.value };
                          setTravellers(next);
                        }}
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Add to saved */}
                  <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
                    <input type="checkbox" className="accent-brand-500" />
                    Add to My Traveller List
                  </label>
                </div>
              ))}

              {/* Contact Information */}
              <div className="bg-surface border border-line rounded-lg p-6">
                <h3 className="font-semibold text-ink-700 mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-label text-ink-500 mb-1 block">Phone*</label>
                    <div className="flex gap-2">
                      <select
                        value={contact.phoneCode}
                        onChange={(e) => setContact({ ...contact, phoneCode: e.target.value })}
                        className="w-24 px-2 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                      >
                        <option value="+880">🇧🇩 +880</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                      </select>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                        placeholder="1712345678"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-label text-ink-500 mb-1 block">Email Address*</label>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                      placeholder="moshiur@example.com"
                    />
                    <p className="text-xs text-ink-400 mt-1">Your e-ticket will be sent here</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contact.whatsapp}
                    onChange={(e) => setContact({ ...contact, whatsapp: e.target.checked })}
                    className="accent-brand-500"
                  />
                  Send booking updates on WhatsApp
                </label>
              </div>
            </div>
          )}

          {/* Step 1: Add-ons */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Extra Baggage */}
              <div className="bg-surface border border-line rounded-lg p-6">
                <h3 className="font-semibold text-ink-700 mb-4">Extra Baggage <span className="text-sm text-ink-400 font-normal">(+{baggageCost > 0 ? formatCurrencyShort(baggageCost) : "0"})</span></h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: "included", label: "No extra baggage", sub: "Included 20 Kg", price: 0 },
                    { value: "+5", label: "+5 Kg", sub: "BDT 600", price: 600 },
                    { value: "+10", label: "+10 Kg", sub: "BDT 1,200", price: 1200 },
                    { value: "+20", label: "+20 Kg", sub: "BDT 2,300", price: 2300 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedBaggage(opt.value)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all",
                        selectedBaggage === opt.value ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-300"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Luggage size={16} className="text-brand-500" />
                        <span className="font-medium text-ink-700">{opt.label}</span>
                      </div>
                      <span className="text-sm text-ink-400">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seat Map (simplified) */}
              <div className="bg-surface border border-line rounded-lg p-6">
                <h3 className="font-semibold text-ink-700 mb-4">Seat Selection</h3>
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-1 text-xs text-ink-400 mb-1">✈️ Cockpit</div>
                  <div className="grid grid-cols-6 gap-1.5 max-w-[240px] mx-auto">
                    {Array.from({ length: 18 }, (_, row) => {
                      const rowNum = row + 1;
                      return [0, 1, 3, 4].map((col) => {
                        const seatLabel = `${rowNum}${col < 2 ? String.fromCharCode(65 + col) : String.fromCharCode(67 + col - 2)}`;
                        const isOccupied = [5, 8, 12].includes(rowNum) && [0, 3].includes(col);
                        const isSelected = selectedSeat === seatLabel;
                        const isWing = rowNum >= 6 && rowNum <= 10;
                        return (
                          <button
                            key={seatLabel}
                            onClick={() => !isOccupied && setSelectedSeat(isSelected ? "" : seatLabel)}
                            disabled={isOccupied}
                            className={cn(
                              "w-8 h-8 rounded text-[10px] font-medium transition-all",
                              isSelected ? "bg-brand-500 text-white" : isOccupied ? "bg-surface-alt text-ink-300 cursor-not-allowed line-through" : "bg-surface border border-line hover:border-brand-500 text-ink-500"
                            )}
                            title={`${seatLabel}${isWing ? " (Wing)" : ""}`}
                          >
                            {isOccupied ? "✕" : seatLabel}
                          </button>
                        );
                      });
                    }).flat()}
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs text-ink-400 mt-1">✈️ Tail</div>
                  <div className="flex justify-center gap-4 mt-4 text-xs text-ink-400">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-surface border border-line" /> Available</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-500" /> Selected</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-surface-alt line-through" /> Occupied</span>
                  </div>
                  {selectedSeat && <p className="text-sm text-brand-600 mt-2">Selected: {selectedSeat} (+BDT 300)</p>}
                </div>
              </div>

              {/* Meal */}
              <div className="bg-surface border border-line rounded-lg p-6">
                <h3 className="font-semibold text-ink-700 mb-4">Meal Preference <span className="text-sm text-ink-400 font-normal">(+{mealCost > 0 ? formatCurrencyShort(mealCost) : "0"})</span></h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: "standard", label: "Standard", sub: "Included", veg: true },
                    { value: "vegetarian", label: "Vegetarian", sub: "BDT 350", veg: true },
                    { value: "halal", label: "Halal Special", sub: "BDT 350", veg: false },
                    { value: "child", label: "Child Meal", sub: "BDT 350", veg: false },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedMeal(opt.value)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all",
                        selectedMeal === opt.value ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-300"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <UtensilsCrossed size={16} className="text-brand-500" />
                        <span className="font-medium text-ink-700">{opt.label}</span>
                      </div>
                      <span className="text-sm text-ink-400">{opt.sub}</span>
                      {opt.veg && <span className="ml-2 text-xs text-success">🟢 Veg</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel Insurance */}
              <div className="bg-surface border border-line rounded-lg p-6">
                <h3 className="font-semibold text-ink-700 mb-4">Travel Insurance</h3>
                <div className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  insuranceOpted ? "border-brand-500 bg-brand-50" : "border-line"
                )}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={insuranceOpted}
                      onChange={(e) => setInsuranceOpted(e.target.checked)}
                      className="mt-1 accent-brand-500"
                    />
                    <div>
                      <div className="font-medium text-ink-700 mb-1">Travel Insurance — BDT 450 per traveller</div>
                      <ul className="text-sm text-ink-400 space-y-0.5">
                        <li>✓ Medical emergency coverage up to BDT 500,000</li>
                        <li>✓ Trip cancellation & interruption</li>
                        <li>✓ Lost baggage protection</li>
                        <li>✓ 24/7 emergency assistance</li>
                      </ul>
                    </div>
                    <Shield size={24} className="text-brand-500 flex-shrink-0" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Promo Code */}
              <div className="bg-surface border border-line rounded-lg p-6">
                <h3 className="font-semibold text-ink-700 mb-3">Promo Code</h3>
                {promoApplied ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success-bg text-success">
                    <span className="text-sm font-medium">Code {promoApplied} applied — you save {formatCurrencyShort(promoDiscount)}</span>
                    <button
                      onClick={() => { setPromoApplied(""); setPromoDiscount(0); }}
                      className="p-1 hover:bg-success/10 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter promo code"
                      className="flex-1 px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                    />
                    <button
                      onClick={handlePromoApply}
                      className="px-4 py-2 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {promoError && <p className="text-sm text-danger mt-2">{promoError}</p>}
                <div className="flex gap-2 mt-2">
                  {["FTEBLDOM07", "FLYBD500", "EBLCARD10"].map((code) => (
                    <button
                      key={code}
                      onClick={() => setPromoCode(code)}
                      className="px-2 py-1 rounded text-xs text-brand-800 bg-brand-100 border border-dashed border-brand-300 hover:bg-brand-200 transition-colors"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-surface border border-line rounded-lg p-6">
                <h3 className="font-semibold text-ink-700 mb-4">Payment Method</h3>

                {/* Mobile Financial Services */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-ink-500 mb-2">Mobile Financial Services</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {["bKash", "Nagad", "Rocket", "Upay"].map((mfs) => (
                      <button
                        key={mfs}
                        onClick={() => setPaymentMethod(mfs)}
                        className={cn(
                          "p-4 rounded-lg border-2 text-center transition-all",
                          paymentMethod === mfs ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-300"
                        )}
                      >
                        <div className="text-lg font-bold text-ink-700 mb-1">{mfs === "bKash" ? "💳" : mfs === "Nagad" ? "📱" : mfs === "Rocket" ? "🚀" : "⬆️"}</div>
                        <div className="text-xs font-medium text-ink-600">{mfs}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cards */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-ink-500 mb-2">Cards <span className="text-xs text-ink-300 font-normal">(Simulated payment — no real data collected)</span></h4>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {["Visa", "Mastercard", "Amex"].map((card) => (
                      <button
                        key={card}
                        onClick={() => setPaymentMethod(card)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-center transition-all",
                          paymentMethod === card ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-300"
                        )}
                      >
                        <div className="text-sm font-bold text-ink-700">{card}</div>
                      </button>
                    ))}
                  </div>
                  {["Visa", "Mastercard", "Amex"].includes(paymentMethod) && (
                    <div className="space-y-3 p-4 bg-surface-alt rounded-lg">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="Card Number"
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                      />
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Name on Card"
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                        />
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="CVV"
                          className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
                        <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="accent-brand-500" />
                        Save this card
                      </label>
                    </div>
                  )}
                </div>

                {/* Internet Banking */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-ink-500 mb-2">Internet Banking</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {["City Bank", "EBL", "BRAC", "DBBL", "IFIC"].map((bank) => (
                      <button
                        key={bank}
                        onClick={() => setPaymentMethod(bank)}
                        className={cn(
                          "p-2 rounded-lg border-2 text-center transition-all",
                          paymentMethod === bank ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-300"
                        )}
                      >
                        <div className="text-xs font-medium text-ink-600">{bank}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* EMI */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-ink-500 mb-2">EMI</h4>
                  <button
                    onClick={() => setPaymentMethod("EMI")}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-all w-full",
                      paymentMethod === "EMI" ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-300"
                    )}
                  >
                    <div className="text-sm font-medium text-ink-700 mb-1">3/6/9/12 months EMI available</div>
                    <div className="text-xs text-ink-400">Monthly instalment from BDT {(youPay / 12).toFixed(0)}/mo</div>
                  </button>
                </div>

                {/* Pay Later */}
                <div>
                  <h4 className="text-sm font-medium text-ink-500 mb-2">Pay Later</h4>
                  <button
                    onClick={() => setPaymentMethod("Pay Later")}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-all w-full",
                      paymentMethod === "Pay Later" ? "border-brand-500 bg-brand-50" : "border-line hover:border-brand-300"
                    )}
                  >
                    <div className="text-sm font-medium text-ink-700 mb-1">Book Now, Pay Later</div>
                    <div className="text-xs text-ink-400">Reserve your fare now. Payment due by {format(addDays(new Date(), 3), "d MMM yyyy")}, 18:00</div>
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2 text-sm text-ink-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 accent-brand-500"
                />
                <span>I have read and accept the fare rules, terms & conditions and privacy policy.</span>
              </label>
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-surface border border-line rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-ink-700">Review your booking</h3>
                  <button onClick={() => setCurrentStep(0)} className="text-sm text-brand-600 hover:text-brand-800">Edit</button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-lg">
                  <AirlineLogo code={airlineCode} />
                  <div>
                    <div className="font-semibold text-ink-700">{airline?.name} • {flightKey}</div>
                    <div className="text-sm text-ink-400">{format(new Date(), "d MMM yyyy")} • {formatDuration(65)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-line rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-ink-700">Traveller Details</h3>
                  <button onClick={() => setCurrentStep(0)} className="text-sm text-brand-600 hover:text-brand-800">Edit</button>
                </div>
                {travellers.map((t, idx) => (
                  <div key={t.id} className="grid grid-cols-2 gap-3 text-sm mb-2">
                    <div><span className="text-ink-400">Name:</span> <span className="text-ink-700">{t.title} {t.firstName} {t.surname}</span></div>
                    <div><span className="text-ink-400">Type:</span> <span className="text-ink-700">Adult</span></div>
                    <div><span className="text-ink-400">DOB:</span> <span className="text-ink-700">{t.dob || "—"}</span></div>
                    <div><span className="text-ink-400">Nationality:</span> <span className="text-ink-700">{t.nationality}</span></div>
                    {selectedSeat && <div><span className="text-ink-400">Seat:</span> <span className="text-ink-700">{selectedSeat}</span></div>}
                    <div><span className="text-ink-400">Baggage:</span> <span className="text-ink-700">{selectedBaggage === "included" ? "20 Kg" : `${selectedBaggage} Kg`}</span></div>
                    {selectedMeal && <div><span className="text-ink-400">Meal:</span> <span className="text-ink-700 capitalize">{selectedMeal}</span></div>}
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-line">
                  <div><span className="text-ink-400">Contact:</span> <span className="text-ink-700">{contact.phone} · {contact.email}</span></div>
                </div>
              </div>

              <div className="bg-surface border border-line rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-ink-700">Add-ons</h3>
                  <button onClick={() => setCurrentStep(1)} className="text-sm text-brand-600 hover:text-brand-800">Edit</button>
                </div>
                <div className="space-y-1 text-sm">
                  {selectedBaggage !== "included" && <div className="flex justify-between"><span>Extra Baggage {selectedBaggage}</span><span>{formatCurrencyShort(baggageCost)}</span></div>}
                  {selectedSeat && <div className="flex justify-between"><span>Seat {selectedSeat}</span><span>BDT 300</span></div>}
                  {selectedMeal !== "standard" && <div className="flex justify-between"><span className="capitalize">{selectedMeal} Meal</span><span>BDT 350</span></div>}
                  {insuranceOpted && <div className="flex justify-between"><span>Travel Insurance</span><span>BDT 450</span></div>}
                  {!selectedSeat && selectedBaggage === "included" && selectedMeal === "standard" && !insuranceOpted && (
                    <span className="text-ink-400">No add-ons selected</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-line">
            <button
              onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : router.push("/flights")}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-ink-500 hover:bg-surface-alt transition-colors"
            >
              <ChevronLeft size={16} />
              {currentStep > 0 ? "Back" : "Back to results"}
            </button>
            <button
              onClick={handleContinue}
              disabled={currentStep === 2 && !acceptedTerms}
              className={cn(
                "px-8 py-2.5 rounded-lg text-white font-semibold transition-colors",
                currentStep === 2 && !acceptedTerms
                  ? "bg-ink-300 cursor-not-allowed"
                  : "bg-brand-500 hover:bg-brand-600"
              )}
            >
              {currentStep < 3 ? "Save & Continue" : `Pay ${formatCurrencyShort(youPay)}`}
            </button>
          </div>
        </div>

        {/* Fare Summary Sidebar */}
        <div className="hidden lg:block w-[380px] flex-shrink-0">
          <div className="sticky top-20 bg-surface border border-line rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className={cn(session.remainingSeconds <= 300 ? "text-brand-500" : "text-ink-400")} />
              <span className={cn("text-sm tabular-nums font-medium", session.remainingSeconds <= 300 && "text-brand-500 animate-pulse")}>
                Time Remaining {formatTime(session.remainingSeconds)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-line">
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(session.remainingSeconds / (20 * 60)) * 100}%` }} />
            </div>

            <div className="border-t border-line pt-4">
              <h4 className="font-semibold text-ink-700 mb-3">Fare Summary</h4>
              <div className="flex items-center gap-2 mb-3">
                <AirlineLogo code={airlineCode} size="sm" />
                <div>
                  <div className="font-medium text-sm text-ink-700">{airline?.name} • {flightKey}</div>
                  <div className="text-xs text-ink-400">One way · {format(new Date(), "d MMM")}</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-500">Base Fare (1 × {formatCurrencyShort(baseFare)})</span>
                  <span className="tabular-nums">{formatCurrencyShort(baseFare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-500">Taxes & Fees (1 × {formatCurrencyShort(taxes)})</span>
                  <span className="tabular-nums">{formatCurrencyShort(taxes)}</span>
                </div>

                {computedAddonsTotal > 0 && (
                  <>
                    <div className="border-t border-dashed border-line pt-2">
                      <p className="text-xs font-medium text-ink-400 mb-1">Add-ons</p>
                      {baggageCost > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-ink-400">Extra baggage</span>
                          <span className="tabular-nums">{formatCurrencyShort(baggageCost)}</span>
                        </div>
                      )}
                      {seatCost > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-ink-400">Seat {selectedSeat}</span>
                          <span className="tabular-nums">{formatCurrencyShort(seatCost)}</span>
                        </div>
                      )}
                      {mealCost > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-ink-400 capitalize">{selectedMeal} meal</span>
                          <span className="tabular-nums">{formatCurrencyShort(mealCost)}</span>
                        </div>
                      )}
                      {insuranceCost > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-ink-400">Travel insurance</span>
                          <span className="tabular-nums">{formatCurrencyShort(insuranceCost)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-line mt-3 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-700">Sub Total</span>
                  <span className="tabular-nums font-medium">{formatCurrencyShort(baseTotal + computedAddonsTotal)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Offer {promoApplied}</span>
                    <span className="tabular-nums">−{formatCurrencyShort(promoDiscount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-line mt-3 pt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-ink-800">You Pay</span>
                  <span className="font-bold text-brand-500 tabular-nums">{formatCurrencyShort(youPay)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="mt-2 p-2 rounded bg-success-bg text-success text-xs text-center">
                    You save {formatCurrencyShort(promoDiscount)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface rounded-xl p-8 text-center max-w-sm">
            <div className="animate-spin w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-ink-500 animate-pulse">Validating fare…</p>
              <p className="text-sm text-ink-500 animate-pulse" style={{ animationDelay: "1.2s" }}>Confirming seats with the airline…</p>
              <p className="text-sm text-ink-500 animate-pulse" style={{ animationDelay: "2.4s" }}>Processing payment…</p>
              <p className="text-sm text-ink-500 animate-pulse" style={{ animationDelay: "3.6s" }}>Issuing your ticket…</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1360px] mx-auto px-4 lg:px-8 py-6">
        <div className="animate-shimmer h-12 rounded-lg mb-6" />
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="animate-shimmer h-[400px] rounded-lg" />
          </div>
          <div className="hidden lg:block w-[380px]">
            <div className="animate-shimmer h-[500px] rounded-lg" />
          </div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
