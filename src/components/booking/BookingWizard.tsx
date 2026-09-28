import { useEffect } from "react";
import { useBooking, TOTAL_STEPS, BookingProvider } from "./BookingContext";
import { Step1Service } from "./steps/Step1Service";
import { Step2PropertyDetails } from "./steps/Step2PropertyDetails";
import { Step3AddOns } from "./steps/Step3AddOns";
import { Step4Pricing } from "./steps/Step4Pricing";
import { Step5Scheduling } from "./steps/Step5Scheduling";
import { Step6CustomerInfo } from "./steps/Step6CustomerInfo";
import { Step7Summary } from "./steps/Step7Summary";
import { Step8Payment } from "./steps/Step8Payment";
import { track } from "@/lib/analytics";

const STEP_LABELS = [
  "Service",
  "Details",
  "Add-ons",
  "Price",
  "Schedule",
  "Your info",
  "Summary",
  "Payment",
];

function WizardBody({ initialServiceSlug }: { initialServiceSlug?: string }) {
  const { state, services } = useBooking();

  useEffect(() => {
    track("booking_started");
  }, []);

  useEffect(() => {
    if (initialServiceSlug && services.length && !state.service) {
      const match = services.find((s) => s.slug === initialServiceSlug);
      if (match) {
        // handled inside Step1Service on mount for selection + tracking
      }
    }
  }, [initialServiceSlug, services, state.service]);

  return (
    <div className="container-site max-w-3xl py-10">
      <ol className="mb-8 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {STEP_LABELS.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === state.step;
          const isDone = stepNum < state.step;
          return (
            <li
              key={label}
              className={`flex items-center gap-1.5 ${
                isActive ? "font-semibold text-pine-900" : isDone ? "text-pine-600" : "text-ink/35"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  isActive ? "bg-pine-800 text-white" : isDone ? "bg-pine-200 text-pine-800" : "bg-pine-50 text-ink/40"
                }`}
              >
                {stepNum}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      <div className="rounded-sm border border-pine-100 bg-white p-6 sm:p-8">
        {state.step === 1 && <Step1Service initialServiceSlug={initialServiceSlug} />}
        {state.step === 2 && <Step2PropertyDetails />}
        {state.step === 3 && <Step3AddOns />}
        {state.step === 4 && <Step4Pricing />}
        {state.step === 5 && <Step5Scheduling />}
        {state.step === 6 && <Step6CustomerInfo />}
        {state.step === 7 && <Step7Summary />}
        {state.step === 8 && <Step8Payment />}
      </div>

      <p className="mt-4 text-center text-xs text-ink/40">Step {state.step} of {TOTAL_STEPS}</p>
    </div>
  );
}

export function BookingWizard({ initialServiceSlug }: { initialServiceSlug?: string }) {
  return (
    <BookingProvider>
      <WizardBody initialServiceSlug={initialServiceSlug} />
    </BookingProvider>
  );
}
