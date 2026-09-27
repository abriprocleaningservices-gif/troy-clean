import type { HandlerEvent } from "@netlify/functions";

/**
 * send-sms, send-email, and google-calendar-sync perform privileged actions
 * (spending Twilio/Resend/Google quota) but have no end-user session to
 * check — they're only ever meant to be called by this project's other
 * Netlify Functions (stripe-webhook, confirm-pay-later-booking,
 * send-reminders-scheduled). A Netlify Function URL is otherwise reachable
 * by anyone, so we gate these on a shared secret both sides know, set via
 * INTERNAL_FUNCTIONS_SECRET.
 */
export function hasValidInternalSecret(event: HandlerEvent): boolean {
  const expected = process.env.INTERNAL_FUNCTIONS_SECRET;
  if (!expected) {
    // Fail closed: if the secret isn't configured, refuse rather than run open.
    console.error("INTERNAL_FUNCTIONS_SECRET is not set — refusing internal call.");
    return false;
  }
  const provided = event.headers["x-internal-secret"] || event.headers["X-Internal-Secret"];
  return provided === expected;
}

export function internalSecretHeader(): Record<string, string> {
  return { "x-internal-secret": process.env.INTERNAL_FUNCTIONS_SECRET || "" };
}
