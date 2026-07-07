import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

/** The signed-in user's role, or null if signed out / no profile row. */
export async function getCurrentRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role ?? null;
}

/**
 * Defense-in-depth check for Server Actions -- RLS already enforces this on
 * every table, but the admin client (used for privileged operations like
 * creating auth users) bypasses RLS, so actions that use it should double
 * check the caller's role explicitly too.
 */
export async function requireRole(
  allowed: UserRole[]
): Promise<{ ok: true; role: UserRole } | { ok: false; error: string }> {
  const role = await getCurrentRole();
  if (!role) return { ok: false, error: "Not signed in" };
  if (!allowed.includes(role)) return { ok: false, error: "You do not have permission to do this" };
  return { ok: true, role };
}
