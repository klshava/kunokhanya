"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { studentFormSchema, studentContactFormSchema, paymentFormSchema } from "@/lib/validations";

export interface FormActionState {
  error?: string;
  success?: boolean;
}

function formValue(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : undefined;
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
    .select("student_id")
    .single();

  if (error || !student) {
    return { error: error?.message ?? "Could not create the student record" };
  }

  revalidatePath("/admin/students");
  redirect(`/admin/students/${student.student_id}?created=1`);
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
    return { error: error.message };
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

export async function inviteStudentToPortalAction(studentId: string, email: string) {
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

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
  if (inviteError || !invited.user) {
    return { error: inviteError?.message ?? "Could not send the invite email" };
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: invited.user.id,
    role: "student",
    linked_student_id: studentId,
    email,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath(`/admin/students/${studentId}`);
  return { success: true };
}
