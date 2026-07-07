import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatZAR } from "@/lib/currency";
import { CourseDialog } from "./course-dialog";
import { createCourseAction, updateCourseAction } from "./actions";

export default async function CourseManagementPage() {
  const role = await getCurrentRole();
  if (role === "facilitator") redirect("/admin");

  const supabase = await createClient();
  const { data: courses } = await supabase.from("courses").select("*").order("course_name");

  return (
    <div>
      <PageHeader
        title="Course management"
        description="Programmes offered and their fee structures."
        backHref="/admin"
        actions={<CourseDialog action={createCourseAction} />}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border-soft text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Mode</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Reg. fee</th>
                <th className="px-5 py-3 font-medium">Monthly fee</th>
                <th className="px-5 py-3 font-medium">Total fee</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {courses?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-ink-soft">
                    No courses yet. Add your first course to get started.
                  </td>
                </tr>
              )}
              {courses?.map((c) => (
                <tr key={c.course_id} className="border-b border-border-soft last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{c.course_name}</td>
                  <td className="px-5 py-3 capitalize text-ink-soft">{c.study_mode ?? "-"}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {c.duration_months ? `${c.duration_months} months` : "-"}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{formatZAR(c.registration_fee)}</td>
                  <td className="px-5 py-3 text-ink-soft">{formatZAR(c.monthly_fee)}</td>
                  <td className="px-5 py-3 text-ink-soft">{formatZAR(c.total_fee)}</td>
                  <td className="px-5 py-3">
                    <Badge variant={c.is_active ? "success" : "neutral"}>
                      {c.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <CourseDialog course={c} action={updateCourseAction.bind(null, c.course_id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
