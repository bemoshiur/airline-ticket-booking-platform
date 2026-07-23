"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAirline } from "@/lib/mock/airlines";
import { getAirport } from "@/lib/mock/airports";
import { getFareFamily } from "@/lib/mock/fares";
import { getPromo, calculateDiscount } from "@/lib/mock/promos";
import { fakeLatency } from "@/lib/utils/fakeLatency";
import { formatCurrencyShort } from "@/lib/utils/currency";
import { formatDuration } from "@/lib/utils/duration";
import { useSessionStore } from "@/lib/store/session";
import { useBookingsStore } from "@/lib/store/bookings";
import { useTravellersStore } from "@/lib/store/travellers";
import { AirlineLogo } from "@/components/ui/airline-logo";
import { PerforatedDivider } from "@/components/ui/perforated-divider";
import { format } from "date-fns";
import { CheckoutStepper } from "@/components/checkout/checkout-stepper";
import { FareSummary } from "@/components/checkout/fare-summary";
import { TravellerStep, type Traveller } from "@/components/checkout/traveller-step";
import { AddonsStep } from "@/components/checkout/addons-step";
import { PaymentStep } from "@/components/checkout/payment-step";
import { PreviewStep } from "@/components/checkout/preview-step";
import { generateBookingReference } from "@/lib/utils/booking";

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
  const bookingsStore = useBookingsStore();
  const travellersStore = useTravellersStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Flight details from params
  const searchId = searchParams.get("searchId") || "mock-search-id";
  const flightKey = searchParams.get("flightKey") || "BS-159";
  const fareKey = searchParams.get("fareKey") || "econ_std";

  const [airlineCode, flightNum] = flightKey.split("-");
  const airline = getAirline(airlineCode);
  const fareFamily = getFareFamily(fareKey);

  // Pricing
  const baseFare = 3031;
  const taxes = 1139;
  const totalPax = 1;
  const baseTotal = (baseFare + taxes) * totalPax;

  // Form state
  const [travellers, setTravellers] = useState<Traveller[]>([
    {
      id: "1",
      title: "Mr.",
      firstName: "",
      surname: "",
      dob: "",
      nationality: "Bangladeshi",
      gender: "Male",
      passportNumber: "",
      passportExpiry: "",
    },
  ]);
  const [contact, setContact] = useState({
    phoneCode: "+880",
    phone: "",
    email: "",
    whatsapp: false,
  });

  // Add-ons state
  const [selectedBaggage, setSelectedBaggage] = useState("included");
  const [selectedSeat, setSelectedSeat] = useState("standard");
  const [selectedMeal, setSelectedMeal] = useState("standard");
  const [insuranceOpted, setInsuranceOpted] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [cardName, setCardName] = useState("S M Moshiur Rahman");
  const [cardExpiry, setCardExpiry] = useState("09/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [saveCard, setSaveCard] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Computed totals
  const baggageCost =
    selectedBaggage === "+5" ? 600 : selectedBaggage === "+10" ? 1200 : selectedBaggage === "+20" ? 2300 : 0;
  const seatCost = selectedSeat === "premium" ? 300 : 0;
  const mealCost = selectedMeal !== "standard" ? 350 : 0;
  const insuranceCost = insuranceOpted ? 450 : 0;
  const addonsTotal = baggageCost + seatCost + mealCost + insuranceCost;
  const totalFare = baseTotal + addonsTotal - promoDiscount;

  // Session timer
  useEffect(() => {
    session.start(20 * 60);
    const interval = setInterval(() => session.tick(), 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Format time
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Handle promo code
  const handlePromoApply = (code: string) => {
    const promo = getPromo(code.toUpperCase());
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
    setPromoApplied(code.toUpperCase());
    setPromoError("");
    setPromoCode("");
  };

  // Handle step completion
  const handleStepComplete = () => {
    if (currentStep < 3) {
      setCompletedSteps([...new Set([...completedSteps, currentStep])]);
      setCurrentStep(currentStep + 1);
    } else {
      handleConfirm();
    }
  };

  // Handle booking confirmation
  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await fakeLatency(2000, 3000);

      // Generate booking reference
      const reference = generateBookingReference();
      const pnr = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create booking object
      const now = new Date().toISOString();
      const booking = {
        reference,
        pnr,
        status: "Confirmed" as const,
        route: "DAC-CXB",
        origin: "DAC",
        destination: "CXB",
        departureDate: format(new Date(), "yyyy-MM-dd"),
        tripType: "one_way" as const,
        baseFare,
        taxes,
        discount: promoDiscount,
        totalFare,
        paymentMethod,
        transactionId: `TXN-${Date.now()}`,
        paidAt: now,
        issuedAt: now,
        travellers: travellers.map((t) => ({
          title: t.title,
          firstName: t.firstName,
          surname: t.surname,
          type: "adult" as const,
          dob: t.dob,
          nationality: t.nationality,
          passportNumber: t.passportNumber,
          seat: selectedSeat === "premium" ? "12A" : "15C",
          baggage: selectedBaggage,
          meal: selectedMeal,
        })),
        segments: [
          {
            airline: airline?.code || airlineCode,
            flightNumber: flightNum,
            origin: "DAC",
            destination: "CXB",
            departureDate: format(new Date(), "yyyy-MM-dd"),
            departureTime: "08:30",
            arrivalTime: "10:35",
            duration: 65,
            cabin: fareFamily?.name || "Economy",
            aircraft: "B787",
          },
        ],
        activities: [
          {
            timestamp: now,
            action: "Booking confirmed",
            actor: "System",
            detail: "Booking completed successfully",
          },
        ],
      };

      // Save to bookings store
      bookingsStore.addBooking(booking);

      // Redirect to confirmation page
      router.push(`/booking/confirmation/${reference}?pnr=${pnr}`);
    } catch (error) {
      console.error("Booking failed:", error);
      setIsProcessing(false);
    }
  };

  // Navigate to step
  const goToStep = (step: number) => {
    if (completedSteps.includes(step) || step <= currentStep) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 lg:px-8 py-6">
      {/* Checkout Stepper */}
      <CheckoutStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onGoToStep={goToStep}
        remainingSeconds={session.remainingSeconds}
      />

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Flight Details Card */}
          <div className="bg-surface border border-line rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <AirlineLogo code={airlineCode} />
              <div className="flex-1">
                <div className="font-semibold text-ink-800">
                  {airline?.name} • {flightKey}
                </div>
                <div className="text-sm text-ink-400 mt-0.5">
                  {format(new Date(), "d MMM yyyy")} • {formatDuration(65)} •{" "}
                  {fareFamily?.name || "Economy"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-fare text-ink-800">
                  {formatCurrencyShort(baseTotal)}
                </div>
                <div className="text-xs text-ink-400">{totalPax} Traveller</div>
              </div>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 0 && (
            <TravellerStep
              travellers={travellers}
              contact={contact}
              onTravellersChange={setTravellers}
              onContactChange={setContact}
              onComplete={handleStepComplete}
            />
          )}

          {currentStep === 1 && (
            <AddonsStep
              baggage={selectedBaggage}
              seat={selectedSeat}
              meal={selectedMeal}
              insurance={insuranceOpted}
              onBaggageChange={setSelectedBaggage}
              onSeatChange={setSelectedSeat}
              onMealChange={setSelectedMeal}
              onInsuranceChange={setInsuranceOpted}
              onComplete={handleStepComplete}
            />
          )}

          {currentStep === 2 && (
            <PaymentStep
              method={paymentMethod}
              promoCode={promoCode}
              promoDiscount={promoDiscount}
              promoApplied={promoApplied}
              promoError={promoError}
              cardNumber={cardNumber}
              cardName={cardName}
              cardExpiry={cardExpiry}
              cardCvv={cardCvv}
              saveCard={saveCard}
              acceptedTerms={acceptedTerms}
              totalFare={totalFare}
              onMethodChange={setPaymentMethod}
              onPromoCodeChange={setPromoCode}
              onPromoApply={handlePromoApply}
              onCardChange={(field, value) => {
                if (field === "cardNumber") setCardNumber(value);
                if (field === "cardName") setCardName(value);
                if (field === "cardExpiry") setCardExpiry(value);
                if (field === "cardCvv") setCardCvv(value);
              }}
              onSaveCardChange={setSaveCard}
              onTermsChange={setAcceptedTerms}
              onComplete={handleStepComplete}
            />
          )}

          {currentStep === 3 && (
            <PreviewStep
              airline={airline?.name || ""}
              flightNum={flightNum}
              departure={{
                code: "DAC",
                time: "08:30",
                date: format(new Date(), "d MMM yyyy"),
              }}
              arrival={{ code: "CXB", time: "10:35" }}
              travellers={travellers}
              contact={contact}
              baggage={selectedBaggage}
              seat={selectedSeat}
              meal={selectedMeal}
              insurance={insuranceOpted}
              totalFare={totalFare}
              isProcessing={isProcessing}
              onConfirm={handleConfirm}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="w-full lg:w-80 space-y-6">
          <FareSummary
            remainingSeconds={session.remainingSeconds}
            airlineCode={airlineCode}
            airlineName={airline?.name}
            flightKey={flightKey}
            baseFare={baseFare}
            taxes={taxes}
            computedAddonsTotal={addonsTotal}
            baggageCost={baggageCost}
            seatCost={seatCost}
            selectedSeat={selectedSeat}
            selectedMeal={selectedMeal}
            mealCost={mealCost}
            insuranceCost={insuranceCost}
            promoDiscount={promoDiscount}
            promoApplied={promoApplied}
            youPay={totalFare}
          />
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
