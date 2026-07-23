import { Skeleton } from "@/components/ui/skeleton";
import { PerforationNotch } from "@/components/ui/perforated-divider";

export function FlightCardSkeleton() {
  return (
    <div className="relative overflow-hidden bg-surface border border-line rounded-[14px] shadow-e1">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3 mb-2">
          <Skeleton className="w-8 h-8 rounded-md flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-12 rounded-full flex-shrink-0" />
        </div>
      </div>

      {/* Hairline divider */}
      <div className="px-4 h-px bg-line" />

      {/* Route section */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Departure */}
          <div className="text-center flex-1 space-y-1">
            <Skeleton className="h-5 w-12 mx-auto" />
            <Skeleton className="h-3 w-8 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>

          {/* Duration & Stops */}
          <div className="flex flex-col items-center flex-1 gap-1.5">
            <Skeleton className="h-3 w-14" />
            <div className="flex items-center gap-1 w-full justify-center">
              <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
              <Skeleton className="flex-1 h-px" />
              <Skeleton className="w-3.5 h-3.5 rounded-full flex-shrink-0" />
              <Skeleton className="flex-1 h-px" />
              <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Arrival */}
          <div className="text-center flex-1 space-y-1">
            <Skeleton className="h-5 w-12 mx-auto" />
            <Skeleton className="h-3 w-8 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        </div>
      </div>

      {/* Hairline divider */}
      <div className="px-4 h-px bg-line" />

      {/* Price section */}
      <div className="p-4 space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-40" />
        <div className="flex items-center gap-2 mt-3 pt-1">
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="h-9 w-20 rounded-md flex-shrink-0" />
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-line bg-surface-alt">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Perforation notch */}
      <PerforationNotch />
    </div>
  );
}
