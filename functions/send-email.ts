import type { Handler } from "@netlify/functions";
import { getSupabaseAdmin } from "./_supabaseAdmin";
import { hasValidInternalSecret } from "./_internalAuth";

/**
 * POST body: { to, templateKey, variables, bookingId? }
 * Renders the email template stored in `message_templates` (channel =
 * 'email'), substituting {{placeholders}} in both subject and body, then
 * sends via Resend (https://resend.com) and logs the outcome.
 *
 * Swap the fetch call below for another provider (Postmark, SendGrid, SES)
 * if preferred — the template lookup and logging stay the same.
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
      .select("subject, body")
      .eq("channel", "email")
      .eq("template_key", templateKey)
      .eq("is_active", true)
      .single();

    if (error || !template) {
      return { statusCode: 404, body: JSON.stringify({ error: `Email template '${templateKey}' not found or inactive` }) };
    }

    const subject = renderTemplate(template.subject ?? "", variables);
    const body = renderTemplate(template.body, variables);

    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS;

    if (!apiKey || !fromAddress) {
      return { statusCode: 500, body: JSON.stringify({ error: "Email provider is not configured" }) };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html: `<p>${body.replace(/\n/g, "<br />")}</p>`,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result?.message || "Email provider request failed");
    }

    await supabaseAdmin.from("messages").insert({
      booking_id: bookingId ?? null,
      channel: "email",
      direction: "outbound",
      template_key: templateKey,
      subject,
      body,
      status: "sent",
      provider_message_id: result?.id ?? null,
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, id: result?.id }) };
  } catch (err) {
    console.error("send-email error", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};

function renderTemplate(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
}
