import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { StudentForm } from "../student-form";
import { createStudentAction } from "../actions";
import { suggestNextStudentNumber } from "@/lib/students";

export default async function NewStudentPage() {
  const role = await getCurrentRole();
  if (role !== "admin" && role !== "registrar") redirect("/admin/students");

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_active", true)
    .order("course_name");

  const suggestedStudentNumber = await suggestNextStudentNumber(
    supabase,
    new Date().getFullYear().toString()
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Register new student"
        description="Capture a new student's details and enroll them in a course."
        backHref="/admin"
      />
      <Card>
        <CardContent className="p-6 sm:p-8">
          <StudentForm
            courses={courses ?? []}
            suggestedStudentNumber={suggestedStudentNumber}
            action={createStudentAction}
            submitLabel="Register student"
          />
        </CardContent>
      </Card>
    </div>
  );
}
