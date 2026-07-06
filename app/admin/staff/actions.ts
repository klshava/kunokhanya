"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { staffFormSchema } from "@/lib/validations";
import type { FormActionState } from "../students/actions";

function formValue(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function parseStaffForm(formData: FormData) {
  return staffFormSchema.safeParse({
    title: formValue(formData, "title") ?? "",
    first_name: formValue(formData, "first_name"),
    last_name: formValue(formData, "last_name"),
    position: formValue(formData, "position") ?? "",
    phone_number: formValue(formData, "phone_number") ?? "",
    email: formValue(formData, "email") ?? "",
    id_number: formValue(formData, "id_number") ?? "",
    nationality: formValue(formData, "nationality") ?? "",
    address: formValue(formData, "address") ?? "",
    next_of_kin_name: formValue(formData, "next_of_kin_name") ?? "",
    next_of_kin_number: formValue(formData, "next_of_kin_number") ?? "",
    date_of_birth: formValue(formData, "date_of_birth") ?? "",
    gender: formValue(formData, "gender"),
    home_language: formValue(formData, "home_language") ?? "",
    is_active: formData.get("is_active") === "on",
  });
}

export async function createStaffAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const parsed = parseStaffForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .insert({
      ...parsed.data,
      date_of_birth: parsed.data.date_of_birth || null,
    })
    .select("staff_id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not create staff record" };

  revalidatePath("/admin/staff");
  redirect(`/admin/staff/${data.staff_id}?created=1`);
}

export async function updateStaffAction(
  staffId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const parsed = parseStaffForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("staff")
    .update({
      ...parsed.data,
      date_of_birth: parsed.data.date_of_birth || null,
    })
    .eq("staff_id", staffId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/staff/${staffId}`);
  revalidatePath("/admin/staff");
  return { success: true };
}
