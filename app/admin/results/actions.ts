"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ResultOutcome } from "@/lib/database.types";

export interface AddResultState {
  error?: string;
  success?: boolean;
}

function formValue(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export async function addResultAction(
  _prevState: AddResultState,
  formData: FormData
): Promise<AddResultState> {
  const check = await requireRole(["admin", "registrar", "facilitator"]);
  if (!check.ok) return { error: check.error };

  const studentId = formValue(formData, "student_id");
  const courseId = formValue(formData, "course_id");
  const moduleName = formValue(formData, "module_name");
  const outcome = formValue(formData, "outcome") as ResultOutcome | undefined;
  const notes = formValue(formData, "notes");
  const assessedDate = formValue(formData, "assessed_date");

  if (!studentId || !moduleName) return { error: "Choose a module name" };
  if (outcome !== "competent" && outcome !== "not_yet_competent") return { error: "Choose an outcome" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("results").insert({
    student_id: studentId,
    course_id: courseId || null,
    module_name: moduleName,
    outcome,
    notes: notes || null,
    assessed_date: assessedDate || new Date().toISOString().slice(0, 10),
    marked_by: user?.id ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/results");
  revalidatePath(`/admin/students/${studentId}`);
  return { success: true };
}

export async function deleteResultAction(resultId: string, studentId: string): Promise<AddResultState> {
  const check = await requireRole(["admin", "registrar", "facilitator"]);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const { error } = await supabase.from("results").delete().eq("result_id", resultId);
  if (error) return { error: error.message };

  revalidatePath("/admin/results");
  revalidatePath(`/admin/students/${studentId}`);
  return { success: true };
}
