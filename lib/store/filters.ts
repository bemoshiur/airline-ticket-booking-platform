import { create } from "zustand";

export interface FilterState {
  priceMin: number;
  priceMax: number;
  stops: string[]; // "0", "1", "2+"
  airlines: string[];
  departureTimeRange: [number, number]; // hours 0-23
  arrivalTimeRange: [number, number];
  baggage: string[];
  refundable: string[];
  layoverMin: number;
  layoverMax: number;
  layoverAirports: string[];
  departureAirports: string[];
  arrivalAirports: string[];
  aircraft: string[];
}

interface FiltersStore {
  filters: FilterState;
  activeFilterCount: number;
  sortMode: "cheapest" | "fastest" | "earliest" | "combo";

  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  setSortMode: (mode: "cheapest" | "fastest" | "earliest" | "combo") => void;
  computeActiveCount: () => void;
}

const defaultFilters: FilterState = {
  priceMin: 0,
  priceMax: 99999,
  stops: [],
  airlines: [],
  departureTimeRange: [0, 23],
  arrivalTimeRange: [0, 23],
  baggage: [],
  refundable: [],
  layoverMin: 0,
  layoverMax: 900,
  layoverAirports: [],
  departureAirports: [],
  arrivalAirports: [],
  aircraft: [],
};

function getActiveCount(f: FilterState): number {
  let count = 0;
  if (f.priceMin > 0 || f.priceMax < 99999) count++;
  if (f.stops.length > 0) count++;
  if (f.airlines.length > 0) count++;
  if (f.departureTimeRange[0] > 0 || f.departureTimeRange[1] < 23) count++;
  if (f.arrivalTimeRange[0] > 0 || f.arrivalTimeRange[1] < 23) count++;
  if (f.baggage.length > 0) count++;
  if (f.refundable.length > 0) count++;
  if (f.layoverMin > 0 || f.layoverMax < 900) count++;
  if (f.layoverAirports.length > 0) count++;
  if (f.departureAirports.length > 0) count++;
  if (f.arrivalAirports.length > 0) count++;
  if (f.aircraft.length > 0) count++;
  return count;
}

export const useFiltersStore = create<FiltersStore>()((set, get) => ({
  filters: { ...defaultFilters },
  activeFilterCount: 0,
  sortMode: "cheapest",

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
    get().computeActiveCount();
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
    get().computeActiveCount();
  },

  setSortMode: (sortMode) => set({ sortMode }),

  computeActiveCount: () => {
    const count = getActiveCount(get().filters);
    set({ activeFilterCount: count });
  },
}));
