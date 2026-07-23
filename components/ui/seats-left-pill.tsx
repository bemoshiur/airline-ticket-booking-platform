"use client";

import { cn } from "@/lib/utils";

interface SeatsLeftPillProps {
  seats: number;
  className?: string;
}

export function SeatsLeftPill({ seats, className }: SeatsLeftPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-label text-urgent bg-urgent-bg border border-urgent",
        className
      )}
    >
      ⚠ {seats} seat(s) left
    </span>
  );
}
