import { supabase } from "@/lib/supabaseClient";

export interface AvailabilitySlot {
  time: string; // "HH:mm:ss"
  label: string;
  capacity: number;
  booked: number;
}

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins: number) {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
}

export function formatSlotTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

const SLOT_INTERVAL_MINUTES = 60;

/**
 * Returns every bookable slot for a given date, given the cleaner
 * availability windows and existing bookings that day. `excludeBookingId`
 * lets a reschedule flow ignore the booking currently being moved so it
 * doesn't count against its own old slot's capacity.
 */
export async function getAvailableSlots(
  dateIso: string,
  durationMinutes: number,
  excludeBookingId?: string
): Promise<AvailabilitySlot[]> {
  const dayOfWeek = new Date(`${dateIso}T00:00:00`).getDay();

  const [availabilityRes, overridesRes, bookingsRes] = await Promise.all([
    supabase.from("availability").select("*").eq("day_of_week", dayOfWeek).eq("is_available", true),
    supabase.from("availability").select("*").eq("date_override", dateIso),
    supabase
      .from("bookings")
      .select("id, scheduled_start_time")
      .eq("scheduled_date", dateIso)
      .not("status", "in", "(cancelled,no_show)"),
  ]);

  const blackoutCleanerIds = new Set(
    (overridesRes.data ?? []).filter((o) => !o.is_available).map((o) => o.cleaner_id)
  );

  const windows = [
    ...(availabilityRes.data ?? []).filter((a) => !blackoutCleanerIds.has(a.cleaner_id)),
    ...(overridesRes.data ?? []).filter((o) => o.is_available),
  ].filter((w) => w.start_time && w.end_time);

  if (windows.length === 0) return [];

  const earliestStart = Math.min(...windows.map((w) => toMinutes(w.start_time)));
  const latestEnd = Math.max(...windows.map((w) => toMinutes(w.end_time)));

  const bookedCounts = new Map<string, number>();
  for (const b of bookingsRes.data ?? []) {
    if (excludeBookingId && b.id === excludeBookingId) continue;
    const key = b.scheduled_start_time as string;
    bookedCounts.set(key, (bookedCounts.get(key) ?? 0) + 1);
  }

  const slots: AvailabilitySlot[] = [];
  for (let t = earliestStart; t + durationMinutes <= latestEnd; t += SLOT_INTERVAL_MINUTES) {
    const timeStr = fromMinutes(t);
    const capacity = windows.filter(
      (w) => toMinutes(w.start_time) <= t && toMinutes(w.end_time) >= t + durationMinutes
    ).length;
    if (capacity > 0) {
      slots.push({ time: timeStr, label: formatSlotTime(timeStr), capacity, booked: bookedCounts.get(timeStr) ?? 0 });
    }
  }
  return slots;
}

/** Convenience check for one specific date/time, used by the reschedule flow. */
export async function isSlotAvailable(
  dateIso: string,
  time: string,
  durationMinutes: number,
  excludeBookingId?: string
): Promise<boolean> {
  const slots = await getAvailableSlots(dateIso, durationMinutes, excludeBookingId);
  const match = slots.find((s) => s.time === time);
  return Boolean(match && match.booked < match.capacity);
}
