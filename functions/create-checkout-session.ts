import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { getSupabaseAdmin } from "./_supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const SITE_URL = process.env.VITE_SITE_URL || "http://localhost:5173";

/**
 * POST body: { bookingId, amount, customerEmail, description, timing }
 * `amount` is the dollar amount due NOW (full price or deposit — computed
 * client-side by the pricing engine, but re-validated here against the
 * booking's stored total before creating the session).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { bookingId, amount, customerEmail, description, timing } = JSON.parse(event.body || "{}");

    if (!bookingId || !amount || !customerEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("id, total_price, payment_timing, payment_status, booking_number")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return { statusCode: 404, body: JSON.stringify({ error: "Booking not found" }) };
    }

    // Idempotency: don't let a double-click or a retried request open a
    // second Checkout Session (and risk a second charge) against a booking
    // that's already been paid.
    if (booking.payment_status === "paid") {
      return { statusCode: 409, body: JSON.stringify({ error: "This booking has already been paid." }) };
    }

    // Re-validate the charged amount server-side rather than trusting the client.
    const depositPercent = 25; // falls back to the seeded default; production should read site_settings
    const expectedAmount =
      timing === "deposit" ? Math.round(Number(booking.total_price) * (depositPercent / 100) * 100) / 100 : Number(booking.total_price);

    if (Math.abs(expectedAmount - Number(amount)) > 0.5) {
      return { statusCode: 400, body: JSON.stringify({ error: "Amount mismatch — please refresh and try again." }) };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: description || `Booking ${booking.booking_number}` },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { booking_id: bookingId, timing: timing || "full" },
      success_url: `${SITE_URL}/book/confirmed?booking=${booking.booking_number}`,
      cancel_url: `${SITE_URL}/book`,
    });

    await supabaseAdmin.from("bookings").update({ status: "pending_payment" }).eq("id", bookingId);

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error("create-checkout-session error", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
