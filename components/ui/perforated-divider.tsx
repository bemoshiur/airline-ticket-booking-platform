"use client";

import { cn } from "@/lib/utils";

interface PerforatedDividerProps {
  className?: string;
  height?: number;
}

/**
 * The signature boarding-pass perforation.
 * A dashed vertical rule with two semicircular notches at top and bottom.
 * Used in: flight card, e-ticket, booking detail header.
 */
export function PerforatedDivider({ className, height = 132 }: PerforatedDividerProps) {
  return (
    <div
      className={cn("relative w-px flex-shrink-0", className)}
      style={{ height }}
      aria-hidden="true"
    >
      {/* Dashed line */}
      <div className="absolute inset-y-0 left-0 w-px" style={{
        background: "repeating-linear-gradient(to bottom, var(--color-line-strong) 0, var(--color-line-strong) 4px, transparent 4px, transparent 8px)",
      }} />

      {/* Top notch */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
        style={{
          top: -6,
          backgroundColor: "var(--color-canvas)",
        }}
      />

      {/* Bottom notch */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
        style={{
          bottom: -6,
          backgroundColor: "var(--color-canvas)",
        }}
      />
    </div>
  );
}

/**
 * Single ornamental notch on card's right edge — boarding-pass signature motif.
 * Positioned at vertical center; semicircular bite exposes canvas background.
 */
export function PerforationNotch({ className }: { className?: string }) {
  return (
    <div
      className={cn("absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full", className)}
      style={{
        right: -6,
        backgroundColor: "var(--color-canvas)",
        boxShadow: "inset 0 1px 2px rgb(0 0 0 / 0.08)",
      }}
      aria-hidden="true"
    />
  );
}
