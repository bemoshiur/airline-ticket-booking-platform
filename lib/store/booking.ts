import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TravellerInfo {
  id: string;
  type: "adult" | "child" | "kid" | "infant";
  title: string;
  firstName: string;
  surname: string;
  dob: string;
  nationality: string;
  gender: "Male" | "Female";
  passportNumber?: string;
  passportExpiry?: string;
  postalCode?: string;
  frequentFlyerProgram?: string;
  frequentFlyerNumber?: string;
  seat?: string;
  baggage?: string;
  meal?: string;
}

export interface ContactInfo {
  phoneCode: string;
  phone: string;
  email: string;
  whatsappUpdates: boolean;
}

export interface AddonState {
  extraBaggage: Record<string, string>; // travellerId -> option
  seatMap: Record<string, string>; // travellerId -> seatNumber
  meal: Record<string, string>; // travellerId -> mealType
  insurance: boolean;
}

export interface PaymentState {
  method: string;
  promoCode?: string;
  promoDiscount: number;
  cardNumber?: string;
  cardName?: string;
  cardExpiry?: string;
  cardCvv?: string;
  saveCard: boolean;
  acceptedTerms: boolean;
}

export interface BookingCart {
  // Flight info
  searchId: string;
  flightKey: string;
  fareKey: string;

  // Steps
  currentStep: number; // 0-3
  completedSteps: number[];

  // Data
  travellers: TravellerInfo[];
  contact: ContactInfo;
  addons: AddonState;
  payment: PaymentState;

  // Totals (computed)
  baseFare: number;
  taxes: number;
  addonsTotal: number;
  discount: number;
  totalFare: number;
}

interface BookingStore {
  cart: BookingCart | null;
  isProcessing: boolean;

  initCart: (cart: Omit<BookingCart, "currentStep" | "completedSteps" | "addons" | "payment" | "isProcessing">) => void;
  setStep: (step: number) => void;
  completeStep: (step: number) => void;
  setTravellers: (travellers: TravellerInfo[]) => void;
  setContact: (contact: ContactInfo) => void;
  setAddons: (addons: Partial<AddonState>) => void;
  setPayment: (payment: Partial<PaymentState>) => void;
  setPromoCode: (code: string | undefined, discount: number) => void;
  setProcessing: (processing: boolean) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      cart: null,
      isProcessing: false,

      initCart: (cartData) => {
        set({
          cart: {
            ...cartData,
            currentStep: 0,
            completedSteps: [],
            addons: {
              extraBaggage: {},
              seatMap: {},
              meal: {},
              insurance: false,
            },
            payment: {
              method: "",
              promoDiscount: 0,
              saveCard: false,
              acceptedTerms: false,
            },
          },
          isProcessing: false,
        });
      },

      setStep: (step) => {
        set((state) => ({
          cart: state.cart ? { ...state.cart, currentStep: step } : null,
        }));
      },

      completeStep: (step) => {
        set((state) => ({
          cart: state.cart
            ? {
                ...state.cart,
                completedSteps: [...new Set([...state.cart.completedSteps, step])],
              }
            : null,
        }));
      },

      setTravellers: (travellers) => {
        set((state) => ({
          cart: state.cart ? { ...state.cart, travellers } : null,
        }));
      },

      setContact: (contact) => {
        set((state) => ({
          cart: state.cart ? { ...state.cart, contact } : null,
        }));
      },

      setAddons: (addons) => {
        set((state) => ({
          cart: state.cart
            ? { ...state.cart, addons: { ...state.cart.addons, ...addons } }
            : null,
        }));
      },

      setPayment: (payment) => {
        set((state) => ({
          cart: state.cart
            ? { ...state.cart, payment: { ...state.cart.payment, ...payment } }
            : null,
        }));
      },

      setPromoCode: (promoCode, promoDiscount) => {
        set((state) => ({
          cart: state.cart
            ? {
                ...state.cart,
                payment: { ...state.cart.payment, promoCode, promoDiscount },
              }
            : null,
        }));
      },

      setProcessing: (isProcessing) => set({ isProcessing }),

      reset: () => set({ cart: null, isProcessing: false }),
    }),
    {
      name: "airline-booking",
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
);
