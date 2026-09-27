import type { Handler } from "@netlify/functions";
import { getSupabaseAdmin } from "./_supabaseAdmin";
import { hasValidInternalSecret } from "./_internalAuth";

/**
 * POST body: { bookingId }
 * Creates a Google Calendar event for a confirmed booking using a long-lived
 * OAuth refresh token (see docs/GOOGLE_CALENDAR_SETUP.md for how to obtain
 * one for a service/staff calendar). Uses raw REST calls against the Google
 * Calendar API rather than the full googleapis SDK, to keep the function
 * lightweight — swap in the official client library if you need more of the
 * API surface (recurrence, attendee responses, etc).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  if (!hasValidInternalSecret(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const { bookingId } = JSON.parse(event.body || "{}");
    if (!bookingId) return { statusCode: 400, body: JSON.stringify({ error: "Missing bookingId" }) };

    const supabaseAdmin = getSupabaseAdmin();
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select(
        "booking_number, scheduled_date, scheduled_start_time, estimated_duration_minutes, special_requests, services(name), customers(first_name, last_name, phone), properties(address_line1, city, zip)"
      )
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return { statusCode: 404, body: JSON.stringify({ error: "Booking not found" }) };
    }

    const accessToken = await getGoogleAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    const start = new Date(`${booking.scheduled_date}T${booking.scheduled_start_time}`);
    const end = new Date(start.getTime() + booking.estimated_duration_minutes * 60000);

    const service = booking.services as unknown as { name: string } | null;
    const customer = booking.customers as unknown as { first_name: string; last_name: string; phone: string } | null;
    const property = booking.properties as unknown as { address_line1: string; city: string; zip: string } | null;

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `${service?.name ?? "Cleaning"} — ${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim(),
          description: `Booking ${booking.booking_number}\nPhone: ${customer?.phone ?? ""}\n${booking.special_requests ?? ""}`,
          location: property ? `${property.address_line1}, ${property.city} ${property.zip}` : undefined,
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
        }),
      }
    );

    const result = await res.json();
    if (!res.ok) throw new Error(result?.error?.message || "Google Calendar request failed");

    return { statusCode: 200, body: JSON.stringify({ ok: true, eventId: result.id, htmlLink: result.htmlLink }) };
  } catch (err) {
    console.error("google-calendar-sync error", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};

async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Calendar is not configured");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || "Failed to refresh Google access token");
  return data.access_token;
}
