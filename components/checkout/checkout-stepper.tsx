import { Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, label: "Traveller Info", key: "traveller" },
  { num: 2, label: "Add-ons", key: "addons" },
  { num: 3, label: "Payment", key: "payment" },
  { num: 4, label: "Preview", key: "preview" },
];

export function CheckoutStepper({
  currentStep,
  completedSteps,
  onGoToStep,
  remainingSeconds,
}: {
  currentStep: number;
  completedSteps: number[];
  onGoToStep: (step: number) => void;
  remainingSeconds: number;
}) {
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex items-center mb-6 rounded-lg overflow-hidden">
      {STEPS.map((step, idx) => {
        const isActive = currentStep === idx;
        const isCompleted = completedSteps.includes(idx);
        const isClickable = isCompleted || idx <= currentStep;
        return (
          <button
            key={step.key}
            onClick={() => isClickable && onGoToStep(idx)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all relative",
              "clip-path-chevron",
              isActive ? "bg-brand-800 text-white" : isCompleted ? "bg-brand-700 text-white/80" : "bg-ink-300 text-white/50 cursor-not-allowed",
              idx < STEPS.length - 1 && "mr-[-12px]"
            )}
            style={{
              clipPath: idx < STEPS.length - 1
                ? "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)"
                : "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            }}
          >
            {isCompleted ? (
              <Check size={16} />
            ) : (
              <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">
                {step.num}
              </span>
            )}
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        );
      })}

      {/* Session Timer */}
      <div className="ml-auto flex items-center gap-2 px-4 py-3 bg-surface border border-line rounded-r-lg">
        <Clock size={16} className={cn(remainingSeconds <= 300 ? "text-brand-500" : "text-ink-400")} />
        <span className={cn("text-sm tabular-nums font-medium", remainingSeconds <= 300 && "text-brand-500 animate-pulse")}>
          {formatTime(remainingSeconds)}
        </span>
      </div>
    </div>
  );
}
