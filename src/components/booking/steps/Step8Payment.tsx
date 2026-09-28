import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../BookingContext";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics";
import type { PaymentTiming } from "@/types/database";

const TIMING_OPTIONS: { value: PaymentTiming; label: string; hint: string }[] = [
  { value: "full", label: "Pay in full now", hint: "Charged today via secure Stripe checkout" },
  { value: "deposit", label: "Pay a deposit now", hint: "Remainder due on the day of service" },
  { value: "pay_later", label: "Pay later", hint: "Booking held; pay when service is complete" },
];

export function Step8Payment() {
  const { state, setPaymentTiming, amountDueNow, priceBreakdown, back, bookingId, bookingNumber } = useBooking();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handlePay() {
    if (!bookingId || !priceBreakdown) return;
    setSubmitting(true);
    setError(null);
    track("checkout_started", { timing: state.paymentTiming, amount: amountDueNow });

    try {
      if (state.paymentTiming === "pay_later") {
        const res = await fetch("/.netlify/functions/confirm-pay-later-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });
        if (!res.ok) throw new Error("Could not confirm booking");
        track("booking_completed", { bookingNumber, timing: "pay_later" });
        navigate(`/book/confirmed?booking=${bookingNumber}`);
        return;
      }

      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          amount: amountDueNow,
          customerEmail: state.customer.email,
          description: `${state.service?.name} — Booking ${bookingNumber}`,
          timing: state.paymentTiming,
        }),
      });
      if (!res.ok) throw new Error("Could not start checkout");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // hand off to Stripe Checkout
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-pine-950">Payment</h2>

      <div className="mt-6 space-y-2">
        {TIMING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPaymentTiming(opt.value)}
            className={`flex w-full items-center justify-between rounded-sm border p-4 text-left ${
              state.paymentTiming === opt.value ? "border-pine-700 bg-pine-50" : "border-pine-100 hover:border-pine-300"
            }`}
          >
            <span>
              <span className="block font-medium text-pine-950">{opt.label}</span>
              <span className="mt-0.5 block text-xs text-ink/60">{opt.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-sm bg-pine-50 px-4 py-3">
        <span className="text-sm text-ink/70">Due now</span>
        <span className="font-display text-xl text-pine-950">${amountDueNow.toFixed(2)}</span>
      </div>

      {error && <p className="mt-4 text-sm text-clay-600">{error}</p>}

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={back} disabled={submitting}>Back</Button>
        <Button onClick={handlePay} disabled={submitting || !bookingId}>
          {submitting ? "Processing..." : state.paymentTiming === "pay_later" ? "Confirm booking" : "Continue to secure payment"}
        </Button>
      </div>
    </div>
  );
}
