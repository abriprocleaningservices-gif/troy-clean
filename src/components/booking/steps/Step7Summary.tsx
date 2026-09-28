import { useState } from "react";
import { format, parse } from "date-fns";
import { useBooking } from "../BookingContext";
import { Button } from "@/components/ui/Button";

export function Step7Summary() {
  const { state, priceBreakdown, back, next, createBookingRecord, creatingBooking, createBookingError } =
    useBooking();
  const [localError, setLocalError] = useState<string | null>(null);

  if (!state.service || !priceBreakdown) return null;

  const dateLabel = state.scheduledDate ? format(new Date(`${state.scheduledDate}T00:00:00`), "EEEE, MMMM d, yyyy") : "";
  const timeLabel = state.scheduledTime
    ? format(parse(state.scheduledTime, "HH:mm:ss", new Date()), "h:mm a")
    : "";

  async function handleContinue() {
    setLocalError(null);
    const result = await createBookingRecord();
    if (!result) {
      setLocalError(createBookingError || "Could not save your booking. Please review your details and try again.");
      return;
    }
    next();
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-pine-950">Review your booking</h2>

      <dl className="mt-6 space-y-4 text-sm">
        <Row label="Service" value={state.service.name} />
        <Row label="Date & time" value={`${dateLabel} at ${timeLabel}`} />
        <Row
          label="Property"
          value={`${state.customer.address}, ${state.customer.city}, MI ${state.customer.zip}`}
        />
        <Row label="Contact" value={`${state.customer.firstName} ${state.customer.lastName} · ${state.customer.phone} · ${state.customer.email}`} />
        {state.selectedAddonIds.length > 0 && (
          <Row label="Add-ons" value={priceBreakdown.addonLines.map((l) => l.label).join(", ")} />
        )}
        <Row label="Estimated total" value={`$${priceBreakdown.total.toFixed(2)}`} emphasize />
      </dl>

      {(localError || createBookingError) && (
        <p className="mt-4 text-sm text-clay-600">{localError || createBookingError}</p>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={back} disabled={creatingBooking}>Back</Button>
        <Button onClick={handleContinue} disabled={creatingBooking}>
          {creatingBooking ? "Saving..." : "Continue to payment"}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-pine-100 pb-3 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-ink/50">{label}</dt>
      <dd className={emphasize ? "font-display text-lg text-pine-950" : "text-ink/90"}>{value}</dd>
    </div>
  );
}
