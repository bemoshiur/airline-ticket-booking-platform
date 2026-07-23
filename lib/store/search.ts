import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TripType = "O" | "R" | "M";
export type CabinClass = "economy" | "premium_economy" | "business" | "first";
export type FareType = "REGULAR" | "STUDENT";

export interface MultiCitySegment {
  id: string;
  origin: string;
  destination: string;
  date: string;
}

interface TravellerCounts {
  adult: number;
  child: number;
  kid: number;
  infant: number;
}

interface SearchState {
  // Search parameters
  tripType: TripType;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travellers: TravellerCounts;
  cabinClass: CabinClass;
  fareType: FareType;
  preferredAirlines: string[];
  multiCitySegments: MultiCitySegment[];

  // Validation
  errors: Record<string, string>;

  // Actions
  setTripType: (t: TripType) => void;
  setOrigin: (code: string) => void;
  setDestination: (code: string) => void;
  setDepartureDate: (d: string) => void;
  setReturnDate: (d: string) => void;
  setTravellers: (t: TravellerCounts) => void;
  setCabinClass: (c: CabinClass) => void;
  setFareType: (f: FareType) => void;
  setPreferredAirlines: (a: string[]) => void;
  addMultiCitySegment: () => void;
  removeMultiCitySegment: (id: string) => void;
  updateMultiCitySegment: (id: string, data: Partial<MultiCitySegment>) => void;
  swapAirports: () => void;
  validate: () => boolean;
  reset: () => void;
}

const defaultTravellers: TravellerCounts = { adult: 1, child: 0, kid: 0, infant: 0 };

const initialState = {
  tripType: "O" as TripType,
  origin: "DAC",
  destination: "CXB",
  departureDate: "",
  returnDate: "",
  travellers: defaultTravellers,
  cabinClass: "economy" as CabinClass,
  fareType: "REGULAR" as FareType,
  preferredAirlines: [] as string[],
  multiCitySegments: [] as MultiCitySegment[],
  errors: {} as Record<string, string>,
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTripType: (tripType) => {
        const state = { tripType };
        if (tripType === "O") {
          Object.assign(state, { returnDate: "" });
        }
        if (tripType === "M") {
          const segs = get().multiCitySegments;
          if (segs.length === 0) {
            Object.assign(state, {
              multiCitySegments: [
                { id: "1", origin: get().origin, destination: "", date: get().departureDate },
                { id: "2", origin: "", destination: "", date: "" },
              ],
            });
          }
        }
        set(state);
      },

      setOrigin: (origin) => set({ origin }),
      setDestination: (destination) => set({ destination }),
      setDepartureDate: (departureDate) => set({ departureDate }),
      setReturnDate: (returnDate) => set({ returnDate }),

      setTravellers: (travellers) => set({ travellers }),
      setCabinClass: (cabinClass) => set({ cabinClass }),
      setFareType: (fareType) => set({ fareType }),
      setPreferredAirlines: (preferredAirlines) => set({ preferredAirlines }),

      addMultiCitySegment: () => {
        const segments = get().multiCitySegments;
        if (segments.length >= 6) return;
        set({
          multiCitySegments: [
            ...segments,
            { id: String(Date.now()), origin: "", destination: "", date: "" },
          ],
        });
      },

      removeMultiCitySegment: (id) => {
        const segments = get().multiCitySegments.filter((s) => s.id !== id);
        set({ multiCitySegments: segments });
      },

      updateMultiCitySegment: (id, data) => {
        const segments = get().multiCitySegments.map((s) =>
          s.id === id ? { ...s, ...data } : s
        );
        set({ multiCitySegments: segments });
      },

      swapAirports: () => {
        const { origin, destination } = get();
        set({ origin: destination, destination: origin });
      },

      validate: () => {
        const state = get();
        const errors: Record<string, string> = {};

        if (!state.origin) errors.origin = "Please select origin";
        if (!state.destination) errors.destination = "Please select destination";
        if (state.origin === state.destination) errors.destination = "Origin and destination must be different";
        if (!state.departureDate) errors.departureDate = "Please select departure date";
        if (state.tripType === "R" && !state.returnDate) errors.returnDate = "Please select return date";

        const { adult, child, kid, infant } = state.travellers;
        if (adult + child + kid > 9) errors.travellers = "Maximum 9 seated passengers";
        if (infant > adult) errors.travellers = "Infants cannot exceed adults";
        if (adult < 1) errors.travellers = "At least 1 adult required";
        if ((child > 0 || kid > 0 || infant > 0) && adult < 1) {
          errors.travellers = "Children must travel with at least one adult";
        }

        if (state.tripType === "M") {
          state.multiCitySegments.forEach((seg, idx) => {
            if (!seg.origin) errors[`mc_${idx}_origin`] = "Required";
            if (!seg.destination) errors[`mc_${idx}_destination`] = "Required";
            if (seg.origin === seg.destination) errors[`mc_${idx}_destination`] = "Must be different";
          });
        }

        set({ errors });
        return Object.keys(errors).length === 0;
      },

      reset: () => set(initialState),
    }),
    {
      name: "airline-search",
      partialize: (state) => ({
        tripType: state.tripType,
        origin: state.origin,
        destination: state.destination,
        departureDate: state.departureDate,
        returnDate: state.returnDate,
        travellers: state.travellers,
        cabinClass: state.cabinClass,
        fareType: state.fareType,
        preferredAirlines: state.preferredAirlines,
      }),
    }
  )
);
