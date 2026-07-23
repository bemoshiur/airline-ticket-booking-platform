import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Booking, bookings as initialBookings } from "@/lib/mock/bookings";

interface BookingsStore {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  cancelBooking: (reference: string, reason: string) => void;
}

export const useBookingsStore = create<BookingsStore>()(
  persist(
    (set) => ({
      bookings: initialBookings, // Initialize with mock data

      addBooking: (booking) =>
        set((state) => ({
          bookings: [booking, ...state.bookings], // Prepend new bookings
        })),

      cancelBooking: (reference, reason) =>
        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.reference === reference) {
              return {
                ...b,
                status: "Cancellation Requested",
                activities: [
                  ...b.activities,
                  {
                    timestamp: new Date().toISOString(),
                    action: "Cancellation requested",
                    actor: "Customer",
                    detail: reason,
                  },
                ],
              };
            }
            return b;
          }),
        })),
    }),
    {
      name: "airline-bookings-store",
    }
  )
);
