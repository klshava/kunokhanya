"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";

export interface BulkStatusState {
  error?: string;
  success?: boolean;
  count?: number;
}

export async function bulkMarkCompletedAction(studentIds: string[]): Promise<BulkStatusState> {
  const check = await requireRole(["admin", "registrar"]);
  if (!check.ok) return { error: check.error };

  if (studentIds.length === 0) return { error: "No students selected" };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("students")
    .update({ status: "completed" }, { count: "exact" })
    .in("student_id", studentIds);

  if (error) return { error: error.message };

  revalidatePath("/admin/students");
  return { success: true, count: count ?? studentIds.length };
}

export interface BulkReminderState {
  error?: string;
  success?: boolean;
  sent?: number;
  skippedNoBalance?: number;
  skippedNoEmail?: number;
  failed?: number;
}

export async function bulkSendFeeRemindersAction(studentIds: string[]): Promise<BulkReminderState> {
  const check = await requireRole(["admin", "registrar"]);
  if (!check.ok) return { error: check.error };

  if (studentIds.length === 0) return { error: "No students selected" };

  const supabase = await createClient();

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("student_id, full_name, email")
    .in("student_id", studentIds);
  if (studentsError) return { error: studentsError.message };

  const { data: balances, error: balancesError } = await supabase
    .from("student_balances")
    .select("student_id, balance")
    .in("student_id", studentIds);
  if (balancesError) return { error: balancesError.message };

  const balanceByStudent = new Map((balances ?? []).map((b) => [b.student_id, Number(b.balance)]));

  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const loginUrl = `${protocol}://${host}/login`;

  const { sendFeeReminderEmail } = await import("@/lib/email");

  let sent = 0;
  let skippedNoBalance = 0;
  let skippedNoEmail = 0;
  let failed = 0;

  for (const student of students ?? []) {
    const balance = balanceByStudent.get(student.student_id) ?? 0;
    if (balance <= 0) {
      skippedNoBalance++;
      continue;
    }
    if (!student.email) {
      skippedNoEmail++;
      continue;
    }
    try {
      await sendFeeReminderEmail({
        to: student.email,
        fullName: student.full_name,
        balance,
        loginUrl,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return { success: true, sent, skippedNoBalance, skippedNoEmail, failed };
}
