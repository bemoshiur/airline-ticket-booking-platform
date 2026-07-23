"use client";

import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";

interface PromoChipProps {
  code: string;
  className?: string;
  onRemove?: () => void;
}

export function PromoChip({ code, className, onRemove }: PromoChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-label text-brand-800 bg-brand-100 border border-dashed border-brand-300",
        className
      )}
    >
      <Tag size={12} />
      {code}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:text-brand-600 focus-ring rounded-sm"
          aria-label={`Remove promo code ${code}`}
        >
          ✕
        </button>
      )}
    </span>
  );
}
