"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { courseFormSchema } from "@/lib/validations";
import type { FormActionState } from "../students/actions";

function formValue(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function parseCourseForm(formData: FormData) {
  return courseFormSchema.safeParse({
    course_name: formValue(formData, "course_name"),
    duration_months: formValue(formData, "duration_months"),
    registration_fee: formValue(formData, "registration_fee") ?? "0",
    monthly_fee: formValue(formData, "monthly_fee") ?? "0",
    total_fee: formValue(formData, "total_fee") ?? "0",
    study_mode: formValue(formData, "study_mode"),
    is_active: formData.get("is_active") === "on",
  });
}

export async function createCourseAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const parsed = parseCourseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("courses").insert(parsed.data);

  if (error) return { error: error.message };

  revalidatePath("/admin/courses");
  return { success: true };
}

export async function updateCourseAction(
  courseId: string,
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const parsed = parseCourseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("courses").update(parsed.data).eq("course_id", courseId);

  if (error) return { error: error.message };

  revalidatePath("/admin/courses");
  return { success: true };
}

export async function toggleCourseActiveAction(courseId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({ is_active: isActive })
    .eq("course_id", courseId);

  revalidatePath("/admin/courses");
  return error ? { error: error.message } : { success: true };
}
