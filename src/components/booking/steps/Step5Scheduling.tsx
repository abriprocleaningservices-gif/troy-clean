import { useEffect, useMemo, useState } from "react";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import { useBooking } from "../BookingContext";
import { supabase } from "@/lib/supabaseClient";
import { getAvailableSlots, type AvailabilitySlot } from "@/lib/availability";
import { Button } from "@/components/ui/Button";

const DAYS_AHEAD = 14;
const DEFAULT_LEAD_TIME_HOURS = 24;

export function Step5Scheduling() {
  const { state, setSchedule, next, back, priceBreakdown } = useBooking();
  const [selectedDate, setSelectedDate] = useState<string | null>(state.scheduledDate);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [leadTimeHours, setLeadTimeHours] = useState(DEFAULT_LEAD_TIME_HOURS);

  const dateOptions = useMemo(() => {
    const earliestAllowed = addDays(new Date(), Math.ceil(leadTimeHours / 24));
    const days: { iso: string; label: string; disabled: boolean }[] = [];
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = addDays(startOfDay(new Date()), i);
      days.push({
        iso: format(d, "yyyy-MM-dd"),
        label: format(d, "EEE, MMM d"),
        disabled: isBefore(d, startOfDay(earliestAllowed)),
      });
    }
    return days;
  }, [leadTimeHours]);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("booking_lead_time_hours")
      .single()
      .then(({ data }) => {
        if (data) setLeadTimeHours(data.booking_lead_time_hours);
      });
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    getAvailableSlots(selectedDate, priceBreakdown?.estimatedDurationMinutes ?? 120)
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, priceBreakdown?.estimatedDurationMinutes]);

  const canContinue = Boolean(selectedDate && state.scheduledTime);

  return (
    <div>
      <h2 className="font-display text-2xl text-pine-950">Choose a date and time</h2>
      <p className="mt-1 text-sm text-ink/60">Availability reflects real cleaner schedules — no double-booking.</p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {dateOptions.map((d) => (
          <button
            key={d.iso}
            type="button"
            disabled={d.disabled}
            onClick={() => {
              setSelectedDate(d.iso);
              setSchedule(d.iso, "");
            }}
            className={`shrink-0 rounded-sm border px-3.5 py-2.5 text-sm ${
              selectedDate === d.iso
                ? "border-pine-700 bg-pine-50 text-pine-900"
                : "border-pine-100 text-ink/70 hover:border-pine-300"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {selectedDate && (
        <div className="mt-6">
          {loadingSlots ? (
            <p className="text-sm text-ink/50">Checking availability...</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-ink/50">No availability this day. Try another date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => {
                const isFull = slot.booked >= slot.capacity;
                const isSelected = state.scheduledTime === slot.time;
                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={isFull}
                    onClick={() => setSchedule(selectedDate, slot.time)}
                    className={`rounded-sm border px-2 py-2 text-sm ${
                      isSelected
                        ? "border-pine-700 bg-pine-700 text-white"
                        : "border-pine-100 text-ink/80 hover:border-pine-300"
                    } disabled:cursor-not-allowed disabled:opacity-30`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={back}>Back</Button>
        <Button onClick={next} disabled={!canContinue}>Continue</Button>
      </div>
    </div>
  );
}
