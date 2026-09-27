import type { Handler } from "@netlify/functions";
import { getSupabaseAdmin } from "./_supabaseAdmin";

/**
 * Guest checkout creates a `customers` row with no `user_id` (nobody was
 * signed in yet). When that same person later signs in to the customer
 * portal via magic link, RLS can't show them their own bookings until their
 * `customers.user_id` is set to their new auth uid — and a plain anon-key
 * update can't do that (the RLS USING clause on the *existing* unlinked row
 * has no way to match it). This function does that one link-up, using the
 * service_role key, immediately after a successful sign-in.
 *
 * POST body: {}  — the caller's identity comes from the Supabase access
 * token in the Authorization header, not from anything in the body, so a
 * caller can only ever link their own account.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  const accessToken = authHeader?.replace(/^Bearer\s+/i, "");
  if (!accessToken) {
    return { statusCode: 401, body: JSON.stringify({ error: "Missing access token" }) };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: userResult, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userResult.user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid session" }) };
    }
    const authUser = userResult.user;
    if (!authUser.email) {
      return { statusCode: 200, body: JSON.stringify({ linked: false, reason: "No email on account" }) };
    }

    // Ensure a `users` row exists for this person (role defaults to customer).
    const { data: existingUserRow } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!existingUserRow) {
      await supabaseAdmin.from("users").insert({
        id: authUser.id,
        role: "customer",
        first_name: (authUser.user_metadata?.first_name as string) || "",
        last_name: (authUser.user_metadata?.last_name as string) || "",
        email: authUser.email,
      });
    }

    // Link any unlinked customer record matching this email.
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("id, user_id")
      .eq("email", authUser.email)
      .is("user_id", null)
      .maybeSingle();

    if (customer) {
      await supabaseAdmin.from("customers").update({ user_id: authUser.id }).eq("id", customer.id);
    }

    // Same for property managers, so the same magic-link flow could later
    // serve the property-manager portal without a second linking mechanism.
    const { data: pm } = await supabaseAdmin
      .from("property_managers")
      .select("id, user_id")
      .eq("email", authUser.email)
      .is("user_id", null)
      .maybeSingle();

    if (pm) {
      await supabaseAdmin.from("property_managers").update({ user_id: authUser.id }).eq("id", pm.id);
    }

    return { statusCode: 200, body: JSON.stringify({ linked: Boolean(customer || pm) }) };
  } catch (err) {
    console.error("link-customer-account error", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
  }
};
