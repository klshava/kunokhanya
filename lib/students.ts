import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const STUDENT_LOGIN_DOMAIN = "kunokhanya.co.za";
const STUDENT_NUMBER_PREFIX = "KTA";

/** e.g. "2026" -> "KTA26". Matches the format the DB trigger generates (KTA + 2-digit year + 4-digit seq). */
export function studentNumberYearPrefix(year: string): string {
  return `${STUDENT_NUMBER_PREFIX}${year.slice(-2)}`;
}

/** Suggests the next student number for a given enrollment year, e.g. KTA260042. Editable by the admin, not enforced. */
export async function suggestNextStudentNumber(
  supabase: SupabaseClient<Database>,
  year: string
): Promise<string> {
  const prefix = studentNumberYearPrefix(year);
  const { data } = await supabase
    .from("students")
    .select("student_number")
    .like("student_number", `${prefix}%`)
    .order("student_number", { ascending: false })
    .limit(1);

  const last = data?.[0]?.student_number;
  const lastSeq = last ? parseInt(last.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

export function studentLoginEmail(studentNumber: string): string {
  return `${studentNumber.trim().toLowerCase()}@${STUDENT_LOGIN_DOMAIN}`;
}

/** Password scheme: last name, lowercased, zero-padded to 6 chars if shorter (matches the historical bulk import). */
export function deriveStudentPassword(fullName: string): string {
  const tokens = fullName.trim().split(/\s+/);
  const surname = tokens[tokens.length - 1] || "student";
  let password = surname.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (password.length < 6) {
    password = password + "0".repeat(6 - password.length);
  }
  return password;
}
