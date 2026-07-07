"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { studentFormSchema, studentContactFormSchema, paymentFormSchema } from "@/lib/validations";
import { studentLoginEmail, deriveStudentPassword, suggestNextStudentNumber } from "@/lib/students";

export interface FormActionState {
  error?: string;
  success?: boolean;
}

function formValue(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function intakeMonthValue(formData: FormData) {
  const v = formValue(formData, "intake_month");
  return v === "unset" ? undefined : v;
}

export async function suggestStudentNumberAction(year: string): Promise<string> {
  const supabase = await createClient();
  return suggestNextStudentNumber(supabase, year);
}

/**
 * Creates a student's portal login using the same scheme everywhere in the
 * app: login = student number, password = surname (zero-padded to 6). If the
 * student has an email on file, their credentials are emailed to them. Used by
 * both new-student registration and the "Send portal login" button, so the two
 * paths always behave identically (no Supabase magic-link invites anywhere).
 */
async function provisionStudentPortalLogin(student: {
  student_id: string;
  student_number: string | null;
  full_name: string;
  email: string | null;
}): Promise<{ created: boolean; emailed: boolean; error?: string }> {
  if (!student.student_number) {
    return { created: false, emailed: false, error: "This student has no student number yet." };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const loginEmail = studentLoginEmail(student.student_number);
  const password = deriveStudentPassword(student.full_name);

  const { data: created, error: createUserError } = await admin.auth.admin.createUser({
    email: loginEmail,
    password,
    email_confirm: true,
  });

  if (createUserError || !created.user) {
    return { created: false, emailed: false, error: createUserError?.message ?? "Could not create the portal login." };
  }

  await admin.from("profiles").upsert({
    id: created.user.id,
    role: "student",
    linked_student_id: student.student_id,
    email: loginEmail,
  });

  let emailed = false;
  if (student.email) {
    try {
      const { sendStudentCredentialsEmail } = await import("@/lib/email");
      const host = (await headers()).get("host") ?? "localhost:3000";
      const protocol = host.startsWith("localhost") ? "http" : "https";
      await sendStudentCredentialsEmail({
        to: student.email,
        fullName: student.full_name,
        loginEmail,
        password,
        loginUrl: `${protocol}://${host}/login`,
      });
      emailed = true;
    } catch {
      // Non-fatal -- the login still exists, the office can share the
      // credentials shown on the page manually or via WhatsApp.
    }
  }

  return { created: true, emailed };
}

export async function createStudentAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const raw = {
    full_name: formValue(formData, "full_name"),
    id_number: formValue(formData, "id_number"),
    date_of_birth: formValue(formData, "date_of_birth"),
    gender: formValue(formData, "gender"),
    contact_number: formValue(formData, "contact_number"),
    email: formValue(formData, "email") ?? "",
    physical_address: formValue(formData, "physical_address") ?? "",
    emergency_contact_name: formValue(formData, "emergency_contact_name") ?? "",
    emergency_contact_number: formValue(formData, "emergency_contact_number") ?? "",
    course_id: formValue(formData, "course_id"),
    study_mode: formValue(formData, "study_mode"),
    enrollment_date: formValue(formData, "enrollment_date"),
    intake_month: intakeMonthValue(formData),
    student_number: formValue(formData, "student_number"),
    status: formValue(formData, "status") ?? "active",
    source: formValue(formData, "source") ?? "walk-in",
    registration_fee_paid: formData.get("registration_fee_paid") === "on",
  };

  const parsed = studentFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("students")
    .select("student_id")
    .eq("id_number", parsed.data.id_number)
    .maybeSingle();

  if (existing) {
    return { error: "A student with this ID number already exists" };
  }

  const { data: student, error } = await supabase
    .from("students")
    .insert({
      ...parsed.data,
      email: parsed.data.email || null,
      physical_address: parsed.data.physical_address || null,
      emergency_contact_name: parsed.data.emergency_contact_name || null,
      emergency_contact_number: parsed.data.emergency_contact_number || null,
      date_of_birth: parsed.data.date_of_birth || null,
    })
    .select("student_id, student_number, full_name, email")
    .single();

  if (error || !student) {
    if (error?.code === "23505" && error.message.includes("student_number")) {
      return {
        error: `Student number "${parsed.data.student_number}" is already in use. Please choose a different one.`,
      };
    }
    return { error: error?.message ?? "Could not create the student record" };
  }

  // Auto-provision their portal login (same email/password scheme as the
  // historical bulk import), and email it to them if we have an address on
  // file. This never blocks the registration itself if it fails -- the admin
  // can still use the "Send portal login" button from the student page.
  const { emailed } = await provisionStudentPortalLogin(student);

  revalidatePath("/admin/students");
  redirect(`/admin/students/${student.student_id}?created=1&emailed=${emailed ? 1 : 0}`);
}

export async function updateStudentAction(
  studentId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const raw = {
    full_name: formValue(formData, "full_name"),
    id_number: formValue(formData, "id_number"),
    date_of_birth: formValue(formData, "date_of_birth"),
    gender: formValue(formData, "gender"),
    contact_number: formValue(formData, "contact_number"),
    email: formValue(formData, "email") ?? "",
    physical_address: formValue(formData, "physical_address") ?? "",
    emergency_contact_name: formValue(formData, "emergency_contact_name") ?? "",
    emergency_contact_number: formValue(formData, "emergency_contact_number") ?? "",
    course_id: formValue(formData, "course_id"),
    study_mode: formValue(formData, "study_mode"),
    enrollment_date: formValue(formData, "enrollment_date"),
    intake_month: intakeMonthValue(formData),
    student_number: formValue(formData, "student_number"),
    status: formValue(formData, "status") ?? "active",
    source: formValue(formData, "source") ?? "walk-in",
    registration_fee_paid: formData.get("registration_fee_paid") === "on",
  };

  const parsed = studentFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("students")
    .select("student_id")
    .eq("id_number", parsed.data.id_number)
    .neq("student_id", studentId)
    .maybeSingle();

  if (existing) {
    return { error: "Another student already uses this ID number" };
  }

  // Remember the current student number so we can tell whether it changed
  // (and if so, keep the linked portal login's email in sync below).
  const { data: before } = await supabase
    .from("students")
    .select("student_number")
    .eq("student_id", studentId)
    .single();

  const { error } = await supabase
    .from("students")
    .update({
      ...parsed.data,
      email: parsed.data.email || null,
      physical_address: parsed.data.physical_address || null,
      emergency_contact_name: parsed.data.emergency_contact_name || null,
      emergency_contact_number: parsed.data.emergency_contact_number || null,
      date_of_birth: parsed.data.date_of_birth || null,
    })
    .eq("student_id", studentId);

  if (error) {
    if (error.code === "23505" && error.message.includes("student_number")) {
      return { error: `Student number "${parsed.data.student_number}" is already in use. Choose a different one.` };
    }
    return { error: error.message };
  }

  // If the student number changed and this student has a portal login, update
  // the login's email to match (logins use <studentnumber>@kunokhanya.co.za),
  // so they keep signing in with their current student number.
  const newNumber = parsed.data.student_number;
  if (newNumber && before?.student_number && newNumber !== before.student_number) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("linked_student_id", studentId)
      .maybeSingle();

    if (profile) {
      const newLoginEmail = studentLoginEmail(newNumber);
      await admin.auth.admin.updateUserById(profile.id, { email: newLoginEmail, email_confirm: true });
      await admin.from("profiles").update({ email: newLoginEmail }).eq("id", profile.id);
    }
  }

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
  return { success: true };
}

export async function updateMyContactAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const raw = {
    contact_number: formValue(formData, "contact_number"),
    email: formValue(formData, "email") ?? "",
    physical_address: formValue(formData, "physical_address") ?? "",
    emergency_contact_name: formValue(formData, "emergency_contact_name") ?? "",
    emergency_contact_number: formValue(formData, "emergency_contact_number") ?? "",
  };

  const parsed = studentContactFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_student_contact", {
    p_contact_number: parsed.data.contact_number,
    p_email: parsed.data.email || null,
    p_physical_address: parsed.data.physical_address || null,
    p_emergency_contact_name: parsed.data.emergency_contact_name || null,
    p_emergency_contact_number: parsed.data.emergency_contact_number || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/portal/profile");
  return { success: true };
}

export async function addPaymentAction(
  studentId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const raw = {
    amount: formValue(formData, "amount"),
    payment_date: formValue(formData, "payment_date"),
    payment_method: formValue(formData, "payment_method") ?? "",
    receipt_number: formValue(formData, "receipt_number") ?? "",
    notes: formValue(formData, "notes") ?? "",
  };

  const parsed = paymentFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the payment details" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    student_id: studentId,
    amount: parsed.data.amount,
    payment_date: parsed.data.payment_date,
    payment_method: parsed.data.payment_method || null,
    receipt_number: parsed.data.receipt_number || null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/students/${studentId}`);
  return { success: true };
}

export async function inviteStudentToPortalAction(
  studentId: string
): Promise<{ success?: boolean; emailed?: boolean; error?: string }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = await createClient();

  // Defense in depth: confirm the caller is really an admin before using the
  // service-role client (RLS already enforces this on every table, but the
  // admin client bypasses RLS so we double check explicitly here too).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Only admins can do this" };
  }

  const admin = createAdminClient();
  const { data: student } = await admin
    .from("students")
    .select("student_id, student_number, full_name, email")
    .eq("student_id", studentId)
    .single();

  if (!student) {
    return { error: "Student not found" };
  }

  // Same credentials scheme as registration -- student number + surname
  // password, emailed to the student if they have an address on file. This
  // deliberately does NOT use Supabase's magic-link invite, so students always
  // get the same login details the office can also read off the screen.
  const result = await provisionStudentPortalLogin(student);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath(`/admin/students/${studentId}`);
  // Reuse the exact same post-registration banner (credentials + WhatsApp +
  // email status) so the office sees the login details to share.
  redirect(`/admin/students/${studentId}?created=1&emailed=${result.emailed ? 1 : 0}`);
}

export async function deleteStudentAction(studentId: string): Promise<FormActionState> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = await createClient();

  // Defense in depth: confirm the caller is really an admin before using the
  // service-role client (RLS already enforces this on every table, but the
  // admin client bypasses RLS so we double check explicitly here too).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Only admins can do this" };
  }

  const admin = createAdminClient();

  // Delete the portal login (if any) first. Deleting the auth user cascades
  // to its profiles row automatically (profiles.id references auth.users
  // with ON DELETE CASCADE), so there's no separate profile cleanup needed.
  const { data: linkedProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("linked_student_id", studentId)
    .maybeSingle();

  if (linkedProfile) {
    const { error: authError } = await admin.auth.admin.deleteUser(linkedProfile.id);
    if (authError) {
      return { error: `Could not delete the portal login: ${authError.message}` };
    }
  }

  // Payments cascade automatically (payments.student_id has ON DELETE CASCADE).
  const { error } = await admin.from("students").delete().eq("student_id", studentId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/students");
  redirect("/admin/students");
}
