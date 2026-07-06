import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus } from "lucide-react";
import type { StudyMode, StudentStatus } from "@/lib/database.types";

const statusVariant = {
  active: "success",
  completed: "brand",
  withdrawn: "neutral",
} as const;

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

  const supabase = await createClient();
  const { data: courses } = await supabase.from("courses").select("course_id, course_name").order("course_name");

  let query = supabase
    .from("students")
    .select("student_id, student_number, full_name, id_number, contact_number, study_mode, status, courses(course_name)")
    .order("created_at", { ascending: false })
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
          <Link href="/admin/students/new">
            <Button variant="brand">
              <UserPlus className="h-4 w-4" />
              Register student
            </Button>
          </Link>
        }
      />

      <Card className="mb-6 p-4 sm:p-5">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Student no.</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Mode</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {error && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-danger">
                    Could not load students: {error.message}
                  </td>
                </tr>
              )}
              {!error && students?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-soft">
                    No students match your search. Try adjusting the filters, or{" "}
                    <Link href="/admin/students/new" className="text-brand-600 underline">
                      register a new student
                    </Link>
                    .
                  </td>
                </tr>
              )}
              {students?.map((s: any) => (
                <tr
                  key={s.student_id}
                  className="border-b border-border-soft last:border-0 hover:bg-background/60"
                >
                  <td className="px-5 py-3">
                    <Link href={`/admin/students/${s.student_id}`} className="font-medium text-ink hover:text-brand-600">
                      {s.full_name}
                    </Link>
                    <p className="text-xs text-ink-faint">{s.id_number}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{s.student_number ?? "-"}</td>
                  <td className="px-5 py-3 text-ink-soft">{s.courses?.course_name ?? "-"}</td>
                  <td className="px-5 py-3 text-ink-soft capitalize">{s.study_mode}</td>
                  <td className="px-5 py-3">
                    <Badge variant={statusVariant[s.status as keyof typeof statusVariant] ?? "neutral"} className="capitalize">
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{s.contact_number ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
