import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type SavedTraveller, savedTravellers as initialTravellers } from "@/lib/mock/travellers";

interface TravellersStore {
  travellers: SavedTraveller[];
  addTraveller: (traveller: SavedTraveller) => void;
  updateTraveller: (id: string, traveller: Partial<SavedTraveller>) => void;
  deleteTraveller: (id: string) => void;
}

export const useTravellersStore = create<TravellersStore>()(
  persist(
    (set) => ({
      travellers: initialTravellers,

      addTraveller: (traveller) =>
        set((state) => ({
          travellers: [...state.travellers, traveller],
        })),

      updateTraveller: (id, updatedFields) =>
        set((state) => ({
          travellers: state.travellers.map((t) =>
            t.id === id ? { ...t, ...updatedFields } : t
          ),
        })),

      deleteTraveller: (id) =>
        set((state) => ({
          travellers: state.travellers.filter((t) => t.id !== id),
        })),
    }),
    {
      name: "airline-travellers-store",
    }
  )
);
