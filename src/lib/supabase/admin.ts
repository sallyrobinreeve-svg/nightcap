import { createClient } from "@supabase/supabase-js";

/**
 * Admin client with service role - use only in server-side API routes.
 * Required for actions like deleting users.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel (Settings > Environment Variables) and locally in .env.local. Get it from Supabase Dashboard > Settings > API."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
