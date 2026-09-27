import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service_role key. This bypasses Row
 * Level Security, which is why it must NEVER be imported into any frontend
 * bundle — it only ever runs inside netlify/functions.
 */
export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
