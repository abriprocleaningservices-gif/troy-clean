import type { Handler } from "@netlify/functions";
import { getSupabaseAdmin } from "./_supabaseAdmin";
import { internalSecretHeader } from "./_internalAuth";

const SITE_URL = process.env.VITE_SITE_URL || "http://localhost:5173";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { bookingId } = JSON.parse(event.body || "{}");
    if (!bookingId) return { statusCode: 400, body: JSON.stringify({ error: "Missing bookingId" }) };

    const supabaseAdmin = getSupabaseAdmin();

    // Idempotency: only transition + notify from an unconfirmed state. If this
    // booking is already confirmed (e.g. the customer double-clicked, or a
    // retry came in), just return success without re-sending notifications.
    const { data: existing } = await supabaseAdmin.from("bookings").select("status").eq("id", bookingId).single();
    if (!existing) {
      return { statusCode: 404, body: JSON.stringify({ error: "Booking not found" }) };
    }
    if (!["requested", "pending_payment"].includes(existing.status)) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, alreadyConfirmed: true }) };
    }

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId)
      .select(
        "booking_number, scheduled_date, scheduled_start_time, total_price, services(name), customers(first_name, email, phone)"
      )
      .single();

    if (error || !booking) {
      return { statusCode: 404, body: JSON.stringify({ error: "Booking not found" }) };
    }

    const customer = booking.customers as unknown as { first_name: string; email: string; phone: string } | null;
    const service = booking.services as unknown as { name: string } | null;

    if (customer) {
      await Promise.all([
        fetch(`${SITE_URL}/.netlify/functions/send-sms`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...internalSecretHeader() },
          body: JSON.stringify({
            to: customer.phone,
            templateKey: "booking_confirmation",
            bookingId,
            variables: {
              first_name: customer.first_name,
              service_name: service?.name ?? "your cleaning",
              booking_date: booking.scheduled_date,
              booking_time: booking.scheduled_start_time,
            },
          }),
        }),
        fetch(`${SITE_URL}/.netlify/functions/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...internalSecretHeader() },
          body: JSON.stringify({
            to: customer.email,
            templateKey: "booking_confirmation",
            bookingId,
            variables: {
              first_name: customer.first_name,
              service_name: service?.name ?? "your cleaning",
              booking_date: booking.scheduled_date,
              booking_time: booking.scheduled_start_time,
              total_price: `$${Number(booking.total_price).toFixed(2)}`,
            },
          }),
        }),
      ]).catch((err) => console.error("Notification dispatch failed", err));
    }

    if (process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
      fetch(`${SITE_URL}/.netlify/functions/google-calendar-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...internalSecretHeader() },
        body: JSON.stringify({ bookingId }),
      }).catch((err) => console.error("Calendar sync dispatch failed", err));
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, bookingNumber: booking.booking_number }) };
  } catch (err) {
    console.error("confirm-pay-later-booking error", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
