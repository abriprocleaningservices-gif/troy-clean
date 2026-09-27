import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { getSupabaseAdmin } from "./_supabaseAdmin";
import { internalSecretHeader } from "./_internalAuth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

const SITE_URL = process.env.VITE_SITE_URL || "http://localhost:5173";

/**
 * Configure this URL as a Stripe webhook endpoint (see docs/STRIPE_SETUP.md):
 *   https://<your-site>.netlify.app/.netlify/functions/stripe-webhook
 * Listening for: checkout.session.completed
 *
 * Stripe retries webhooks that don't return 2xx, and can occasionally
 * deliver the same event more than once even on success — so every write
 * here is guarded to be safe to run twice for the same event.
 */
export const handler: Handler = async (event) => {
  const sig = event.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return { statusCode: 400, body: "Missing signature or webhook secret" };
  }

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body || "", sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return { statusCode: 400, body: "Invalid signature" };
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;
    const timing = session.metadata?.timing;
    if (!bookingId) return { statusCode: 200, body: "No booking_id in metadata, ignoring" };

    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
    const amountPaid = (session.amount_total ?? 0) / 100;

    // Idempotency guard: if we've already recorded a payment for this Stripe
    // payment intent, this is a duplicate delivery of the same event —
    // acknowledge without re-inserting or re-notifying.
    if (paymentIntentId) {
      const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle();
      if (existingPayment) {
        return { statusCode: 200, body: JSON.stringify({ received: true, duplicate: true }) };
      }
    }

    await supabaseAdmin.from("payments").insert({
      booking_id: bookingId,
      stripe_payment_intent_id: paymentIntentId,
      amount: amountPaid,
      method: "card",
      status: "paid",
      paid_at: new Date().toISOString(),
    });

    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select(
        "total_price, booking_number, customer_id, scheduled_date, scheduled_start_time, service_id, services(name), customers(first_name, email, phone)"
      )
      .eq("id", bookingId)
      .single();

    const paymentStatus = timing === "deposit" ? "partially_paid" : "paid";

    await supabaseAdmin
      .from("bookings")
      .update({ status: "confirmed", payment_status: paymentStatus })
      .eq("id", bookingId);

    // Fire confirmation SMS + email — these call the same functions the rest
    // of the app uses, so templates stay centralized in message_templates.
    if (booking?.customers) {
      const customer = booking.customers as unknown as { first_name: string; email: string; phone: string };
      const service = booking.services as unknown as { name: string } | null;

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

    // Best-effort Google Calendar sync — skipped quietly if not configured,
    // and never allowed to fail the webhook (Stripe retries on non-2xx).
    if (process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
      fetch(`${SITE_URL}/.netlify/functions/google-calendar-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...internalSecretHeader() },
        body: JSON.stringify({ bookingId }),
      }).catch((err) => console.error("Calendar sync dispatch failed", err));
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
