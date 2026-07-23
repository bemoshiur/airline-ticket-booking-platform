import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionStore {
  isRunning: boolean;
  remainingSeconds: number;
  expired: boolean;

  start: (durationSeconds?: number) => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  expire: () => void;
  reset: () => void;
}

const SESSION_DURATION = 20 * 60; // 20 minutes

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      isRunning: false,
      remainingSeconds: SESSION_DURATION,
      expired: false,

      start: (durationSeconds = SESSION_DURATION) => {
        set({
          isRunning: true,
          remainingSeconds: durationSeconds,
          expired: false,
        });
      },

      tick: () => {
        const { isRunning, remainingSeconds } = get();
        if (!isRunning || remainingSeconds <= 0) return;

        const newRemaining = remainingSeconds - 1;
        if (newRemaining <= 0) {
          set({ remainingSeconds: 0, isRunning: false, expired: true });
        } else {
          set({ remainingSeconds: newRemaining });
        }
      },

      pause: () => set({ isRunning: false }),

      resume: () => {
        const { expired, remainingSeconds } = get();
        if (!expired && remainingSeconds > 0) {
          set({ isRunning: true });
        }
      },

      expire: () => set({ isRunning: false, remainingSeconds: 0, expired: true }),

      reset: () => {
        set({
          isRunning: false,
          remainingSeconds: SESSION_DURATION,
          expired: false,
        });
      },
    }),
    {
      name: "airline-session",
      partialize: (state) => ({
        remainingSeconds: state.remainingSeconds,
        expired: state.expired,
      }),
    }
  )
);
