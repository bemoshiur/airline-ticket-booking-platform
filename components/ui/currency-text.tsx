"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, formatCurrencyShort, type Currency } from "@/lib/utils/currency";

interface CurrencyTextProps {
  amount: number;
  currency?: Currency;
  short?: boolean;
  className?: string;
  strike?: boolean;
  tabular?: boolean;
}

export function CurrencyText({
  amount,
  currency,
  short = false,
  className,
  strike = false,
  tabular = true,
}: CurrencyTextProps) {
  const formatted = short
    ? formatCurrencyShort(amount, currency)
    : formatCurrency(amount, currency);

  return (
    <span
      className={cn(
        tabular && "tabular-nums",
        strike && "line-through text-ink-400",
        className
      )}
    >
      {formatted}
    </span>
  );
}
