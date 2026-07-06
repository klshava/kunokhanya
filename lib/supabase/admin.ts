import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Privileged Supabase client using the SERVICE ROLE key. This bypasses Row Level
 * Security entirely, so it must only ever be used in server-side code (Server
 * Actions, Route Handlers) after we've already verified the caller is an admin.
 *
 * Never import this file from a Client Component. The `server-only` import
 * above will throw a build error if that ever happens by mistake.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
