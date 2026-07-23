"use client";

import { MotionConfig } from "framer-motion";
import { DURATION, EASE_ENTRANCE } from "@/lib/motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      transition={{ duration: DURATION.fast, ease: EASE_ENTRANCE }}
      reducedMotion="user"
    >
      {children}
    </MotionConfig>
  );
}
