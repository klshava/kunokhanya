"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { generateStaffPassword } from "@/lib/staff-auth";
import { createMoodleUser, deleteMoodleUser, moodleUsername } from "@/lib/moodle";
import type { UserRole } from "@/lib/database.types";

export interface CreateUserState {
  error?: string;
  success?: boolean;
  password?: string;
  loginEmail?: string;
  emailed?: boolean;
  staffName?: string;
  phoneNumber?: string | null;
  /** Only set when a matching Moodle account was actually created. */
  moodleUsername?: string;
  moodleLoginUrl?: string;
}

function formValue(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

const ASSIGNABLE_ROLES: UserRole[] = ["admin", "registrar", "facilitator"];

export async function createStaffLoginAction(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const check = await requireRole(["admin"]);
  if (!check.ok) return { error: check.error };

  const staffId = formValue(formData, "staff_id");
  const role = formValue(formData, "role") as UserRole | undefined;

  if (!staffId) return { error: "Choose a staff member" };
  if (!role || !ASSIGNABLE_ROLES.includes(role)) return { error: "Choose a role" };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: staff } = await admin.from("staff").select("*").eq("staff_id", staffId).single();
  if (!staff) return { error: "Staff record not found" };
  if (!staff.email) {
    return { error: "This staff member has no email on file -- add one on their staff record first." };
  }

  const { data: existingLink } = await admin
    .from("profiles")
    .select("id")
    .eq("linked_staff_id", staffId)
    .maybeSingle();
  if (existingLink) return { error: "This staff member already has a login" };

  const password = generateStaffPassword();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: staff.email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    return { error: createErr?.message ?? "Could not create the login" };
  }

  const fullName = [staff.title, staff.first_name, staff.last_name].filter(Boolean).join(" ");

  await admin.from("profiles").upsert({
    id: created.user.id,
    role,
    linked_staff_id: staffId,
    email: staff.email,
    full_name: fullName,
  });

  // Best-effort, same as student registration: a facilitator/registrar/admin
  // gets one set of credentials that work on both Student Central and
  // Moodle. Username is the local part of their email (staff have no
  // student-number-style identifier to reuse).
  let moodleCreated = false;
  const moodleUser = moodleUsername(staff.email.split("@")[0]);
  if (process.env.MOODLE_BASE_URL) {
    try {
      const { moodleUserId } = await createMoodleUser({
        studentNumber: moodleUser,
        password,
        fullName,
        email: staff.email,
      });
      await admin.from("staff").update({ moodle_user_id: moodleUserId }).eq("staff_id", staffId);
      moodleCreated = true;
    } catch {
      // Non-fatal -- the Student Central login still exists; the admin can
      // create the Moodle account manually if needed.
    }
  }

  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const moodleLoginUrl = moodleCreated ? `${process.env.MOODLE_BASE_URL}/login/index.php` : undefined;

  let emailed = false;
  try {
    const { sendStaffCredentialsEmail } = await import("@/lib/email");
    await sendStaffCredentialsEmail({
      to: staff.email,
      fullName,
      loginEmail: staff.email,
      password,
      role,
      loginUrl: `${protocol}://${host}/login`,
      moodleUsername: moodleCreated ? moodleUser : undefined,
      moodleLoginUrl,
    });
    emailed = true;
  } catch {
    // Non-fatal -- the login still exists, the admin can share the
    // credentials shown on screen manually or via WhatsApp.
  }

  revalidatePath("/admin/users");
  return {
    success: true,
    password,
    loginEmail: staff.email,
    emailed,
    staffName: fullName,
    phoneNumber: staff.phone_number,
    moodleUsername: moodleCreated ? moodleUser : undefined,
    moodleLoginUrl,
  };
}

export async function revokeUserAccessAction(profileId: string): Promise<{ error?: string; success?: boolean }> {
  const check = await requireRole(["admin"]);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === profileId) {
    return { error: "You cannot revoke your own access" };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  // Look up the linked staff record's Moodle account before the profile
  // row is cascade-deleted below, so we can clean it up too.
  const { data: profile } = await admin.from("profiles").select("linked_staff_id").eq("id", profileId).maybeSingle();
  if (profile?.linked_staff_id) {
    const { data: staff } = await admin
      .from("staff")
      .select("staff_id, moodle_user_id")
      .eq("staff_id", profile.linked_staff_id)
      .maybeSingle();
    if (staff?.moodle_user_id) {
      try {
        await deleteMoodleUser(staff.moodle_user_id);
      } catch {
        // Non-fatal -- the Student Central login is still revoked below.
      }
      await admin.from("staff").update({ moodle_user_id: null }).eq("staff_id", staff.staff_id);
    }
  }

  // Deleting the auth user cascades to its profiles row automatically
  // (profiles.id references auth.users with ON DELETE CASCADE). The linked
  // staff record itself is untouched and will reappear in the picker.
  const { error } = await admin.auth.admin.deleteUser(profileId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}
