"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export async function toggleAttendanceAction(
  studentId: string,
  date: string,
  present: boolean
): Promise<{ error?: string; success?: boolean }> {
  const check = await requireRole(["admin", "registrar", "facilitator"]);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("attendance")
    .upsert(
      { student_id: studentId, attendance_date: date, present, marked_by: user?.id ?? null },
      { onConflict: "student_id,attendance_date" }
    );

  if (error) return { error: error.message };
  return { success: true };
}
