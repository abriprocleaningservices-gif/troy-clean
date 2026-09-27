import type { Handler } from "@netlify/functions";
import twilio from "twilio";
import { getSupabaseAdmin } from "./_supabaseAdmin";
import { hasValidInternalSecret } from "./_internalAuth";

/**
 * POST body: { to, templateKey, variables }
 * Renders the SMS template stored in `message_templates` (channel = 'sms'),
 * substituting {{placeholders}}, then sends it via Twilio and logs the
 * outcome to the `messages` table.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  if (!hasValidInternalSecret(event)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  try {
    const { to, templateKey, variables = {}, bookingId } = JSON.parse(event.body || "{}");
    if (!to || !templateKey) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing to/templateKey" }) };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: template, error } = await supabaseAdmin
      .from("message_templates")
      .select("body")
      .eq("channel", "sms")
      .eq("template_key", templateKey)
      .eq("is_active", true)
      .single();

    if (error || !template) {
      return { statusCode: 404, body: JSON.stringify({ error: `SMS template '${templateKey}' not found or inactive` }) };
    }

    const body = renderTemplate(template.body, variables);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return { statusCode: 500, body: JSON.stringify({ error: "Twilio is not configured" }) };
    }

    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({ to, from: fromNumber, body });

    await supabaseAdmin.from("messages").insert({
      booking_id: bookingId ?? null,
      channel: "sms",
      direction: "outbound",
      template_key: templateKey,
      body,
      status: message.status,
      provider_message_id: message.sid,
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, sid: message.sid }) };
  } catch (err) {
    console.error("send-sms error", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};

function renderTemplate(body: string, variables: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
}
