"use client";

import { cn } from "@/lib/utils";

interface RefundPillProps {
  refundable: boolean;
  className?: string;
}

export function RefundPill({ refundable, className }: RefundPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label",
        refundable
          ? "text-success bg-success-bg"
          : "text-danger bg-danger-bg",
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          refundable ? "bg-success" : "bg-danger"
        )}
      />
      {refundable ? "Partially Refundable" : "Non-Refundable"}
    </span>
  );
}
