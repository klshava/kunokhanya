import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddResultDialog } from "./add-result-dialog";
import { ResultChip } from "./result-chip";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const courseId = typeof params.course === "string" ? params.course : "";

  const role = await getCurrentRole();
  const isFacilitator = role === "facilitator";

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("course_id, course_name")
    .eq("is_active", true)
    .order("course_name");

  const selectedCourseId = courseId || courses?.[0]?.course_id || "";

  // Facilitators have no RLS access to the base students table -- read the
  // roster from students_directory instead, same as attendance.
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

  const resultsByStudent = new Map<
    string,
    { result_id: string; module_name: string; outcome: "competent" | "not_yet_competent" }[]
  >();
  const allModuleNames = new Set<string>();
  if (students.length > 0) {
    const { data: results } = await supabase
      .from("results")
      .select("result_id, student_id, module_name, outcome")
      .in("student_id", students.map((s) => s.student_id))
      .order("assessed_date", { ascending: true });
    for (const r of results ?? []) {
      allModuleNames.add(r.module_name);
      const list = resultsByStudent.get(r.student_id) ?? [];
      list.push({ result_id: r.result_id, module_name: r.module_name, outcome: r.outcome });
      resultsByStudent.set(r.student_id, list);
    }
  }

  return (
    <div>
      <PageHeader
        title="Results"
        description="Record Competent / Not Yet Competent outcomes per module."
        backHref="/admin"
      />

      <Card className="mb-6 p-4 sm:p-5">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Results</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {!selectedCourseId && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-ink-soft">
                    No active courses to show results for.
                  </td>
                </tr>
              )}
              {selectedCourseId && students.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-ink-soft">
                    No active students enrolled in this course.
                  </td>
                </tr>
              )}
              {students.map((s) => {
                const studentResults = resultsByStudent.get(s.student_id) ?? [];
                return (
                  <tr key={s.student_id} className="border-b border-border-soft last:border-0 hover:bg-background/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{s.full_name}</p>
                      <p className="text-xs text-ink-faint">{s.student_number}</p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {studentResults.length === 0 && <span className="text-ink-faint">No results yet</span>}
                        {studentResults.map((r) => (
                          <ResultChip
                            key={r.result_id}
                            resultId={r.result_id}
                            studentId={s.student_id}
                            moduleName={r.module_name}
                            outcome={r.outcome}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <AddResultDialog
                        studentId={s.student_id}
                        courseId={selectedCourseId}
                        studentName={s.full_name}
                        existingModules={Array.from(allModuleNames)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
