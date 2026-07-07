import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Users, UserCheck, GraduationCap, UserX } from "lucide-react";
import { StudentsTable } from "./students-table";
import type { StudyMode, StudentStatus } from "@/lib/database.types";

const STAT_CARDS: { key: "" | StudentStatus; label: string; icon: typeof Users }[] = [
  { key: "", label: "Total students", icon: Users },
  { key: "active", label: "Active", icon: UserCheck },
  { key: "completed", label: "Completed", icon: GraduationCap },
  { key: "withdrawn", label: "Withdrawn", icon: UserX },
];

export default async function StudentLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const courseId = typeof params.course === "string" ? params.course : "";
  const studyMode = typeof params.study_mode === "string" ? params.study_mode : "";
  const status = typeof params.status === "string" ? params.status : "";

  const role = await getCurrentRole();
  const isFacilitator = role === "facilitator";
  const canBulkAct = role === "admin" || role === "registrar";

  const supabase = await createClient();
  const { data: courses } = await supabase.from("courses").select("course_id, course_name").order("course_name");

  // Status breakdown for the summary cards -- needs every matching row's status,
  // so fetch just that column paginated (the table can exceed the 1,000-row cap).
  // Facilitators have no RLS access to the base students table at all -- they
  // read from students_directory instead, which never has financial columns.
  const statusValues: StudentStatus[] = [];
  {
    let statusQuery = isFacilitator
      ? supabase.from("students_directory").select("status")
      : supabase.from("students").select("status");
    if (q) {
      statusQuery = statusQuery.or(
        `full_name.ilike.%${q}%,id_number.ilike.%${q}%,student_number.ilike.%${q}%`
      );
    }
    if (courseId) statusQuery = statusQuery.eq("course_id", courseId);
    if (studyMode) statusQuery = statusQuery.eq("study_mode", studyMode as StudyMode);

    let offset = 0;
    while (true) {
      const { data } = await statusQuery.range(offset, offset + 999);
      const batch = data ?? [];
      statusValues.push(...batch.map((b) => b.status as StudentStatus));
      if (batch.length < 1000) break;
      offset += 1000;
    }
  }
  const statusCounts = statusValues.reduce(
    (acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }),
    {} as Record<StudentStatus, number>
  );
  const totalCount = statusValues.length;

  function statHref(targetStatus: "" | StudentStatus) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (courseId) p.set("course", courseId);
    if (studyMode) p.set("study_mode", studyMode);
    if (targetStatus && targetStatus !== status) p.set("status", targetStatus);
    const qs = p.toString();
    return qs ? `/admin/students?${qs}` : "/admin/students";
  }

  let query = isFacilitator
    ? supabase
        .from("students_directory")
        .select("student_id, student_number, full_name, id_number, contact_number, study_mode, status, course_name")
        .order("student_number", { ascending: false, nullsFirst: false })
        .limit(100)
    : supabase
        .from("students")
        .select("student_id, student_number, full_name, id_number, contact_number, study_mode, status, courses(course_name)")
        .order("student_number", { ascending: false, nullsFirst: false })
        .limit(100);

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,id_number.ilike.%${q}%,student_number.ilike.%${q}%`
    );
  }
  if (courseId) query = query.eq("course_id", courseId);
  if (studyMode) query = query.eq("study_mode", studyMode as StudyMode);
  if (status) query = query.eq("status", status as StudentStatus);

  const { data: students, error } = await query;

  return (
    <div>
      <PageHeader
        title="Student lookup"
        description="Search and filter your student records."
        backHref="/admin"
        actions={
          isFacilitator ? undefined : (
            <Link href="/admin/students/new">
              <Button variant="brand">
                <UserPlus className="h-4 w-4" />
                Register student
              </Button>
            </Link>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon }) => {
          const active = status === key && key !== "";
          const count = key === "" ? totalCount : statusCounts[key] ?? 0;
          return (
            <Link key={label} href={statHref(key)}>
              <Card
                className={`p-4 transition-colors ${active ? "ring-2 ring-brand-600" : "hover:bg-background/60"}`}
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-ink-faint">{label}</p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight text-ink">{count}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="mb-6 p-4 sm:p-5">
        <form
          method="get"
          key={`${q}-${courseId}-${studyMode}-${status}`}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap"
        >
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search name, ID number, or student number"
              className="pl-9"
            />
          </div>

          <select
            name="course"
            defaultValue={courseId}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="">All courses</option>
            {courses?.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_name}
              </option>
            ))}
          </select>

          <select
            name="study_mode"
            defaultValue={studyMode}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="">Any study mode</option>
            <option value="full-time">Full time</option>
            <option value="part-time">Part time</option>
          </select>

          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="withdrawn">Withdrawn</option>
          </select>

          <Button type="submit" variant="outline">
            Apply filters
          </Button>
        </form>
      </Card>

      <StudentsTable students={(students ?? []) as any} error={error?.message ?? null} canBulkAct={canBulkAct} />
    </div>
  );
}
