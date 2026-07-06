"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { FormActionState } from "../students/actions";
import type { LeadStatus } from "@/lib/database.types";

export async function updateLeadStatusAction(leadId: string, status: LeadStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("website_leads").update({ status }).eq("lead_id", leadId);
  revalidatePath("/admin/leads");
  return error ? { error: error.message } : { success: true };
}

const convertSchema = z.object({
  lead_id: z.string().uuid(),
  full_name: z.string().min(1),
  email: z.string().optional(),
  contact_number: z.string().optional(),
  id_number: z.string().min(1, "ID / passport number is required"),
  course_id: z.string().uuid("Please select a course"),
  study_mode: z.enum(["full-time", "part-time"]),
});

function formValue(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export async function convertLeadToStudentAction(
  _prevState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const parsed = convertSchema.safeParse({
    lead_id: formValue(formData, "lead_id"),
    full_name: formValue(formData, "full_name"),
    email: formValue(formData, "email"),
    contact_number: formValue(formData, "contact_number"),
    id_number: formValue(formData, "id_number"),
    course_id: formValue(formData, "course_id"),
    study_mode: formValue(formData, "study_mode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
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

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      full_name: parsed.data.full_name,
      id_number: parsed.data.id_number,
      email: parsed.data.email || null,
      contact_number: parsed.data.contact_number || null,
      course_id: parsed.data.course_id,
      study_mode: parsed.data.study_mode,
      source: "wordpress",
    })
    .select("student_id")
    .single();

  if (studentError || !student) {
    return { error: studentError?.message ?? "Could not create the student record" };
  }

  const { error: leadError } = await supabase
    .from("website_leads")
    .update({ status: "converted", converted_student_id: student.student_id })
    .eq("lead_id", parsed.data.lead_id);

  if (leadError) {
    return { error: leadError.message };
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin/students");
  return { success: true };
}
