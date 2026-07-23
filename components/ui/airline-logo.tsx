"use client";

import { cn } from "@/lib/utils";
import { getAirline } from "@/lib/mock/airlines";

interface AirlineLogoProps {
  code: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AirlineLogo({ code, size = "md", className }: AirlineLogoProps) {
  const airline = getAirline(code);

  const sizeMap = { sm: "w-6 h-6 text-[8px]", md: "w-8 h-8 text-[10px]", lg: "w-10 h-10 text-xs" };

  if (!airline) {
    return (
      <div
        className={cn(
          "rounded-md bg-ink-300 text-white flex items-center justify-center font-bold",
          sizeMap[size],
          className
        )}
        aria-label={code}
      >
        {code}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md flex items-center justify-center font-bold text-white",
        sizeMap[size],
        className
      )}
      style={{ backgroundColor: airline.color }}
      aria-label={`${airline.name} (${code})`}
    >
      {airline.logo}
    </div>
  );
}
