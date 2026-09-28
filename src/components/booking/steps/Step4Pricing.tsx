import { useEffect } from "react";
import { useBooking } from "../BookingContext";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics";

export function Step4Pricing() {
  const { priceBreakdown, next, back } = useBooking();

  useEffect(() => {
    if (priceBreakdown) {
      track("quote_generated", { total: priceBreakdown.total });
    }
  }, [priceBreakdown]);

  if (!priceBreakdown) {
    return <p className="text-sm text-ink/60">Calculating your price...</p>;
  }

  const allLines = [...priceBreakdown.lines, ...priceBreakdown.addonLines];

  return (
    <div>
      <h2 className="font-display text-2xl text-pine-950">Your estimated price</h2>
      <p className="mt-1 text-sm text-ink/60">
        Estimated duration: {Math.round(priceBreakdown.estimatedDurationMinutes / 60 * 10) / 10} hours
      </p>

      <div className="mt-6 divide-y divide-pine-100 rounded-sm border border-pine-100">
        {allLines.map((line, idx) => (
          <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-ink/80">{line.label}</span>
            <span className="font-medium text-pine-900">${line.amount.toFixed(2)}</span>
          </div>
        ))}
        {priceBreakdown.discountTotal > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-ink/80">Recurring discount</span>
            <span className="font-medium text-clay-600">-${priceBreakdown.discountTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
          <span className="text-ink/80">Tax</span>
          <span className="font-medium text-pine-900">${priceBreakdown.taxTotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between bg-pine-50 px-4 py-3">
          <span className="font-display text-lg text-pine-950">Total</span>
          <span className="font-display text-lg text-pine-950">${priceBreakdown.total.toFixed(2)}</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink/50">
        This is an estimate based on the details you provided. Your final price is confirmed once the booking is
        placed.
      </p>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={back}>Back</Button>
        <Button onClick={next}>Continue to scheduling</Button>
      </div>
    </div>
  );
}
