import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AttendanceCheckbox } from "./attendance-checkbox";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function formatWeekLabel(monday: Date, friday: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const start = monday.toLocaleDateString("en-ZA", opts);
  const end = friday.toLocaleDateString("en-ZA", { ...opts, year: "numeric" });
  return `${start} - ${end}`;
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const courseId = typeof params.course === "string" ? params.course : "";
  const weekParam = typeof params.week === "string" ? params.week : "";

  const monday = weekParam ? getMonday(parseISODate(weekParam)) : getMonday(new Date());
  const weekdays = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  const weekdayISO = weekdays.map(toISODate);
  const mondayISO = toISODate(monday);
  const prevWeekISO = toISODate(addDays(monday, -7));
  const nextWeekISO = toISODate(addDays(monday, 7));

  const role = await getCurrentRole();
  const isFacilitator = role === "facilitator";

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("course_id, course_name")
    .eq("is_active", true)
    .order("course_name");

  const selectedCourseId = courseId || courses?.[0]?.course_id || "";

  // Facilitators have no RLS access to the base students table at all -- they
  // read the roster from students_directory instead, same as the student
  // lookup page. Attendance itself is non-financial, so this is fine.
  let students: { student_id: string; full_name: string; student_number: string | null }[] = [];
  if (selectedCourseId) {
    const { data } = isFacilitator
      ? await supabase
          .from("students_directory")
          .select("student_id, full_name, student_number")
          .eq("course_id", selectedCourseId)
          .eq("status", "active")
          .order("full_name")
      : await supabase
          .from("students")
          .select("student_id, full_name, student_number")
          .eq("course_id", selectedCourseId)
          .eq("status", "active")
          .order("full_name");
    students = data ?? [];
  }

  const presentMap = new Map<string, boolean>();
  if (students.length > 0) {
    const { data: attendanceRows } = await supabase
      .from("attendance")
      .select("student_id, attendance_date, present")
      .in("student_id", students.map((s) => s.student_id))
      .gte("attendance_date", weekdayISO[0])
      .lte("attendance_date", weekdayISO[4]);
    for (const row of attendanceRows ?? []) {
      presentMap.set(`${row.student_id}_${row.attendance_date}`, row.present);
    }
  }

  function weekHref(courseVal: string, weekVal: string) {
    const p = new URLSearchParams();
    if (courseVal) p.set("course", courseVal);
    if (weekVal) p.set("week", weekVal);
    return `/admin/attendance?${p.toString()}`;
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Tick attendance for a course, week by week."
        backHref="/admin"
      />

      <Card className="mb-6 p-4 sm:p-5">
        <form
          method="get"
          key={selectedCourseId}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap"
        >
          <input type="hidden" name="week" value={mondayISO} />
          <select
            name="course"
            defaultValue={selectedCourseId}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
          >
            {courses?.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline">
            View
          </Button>

          <div className="flex flex-1 items-center justify-end gap-2">
            <Link href={weekHref(selectedCourseId, prevWeekISO)}>
              <Button type="button" variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
                Prev week
              </Button>
            </Link>
            <span className="text-sm font-medium text-ink">{formatWeekLabel(monday, weekdays[4])}</span>
            <Link href={weekHref(selectedCourseId, nextWeekISO)}>
              <Button type="button" variant="outline" size="sm">
                Next week
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-medium">Student</th>
                {weekdays.map((d, i) => (
                  <th key={weekdayISO[i]} className="px-3 py-3 text-center font-medium">
                    {WEEKDAY_LABELS[i]}
                    <div className="normal-case text-ink-faint">{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!selectedCourseId && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-soft">
                    No active courses to show attendance for.
                  </td>
                </tr>
              )}
              {selectedCourseId && students.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-soft">
                    No active students enrolled in this course.
                  </td>
                </tr>
              )}
              {students.map((s) => (
                <tr key={s.student_id} className="border-b border-border-soft last:border-0 hover:bg-background/60">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{s.full_name}</p>
                    <p className="text-xs text-ink-faint">{s.student_number}</p>
                  </td>
                  {weekdayISO.map((date) => (
                    <td key={date} className="px-3 py-3">
                      <AttendanceCheckbox
                        studentId={s.student_id}
                        date={date}
                        initialPresent={presentMap.get(`${s.student_id}_${date}`) ?? false}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
