import type { Handler } from "@netlify/functions";
import { getSupabaseAdmin } from "./_supabaseAdmin";
import { internalSecretHeader } from "./_internalAuth";

/**
 * Scheduled function (Netlify Scheduled Functions / cron). Suggested schedule:
 * run daily — see netlify.toml comment below for how to enable it. Finds all
 * confirmed bookings scheduled for tomorrow and sends the 24-hour reminder
 * SMS + email for each.
 *
 * To enable on Netlify, add to netlify.toml:
 *   [[functions."send-reminders-scheduled"]]
 *     schedule = "0 14 * * *"   # 9am Eastern, adjust for your timezone
 */
const SITE_URL = process.env.VITE_SITE_URL || "http://localhost:5173";

export const handler: Handler = async () => {
  const supabaseAdmin = getSupabaseAdmin();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);

  const { data: bookings, error } = await supabaseAdmin
    .from("bookings")
    .select("id, scheduled_date, scheduled_start_time, services(name), customers(first_name, email, phone)")
    .eq("scheduled_date", tomorrowIso)
    .eq("status", "confirmed");

  if (error) {
    console.error("send-reminders-scheduled query error", error);
    return { statusCode: 500, body: "Query failed" };
  }

  for (const booking of bookings ?? []) {
    const customer = booking.customers as unknown as { first_name: string; email: string; phone: string } | null;
    const service = booking.services as unknown as { name: string } | null;
    if (!customer) continue;

    const variables = {
      first_name: customer.first_name,
      service_name: service?.name ?? "your cleaning",
      booking_date: booking.scheduled_date,
      booking_time: booking.scheduled_start_time,
    };

    await Promise.all([
      fetch(`${SITE_URL}/.netlify/functions/send-sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...internalSecretHeader() },
        body: JSON.stringify({ to: customer.phone, templateKey: "reminder_24h", variables, bookingId: booking.id }),
      }),
      fetch(`${SITE_URL}/.netlify/functions/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...internalSecretHeader() },
        body: JSON.stringify({ to: customer.email, templateKey: "reminder_24h", variables, bookingId: booking.id }),
      }),
    ]).catch((err) => console.error("Reminder dispatch failed for booking", booking.id, err));
  }

  return { statusCode: 200, body: JSON.stringify({ sent: bookings?.length ?? 0 }) };
};
